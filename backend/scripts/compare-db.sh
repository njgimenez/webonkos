#!/bin/bash

# Script para comparar bases de datos PostgreSQL
# Uso: ./scripts/compare-db.sh

echo "🚀 Iniciando comparación de bases de datos..."
echo ""

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instálalo primero."
    exit 1
fi

# Verificar que el archivo de comparación existe
if [ ! -f "compare-databases.js" ]; then
    echo "❌ El archivo compare-databases.js no existe."
    exit 1
fi

# Ejecutar la comparación
echo "📊 Ejecutando comparación..."
node compare-databases.js

# Verificar si se generaron los reportes
if [ -f "database-comparison-report.html" ]; then
    echo ""
    echo "✅ Reporte HTML generado: database-comparison-report.html"
    echo "   Puedes abrirlo en tu navegador para ver el reporte detallado."
fi

if [ -f "database-comparison-report.json" ]; then
    echo "✅ Reporte JSON generado: database-comparison-report.json"
fi

echo ""
echo "🎉 Comparación completada!"