const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanForProduction() {
  try {
    console.log("🧹 Limpiando base de datos para producción...\n");

    // 1. Eliminar todos los datos de ejemplo manteniendo la estructura
    console.log("1️⃣ Eliminando datos de ejemplo...");

    // Eliminar en orden para evitar violaciones de foreign key
    await prisma.message.deleteMany({});
    console.log("   ✅ Mensajes eliminados");

    await prisma.conversation.deleteMany({});
    console.log("   ✅ Conversaciones eliminadas");

    await prisma.whatsappTemplate.deleteMany({});
    console.log("   ✅ Templates de WhatsApp eliminados");

    await prisma.whatsappConfiguration.deleteMany({});
    console.log("   ✅ Configuraciones de WhatsApp eliminadas");

    await prisma.task.deleteMany({});
    console.log("   ✅ Tareas eliminadas");

    await prisma.project.deleteMany({});
    console.log("   ✅ Proyectos eliminados");

    await prisma.quote.deleteMany({});
    console.log("   ✅ Cotizaciones eliminadas");

    await prisma.product.deleteMany({});
    console.log("   ✅ Productos eliminados");

    await prisma.lead.deleteMany({});
    console.log("   ✅ Leads eliminados");

    await prisma.company.deleteMany({});
    console.log("   ✅ Empresas eliminadas");

    // Eliminar usuarios y tenants (excepto si quieres mantener alguno específico)
    await prisma.tenantUser.deleteMany({});
    console.log("   ✅ Relaciones tenant-usuario eliminadas");

    await prisma.tenant.deleteMany({});
    console.log("   ✅ Tenants eliminados");

    await prisma.user.deleteMany({});
    console.log("   ✅ Usuarios eliminados");

    console.log("\n2️⃣ Verificando limpieza...");

    // Verificar que todo esté limpio
    const counts = {
      users: await prisma.user.count(),
      tenants: await prisma.tenant.count(),
      tenantUsers: await prisma.tenantUser.count(),
      companies: await prisma.company.count(),
      leads: await prisma.lead.count(),
      products: await prisma.product.count(),
      quotes: await prisma.quote.count(),
      projects: await prisma.project.count(),
      tasks: await prisma.task.count(),
      whatsappConfigs: await prisma.whatsappConfiguration.count(),
      whatsappTemplates: await prisma.whatsappTemplate.count(),
      conversations: await prisma.conversation.count(),
      messages: await prisma.message.count(),
    };

    console.log("\n📊 Estado final de la base de datos:");
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} registros`);
    });

    const totalRecords = Object.values(counts).reduce(
      (sum, count) => sum + count,
      0
    );

    if (totalRecords === 0) {
      console.log("\n✅ Base de datos completamente limpia");
      console.log("🚀 Sistema listo para producción");

      console.log("\n📋 PRÓXIMOS PASOS PARA PRODUCCIÓN:");
      console.log("=====================================");
      console.log("1. Configurar variables de entorno de producción");
      console.log("2. Configurar dominio principal en lugar de localhost");
      console.log("3. Configurar certificados SSL");
      console.log(
        "4. Configurar WhatsApp Business API con credenciales reales"
      );
      console.log("5. Configurar SMTP para emails");
      console.log("6. Configurar backup automático de base de datos");
      console.log("7. Configurar monitoreo y logs");
      console.log("8. Realizar pruebas de carga");

      console.log("\n🔐 PRIMER USUARIO:");
      console.log(
        "Para crear el primer usuario y tenant, usar la página de registro:"
      );
      console.log("http://skailan.com/signup");
    } else {
      console.log(
        `\n⚠️  Aún quedan ${totalRecords} registros en la base de datos`
      );
    }
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanForProduction();
