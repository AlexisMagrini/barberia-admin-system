const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

// GET appointments (optionally filter by date via query param ?date=YYYY-MM-DD)
router.get('/', async (req, res) => {
  try {
    let appointments;
    
    if (req.query.date) {
      const dateQuery = new Date(req.query.date);
      const nextDay = new Date(dateQuery.getTime() + 24 * 60 * 60 * 1000);
      
      appointments = await prisma.appointment.findMany({
        where: {
          date: {
            gte: dateQuery,
            lt: nextDay
          }
        },
        orderBy: [
          { date: 'desc' },
          { time: 'asc' }
        ]
      });
    } else {
      appointments = await prisma.appointment.findMany({
        orderBy: [
          { date: 'desc' },
          { time: 'asc' }
        ]
      });
    }
    
    res.json({ 
      success: true, 
      data: appointments,
      count: appointments.length
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener turnos: " + error.message 
    });
  }
});

// GET single appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: "Turno no encontrado" 
      });
    }
    
    res.json({ 
      success: true, 
      data: appointment 
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener turno: " + error.message 
    });
  }
});

// POST new appointment
router.post('/', async (req, res) => {
  try {
    const { date, time, barber, service, price, paymentMethod } = req.body;
    
    // Validación de campos requeridos
    if (!date || !time || !barber || !service || !price || !paymentMethod) {
      return res.status(400).json({ 
        success: false, 
        message: "Todos los campos son requeridos: date, time, barber, service, price, paymentMethod" 
      });
    }

    // Validar barberos permitidos
    const allowedBarbers = ['Simón', 'Franco', 'Marcos'];
    if (!allowedBarbers.includes(barber)) {
      return res.status(400).json({ 
        success: false, 
        message: "Barbero no válido. Opciones: " + allowedBarbers.join(', ') 
      });
    }

    // Validar formas de pago permitidas
    const allowedPayments = ['Efectivo', 'MercadoPago', 'QR/Tarjeta'];
    if (!allowedPayments.includes(paymentMethod)) {
      return res.status(400).json({ 
        success: false, 
        message: "Forma de pago no válida. Opciones: " + allowedPayments.join(', ') 
      });
    }

    // Validar que el precio sea un número positivo
    const priceNum = parseInt(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "El precio debe ser un número positivo" 
      });
    }

    // Verificar que no haya conflicto de horario
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        date: new Date(date),
        time: time,
        barber: barber
      }
    });

    if (existingAppointment) {
      return res.status(409).json({ 
        success: false, 
        message: `Ya existe un turno para ${barber} el ${date} a las ${time}` 
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        date: new Date(date),
        time,
        barber,
        service,
        price: priceNum,
        paymentMethod
      }
    });
    
    res.status(201).json({ 
      success: true, 
      data: appointment,
      message: "Turno creado exitosamente"
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al crear turno: " + error.message 
    });
  }
});

// PUT update appointment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, barber, service, price, paymentMethod } = req.body;
    
    // Verificar que el turno existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingAppointment) {
      return res.status(404).json({ 
        success: false, 
        message: "Turno no encontrado" 
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        ...(date && { date: new Date(date) }),
        ...(time && { time }),
        ...(barber && { barber }),
        ...(service && { service }),
        ...(price && { price: parseInt(price) }),
        ...(paymentMethod && { paymentMethod })
      }
    });
    
    res.json({ 
      success: true, 
      data: updatedAppointment,
      message: "Turno actualizado exitosamente"
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al actualizar turno: " + error.message 
    });
  }
});

// DELETE appointment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el turno existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingAppointment) {
      return res.status(404).json({ 
        success: false, 
        message: "Turno no encontrado" 
      });
    }

    await prisma.appointment.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ 
      success: true, 
      message: "Turno eliminado exitosamente"
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al eliminar turno: " + error.message 
    });
  }
});

module.exports = router;
