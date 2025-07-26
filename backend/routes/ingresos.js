const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

// GET extra incomes (optionally filter by date)
router.get('/', async (req, res) => {
  try {
    let ingresos;
    
    if (req.query.date) {
      const dateQuery = new Date(req.query.date);
      const nextDay = new Date(dateQuery.getTime() + 24 * 60 * 60 * 1000);
      
      ingresos = await prisma.extraIncome.findMany({
        where: {
          date: {
            gte: dateQuery,
            lt: nextDay
          }
        },
        orderBy: { date: 'desc' }
      });
    } else {
      ingresos = await prisma.extraIncome.findMany({
        orderBy: { date: 'desc' }
      });
    }
    
    res.json({ 
      success: true, 
      data: ingresos,
      count: ingresos.length
    });
  } catch (error) {
    console.error('Error fetching extra incomes:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener ingresos extra: " + error.message 
    });
  }
});

// GET single extra income by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ingreso = await prisma.extraIncome.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!ingreso) {
      return res.status(404).json({ 
        success: false, 
        message: "Ingreso extra no encontrado" 
      });
    }
    
    res.json({ 
      success: true, 
      data: ingreso 
    });
  } catch (error) {
    console.error('Error fetching extra income:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener ingreso extra: " + error.message 
    });
  }
});

// POST new extra income
router.post('/', async (req, res) => {
  try {
    const { date, product, amount } = req.body;
    
    // Validación de campos requeridos
    if (!date || !product || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: "Todos los campos son requeridos: date, product, amount" 
      });
    }

    // Validar productos permitidos (dropdown)
    const allowedProducts = [
      'Pomada',
      'Shampoo',
      'Cera',
      'Aceite para barba',
      'Bálsamo',
      'Gel',
      'Spray fijador',
      'Loción aftershave',
      'Crema hidratante',
      'Otros productos'
    ];
    
    if (!allowedProducts.includes(product)) {
      return res.status(400).json({ 
        success: false, 
        message: "Producto no válido. Opciones: " + allowedProducts.join(', ') 
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

    const ingreso = await prisma.extraIncome.create({
      data: {
        date: new Date(date),
        product,
        amount: amountNum
      }
    });
    
    res.status(201).json({ 
      success: true, 
      data: ingreso,
      message: "Ingreso extra creado exitosamente"
    });
  } catch (error) {
    console.error('Error creating extra income:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al crear ingreso extra: " + error.message 
    });
  }
});

// PUT update extra income
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, product, amount } = req.body;
    
    // Verificar que el ingreso existe
    const existingIngreso = await prisma.extraIncome.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingIngreso) {
      return res.status(404).json({ 
        success: false, 
        message: "Ingreso extra no encontrado" 
      });
    }

    const updatedIngreso = await prisma.extraIncome.update({
      where: { id: parseInt(id) },
      data: {
        ...(date && { date: new Date(date) }),
        ...(product && { product }),
        ...(amount && { amount: parseInt(amount) })
      }
    });
    
    res.json({ 
      success: true, 
      data: updatedIngreso,
      message: "Ingreso extra actualizado exitosamente"
    });
  } catch (error) {
    console.error('Error updating extra income:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al actualizar ingreso extra: " + error.message 
    });
  }
});

// DELETE extra income
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el ingreso existe
    const existingIngreso = await prisma.extraIncome.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingIngreso) {
      return res.status(404).json({ 
        success: false, 
        message: "Ingreso extra no encontrado" 
      });
    }

    await prisma.extraIncome.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ 
      success: true, 
      message: "Ingreso extra eliminado exitosamente"
    });
  } catch (error) {
    console.error('Error deleting extra income:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al eliminar ingreso extra: " + error.message 
    });
  }
});

// GET available products (for dropdown)
router.get('/config/products', async (req, res) => {
  try {
    const products = [
      'Pomada',
      'Shampoo',
      'Cera',
      'Aceite para barba',
      'Bálsamo',
      'Gel',
      'Spray fijador',
      'Loción aftershave',
      'Crema hidratante',
      'Otros productos'
    ];
    
    res.json({ 
      success: true, 
      data: products 
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener productos: " + error.message 
    });
  }
});

module.exports = router;
