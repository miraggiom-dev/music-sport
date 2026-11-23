# Music&Sport

## Sistema web de gestión de inventario y ventas

Music&Sport es una aplicación web desarrollada como proyecto académico para gestionar las operaciones de una tienda de artículos musicales y deportivos.

El sistema centraliza la administración de usuarios, clientes, productos, inventario, órdenes de compra, pagos y tasas de cambio, mediante interfaces diferenciadas según el rol de cada usuario.

## 1. Funcionalidades

### Administrador
- Panel de control con indicadores del negocio.
- Gestión de usuarios y vendedores.
- Gestión de clientes.
- Registro, edición y administración de productos.
- Control de inventario y existencias.
- Consulta y gestión de órdenes.
- Revisión de informes.
- Administración de tasas de cambio.

### Vendedor
- Panel de operaciones.
- Consulta y gestión de órdenes asignadas.
- Revisión y procesamiento de pagos.
- Actualización de estados de las operaciones.
- Consulta del inventario.

### Cliente
- Catálogo de productos.
- Búsqueda y filtrado por categorías.
- Consulta del detalle de productos.
- Carrito de compras.
- Proceso de checkout.
- Registro y consulta de órdenes.
- Consulta y actualización del perfil.

### Funcionalidades generales
- Autenticación mediante correo y contraseña.
- Control de acceso según el rol.
- Gestión de sesiones.
- Conversión referencial de precios entre dólares y bolívares.
- Gestión de tasas de cambio.
- Generación e impresión de recibos y documentos.

## 2. Tecnologías utilizadas

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS 4
- React Router
- Recharts
- Lucide React
- Sonner

### Backend
- Node.js
- Express 5
- express-session
- bcryptjs

### Base de datos
- SQLite
- better-sqlite3

### Desarrollo y pruebas
- pnpm
- Vitest
- TypeScript

## 3. Arquitectura del sistema

La aplicación utiliza una arquitectura cliente-servidor.

```text
Usuario
   |
   v
Frontend React + TypeScript
   |
   | Solicitudes HTTP
   v
Backend Node.js + Express
   |
   +---- API de autenticación
   +---- API de usuarios
   +---- API de clientes
   +---- API de productos
   +---- API de órdenes
   +---- API de tasas de cambio
   |
   v
SQLite
   |
   +---- Usuarios
   +---- Clientes
   +---- Productos
   +---- Inventario
   +---- Órdenes de compra
   +---- Detalles de compra
   +---- Pagos
   +---- Recibos
   +---- Carritos
   +---- Tasas de cambio
   +---- Informes
   +---- Sesiones
```

### Frontend

La interfaz está desarrollada con React y TypeScript. Está organizada en componentes, páginas, contextos, servicios y tipos, con interfaces separadas para los distintos roles.

### Backend

Express administra las solicitudes del cliente y expone las rutas de la API bajo el prefijo `/api`.

Las rutas principales son:

| Ruta | Función |
|---|---|
| `/api/auth` | Autenticación y sesiones |
| `/api/users` | Usuarios |
| `/api/clients` | Clientes |
| `/api/products` | Productos |
| `/api/orders` | Órdenes |
| `/api/rates` | Tasas de cambio |
| `/api/status` | Estado del servidor |
| `/api/db-status` | Estado de la base de datos |

### Base de datos

SQLite almacena la información de manera persistente en el archivo:

```text
data/music-sport.db
```

La estructura de las tablas se encuentra definida en `database/schema.js`.

La conexión se administra desde `database/connection.js`, donde se configura SQLite, se activan las claves foráneas y se inicializa el esquema.

Las sesiones se almacenan también en SQLite mediante el módulo `server/sessionStore.js`.

## 4. Estructura del proyecto

```text
APP WEB/
|
+-- database/
|   +-- schema.js
|   +-- connection.js
|   +-- create-admin.js
|   +-- demo-data.sql
|   +-- seeds/
|
+-- server/
|   +-- index.js
|   +-- sessionStore.js
|   +-- routes/
|       +-- auth.js
|       +-- users.js
|       +-- clients.js
|       +-- products.js
|       +-- orders.js
|       +-- rates.js
|
+-- src/
|   +-- app/
|   +-- components/
|   +-- contexts/
|   +-- hooks/
|   +-- lib/
|   +-- services/
|   +-- types/
|   +-- main.tsx
|
+-- public/
+-- package.json
+-- pnpm-lock.yaml
+-- INICIAR.bat
+-- README.md
```

La carpeta `data/` se genera localmente al iniciar el servidor. No se incluye en el repositorio porque contiene la base de datos de cada instalación.

## 5. Requisitos

Para ejecutar el proyecto se necesita:

- Windows 10 o superior (para utilizar el archivo `INICIAR.bat`).
- Node.js 22 o superior.
- pnpm 12.8.1.
- Git (opcional, para obtener el proyecto desde GitHub).

## 6. Instalación

### Obtener el proyecto

Clonar el repositorio:

```bash
git clone https://github.com/miraggiom-dev/music-sport.git
cd music-sport
```

### Instalar dependencias

```bash
pnpm install
```

### Inicializar la base de datos

La base de datos SQLite no se descarga desde GitHub, ya que los archivos de datos locales están excluidos mediante `.gitignore`.

Al iniciar el servidor por primera vez, la aplicación crea automáticamente la carpeta `data/`, el archivo `music-sport.db`, la estructura de las tablas y el administrador inicial si todavía no existe.

Para inicializarla manualmente:

```bash
pnpm server
```

Una vez que el servidor haya iniciado correctamente, se puede detener con `Ctrl + C`.

### Cargar los datos de demostración

El proyecto incluye el archivo `database/demo-data.sql`, que contiene registros ficticios para facilitar la presentación y demostración de las funcionalidades.

Después de inicializar la base de datos por primera vez, ejecutar el siguiente comando desde la carpeta del proyecto:

```bash
node --input-type=module -e "import Database from 'better-sqlite3'; import { readFileSync } from 'node:fs'; const db = new Database('./data/music-sport.db'); try { db.pragma('foreign_keys = ON'); db.exec(readFileSync('./database/demo-data.sql', 'utf8').replace(/^\uFEFF/, '')); console.log('Datos de demostración cargados correctamente.'); } finally { db.close(); }"
```

Este procedimiento se realiza una sola vez por cada base de datos nueva. No debe ejecutarse nuevamente sobre una base que ya contenga los registros de demostración.

Las cuentas de demostración utilizan la contraseña:

```text
Demo123!
```

### Iniciar la aplicación en Windows

Ejecutar:

```text
INICIAR.bat
```

El archivo realiza las siguientes operaciones:

1. Accede a la carpeta del proyecto.
2. Compila el frontend.
3. Inicia el servidor Express.
4. Abre el navegador en la dirección local.

La aplicación estará disponible en:

```text
http://localhost:3000
```

### Inicio manual

También es posible compilar e iniciar el sistema manualmente:

```bash
pnpm build
pnpm server
```

Para trabajar únicamente con el servidor de desarrollo del frontend:

```bash
pnpm dev
```

## 7. Comandos disponibles

| Comando | Descripción |
|---|---|
| `pnpm install` | Instala las dependencias |
| `pnpm dev` | Inicia Vite en modo desarrollo |
| `pnpm build` | Compila el frontend |
| `pnpm server` | Inicia el servidor Express |
| `pnpm start` | Inicia el servidor Express |
| `pnpm test` | Ejecuta las pruebas automatizadas |
| `pnpm exec tsc --noEmit` | Comprueba los tipos de TypeScript |

## 8. Base de datos y usuarios

La aplicación utiliza SQLite y crea automáticamente la estructura de la base de datos cuando se inicia el servidor.

En una base de datos nueva, si no existe un administrador, se crea inicialmente la siguiente cuenta:

```text
Correo: admin@musicsport.com
Contraseña: admin123
```

Esta contraseña corresponde a la configuración inicial y debe cambiarse antes de utilizar el sistema en un entorno real.

### Datos de demostración

El proyecto incluye `database/demo-data.sql`, que contiene registros ficticios para facilitar la presentación y demostración de las funcionalidades.

Las cuentas de demostración creadas con esos datos utilizan:

```text
Contraseña: Demo123!
```

La base de datos utilizada por cada instalación local se encuentra en `data/music-sport.db`.

Los archivos de bases de datos están excluidos del repositorio mediante `.gitignore`. De esta manera, cada instalación mantiene sus propios datos locales, mientras que el esquema y los registros de demostración permanecen disponibles en el código fuente.

## 9. Seguridad

El sistema incorpora:

- Contraseñas almacenadas mediante hashes con bcryptjs.
- Autenticación basada en sesiones.
- Almacenamiento persistente de sesiones en SQLite.
- Cookies HTTP-only.
- Control de acceso según roles.
- Claves foráneas activadas en SQLite.

Para producción se deben configurar las variables de entorno correspondientes, especialmente:

- `NODE_ENV`
- `SESSION_SECRET`
- `DATA_DIRECTORY`

El secreto de sesión debe tener al menos 32 caracteres en producción. Las credenciales iniciales y los secretos de desarrollo no deben utilizarse en un despliegue real.

## 10. Pruebas y calidad

El proyecto utiliza Vitest para las pruebas automatizadas y TypeScript para la comprobación estática de tipos.

Los comandos de verificación son:

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

## 11. Repositorio

GitHub:

https://github.com/miraggiom-dev/music-sport

Rama principal de trabajo:

```text
develop
```

## 12. Información académica

Proyecto académico desarrollado para la asignatura Ingeniería del Software II.

Universidad Privada Dr. Rafael Belloso Chacín (URBE).

---

**Music&Sport — Sistema de gestión de inventario y ventas.**
