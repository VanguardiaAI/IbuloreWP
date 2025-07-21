# Panel de Administración - Ibulore WooCommerce

Este es un panel de administración personalizado para WooCommerce construido con Next.js, TypeScript y Shadcn/UI.

## 🚀 Características

- **Frontend Moderno**: Construido con Next.js 15 y React 19
- **TypeScript**: Tipado estático para mejor desarrollo
- **Shadcn/UI**: Componentes de UI modernos y accesibles
- **Tailwind CSS**: Estilos utilitarios para diseño rápido
- **Formularios**: Validación con React Hook Form y Zod
- **Responsive**: Diseño adaptable para todos los dispositivos

## 🛠️ Tecnologías Utilizadas

- [Next.js](https://nextjs.org/) - Framework de React
- [TypeScript](https://www.typescriptlang.org/) - Tipado estático
- [Shadcn/UI](https://ui.shadcn.com/) - Componentes de UI
- [Tailwind CSS](https://tailwindcss.com/) - Framework de CSS
- [React Hook Form](https://react-hook-form.com/) - Manejo de formularios
- [Zod](https://zod.dev/) - Validación de esquemas
- [Lucide React](https://lucide.dev/) - Iconos

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd admin-panel
```

2. Instala las dependencias:
```bash
npm install
```

3. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🏗️ Estructura del Proyecto

```
admin-panel/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Página del dashboard
│   │   ├── globals.css           # Estilos globales
│   │   ├── layout.tsx            # Layout principal
│   │   └── page.tsx              # Página de login
│   ├── components/
│   │   └── ui/                   # Componentes de Shadcn/UI
│   └── lib/
│       └── utils.ts              # Utilidades
├── components.json               # Configuración de Shadcn/UI
├── next.config.ts               # Configuración de Next.js
├── package.json
├── tailwind.config.ts           # Configuración de Tailwind
└── tsconfig.json               # Configuración de TypeScript
```

## 🔐 Autenticación

El sistema incluye:
- Página de login con validación de formularios
- Redirección automática al dashboard después del login
- Funcionalidad de logout
- Validación de campos con mensajes de error

## 📱 Páginas Disponibles

### Login (`/`)
- Formulario de autenticación
- Validación de email y contraseña
- Mostrar/ocultar contraseña
- Estados de carga

### Dashboard (`/dashboard`)
- Resumen de estadísticas
- Tarjetas de métricas (ventas, pedidos, productos, clientes)
- Acciones rápidas
- Actividad reciente
- Área para gráficos

## 🔮 Próximas Funcionalidades

- [ ] Integración con backend Flask
- [ ] Conexión a base de datos WordPress/WooCommerce
- [ ] Gestión de productos
- [ ] Gestión de pedidos
- [ ] Gestión de clientes
- [ ] Reportes y analytics
- [ ] Sistema de roles y permisos
- [ ] Configuraciones avanzadas

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Contacto

Proyecto: Panel de Administración Ibulore
- Frontend: Next.js + TypeScript + Shadcn/UI
- Backend: Flask (próximamente)
- Base de datos: WordPress/WooCommerce MySQL

---

Desarrollado con ❤️ para Ibulore
