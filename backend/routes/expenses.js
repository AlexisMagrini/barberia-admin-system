const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

// GET expenses (optionally filter by date)
router.get('/', async (req, res) => {
  try {
    let expenses;
    
    if (req.query.date) {
      const dateQuery = new Date(req.query.date);
      const nextDay = new Date(dateQuery.getTime() + 24 * 60 * 60 * 1000);
      
      expenses = await prisma.expense.findMany({
        where: {
          date: {
            gte: dateQuery,
            lt: nextDay
          }
        },
        orderBy: { date: 'desc' }
      });
    } else {
      expenses = await prisma.expense.findMany({
        orderBy: { date: 'desc' }
      });
    }
    
    res.json({ 
      success: true, 
      data: expenses,
      count: expenses.length
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener egresos: " + error.message 
    });
  }
});

// GET single expense by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await prisma.expense.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!expense) {
      return res.status(404).json({ 
        success: false, 
        message: "Egreso no encontrado" 
      });
    }
    
    res.json({ 
      success: true, 
      data: expense 
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener egreso: " + error.message 
    });
  }
});

// POST new expense
router.post('/', async (req, res) => {
  try {
    const { date, motivo, amount } = req.body;
    
    // Validación de campos requeridos
    if (!date || !motivo || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: "Todos los campos son requeridos: date, motivo, amount" 
      });
    }

    // Validar que el motivo no esté vacío y tenga longitud razonable
    if (typeof motivo !== 'string' || motivo.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "El motivo debe ser un texto válido" 
      });
    }

    if (motivo.trim().length > 200) {
      return res.status(400).json({ 
        success: false, 
        message: "El motivo no puede exceder 200 caracteres" 
      });
    }

    // Validar que el monto sea un número positivo
    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "El monto debe ser un número positivo" 
      });
    }

    const expense = await prisma.expense.create({
      data: {
        date: new Date(date),
        motivo: motivo.trim(),
        amount: amountNum
      }
    });
    
    res.status(201).json({ 
      success: true, 
      data: expense,
      message: "Egreso creado exitosamente"
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al crear egreso: " + error.message 
    });
  }
});

// PUT update expense
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, motivo, amount } = req.body;
    
    // Verificar que el egreso existe
    const existingExpense = await prisma.expense.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingExpense) {
      return res.status(404).json({ 
        success: false, 
        message: "Egreso no encontrado" 
      });
    }

    // Validaciones para campos que se están actualizando
    const updateData = {};
    
    if (date) {
      updateData.date = new Date(date);
    }
    
    if (motivo !== undefined) {
      if (typeof motivo !== 'string' || motivo.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "El motivo debe ser un texto válido" 
        });
      }
      if (motivo.trim().length > 200) {
        return res.status(400).json({ 
          success: false, 
          message: "El motivo no puede exceder 200 caracteres" 
        });
      }
      updateData.motivo = motivo.trim();
    }
    
    if (amount !== undefined) {
      const amountNum = parseInt(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: "El monto debe ser un número positivo" 
        });
      }
      updateData.amount = amountNum;
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    res.json({ 
      success: true, 
      data: updatedExpense,
      message: "Egreso actualizado exitosamente"
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al actualizar egreso: " + error.message 
    });
  }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el egreso existe
    const existingExpense = await prisma.expense.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingExpense) {
      return res.status(404).json({ 
        success: false, 
        message: "Egreso no encontrado" 
      });
    }

    await prisma.expense.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ 
      success: true, 
      message: "Egreso eliminado exitosamente"
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al eliminar egreso: " + error.message 
    });
  }
});

// GET expense statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let whereClause = {};
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause
    });

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const count = expenses.length;
    const averageAmount = count > 0 ? Math.round(totalAmount / count) : 0;

    // Agrupar por motivos más comunes
    const motivoGroups = expenses.reduce((acc, expense) => {
      const motivo = expense.motivo.toLowerCase();
      acc[motivo] = (acc[motivo] || 0) + expense.amount;
      return acc;
    }, {});

    res.json({ 
      success: true, 
      data: {
        totalAmount,
        count,
        averageAmount,
        motivoGroups,
        period: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener estadísticas de egresos: " + error.message 
    });
  }
});

module.exports = router;
