# Skailan - Sistema de Gestión de Conversaciones

Sistema completo de gestión de conversaciones con integración WhatsApp Business API, CRM y analytics.

## 🚀 Deployment en Vercel

### Prerrequisitos

1. **Base de datos PostgreSQL** (recomendado: Supabase, Neon, o PlanetScale)
2. **WhatsApp Business API** configurado
3. **Cuenta de Vercel**

### Pasos para Deploy

1. **Fork/Clone este repositorio**

2. **Configurar variables de entorno en Vercel:**

   ```bash
   DATABASE_URL=postgresql://...
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=https://your-app.vercel.app
   WHATSAPP_ACCESS_TOKEN=your-token
   WHATSAPP_PHONE_NUMBER_ID=your-phone-id
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token
   WHATSAPP_WEBHOOK_SECRET=your-webhook-secret
   ```

3. **Deploy en Vercel:**

   ```bash
   npm install -g vercel
   vercel --prod
   ```

4. **Configurar base de datos:**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Configurar webhooks de WhatsApp:**
   - URL: `https://your-app.vercel.app/api/webhooks/whatsapp`
   - Verify Token: el configurado en `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

## 🛠️ Tecnologías

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Base de datos:** PostgreSQL
- **Autenticación:** NextAuth.js
- **UI:** shadcn/ui components
- **Integración:** WhatsApp Business API

## 📱 Características

### ✅ Sistema de Conversaciones

- Chat en tiempo real con WhatsApp
- Gestión de múltiples canales
- Estados de mensaje (enviado, entregado, leído)
- Archivado y cierre de conversaciones

### ✅ CRM Integrado

- Gestión de leads y contactos
- Seguimiento de empresas
- Sistema de tareas y proyectos
- Cotizaciones y propuestas

### ✅ Analytics y Reportes

- Dashboard con métricas en tiempo real
- Distribución por canales
- Análisis de conversaciones

### ✅ Multi-tenant

- Soporte para múltiples organizaciones
- Subdominios personalizados
- Datos aislados por tenant

## 🔧 Configuración Local

1. **Clonar repositorio:**

   ```bash
   git clone <repo-url>
   cd skailan
   ```

2. **Instalar dependencias:**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**

   ```bash
   cp .env.example .env.local
   # Editar .env.local con tus valores
   ```

4. **Configurar base de datos:**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

## 📝 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── (app)/             # Rutas protegidas
│   │   ├── conversations/ # Sistema de chat
│   │   ├── crm/          # Módulos CRM
│   │   ├── dashboard/    # Panel principal
│   │   └── settings/     # Configuraciones
│   ├── api/              # API Routes
│   └── auth/             # Autenticación
├── components/           # Componentes reutilizables
├── lib/                 # Utilidades y servicios
└── hooks/               # Custom hooks
```

## 🔐 Seguridad

- Autenticación con NextAuth.js
- Validación de webhooks WhatsApp
- Aislamiento de datos por tenant
- Variables de entorno para secretos

## 📞 Soporte

Para soporte técnico o consultas sobre implementación, contactar al equipo de desarrollo.

## 📄 Licencia

Proyecto propietario - Todos los derechos reservados.
