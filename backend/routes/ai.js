const express = require('express');
const { Groq } = require('groq-sdk');
const router = express.Router();

// Configurar Groq solo si hay API key disponible
let groq = null;
if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'tu_api_key_de_groq_aqui' && process.env.GROQ_API_KEY.trim() !== '') {
  try {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    console.log('✅ Groq AI configurado correctamente');
  } catch (error) {
    console.log('⚠️ Error configurando Groq AI:', error.message);
    groq = null;
  }
} else {
  console.log('⚠️ GROQ_API_KEY no configurada, usando respuestas predefinidas');
}

// Ruta para analizar exámenes médicos
router.post('/analyze-exam', async (req, res) => {
  try {
    const { image, prompt } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Se requiere una imagen para el análisis' });
    }

    if (!groq) {
      return res.status(500).json({ 
        error: 'Servicio de IA no disponible',
        message: 'La API de Groq no está configurada. Por favor, configura GROQ_API_KEY en las variables de entorno.'
      });
    }

    // Clasificación previa estricta: solo MEDICAL o NON_MEDICAL
    const classification = await groq.chat.completions.create({
      model: "meta-llama/llama-4-maverick-17b-128e-instruct",
      messages: [
        {
          role: "system",
          content: "Eres un clasificador estricto. Determina únicamente si la imagen proporcionada es de índole médica (radiografías, resonancias, tomografías, análisis de laboratorio, informes clínicos o fotografías de lesiones cutáneas con intención clínica). Responde EXACTAMENTE con una sola palabra y sin signos de puntuación ni texto adicional: 'MEDICAL' o 'NON_MEDICAL'."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Clasifica la imagen." },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ],
      max_tokens: 2,
      temperature: 0
    });

    const classificationLabel = (classification.choices?.[0]?.message?.content || '').trim().toUpperCase();
    if (classificationLabel !== 'MEDICAL') {
      return res.json({
        analysis: "ERROR: La imagen no parece ser de índole médica. Por favor, proporciona una imagen de estudio o contexto clínico.",
        model: "classifier",
        timestamp: new Date().toISOString()
      });
    }

    // Procesar la imagen y enviar a Groq
    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-maverick-17b-128e-instruct",
      messages: [
        {
          role: "system",
          content: "Eres un especialista en análisis de imágenes médicas. Primero determina si la imagen es de índole médica (p. ej., radiografías, resonancias, tomografías, análisis de laboratorio, estudios clínicos o fotografías de lesiones cutáneas con intención médica). Si NO es de índole médica, responde exactamente iniciando con: 'ERROR: La imagen no parece ser de índole médica. Por favor, proporciona una imagen de estudio o contexto clínico.' y no agregues más texto. Si SÍ es de índole médica, analiza la imagen y proporciona un informe claro, didáctico y profesional."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt || "Analiza esta imagen médica y proporciona un diagnóstico detallado."
            },
            {
              type: "image_url",
              image_url: {
                url: image
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });

    res.json({
      analysis: response.choices[0].message.content,
      model: "meta-llama/llama-4-maverick-17b-128e-instruct",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en análisis de examen:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// Ruta para preguntas de seguimiento
router.post('/follow-up', async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Se requiere una pregunta' });
    }

    if (!groq) {
      return res.status(500).json({ 
        error: 'Servicio de IA no disponible',
        message: 'La API de Groq no está configurada. Por favor, configura GROQ_API_KEY en las variables de entorno.'
      });
    }

    const response = await groq.chat.completions.create({
      model: "moonshotai/kimi-k2-instruct-0905",
      messages: [
        {
          role: "system",
          content: "Eres un especialista médico que responde preguntas de seguimiento basadas en el contexto proporcionado. Proporciona respuestas precisas y útiles."
        },
        {
          role: "user",
          content: `Contexto: ${context || 'No hay contexto previo'}\n\nPregunta: ${question}`
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    });

    res.json({
      answer: response.choices[0].message.content,
      model: "moonshotai/kimi-k2-instruct-0905",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en pregunta de seguimiento:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// Ruta para verificar el estado de Groq
router.get('/status', async (req, res) => {
  try {
    if (!groq) {
      return res.json({
        available: false,
        message: 'Groq AI no está configurado. Configura GROQ_API_KEY para habilitar el servicio.',
        hasApiKey: false
      });
    }

    // Intentar hacer una consulta simple para verificar la conexión
    const testResponse = await groq.chat.completions.create({
      model: "moonshotai/kimi-k2-instruct-0905",
      messages: [
        {
          role: "user",
          content: "Hola"
        }
      ],
      max_tokens: 10
    });

    res.json({
      available: true,
      message: 'Groq AI está funcionando correctamente',
      hasApiKey: true,
      model: "moonshotai/kimi-k2-instruct-0905"
    });

  } catch (error) {
    res.json({
      available: false,
      message: `Error conectando con Groq AI: ${error.message}`,
      hasApiKey: !!process.env.GROQ_API_KEY
    });
  }
});

module.exports = router;
