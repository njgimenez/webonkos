# 🤖 Esquema del Chatbot LucIA - Onkos Instituto del Cáncer

## 📋 Resumen del Sistema

**LucIA** es un chatbot inteligente que actúa como recepcionista virtual del Onkos Instituto del Cáncer. Utiliza **Groq AI** con el modelo `moonshotai/kimi-k2-instruct` para proporcionar respuestas naturales y gestionar el agendamiento de citas médicas.

## 🏗️ Arquitectura del Sistema

### Frontend (Vue.js 3)
- **Componente**: `ChatBot.vue` (1,341 líneas)
- **Ubicación**: `frontend/src/components/ChatBot.vue`
- **Funcionalidades**:
  - Interfaz de chat flotante
  - Indicador de escritura en tiempo real
  - Gestión de conversación
  - Flujo de agendamiento de citas
  - Validación de datos con IA

### Backend (Node.js + Express)
- **Endpoint Principal**: `/api/chat`
- **Archivo**: `backend/server.js` (líneas 122-250)
- **IA**: Groq AI con fallback a respuestas predefinidas
- **Base de Datos**: PostgreSQL para gestión de citas y pacientes

## 🔄 Flujo de Funcionamiento

### 1. Inicialización
```
Usuario abre la página → ChatBot se monta → Mensaje de bienvenida
```

### 2. Procesamiento de Mensajes
```
Usuario escribe mensaje → Frontend valida → Envía a /api/chat → Backend procesa
```

### 3. Respuesta de IA
```
Backend recibe mensaje → Construye contexto → Envía a Groq AI → Procesa respuesta → Envía al frontend
```

### 4. Presentación al Usuario
```
Frontend recibe respuesta → Calcula tiempo de escritura → Simula escritura → Muestra mensaje
```

## 🎯 Flujo de Agendamiento de Citas

### Paso 1: Detección de Intención
- **Trigger**: Palabras clave como "agendar", "cita", "consulta"
- **Acción**: Activa modo agendamiento
- **Respuesta**: "Perfecto, te ayudo a agendar tu cita. ¿Cuál es tu nombre completo?"

### Paso 2: Recolección de Datos
1. **Nombre**: Captura nombre completo
2. **Documento**: Valida tipo y número con IA
3. **Contacto**: Valida teléfono y email con IA
4. **Validación de Paciente**: Busca en base de datos
5. **Fecha de Nacimiento**: Si es paciente nuevo
6. **Especialidad**: Selección de especialidad médica
7. **Fecha de Cita**: Interpretación natural de fechas
8. **Hora**: Selección de horario disponible
9. **Motivo**: Descripción de la consulta

### Paso 3: Validaciones con IA
- **Documentos**: DNI, CE, Pasaporte
- **Teléfonos**: Formato peruano (+51 9XXXXXXXX)
- **Emails**: Validación de formato
- **Fechas**: Interpretación de formatos naturales
- **Horarios**: Conversión de expresiones naturales

### Paso 4: Confirmación y Creación
- **Resumen**: Muestra datos recopilados
- **Confirmación**: Usuario confirma o modifica
- **Creación**: Guarda paciente y cita en PostgreSQL

## 🧠 Sistema de IA

### Modelo Principal
- **Proveedor**: Groq AI
- **Modelo**: `moonshotai/kimi-k2-instruct`
- **Configuración**:
  - Temperature: 0.7
  - Max tokens: 1000
  - Contexto: Historial de conversación

### Prompt del Sistema
```
Eres LucIA, recepcionista del Onkos Instituto del Cáncer en Perú.
- Personalidad: Natural, amigable, profesional
- Tono: Conversacional, empático
- Funciones: Información y agendamiento de citas
- Flujo: 9 pasos estructurados para citas
```

### Fallback
- **Respuestas Predefinidas**: Si Groq no está disponible
- **Funciones**: `getChatbotResponse()` con respuestas hardcodeadas
- **Cobertura**: Información básica de la clínica

## 🔧 Endpoints del Backend

### Chat Principal
- **POST** `/api/chat`
- **Función**: Procesamiento de mensajes con IA
- **Parámetros**: `message`, `conversationHistory`

### Agendamiento de Citas
- **POST** `/api/chatbot/validar-paciente`
- **POST** `/api/chatbot/crear-paciente`
- **POST** `/api/chatbot/agendar-cita`
- **GET** `/api/chatbot/medicos/:especialidad`
- **POST** `/api/chatbot/verificar-disponibilidad`

### Análisis Médico (Bonus)
- **POST** `/api/analyze-exam`
- **POST** `/api/follow-up`
- **Función**: Análisis de imágenes médicas con Groq

## 🎨 Características de UX

### Interfaz de Chat
- **Botón flotante**: Esquina inferior derecha
- **Ventana deslizable**: Se abre/cierra suavemente
- **Indicador de escritura**: "LucIA está escribiendo..."
- **Notificaciones**: Badge cuando hay mensajes no leídos

### Simulación de Escritura
- **Tiempo calculado**: Basado en longitud del texto
- **Velocidad**: 40 palabras por minuto
- **Límites**: Mínimo 1s, máximo 8s
- **División**: Mensajes largos se dividen automáticamente

### Gestión de Estado
- **Conversación**: Historial limitado a 10 mensajes
- **Agendamiento**: Estado persistente durante el flujo
- **Reset**: Limpieza automática al cerrar chat

## 🔐 Configuración y Seguridad

### Variables de Entorno
- **GROQ_API_KEY**: Clave de API de Groq
- **DATABASE_URL**: Conexión a PostgreSQL
- **CORS**: Configurado para desarrollo

### Validaciones
- **Input**: Sanitización de mensajes
- **API**: Rate limiting y error handling
- **Datos**: Validación con IA antes de guardar

## 📊 Métricas y Monitoreo

### Logs del Sistema
- **Inicio**: Verificación de conexión a Groq
- **Mensajes**: Log de cada interacción
- **Errores**: Manejo específico de errores de API
- **Performance**: Tiempo de respuesta y tokens utilizados

### Estados de Error
- **API no configurada**: Fallback a respuestas predefinidas
- **Rate limit**: Mensaje de espera
- **Error de red**: Mensaje de reintento
- **Error de validación**: Solicitud de corrección

---

**🏥 Onkos Instituto del Cáncer - Chatbot LucIA** 🤖
