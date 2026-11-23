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
- Footer responsive con navegación de compra, ayuda, empresa y enlaces legales.

### Funcionalidades generales

- Autenticación mediante correo y contraseña.
- Control de acceso según el rol.
- Gestión de sesiones.
- Recuperación de contraseña mediante códigos de verificación.
- Restablecimiento de contraseña con validación de código y tiempo de expiración.
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

| Ruta                        | Función                                                |
| --------------------------- | ------------------------------------------------------ |
| `/api/auth`                 | Autenticación y sesiones                               |
| `/api/auth/forgot-password` | Solicitud de recuperación de contraseña                |
| `/api/auth/reset-password`  | Validación del código y restablecimiento de contraseña |
| `/api/users`                | Usuarios                                               |
| `/api/clients`              | Clientes                                               |
| `/api/products`             | Productos                                              |
| `/api/orders`               | Órdenes                                                |
| `/api/rates`                | Tasas de cambio                                        |
| `/api/status`               | Estado del servidor                                    |
| `/api/db-status`            | Estado de la base de datos                             |

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
|   +-- product-images/
|       +-- guitarra.webp
|       +-- teclado.webp
|       +-- microfono.webp
|       +-- balon-adidas.webp
|       +-- balon-baloncesto.webp
|       +-- balon-volleyball.webp
|       +-- mancuernas.webp
|       +-- colchoneta.webp
|       +-- raqueta.webp
|       +-- baquetas.webp
|
+-- package.json
+-- pnpm-lock.yaml
+-- INICIAR.bat
+-- README.md
```

La carpeta `data/` se genera localmente al iniciar el servidor. No se incluye en el repositorio porque contiene la base de datos de cada instalación.

### Imágenes de los productos

Los diez productos de demostración utilizan imágenes WebP locales almacenadas en `public/product-images/`. Las rutas se asocian en los datos de demostración.

Las imágenes locales permiten que el catálogo, el carrito y el detalle de productos funcionen sin depender de servicios externos. Una imagen personalizada que ya haya sido cargada en la administración no se reemplaza automáticamente.

### Footer

El footer del catálogo sigue la identidad visual de Music&Sport y presenta secciones responsive para compra, ayuda, empresa y enlaces legales. Los títulos de sección utilizan un tamaño mayor y los enlaces y textos secundarios mantienen una medida uniforme.

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

No es necesario ejecutar la instalación manualmente. El archivo `INICIAR.bat` comprueba las dependencias e instala los paquetes del proyecto cuando es necesario.

### Inicializar la base de datos

No se requiere ningún comando manual para inicializar SQLite.

Al iniciar el servidor por primera vez, la aplicación crea automáticamente:

- La carpeta `data/`.
- El archivo `music-sport.db`.
- La estructura de las tablas.
- El administrador inicial, si todavía no existe.
- Los datos de demostración, cuando corresponde.

La inicialización de los datos de demostración se controla mediante un registro interno para evitar que se carguen repetidamente.

Si la base de datos ya contiene información, esta se conserva y no se vuelve a ejecutar la carga de demostración.

### Datos de demostración

El proyecto incluye el archivo `database/demo-data.sql`, que contiene registros ficticios para facilitar la presentación y demostración de las funcionalidades.

En una base de datos nueva, los datos se cargan automáticamente durante la inicialización. Las cuentas de demostración utilizan la contraseña:

```text
Demo123!
```

### Iniciar la aplicación en Windows

Ejecutar el archivo:

```text
INICIAR.bat
```

El archivo realiza las siguientes operaciones:

1. Accede a la carpeta del proyecto.
2. Comprueba que Node.js esté instalado.
3. Comprueba la disponibilidad de pnpm.
4. Instala las dependencias cuando sea necesario.
5. Compila el frontend.
6. Inicializa SQLite y carga los datos de demostración solamente cuando corresponde.
7. Genera o reutiliza un secreto persistente para las sesiones.
8. Inicia el servidor Express con el frontend compilado.
9. Comprueba que el servidor responda correctamente.
10. Abre el navegador cuando la aplicación está disponible.

La aplicación estará disponible en:

```text
http://localhost:3000
```

Para cerrar la aplicación, se puede cerrar la ventana del servidor que se abre junto con el navegador.

### Inicio manual para desarrollo

El inicio habitual para la presentación en Windows es mediante `INICIAR.bat`.

Si se necesita trabajar manualmente durante el desarrollo, se pueden utilizar:

```bash
pnpm install
pnpm build
pnpm server
```

Para iniciar únicamente el servidor de desarrollo de Vite:

```bash
pnpm dev
```

Estos comandos son opcionales y no son necesarios para la instalación normal.

## 7. Comandos disponibles

| Comando                  | Descripción                       |
| ------------------------ | --------------------------------- |
| `pnpm install`           | Instala las dependencias          |
| `pnpm dev`               | Inicia Vite en modo desarrollo    |
| `pnpm build`             | Compila el frontend               |
| `pnpm server`            | Inicia el servidor Express        |
| `pnpm start`             | Inicia el servidor Express        |
| `pnpm test`              | Ejecuta las pruebas automatizadas |
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
- Secreto de sesión persistente para las ejecuciones locales.

### Recuperación de contraseña

El sistema incorpora un mecanismo de recuperación de contraseña mediante códigos de verificación de un solo uso.

El proceso funciona de la siguiente manera:

1. El usuario solicita recuperar su contraseña desde la pantalla de inicio de sesión.
2. Introduce el correo electrónico asociado a su cuenta.
3. El servidor genera un código numérico de ocho dígitos.
4. El código tiene una vigencia de 15 minutos.
5. El código se almacena mediante un hash SHA-256, evitando guardar el código original en la base de datos.
6. El usuario introduce el código y establece una contraseña nueva.
7. El servidor valida el código y actualiza la contraseña utilizando bcryptjs.
8. Una vez utilizado, el código queda invalidado y no puede reutilizarse.

#### Modo simulado

La recuperación utiliza el modo `simulated`, habilitado mediante la variable de entorno:

```env
RECOVERY_MODE=simulated
```

En este modo, el código de recuperación se muestra en la consola del servidor para realizar pruebas y demostraciones locales.

Este mecanismo no envía correos electrónicos. Para un despliegue público deberá integrarse un servicio de envío de correo electrónico y configurarse un mecanismo de recuperación apropiado para producción.

### Consideraciones para despliegue

El archivo `INICIAR.bat` ejecuta la versión compilada del sistema en modo de producción local. Esto no significa que la aplicación esté preparada para exponerse directamente a Internet.

Antes de realizar un despliegue público se deben configurar adecuadamente:

- Credenciales administrativas propias y seguras.
- HTTPS.
- Cookies seguras.
- Un `SESSION_SECRET` privado de al menos 32 caracteres.
- Almacenamiento persistente y protegido para la base de datos.
- Un servicio de correo electrónico para la recuperación de contraseñas.

Las credenciales de demostración son exclusivamente para la presentación local y no deben utilizarse en un despliegue público.

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

Rama de trabajo:

```text
develop
```

## 12. Información académica

Proyecto académico desarrollado para la asignatura Ingeniería del Software II.

Universidad Privada Dr. Rafael Belloso Chacín (URBE).

---

**Music&Sport — Sistema de gestión de inventario y ventas.**
