const { query } = require('./database.js');

async function seedBlogData() {
  try {
    console.log('🌱 Insertando datos de ejemplo para el blog...');

    // Insertar entradas de ejemplo
    const entradasEjemplo = [
      {
        titulo: 'Avances en Tratamiento de Cáncer de Mama',
        contenido: `
          <h2>Introducción</h2>
          <p>El cáncer de mama es uno de los tipos de cáncer más comunes en mujeres a nivel mundial. En los últimos años, hemos visto avances significativos en su diagnóstico y tratamiento.</p>
          
          <h3>Nuevas Técnicas de Diagnóstico</h3>
          <p>La tecnología ha revolucionado la forma en que diagnosticamos el cáncer de mama:</p>
          <ul>
            <li>Mamografía digital avanzada</li>
            <li>Resonancia magnética especializada</li>
            <li>Biopsia guiada por imagen</li>
          </ul>
          
          <h3>Tratamientos Innovadores</h3>
          <p>Los tratamientos modernos incluyen:</p>
          <ul>
            <li>Terapias dirigidas</li>
            <li>Inmunoterapia</li>
            <li>Quimioterapia personalizada</li>
          </ul>
          
          <blockquote>
            "La personalización del tratamiento es clave para mejorar los resultados en pacientes con cáncer de mama"
          </blockquote>
          
          <h3>Conclusiones</h3>
          <p>Estos avances han mejorado significativamente las tasas de supervivencia y la calidad de vida de las pacientes.</p>
        `,
        resumen: 'Descubre los últimos avances en el diagnóstico y tratamiento del cáncer de mama, incluyendo nuevas técnicas y terapias personalizadas.',
        categoria_id: 1, // Oncología
        estado: 'publicado',
        destacado: true,
        tags: ['cáncer de mama', 'tratamiento', 'diagnóstico', 'avances médicos']
      },
      {
        titulo: 'Importancia de la Nutrición en Pacientes Oncológicos',
        contenido: `
          <h2>La Nutrición como Pilar del Tratamiento</h2>
          <p>Una nutrición adecuada es fundamental durante el tratamiento oncológico. Los pacientes que mantienen una buena alimentación tienen mejores resultados y menor toxicidad.</p>
          
          <h3>Alimentos Recomendados</h3>
          <p>Durante el tratamiento, es importante incluir:</p>
          <ul>
            <li>Proteínas de alta calidad</li>
            <li>Frutas y verduras ricas en antioxidantes</li>
            <li>Grasas saludables</li>
            <li>Hidratación adecuada</li>
          </ul>
          
          <h3>Alimentos a Evitar</h3>
          <p>Se recomienda limitar:</p>
          <ul>
            <li>Alimentos procesados</li>
            <li>Azúcares refinados</li>
            <li>Grasas saturadas</li>
          </ul>
          
          <h3>Recomendaciones Prácticas</h3>
          <p>Es importante trabajar con un nutricionista especializado en oncología para crear un plan alimenticio personalizado.</p>
        `,
        resumen: 'Conoce la importancia de una nutrición adecuada durante el tratamiento oncológico y las recomendaciones alimenticias específicas.',
        categoria_id: 4, // Prevención
        estado: 'publicado',
        destacado: false,
        tags: ['nutrición', 'tratamiento', 'alimentación', 'bienestar']
      },
      {
        titulo: 'Nuevas Terapias de Inmunoterapia',
        contenido: `
          <h2>Revolución en el Tratamiento del Cáncer</h2>
          <p>La inmunoterapia ha revolucionado el tratamiento del cáncer, ofreciendo nuevas esperanzas a pacientes con diferentes tipos de tumores.</p>
          
          <h3>¿Qué es la Inmunoterapia?</h3>
          <p>La inmunoterapia es un tratamiento que utiliza el propio sistema inmunológico del paciente para combatir el cáncer.</p>
          
          <h3>Tipos de Inmunoterapia</h3>
          <ul>
            <li>Inhibidores de puntos de control</li>
            <li>Terapias CAR-T</li>
            <li>Vacunas terapéuticas</li>
            <li>Citocinas</li>
          </ul>
          
          <h3>Resultados Prometedores</h3>
          <p>Los estudios clínicos han mostrado resultados muy prometedores en varios tipos de cáncer, incluyendo melanoma, cáncer de pulmón y linfoma.</p>
          
          <h3>Futuro de la Inmunoterapia</h3>
          <p>La investigación continúa para expandir el uso de la inmunoterapia a más tipos de cáncer y mejorar su efectividad.</p>
        `,
        resumen: 'Explora las nuevas terapias de inmunoterapia que están transformando el tratamiento del cáncer y ofreciendo nuevas opciones a los pacientes.',
        categoria_id: 2, // Tratamientos
        estado: 'publicado',
        destacado: true,
        tags: ['inmunoterapia', 'tratamiento', 'investigación', 'avances']
      },
      {
        titulo: 'Prevención del Cáncer: Factores de Riesgo Modificables',
        contenido: `
          <h2>Prevención Primaria del Cáncer</h2>
          <p>Se estima que hasta el 40% de los casos de cáncer pueden prevenirse mediante cambios en el estilo de vida.</p>
          
          <h3>Factores de Riesgo Principales</h3>
          <ul>
            <li>Tabaquismo</li>
            <li>Obesidad</li>
            <li>Sedentarismo</li>
            <li>Dieta inadecuada</li>
            <li>Consumo excesivo de alcohol</li>
          </ul>
          
          <h3>Recomendaciones de Prevención</h3>
          <p>Para reducir el riesgo de cáncer:</p>
          <ul>
            <li>Mantener un peso saludable</li>
            <li>Realizar actividad física regular</li>
            <li>Consumir una dieta rica en frutas y verduras</li>
            <li>Evitar el tabaco y el alcohol</li>
            <li>Protegerse del sol</li>
          </ul>
          
          <h3>Importancia de la Detección Temprana</h3>
          <p>Además de la prevención, es crucial participar en programas de detección temprana según las recomendaciones médicas.</p>
        `,
        resumen: 'Aprende sobre los factores de riesgo modificables del cáncer y las estrategias de prevención que puedes implementar en tu vida diaria.',
        categoria_id: 4, // Prevención
        estado: 'publicado',
        destacado: false,
        tags: ['prevención', 'factores de riesgo', 'estilo de vida', 'salud']
      },
      {
        titulo: 'Investigación en Cáncer de Pulmón: Nuevos Horizontes',
        contenido: `
          <h2>Avances en la Investigación del Cáncer de Pulmón</h2>
          <p>El cáncer de pulmón sigue siendo uno de los tipos de cáncer más desafiantes, pero la investigación está abriendo nuevos caminos.</p>
          
          <h3>Nuevas Técnicas de Diagnóstico</h3>
          <p>La detección temprana es crucial:</p>
          <ul>
            <li>Tomografía computarizada de baja dosis</li>
            <li>Biopsia líquida</li>
            <li>Marcadores tumorales</li>
          </ul>
          
          <h3>Tratamientos Personalizados</h3>
          <p>La medicina de precisión está transformando el tratamiento:</p>
          <ul>
            <li>Terapias dirigidas según mutaciones genéticas</li>
            <li>Inmunoterapia específica</li>
            <li>Combinaciones de tratamientos</li>
          </ul>
          
          <h3>Resultados de Investigación</h3>
          <p>Los estudios recientes muestran mejoras significativas en la supervivencia de pacientes con cáncer de pulmón avanzado.</p>
          
          <h3>Futuro de la Investigación</h3>
          <p>La investigación continúa enfocándose en tratamientos más efectivos y menos tóxicos.</p>
        `,
        resumen: 'Descubre los últimos avances en la investigación del cáncer de pulmón y las nuevas opciones de tratamiento disponibles.',
        categoria_id: 3, // Investigación
        estado: 'publicado',
        destacado: true,
        tags: ['cáncer de pulmón', 'investigación', 'diagnóstico', 'tratamiento']
      }
    ];

    for (const entrada of entradasEjemplo) {
      await query(`
        INSERT INTO entradas (
          titulo, slug, contenido, resumen, categoria_id, 
          estado, destacado, tags, fecha_publicacion
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (slug) DO NOTHING
      `, [
        entrada.titulo,
        entrada.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        entrada.contenido,
        entrada.resumen,
        entrada.categoria_id,
        entrada.estado,
        entrada.destacado,
        JSON.stringify(entrada.tags),
        new Date()
      ]);
    }

    console.log('✅ Datos de ejemplo insertados exitosamente');
    
  } catch (error) {
    console.error('❌ Error insertando datos de ejemplo:', error);
  }
}

seedBlogData(); 