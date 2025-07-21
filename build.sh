#!/bin/bash

# Script para construir la aplicación para producción

echo "🚀 Preparando IbuloreWP para producción..."

# Copiar la configuración de producción de Next.js
echo "📋 Configurando Next.js para producción..."
cp frontend/next.config.production.ts frontend/next.config.ts

# Construir las imágenes de Docker
echo "🐳 Construyendo imágenes de Docker..."
docker-compose build

echo "✅ Construcción completada!"
echo ""
echo "Para iniciar la aplicación, ejecuta:"
echo "  docker-compose up -d"
echo ""
echo "La aplicación estará disponible en:"
echo "  http://localhost:8080/panel"