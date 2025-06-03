# Guía para Probar la Integración de WhatsApp desde Cero

Esta guía te ayudará a limpiar la base de datos y configurar todo lo necesario para probar la integración de WhatsApp Business API en el CRM.

## Requisitos Previos

- Node.js y npm instalados
- Base de datos PostgreSQL configurada en tu archivo `.env`
- Proyecto inicializado y migrations aplicadas

## Paso 1: Limpiar la Base de Datos

Para empezar desde cero, necesitamos limpiar la base de datos eliminando todos los datos existentes pero manteniendo la estructura:

```bash
node scripts/reset-database.js
```

Este script te pedirá confirmación antes de proceder. Escribe "SI" (en mayúsculas) para confirmar la limpieza.

## Paso 2: Crear Usuario Administrador

Primero, necesitamos crear un usuario administrador y un tenant:

```bash
node create-admin-user.js
```

Este script creará:

- Un usuario administrador con credenciales:
  - Email: admin@example.com
  - Contraseña: password123
- Un tenant llamado "Empresa Demo"

## Paso 3: Crear Datos de Prueba para WhatsApp

Ahora, vamos a crear datos específicos para probar la integración de WhatsApp:

```bash
node scripts/create-whatsapp-test-data.js
```

Este script creará:

- Configuración de WhatsApp con credenciales de prueba
- Plantillas de mensajes de WhatsApp
- Leads asociados a números de WhatsApp
- Conversaciones con historiales de mensajes

## Paso 4: Acceder a la Aplicación y Probar las Funciones

1. Inicia la aplicación:

```bash
npm run dev
```

2. Accede a la aplicación con el usuario administrador:

   - URL: http://localhost:3000/login
   - Email: admin@example.com
   - Contraseña: password123

3. Explora las diferentes secciones de WhatsApp:

   - **Configuración de WhatsApp**:

     - URL: http://localhost:3000/settings/whatsapp
     - Aquí puedes ver y editar la configuración de la API de WhatsApp

   - **Plantillas de Mensajes**:

     - URL: http://localhost:3000/settings/whatsapp/templates
     - Muestra las plantillas predefinidas creadas por el script

   - **Conversaciones**:

     - URL: http://localhost:3000/conversations
     - Lista todas las conversaciones de WhatsApp
     - Puedes filtrar por estado, asignación, etc.

   - **Conversación Individual**:
     - Haz clic en cualquier conversación para ver el historial de mensajes
     - Prueba enviar un mensaje (no se enviará realmente a WhatsApp sin credenciales válidas)
     - Prueba asignar la conversación a un agente
     - Prueba marcar la conversación como resuelta

## Configuración Real de WhatsApp Business API

Para una integración real con WhatsApp (no solo de prueba), necesitarás:

1. Una cuenta de WhatsApp Business API verificada por Meta
2. Credenciales reales de la API:
   - Phone Number ID
   - Business Account ID
   - Access Token permanente
3. Configurar el webhook en Meta Business Dashboard:
   - URL: https://tu-dominio.com/api/whatsapp/webhook
   - Token de verificación: El mismo que configuraste en la aplicación

## Solución de Problemas

Si encuentras algún problema durante las pruebas:

1. Verifica los logs del servidor para errores detallados
2. Asegúrate de que la base de datos esté correctamente configurada
3. Verifica que todas las migrations se hayan aplicado correctamente
4. Reinicia el servidor después de crear datos de prueba

Para cualquier problema específico con la API de WhatsApp, consulta la documentación oficial de Meta.
