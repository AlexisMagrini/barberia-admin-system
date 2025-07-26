const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes
  await prisma.appointment.deleteMany();
  await prisma.extraIncome.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.price.deleteMany();
  await prisma.admin.deleteMany();

  // Seed tabla de precios
  const prices = [
    // Simón
    { barber: "Simón", service: "Corte", price: 12000 },
    { barber: "Simón", service: "Barba", price: 8000 },
    { barber: "Simón", service: "Corte + Barba", price: 18000 },
    
    // Franco
    { barber: "Franco", service: "Corte", price: 12000 },
    { barber: "Franco", service: "Barba", price: 8000 },
    { barber: "Franco", service: "Corte + Barba", price: 18000 },
    { barber: "Franco", service: "Cejas", price: 5000 },
    
    // Marcos
    { barber: "Marcos", service: "Corte", price: 15500 },
    { barber: "Marcos", service: "Barba", price: 10000 },
    { barber: "Marcos", service: "Corte + Barba", price: 23000 },
    { barber: "Marcos", service: "Global", price: 86000 },
    { barber: "Marcos", service: "Cejas", price: 6000 },
  ];

  console.log('📋 Creando tabla de precios...');
  for (const price of prices) {
    await prisma.price.create({ data: price });
  }

  // Seed usuario administrador
  console.log('👤 Creando usuario administrador...');
  await prisma.admin.create({
    data: {
      username: "admin",
      passwordHash: "admin123" // En producción usar bcrypt
    }
  });

  // Datos de ejemplo para testing
  console.log('📅 Creando datos de ejemplo...');
  
  // Algunos turnos de ejemplo
  const today = new Date();
  await prisma.appointment.createMany({
    data: [
      {
        date: today,
        time: "09:00",
        barber: "Simón",
        service: "Corte",
        price: 12000,
        paymentMethod: "Efectivo"
      },
      {
        date: today,
        time: "10:30",
        barber: "Franco",
        service: "Corte + Barba",
        price: 18000,
        paymentMethod: "MercadoPago"
      },
      {
        date: today,
        time: "14:00",
        barber: "Marcos",
        service: "Global",
        price: 86000,
        paymentMethod: "QR/Tarjeta"
      }
    ]
  });

  // Algunos ingresos extra de ejemplo
  await prisma.extraIncome.createMany({
    data: [
      {
        date: today,
        product: "Pomada",
        amount: 15000
      },
      {
        date: today,
        product: "Shampoo",
        amount: 12000
      }
    ]
  });

  // Algunos egresos de ejemplo
  await prisma.expense.createMany({
    data: [
      {
        date: today,
        motivo: "Compra de productos",
        amount: 25000
      },
      {
        date: today,
        motivo: "Servicios públicos",
        amount: 18000
      }
    ]
  });

  console.log('✅ Seed completado exitosamente!');
  console.log('📊 Datos creados:');
  console.log(`   - ${prices.length} precios`);
  console.log('   - 1 usuario administrador (admin/admin123)');
  console.log('   - 3 turnos de ejemplo');
  console.log('   - 2 ingresos extra de ejemplo');
  console.log('   - 2 egresos de ejemplo');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
