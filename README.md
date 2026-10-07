# Aplicación web de gestión de inventario y ventas

## Music & Sport, DSS C.A.

Music&Sport DSS es una aplicación web para automatizar los procesos operativos de inventario y ventas de Music&Sport DSS, C.A. Permite gestionar productos, órdenes, pagos y clientes desde un catálogo digital con acceso diferenciado por rol:

- Administrador
- Vendedor
- Cliente

> **Estado actual:** prototipo frontend funcional con datos simulados en memoria. El backend y la base de datos todavía están pendientes de definición e implementación. Los datos se reinician al recargar la aplicación.

## Características principales

### Acceso y roles

- Inicio y cierre de sesión para los tres roles.
- Credenciales de demostración basadas en mock data.
- Redirección al área correspondiente después del inicio de sesión.
- Protección de áreas mediante guards de React Router.
- Control de permisos para evitar el acceso de un rol a módulos no autorizados.

### Catálogo y carrito

- Exploración y búsqueda de productos.
- Filtros por categoría y disponibilidad.
- Agregar, modificar y eliminar artículos del carrito.
- Validación del stock antes de agregar productos y emitir órdenes.
- Precios en USD con conversión referencial a bolívares usando la tasa activa.

### Órdenes y pagos

- Emisión de órdenes de compra.
- Métodos de pago en bolívares y divisas, incluyendo Zelle y Binance.
- Registro de referencias de pago.
- Flujo de revisión y cambio de estado de las órdenes.
- Generación e impresión de recibos y documentos.

### Inventario y administración

- Registro, edición y eliminación de productos.
- Control de stock y alertas de inventario bajo.
- Gestión de usuarios internos.
- Gestión de clientes.
- Gestión de órdenes.
- Informes de ventas e inventario.
- Configuración de tasas de cambio.
- Dashboard con métricas operativas.

### Área del vendedor

- Panel de órdenes.
- Revisión y procesamiento de pagos.
- Actualización del estado de las órdenes.
- Consulta de inventario permitido para el rol.

### Área del cliente

- Catálogo de productos.
- Detalle de producto.
- Carrito y checkout.
- Confirmación de órdenes.
- Historial de órdenes.
- Edición del perfil.

## Arquitectura

```text
src/
├── app/
│   ├── App.tsx              Coordinación temporal del estado mock y composición
│   ├── AppShell.tsx         Componente raíz de la aplicación
│   ├── auth/
│   ├── admin/
│   │   ├── layout.tsx       Área protegida de administrador
│   │   └── [módulos]/
│   ├── vendedor/
│   │   ├── layout.tsx       Área protegida de vendedor
│   │   └── [módulos]/
│   └── cliente/
│       ├── layout.tsx       Área protegida de cliente
│       └── [módulos]/
│
├── components/
│   ├── shared/              Componentes y helpers reutilizables
│   ├── admin/               Vistas separadas por módulo + barrel index.ts
│   ├── vendedor/            Vistas separadas por módulo + barrel index.ts
│   ├── cliente/             Vistas separadas por módulo + barrel index.ts
│   └── auth/                Shell y vistas separadas + barrel index.ts
│
├── contexts/
│   ├── AuthContext.tsx       Estado transversal de autenticación y rol
│   └── RateContext.ts        Tasa de cambio activa
│
├── hooks/
│   ├── useAuth.ts
│   └── useTasaCambio.ts
│
├── lib/
│   ├── constants.ts          Constantes del dominio
│   ├── permissions.ts        Permisos y vistas por rol
│   ├── guards.tsx            Protección de áreas
│   ├── validation.ts         Validaciones reutilizables
│   ├── formatCurrency.ts     Formateo de monedas
│   └── generatePDF.ts        Impresión y generación de documentos
│
├── services/
│   ├── authService.ts
│   ├── productService.ts
│   ├── orderService.ts
│   ├── clientService.ts
│   └── rateService.ts
│
├── data/
│   └── mockData.ts           Datos temporales en memoria
│
├── types/
│   └── index.ts              Tipos e interfaces del dominio
│
└── main.tsx                  Punto de entrada de React
```

### Context

**Context** comparte estado transversal sin pasar props por toda la aplicación:

- `AuthContext`: autenticación, rol, usuario interno, cliente actual y mensajes.
- `RateContext`: tasa de cambio activa.

### Hooks

**Hooks** encapsulan el acceso a los contextos y lógica reutilizable:

- `useAuth`
- `useTasaCambio`

### Guards

Los **guards** (`src/lib/guards.tsx`) protegen áreas y redirigen según el rol:

- `AdminGuard`
- `VendorGuard`
- `ClientGuard`
- `RequireAuth`

Las rutas siguen siendo compatibles con la navegación existente y utilizan URLs reales como:

```text
/login
/admin/dashboard
/admin/productos
/vendedor/panel
/vendedor/ordenes
/catalogo
/carrito
/perfil
```

### Services

Los **services** (`src/services`) exponen APIs TypeScript para:

- Autenticación
- Productos
- Órdenes
- Clientes
- Tasas de cambio

Actualmente delegan en `src/data/mockData.ts`. No realizan persistencia ni llamadas a un backend. Esta capa permitirá reemplazar posteriormente la implementación mock por llamadas a una API sin modificar las vistas.

### Carga diferida

Las áreas administrativas, de vendedor y autenticación utilizan `lazy()` y `Suspense` para cargar sus módulos bajo demanda y reducir el bundle inicial.

El catálogo y sus páginas también se dividen en chunks cuando corresponde.

## Flujo de datos actual

```text
Vista React
    ↓
Context / Hook
    ↓
Service TypeScript
    ↓
mockData.ts
```

## Tecnologías

- React 18
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Recharts
- Lucide React
- Sonner
- Vitest

## Requisitos

- Node.js 18 o superior
- pnpm

## Instalación

```bash
pnpm install
pnpm dev
```

La aplicación estará disponible en `http://localhost:5173`.

Para permitir el acceso desde otros dispositivos de la red local:

```bash
pnpm dev
```

El script de desarrollo ya está configurado para escuchar en `0.0.0.0`. Vite mostrará la dirección de red disponible en la terminal.

## Comandos

```bash
pnpm dev                 # servidor de desarrollo
pnpm build               # compilación de producción
pnpm test                # pruebas automatizadas
pnpm exec tsc --noEmit   # comprobación de TypeScript
pnpm exec vite preview   # vista previa de producción
```

## Credenciales de prueba

Las siguientes cuentas utilizan los datos simulados actuales:

```text
Administrador
Correo:      admin@musicsport.com
Contraseña:  admin123

Vendedor
Correo:      vendedor@musicsport.com
Contraseña:  vendedor123

Cliente
Correo:      cliente@demo.com
Contraseña:  cliente123
```

Estas credenciales son únicamente para desarrollo. La autenticación real se implementará en el backend.

## Datos y persistencia

Los datos actuales se encuentran en [src/data/mockData.ts](./src/data/mockData.ts) y se mantienen en memoria:

- Productos
- Usuarios internos
- Clientes
- Órdenes
- Tasas de cambio

No existe persistencia entre sesiones ni conexión con una base de datos.

## Módulos por integrante

| Módulo | Responsable | Carpeta |
|---|---|---|
| Catálogo y carrito | Melissa | `src/app/cliente/` |
| Panel administrador | Sebastián y Carlos | `src/app/admin/` |
| Panel vendedor | Dominic | `src/app/vendedor/` |
| Autenticación | — | `src/app/auth/` |
| Servicios y futura integración API | — | `src/services/` |
| Backend y base de datos | — | Pendiente de definición |


## Licencia

Proyecto académico — Universidad Privada Dr. Rafael Belloso Chacín (URBE).  
Ingeniería del Software II · Sección N913
