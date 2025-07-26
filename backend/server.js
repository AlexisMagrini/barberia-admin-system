const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middlewares
app.use(cors({
  origin: ['http://localhost:8000', 'http://localhost:3000'], // Frontend URLs
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simple authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];
  if (token === 'Bearer admin-token') {
    next();
  } else {
    res.status(401).json({ 
      success: false, 
      message: "No autorizado. Token requerido." 
    });
  }
};

// Public routes
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Usuario y contraseña requeridos" 
      });
    }

    // Verificación simple - en producción usar bcrypt y DB
    if (username === "admin" && password === "admin123") {
      return res.json({ 
        success: true, 
        token: "admin-token",
        message: "Login exitoso"
      });
    }
    
    res.status(401).json({ 
      success: false, 
      message: "Credenciales inválidas" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: "Backend funcionando correctamente",
    timestamp: new Date().toISOString()
  });
});

// Protected routes
const appointmentsRouter = require('./routes/appointments');
const ingresosRouter = require('./routes/ingresos');
const expensesRouter = require('./routes/expenses');
const pricesRouter = require('./routes/prices');
const reportsRouter = require('./routes/reports');

app.use('/api/turnos', authMiddleware, appointmentsRouter);
app.use('/api/ingresos', authMiddleware, ingresosRouter);
app.use('/api/egresos', authMiddleware, expensesRouter);
app.use('/api/prices', authMiddleware, pricesRouter);
app.use('/api/reports', authMiddleware, reportsRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: "Error interno del servidor" 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/login`);
});

module.exports = app;
