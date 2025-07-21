# Guía de Despliegue para IbuloreWP en 1Panel

## Requisitos Previos

1. Tener 1Panel instalado y configurado
2. Tener acceso SSH al servidor
3. Tener Git instalado en el servidor
4. Tener Docker y Docker Compose instalados (1Panel normalmente los incluye)

## Pasos para el Despliegue

### 1. Preparar el Código en GitHub

Primero, sube tu código a GitHub:

```bash
git add .
git commit -m "Preparar proyecto para despliegue en Docker"
git push origin main
```

### 2. Configurar el Servidor con 1Panel

1. Accede a tu panel de 1Panel
2. Ve a la sección de "Aplicaciones" o "Contenedores"
3. Selecciona "Crear desde Docker Compose"

### 3. Clonar el Repositorio en el Servidor

Conéctate por SSH a tu servidor:

```bash
ssh usuario@tu-servidor.com
cd /opt/1panel/apps
git clone https://github.com/tu-usuario/IbuloreWP.git
cd IbuloreWP
```

### 4. Configurar las Variables de Entorno

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp .env.example .env
nano .env
```

Edita el archivo con tus credenciales reales:

```env
WC_STORE_URL=https://ibulore.com
WC_CONSUMER_KEY=ck_tu_clave_real
WC_CONSUMER_SECRET=cs_tu_secreto_real
WP_USER_LOGIN=tu_usuario_wordpress
WP_APPLICATION_PASSWORD=tu_password_aplicacion
OPENAI_API_KEY=sk_tu_clave_openai
```

### 5. Construir y Ejecutar con Docker Compose

Ejecuta el script de construcción:

```bash
./build.sh
```

O manualmente:

```bash
# Copiar configuración de producción
cp frontend/next.config.production.ts frontend/next.config.ts

# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d
```

### 6. Configurar Nginx en 1Panel para el Dominio

En 1Panel, configura un sitio web con las siguientes reglas de proxy:

1. Ve a "Sitios Web" en 1Panel
2. Edita tu sitio ibulore.com
3. Añade las siguientes reglas de ubicación:

```nginx
# Redirigir /panel al contenedor de la aplicación
location /panel {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 7. Verificar el Despliegue

1. Verifica que los contenedores estén ejecutándose:
   ```bash
   docker-compose ps
   ```

2. Revisa los logs si hay problemas:
   ```bash
   docker-compose logs -f
   ```

3. Accede a tu aplicación en:
   ```
   https://ibulore.com/panel
   ```

## Actualización del Código

Para actualizar la aplicación con nuevos cambios:

```bash
cd /opt/1panel/apps/IbuloreWP
git pull origin main
./build.sh
docker-compose down
docker-compose up -d
```

## Comandos Útiles

- Ver logs: `docker-compose logs -f [servicio]`
- Reiniciar servicios: `docker-compose restart`
- Detener servicios: `docker-compose down`
- Ver estado: `docker-compose ps`

## Solución de Problemas

### Error de permisos
```bash
chmod -R 755 /opt/1panel/apps/IbuloreWP
chown -R www-data:www-data /opt/1panel/apps/IbuloreWP
```

### Puerto en uso
Cambia el puerto en docker-compose.yml si 8080 está ocupado:
```yaml
ports:
  - "8081:80"  # Cambiar 8080 por otro puerto
```

### Problemas de memoria
Añade límites de recursos en docker-compose.yml:
```yaml
services:
  frontend:
    deploy:
      resources:
        limits:
          memory: 512M
```

## Notas de Seguridad

1. **Nunca** subas el archivo `.env` a GitHub
2. Usa contraseñas seguras para WordPress Application Password
3. Configura HTTPS en 1Panel para tu dominio
4. Considera usar un firewall para restringir acceso al puerto 8080

## Estructura de URLs

- WordPress principal: `https://ibulore.com`
- Panel de administración: `https://ibulore.com/panel`
- API Backend: `https://ibulore.com/panel/api/*`