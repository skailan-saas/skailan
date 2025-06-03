# Módulo de Flows para Skailan

Este módulo permite crear, gestionar y ejecutar flujos conversacionales automatizados en la plataforma Skailan.

## Características implementadas

1. **Soporte para múltiples tipos de nodos:**
   - Texto: Envía mensajes de texto simples
   - Imagen: Envía imágenes con texto opcional
   - Botones: Muestra opciones interactivas mediante botones
   - Carrusel: Muestra una lista de opciones con imágenes y acciones
   - Entrada de usuario: Solicita información al usuario
   - Condición: Permite bifurcación basada en variables
   - Acción: Realiza acciones como llamadas a API o guardar datos

2. **Integración con WhatsApp Business API:**
   - Soporte completo para mensajes interactivos (botones, listas)
   - Manejo de respuestas de usuario a elementos interactivos
   - Implementación de carruseles mediante listas interactivas

3. **Gestión de estado de conversación:**
   - Persistencia del estado entre mensajes
   - Variables para almacenar respuestas y datos
   - Manejo de bifurcaciones condicionales

4. **Triggers automáticos:**
   - Inicio de conversación
   - Recepción de mensajes
   - Detección de palabras clave

5. **Generación de flujos con IA:**
   - Creación de flujos basados en descripciones en lenguaje natural

## Estructura técnica

### Componentes principales

1. **FlowEngine (`src/lib/flows/flow-engine.ts`):**
   - Motor de ejecución de flujos
   - Manejo de nodos y transiciones
   - Gestión de estado de conversación

2. **WhatsappApiService (`src/lib/whatsapp/whatsapp-api.ts`):**
   - Comunicación con WhatsApp Business API
   - Envío de mensajes interactivos

3. **Webhook de WhatsApp (`src/app/api/webhooks/whatsapp/route.ts`):**
   - Procesamiento de mensajes entrantes
   - Manejo de respuestas interactivas

4. **Interfaz de usuario del Flow Builder (`src/app/(app)/flows/page.tsx`):**
   - Editor visual de flujos
   - Interfaz para crear y gestionar flujos

### Flujo de datos

1. Un usuario crea un flujo utilizando la interfaz visual o la generación con IA
2. El flujo se almacena en la base de datos a través de `actions.ts`
3. Cuando se activa un trigger, `FlowEngine` ejecuta el flujo:
   - Busca el flujo en la base de datos
   - Ejecuta los nodos secuencialmente
   - Actualiza el estado de la conversación
4. Las respuestas del usuario son procesadas por el webhook y se pasan al flujo
5. El flujo continúa su ejecución hasta completarse

## Uso del Carousel

El nodo de carrusel permite mostrar una lista de opciones con imágenes y acciones. Para configurarlo:

1. Añadir un nodo de tipo "carousel" al flujo
2. Configurar los elementos del carrusel en formato JSON en el campo "carouselConfigText"

Ejemplo de configuración:

```json
[
  {
    "title": "Producto 1",
    "description": "Descripción del producto 1",
    "imageUrl": "https://ejemplo.com/imagen1.jpg",
    "buttons": [
      {
        "id": "btn_1",
        "label": "Ver detalles"
      }
    ]
  },
  {
    "title": "Producto 2",
    "description": "Descripción del producto 2",
    "imageUrl": "https://ejemplo.com/imagen2.jpg",
    "buttons": [
      {
        "id": "btn_2",
        "label": "Ver detalles"
      }
    ]
  }
]
```

## Mejoras futuras

1. **Soporte para más canales:**
   - Implementar adaptadores para Telegram, Facebook Messenger, etc.

2. **Análisis y optimización:**
   - Añadir métricas de conversión y engagement
   - Implementar A/B testing para optimizar flujos

3. **Validación de flujos:**
   - Detección de nodos inalcanzables o ciclos infinitos
   - Simulación de ejecución de flujo

4. **Plantillas predefinidas:**
   - Biblioteca de flujos comunes para casos de uso frecuentes 