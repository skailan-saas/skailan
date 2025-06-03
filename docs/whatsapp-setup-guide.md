# Guía de Configuración de WhatsApp Business API

Esta guía te ayudará a configurar WhatsApp Business API para pruebas reales con tu aplicación Skailan.

## Prerrequisitos

1. **Cuenta de Meta for Developers**: Necesitas una cuenta en [developers.facebook.com](https://developers.facebook.com)
2. **Aplicación de WhatsApp Business**: Crear una aplicación con WhatsApp Business API habilitado
3. **Número de teléfono verificado**: Un número de teléfono que no esté siendo usado en WhatsApp personal
4. **Túnel público**: ngrok, cloudflare tunnel, o similar para exponer tu localhost

## Paso 1: Configurar Meta for Developers

### 1.1 Crear Aplicación

1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Crea una nueva aplicación
3. Selecciona "Business" como tipo de aplicación
4. Agrega el producto "WhatsApp Business API"

### 1.2 Configurar WhatsApp Business API

1. En el panel de WhatsApp, ve a "Getting Started"
2. Selecciona o crea una cuenta de WhatsApp Business
3. Agrega un número de teléfono y verifica el código SMS
4. Anota los siguientes datos:
   - **Phone Number ID**: ID del número de teléfono
   - **WhatsApp Business Account ID (WABA ID)**: ID de la cuenta de negocio
   - **Access Token**: Token de acceso temporal (luego necesitarás uno permanente)

## Paso 2: Configurar Túnel Público

### Opción A: ngrok (Recomendado para desarrollo)

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto 3000
ngrok http 3000

# Copiar la URL HTTPS (ej: https://abc123.ngrok.io)
```

### Opción B: Cloudflare Tunnel

```bash
# Instalar cloudflared
# Seguir instrucciones en https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

# Crear túnel
cloudflared tunnel --url http://localhost:3000
```

## Paso 3: Configurar Variables de Entorno

Edita tu archivo `.env` y agrega:

```env
# Dominio del túnel (sin https://)
TUNNEL_DOMAIN="abc123.ngrok.io"

# Secreto para verificar webhooks (opcional pero recomendado)
WHATSAPP_WEBHOOK_SECRET="tu_secreto_webhook"
```

## Paso 4: Configurar Canal en Skailan

1. Ve a **Settings > Channels** en tu aplicación Skailan
2. Haz clic en "Add New Connection"
3. Selecciona "WhatsApp Business API"
4. Completa los campos:

   - **Instance Name**: Nombre descriptivo (ej: "WhatsApp Principal")
   - **Phone Number ID**: El ID obtenido en el paso 1.2
   - **Phone Number**: El número con formato internacional (ej: +1234567890)
   - **WABA ID**: El WhatsApp Business Account ID
   - **JWT Status/Access Token**: El token de acceso

5. Haz clic en "Add Connection"

## Paso 5: Configurar Webhook en Meta

1. En Meta for Developers, ve a tu aplicación > WhatsApp > Configuration
2. En la sección "Webhook", haz clic en "Edit"
3. Configura:
   - **Callback URL**: La URL que aparece en Skailan (ej: `https://abc123.ngrok.io/api/webhooks/whatsapp`)
   - **Verify Token**: El token que aparece en Skailan
4. Suscríbete a estos campos:

   - `messages`
   - `message_deliveries`
   - `message_reads`
   - `message_echoes` (opcional)

5. Haz clic en "Verify and Save"

## Paso 6: Probar la Conexión

### 6.1 Probar Conexión API

1. En Skailan, ve al canal creado
2. Haz clic en el menú de opciones (⋮)
3. Selecciona "Test Connection"
4. Deberías ver un mensaje de éxito

### 6.2 Enviar Mensaje de Prueba

1. En el mismo menú, selecciona "Send Test Message"
2. Ingresa un número de teléfono (con código de país)
3. Escribe un mensaje de prueba
4. Haz clic en "Send"

### 6.3 Probar Webhook (Recepción)

1. Envía un mensaje de WhatsApp al número configurado
2. Ve a **Conversations** en Skailan
3. Deberías ver la conversación y el mensaje recibido

## Solución de Problemas

### Error: "Invalid Phone Number ID"

- Verifica que el Phone Number ID sea correcto
- Asegúrate de que el número esté verificado en Meta

### Error: "Invalid Access Token"

- El token puede haber expirado
- Genera un nuevo token permanente en Meta for Developers

### Webhook no funciona

- Verifica que el túnel esté activo
- Comprueba que la URL del webhook sea accesible públicamente
- Revisa los logs del servidor para errores

### Mensajes no se envían

- Verifica que el número de destino esté en formato internacional
- Asegúrate de que el canal esté en estado "Connected"
- Revisa los límites de la API de WhatsApp

## Obtener Token Permanente

Para producción, necesitas un token permanente:

1. Ve a Meta for Developers > Tu App > WhatsApp > Getting Started
2. En "Permanent token", sigue las instrucciones
3. Actualiza el token en la configuración del canal

## Límites de la API

- **Mensajes de prueba**: 1000 conversaciones por mes
- **Números verificados**: Solo puedes enviar a números que te hayan escrito primero
- **Templates**: Para enviar mensajes proactivos necesitas templates aprobados

## Recursos Adicionales

- [Documentación oficial de WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Guía de webhooks](https://developers.facebook.com/docs/whatsapp/webhooks)
- [Referencia de la API](https://developers.facebook.com/docs/whatsapp/cloud-api/reference)
