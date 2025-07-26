# 🪒 Barbería Admin - Sistema de Gestión

Sistema administrativo completo para barbería con gestión de turnos, ingresos, egresos y reportes diarios. Desarrollado con Next.js, Express, Prisma y SQLite.

## 📋 Características

- ✅ **Gestión de Turnos**: Registro con precios dinámicos por barbero
- ✅ **Ingresos Extra**: Control de ventas de productos
- ✅ **Egresos**: Seguimiento de gastos operativos
- ✅ **Reportes**: Análisis diario y semanal con estadísticas
- ✅ **Dashboard**: Vista general con métricas en tiempo real
- ✅ **Interfaz Intuitiva**: Solo dropdowns, sin tipeo libre
- ✅ **Responsive**: Adaptado para móviles y desktop
- ✅ **Autenticación**: Sistema de login seguro

## 🏗️ Arquitectura

```
barbershop-admin/
├── backend/                 # API REST con Express + Prisma
│   ├── prisma/             # Esquema y migraciones de BD
│   ├── routes/             # Endpoints organizados
│   └── server.js           # Servidor principal
├── src/                    # Frontend Next.js
│   ├── app/               # Pages (App Router)
│   └── components/        # Componentes reutilizables
└── README.md              # Este archivo
```

## 🚀 Instalación Local

### Prerrequisitos

- Node.js 18+ instalado
- npm o yarn
- Git

### Paso 1: Clonar y configurar

```bash
# Clonar el repositorio
git clone <tu-repo-url>
cd barbershop-admin

# Instalar dependencias del frontend
npm install
```

### Paso 2: Configurar Backend

```bash
# Navegar al backend
cd backend

# Instalar dependencias
npm install

# Configurar base de datos
npx prisma migrate dev --name init

# Poblar con datos iniciales
npm run seed
```

### Paso 3: Configurar Variables de Entorno

El archivo `.env.local` ya está configurado con:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Barbería Admin
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Paso 4: Ejecutar la Aplicación

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Servidor corriendo en http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
# Desde la raíz del proyecto
npm run dev
# Aplicación corriendo en http://localhost:8000
```

### Paso 5: Acceder al Sistema

1. Abrir http://localhost:8000
2. Usar credenciales por defecto:
   - **Usuario**: `admin`
   - **Contraseña**: `admin123`

## 📊 Datos Iniciales

El sistema viene con datos de ejemplo:

### Barberos y Precios
- **Simón**: Corte ($12.000), Barba ($8.000), Corte + Barba ($18.000)
- **Franco**: Corte ($12.000), Barba ($8.000), Corte + Barba ($18.000), Cejas ($5.000)
- **Marcos**: Corte ($15.500), Barba ($10.000), Corte + Barba ($23.000), Global ($86.000), Cejas ($6.000)

### Datos de Prueba
- 3 turnos de ejemplo del día actual
- 2 ingresos extra (productos)
- 2 egresos (gastos)

## 🌐 Despliegue en la Nube

### Opción 1: Vercel (Frontend) + Render (Backend)

#### Frontend en Vercel

1. **Preparar el proyecto:**
```bash
# Crear build de producción
npm run build
```

2. **Desplegar en Vercel:**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Configurar variables de entorno en Vercel Dashboard:
# NEXT_PUBLIC_API_URL=https://tu-backend.render.com/api
```

#### Backend en Render

1. **Crear cuenta en Render.com**

2. **Crear nuevo Web Service:**
   - Conectar repositorio
   - Build Command: `cd backend && npm install && npx prisma migrate deploy && npm run seed`
   - Start Command: `cd backend && npm start`
   - Environment Variables:
     ```
     NODE_ENV=production
     PORT=5000
     ```

3. **Configurar base de datos:**
   - Para producción, considera migrar a PostgreSQL
   - Render ofrece PostgreSQL gratuito

### Opción 2: Railway (Full Stack)

1. **Crear cuenta en Railway.app**

2. **Desplegar desde GitHub:**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login y desplegar
railway login
railway link
railway up
```

3. **Configurar servicios:**
   - Backend: Puerto 5000
   - Frontend: Puerto 8000
   - Variables de entorno automáticas

### Migración a PostgreSQL (Producción)

Para producción, reemplaza SQLite con PostgreSQL:

1. **Actualizar `backend/prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. **Configurar variable de entorno:**
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

3. **Ejecutar migración:**
```bash
npx prisma migrate deploy
npm run seed
```

## 🐳 Docker (Opcional)

### Docker Compose para desarrollo local

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development

  frontend:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5000/api
    depends_on:
      - backend
```

```bash
# Ejecutar con Docker
docker-compose up --build
```

## 🔧 Configuración Avanzada

### Personalizar Barberos y Servicios

Editar `backend/prisma/seed.js` para modificar:
- Lista de barberos
- Servicios disponibles
- Precios por barbero/servicio
- Productos para ingresos extra

### Agregar Nuevos Endpoints

1. Crear ruta en `backend/routes/`
2. Registrar en `backend/server.js`
3. Actualizar frontend según necesidad

### Modificar Interfaz

- Componentes UI en `src/components/ui/`
- Páginas en `src/app/`
- Estilos con TailwindCSS

## 📱 Uso del Sistema

### Dashboard
- Vista general de métricas diarias
- Totales por barbero y forma de pago
- Estadísticas de rendimiento

### Gestión de Turnos
- Formulario con dropdowns únicamente
- Precios automáticos según barbero/servicio
- Validación de horarios disponibles

### Ingresos Extra
- Registro de ventas de productos
- Categorización automática
- Resumen por producto

### Egresos
- Control de gastos operativos
- Categorización inteligente
- Estadísticas de gastos

### Reportes
- Reporte diario detallado
- Reporte semanal comparativo
- Exportación de datos (futuro)

## 🛠️ Desarrollo

### Estructura de Archivos Clave

```
backend/
├── routes/
│   ├── appointments.js    # CRUD turnos
│   ├── ingresos.js       # CRUD ingresos extra
│   ├── expenses.js       # CRUD egresos
│   ├── prices.js         # Gestión precios
│   └── reports.js        # Reportes y analytics
├── prisma/
│   ├── schema.prisma     # Modelo de datos
│   └── seed.js          # Datos iniciales
└── server.js            # Servidor Express

src/
├── app/
│   ├── dashboard/       # Dashboard principal
│   ├── turnos/         # Gestión turnos
│   ├── ingresos/       # Ingresos extra
│   ├── egresos/        # Egresos
│   └── reportes/       # Reportes
└── components/
    ├── AuthLayout.tsx   # Layout autenticado
    └── Navigation.tsx   # Navegación principal
```

### Scripts Disponibles

```bash
# Frontend
npm run dev          # Desarrollo
npm run build        # Build producción
npm run start        # Servidor producción

# Backend
cd backend
npm run dev          # Desarrollo con nodemon
npm run seed         # Poblar base de datos
npm run migrate      # Ejecutar migraciones
```

## 🔒 Seguridad

### Producción
- Cambiar credenciales por defecto
- Implementar JWT tokens
- Usar HTTPS obligatorio
- Validar inputs del servidor
- Implementar rate limiting

### Variables de Entorno Sensibles
```env
# Producción
JWT_SECRET=tu-jwt-secret-muy-seguro
DATABASE_URL=postgresql://...
ADMIN_PASSWORD_HASH=hash-bcrypt
```

## 🐛 Troubleshooting

### Problemas Comunes

1. **Error de conexión Backend/Frontend:**
   - Verificar que ambos servidores estén corriendo
   - Confirmar URLs en `.env.local`

2. **Error de base de datos:**
   ```bash
   cd backend
   rm prisma/dev.db
   npx prisma migrate dev --name init
   npm run seed
   ```

3. **Problemas de dependencias:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Logs y Debugging

- Backend logs: Consola del servidor Express
- Frontend logs: DevTools del navegador
- Base de datos: `npx prisma studio` (interfaz visual)

## 📞 Soporte

Para problemas o mejoras:

1. Revisar logs de error
2. Verificar configuración de variables de entorno
3. Consultar documentación de dependencias
4. Crear issue en el repositorio

## 🚀 Próximas Mejoras

- [ ] Exportación PDF/Excel de reportes
- [ ] Notificaciones push
- [ ] Calendario visual de turnos
- [ ] Multi-barbería (sucursales)
- [ ] App móvil nativa
- [ ] Integración con sistemas de pago
- [ ] Backup automático de datos

---

**Desarrollado con ❤️ para optimizar la gestión de barberías**

*Sistema completo, intuitivo y escalable para el control administrativo diario.*
