const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

// GET daily report; expects query param: date=YYYY-MM-DD
router.get('/daily', async (req, res) => {
  try {
    if (!req.query.date) {
      return res.status(400).json({ 
        success: false, 
        message: "Fecha requerida. Usar formato: ?date=YYYY-MM-DD" 
      });
    }

    const targetDate = new Date(req.query.date);
    const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    // Validar que la fecha sea válida
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: "Fecha inválida. Usar formato: YYYY-MM-DD" 
      });
    }

    // Turnos del día
    const appointments = await prisma.appointment.findMany({
      where: { 
        date: { 
          gte: targetDate, 
          lt: nextDay 
        } 
      },
      orderBy: { time: 'asc' }
    });

    // Ingresos extra del día
    const ingresos = await prisma.extraIncome.findMany({
      where: { 
        date: { 
          gte: targetDate, 
          lt: nextDay 
        } 
      },
      orderBy: { createdAt: 'asc' }
    });

    // Egresos del día
    const expenses = await prisma.expense.findMany({
      where: { 
        date: { 
          gte: targetDate, 
          lt: nextDay 
        } 
      },
      orderBy: { createdAt: 'asc' }
    });

    // Calcular totales por barbero
    const totalsByBarber = appointments.reduce((acc, turno) => {
      if (!acc[turno.barber]) {
        acc[turno.barber] = {
          total: 0,
          count: 0,
          services: {}
        };
      }
      acc[turno.barber].total += turno.price;
      acc[turno.barber].count += 1;
      
      // Contar servicios por barbero
      if (!acc[turno.barber].services[turno.service]) {
        acc[turno.barber].services[turno.service] = 0;
      }
      acc[turno.barber].services[turno.service] += 1;
      
      return acc;
    }, {});

    // Calcular totales por forma de pago
    const totalsByPayment = appointments.reduce((acc, turno) => {
      if (!acc[turno.paymentMethod]) {
        acc[turno.paymentMethod] = {
          total: 0,
          count: 0
        };
      }
      acc[turno.paymentMethod].total += turno.price;
      acc[turno.paymentMethod].count += 1;
      return acc;
    }, {});

    // Calcular totales generales
    const totalTurnos = appointments.reduce((sum, t) => sum + t.price, 0);
    const totalIngresos = ingresos.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netTotal = totalTurnos + totalIngresos - totalExpenses;

    // Estadísticas adicionales
    const stats = {
      appointmentsCount: appointments.length,
      ingresosCount: ingresos.length,
      expensesCount: expenses.length,
      averageAppointmentPrice: appointments.length > 0 ? Math.round(totalTurnos / appointments.length) : 0,
      mostPopularService: null,
      mostActiveBarber: null
    };

    // Servicio más popular
    const serviceCount = appointments.reduce((acc, turno) => {
      acc[turno.service] = (acc[turno.service] || 0) + 1;
      return acc;
    }, {});
    
    if (Object.keys(serviceCount).length > 0) {
      stats.mostPopularService = Object.entries(serviceCount)
        .sort(([,a], [,b]) => b - a)[0][0];
    }

    // Barbero más activo
    if (Object.keys(totalsByBarber).length > 0) {
      stats.mostActiveBarber = Object.entries(totalsByBarber)
        .sort(([,a], [,b]) => b.count - a.count)[0][0];
    }

    res.json({
      success: true,
      data: {
        date: req.query.date,
        appointments,
        ingresos,
        expenses,
        totals: {
          turnos: totalTurnos,
          ingresos: totalIngresos,
          expenses: totalExpenses,
          net: netTotal
        },
        totalsByBarber,
        totalsByPayment,
        stats
      }
    });
  } catch (error) {
    console.error('Error generating daily report:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al generar reporte diario: " + error.message 
    });
  }
});

// GET weekly report
router.get('/weekly', async (req, res) => {
  try {
    if (!req.query.startDate) {
      return res.status(400).json({ 
        success: false, 
        message: "Fecha de inicio requerida. Usar formato: ?startDate=YYYY-MM-DD" 
      });
    }

    const startDate = new Date(req.query.startDate);
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: "Fecha inválida. Usar formato: YYYY-MM-DD" 
      });
    }

    // Obtener datos de la semana
    const appointments = await prisma.appointment.findMany({
      where: { 
        date: { 
          gte: startDate, 
          lt: endDate 
        } 
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }]
    });

    const ingresos = await prisma.extraIncome.findMany({
      where: { 
        date: { 
          gte: startDate, 
          lt: endDate 
        } 
      }
    });

    const expenses = await prisma.expense.findMany({
      where: { 
        date: { 
          gte: startDate, 
          lt: endDate 
        } 
      }
    });

    // Agrupar por día
    const dailyData = {};
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      dailyData[dateStr] = {
        appointments: [],
        ingresos: [],
        expenses: [],
        totals: { turnos: 0, ingresos: 0, expenses: 0, net: 0 }
      };
    }

    // Distribuir datos por día
    appointments.forEach(apt => {
      const dateStr = apt.date.toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].appointments.push(apt);
        dailyData[dateStr].totals.turnos += apt.price;
      }
    });

    ingresos.forEach(ing => {
      const dateStr = ing.date.toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].ingresos.push(ing);
        dailyData[dateStr].totals.ingresos += ing.amount;
      }
    });

    expenses.forEach(exp => {
      const dateStr = exp.date.toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].expenses.push(exp);
        dailyData[dateStr].totals.expenses += exp.amount;
      }
    });

    // Calcular neto por día
    Object.keys(dailyData).forEach(date => {
      const day = dailyData[date];
      day.totals.net = day.totals.turnos + day.totals.ingresos - day.totals.expenses;
    });

    // Totales de la semana
    const weeklyTotals = {
      turnos: appointments.reduce((sum, apt) => sum + apt.price, 0),
      ingresos: ingresos.reduce((sum, ing) => sum + ing.amount, 0),
      expenses: expenses.reduce((sum, exp) => sum + exp.amount, 0)
    };
    weeklyTotals.net = weeklyTotals.turnos + weeklyTotals.ingresos - weeklyTotals.expenses;

    res.json({
      success: true,
      data: {
        period: {
          startDate: req.query.startDate,
          endDate: endDate.toISOString().split('T')[0]
        },
        dailyData,
        weeklyTotals
      }
    });
  } catch (error) {
    console.error('Error generating weekly report:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al generar reporte semanal: " + error.message 
    });
  }
});

// GET monthly summary
router.get('/monthly', async (req, res) => {
  try {
    if (!req.query.year || !req.query.month) {
      return res.status(400).json({ 
        success: false, 
        message: "Año y mes requeridos. Usar formato: ?year=2024&month=1" 
      });
    }

    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ 
        success: false, 
        message: "Año y mes inválidos" 
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Obtener datos del mes
    const appointments = await prisma.appointment.findMany({
      where: { 
        date: { 
          gte: startDate, 
          lt: endDate 
        } 
      }
    });

    const ingresos = await prisma.extraIncome.findMany({
      where: { 
        date: { 
          gte: startDate, 
          lt: endDate 
        } 
      }
    });

    const expenses = await prisma.expense.findMany({
      where: { 
        date: { 
          gte: startDate, 
          lt: endDate 
        } 
      }
    });

    // Calcular totales
    const monthlyTotals = {
      turnos: appointments.reduce((sum, apt) => sum + apt.price, 0),
      ingresos: ingresos.reduce((sum, ing) => sum + ing.amount, 0),
      expenses: expenses.reduce((sum, exp) => sum + exp.amount, 0)
    };
    monthlyTotals.net = monthlyTotals.turnos + monthlyTotals.ingresos - monthlyTotals.expenses;

    // Estadísticas por barbero
    const barberStats = appointments.reduce((acc, apt) => {
      if (!acc[apt.barber]) {
        acc[apt.barber] = { total: 0, count: 0 };
      }
      acc[apt.barber].total += apt.price;
      acc[apt.barber].count += 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        period: { year, month },
        monthlyTotals,
        barberStats,
        counts: {
          appointments: appointments.length,
          ingresos: ingresos.length,
          expenses: expenses.length
        }
      }
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al generar reporte mensual: " + error.message 
    });
  }
});

module.exports = router;
