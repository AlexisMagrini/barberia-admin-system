const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

// GET all prices
router.get('/', async (req, res) => {
  try {
    const prices = await prisma.price.findMany({
      orderBy: [
        { barber: 'asc' },
        { service: 'asc' }
      ]
    });
    
    res.json({ 
      success: true, 
      data: prices,
      count: prices.length
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener precios: " + error.message 
    });
  }
});

// GET prices by barber
router.get('/barber/:barber', async (req, res) => {
  try {
    const { barber } = req.params;
    
    // Validar barberos permitidos
    const allowedBarbers = ['Simón', 'Franco', 'Marcos'];
    if (!allowedBarbers.includes(barber)) {
      return res.status(400).json({ 
        success: false, 
        message: "Barbero no válido. Opciones: " + allowedBarbers.join(', ') 
      });
    }

    const prices = await prisma.price.findMany({
      where: { barber },
      orderBy: { service: 'asc' }
    });
    
    res.json({ 
      success: true, 
      data: prices,
      barber,
      count: prices.length
    });
  } catch (error) {
    console.error('Error fetching prices by barber:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener precios por barbero: " + error.message 
    });
  }
});

// GET services by barber (for dropdown)
router.get('/services/:barber', async (req, res) => {
  try {
    const { barber } = req.params;
    
    // Validar barberos permitidos
    const allowedBarbers = ['Simón', 'Franco', 'Marcos'];
    if (!allowedBarbers.includes(barber)) {
      return res.status(400).json({ 
        success: false, 
        message: "Barbero no válido. Opciones: " + allowedBarbers.join(', ') 
      });
    }

    const services = await prisma.price.findMany({
      where: { barber },
      select: {
        service: true,
        price: true
      },
      orderBy: { service: 'asc' }
    });
    
    res.json({ 
      success: true, 
      data: services,
      barber,
      count: services.length
    });
  } catch (error) {
    console.error('Error fetching services by barber:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener servicios por barbero: " + error.message 
    });
  }
});

// GET specific price
router.get('/price/:barber/:service', async (req, res) => {
  try {
    const { barber, service } = req.params;
    
    const price = await prisma.price.findFirst({
      where: { 
        barber,
        service 
      }
    });
    
    if (!price) {
      return res.status(404).json({ 
        success: false, 
        message: `No se encontró precio para ${barber} - ${service}` 
      });
    }
    
    res.json({ 
      success: true, 
      data: price
    });
  } catch (error) {
    console.error('Error fetching specific price:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener precio específico: " + error.message 
    });
  }
});

// GET all barbers
router.get('/config/barbers', async (req, res) => {
  try {
    const barbers = await prisma.price.findMany({
      select: { barber: true },
      distinct: ['barber'],
      orderBy: { barber: 'asc' }
    });
    
    const barberNames = barbers.map(b => b.barber);
    
    res.json({ 
      success: true, 
      data: barberNames
    });
  } catch (error) {
    console.error('Error fetching barbers:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener barberos: " + error.message 
    });
  }
});

// GET all services
router.get('/config/services', async (req, res) => {
  try {
    const services = await prisma.price.findMany({
      select: { service: true },
      distinct: ['service'],
      orderBy: { service: 'asc' }
    });
    
    const serviceNames = services.map(s => s.service);
    
    res.json({ 
      success: true, 
      data: serviceNames
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener servicios: " + error.message 
    });
  }
});

// POST create new price (admin only)
router.post('/', async (req, res) => {
  try {
    const { barber, service, price } = req.body;
    
    // Validación de campos requeridos
    if (!barber || !service || !price) {
      return res.status(400).json({ 
        success: false, 
        message: "Todos los campos son requeridos: barber, service, price" 
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

    // Validar que el precio sea un número positivo
    const priceNum = parseInt(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "El precio debe ser un número positivo" 
      });
    }

    // Verificar si ya existe esta combinación
    const existingPrice = await prisma.price.findFirst({
      where: { barber, service }
    });

    if (existingPrice) {
      return res.status(409).json({ 
        success: false, 
        message: `Ya existe un precio para ${barber} - ${service}` 
      });
    }

    const newPrice = await prisma.price.create({
      data: {
        barber,
        service,
        price: priceNum
      }
    });
    
    res.status(201).json({ 
      success: true, 
      data: newPrice,
      message: "Precio creado exitosamente"
    });
  } catch (error) {
    console.error('Error creating price:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al crear precio: " + error.message 
    });
  }
});

// PUT update price
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { barber, service, price } = req.body;
    
    // Verificar que el precio existe
    const existingPrice = await prisma.price.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingPrice) {
      return res.status(404).json({ 
        success: false, 
        message: "Precio no encontrado" 
      });
    }

    const updateData = {};
    
    if (barber) {
      const allowedBarbers = ['Simón', 'Franco', 'Marcos'];
      if (!allowedBarbers.includes(barber)) {
        return res.status(400).json({ 
          success: false, 
          message: "Barbero no válido. Opciones: " + allowedBarbers.join(', ') 
        });
      }
      updateData.barber = barber;
    }
    
    if (service) {
      updateData.service = service;
    }
    
    if (price !== undefined) {
      const priceNum = parseInt(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: "El precio debe ser un número positivo" 
        });
      }
      updateData.price = priceNum;
    }

    const updatedPrice = await prisma.price.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    res.json({ 
      success: true, 
      data: updatedPrice,
      message: "Precio actualizado exitosamente"
    });
  } catch (error) {
    console.error('Error updating price:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al actualizar precio: " + error.message 
    });
  }
});

// DELETE price
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el precio existe
    const existingPrice = await prisma.price.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingPrice) {
      return res.status(404).json({ 
        success: false, 
        message: "Precio no encontrado" 
      });
    }

    await prisma.price.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ 
      success: true, 
      message: "Precio eliminado exitosamente"
    });
  } catch (error) {
    console.error('Error deleting price:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al eliminar precio: " + error.message 
    });
  }
});

module.exports = router;
