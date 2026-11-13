# Backend Version - Chatbot Actualizado

**Versión:** 1.2.0  
**Fecha:** $(date)  
**Branch:** mejoras  

## Cambios del Backend Implementados

### ✅ Nuevo Endpoint `/api/chatbot/obtener-citas-medico`
- Obtiene todas las citas existentes para un médico en una fecha específica
- Ordenadas por fecha ASC para calcular el siguiente horario disponible
- Usado para asignación automática de horarios

### ✅ Modificación `/api/chatbot/agendar-cita`
- **Duración por defecto:** 20 minutos (antes 30)
- **Parámetro `hora_automatica`:** Evita verificación redundante cuando la hora es asignada automáticamente
- **Verificación condicional:** Solo verifica disponibilidad si `hora_automatica = false`

### ✅ Endpoint `/api/chatbot/especialidades`
- Obtiene especialidades dinámicamente desde la base de datos
- Eliminada condición `WHERE estado = 'activo'` (columna no existe)

### ✅ Endpoint `/api/chatbot/medicos`
- Ordenamiento por `especialidad_id, nombre` para mejor organización

## Código Clave Implementado

```javascript
// Nuevo endpoint para obtener citas del médico
app.post('/api/chatbot/obtener-citas-medico', async (req, res) => {
  // Obtiene citas ordenadas por fecha ASC
});

// Modificación en agendar-cita
const { duracion = 20, hora_automatica = false } = req.body;

// Verificación condicional de disponibilidad
if (!hora_automatica) {
  // Solo verifica si la hora NO fue asignada automáticamente
}
```

## Commit Hash Backend

Último commit: ad6780b