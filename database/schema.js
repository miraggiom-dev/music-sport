
export const schema = `
PRAGMA foreign_keys = ON;

-- Control interno de inicialización. Permite cargar datos de demostración
-- una sola vez sin modificar instalaciones existentes.
CREATE TABLE IF NOT EXISTS INICIALIZACION (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 1. USUARIOS
-- =============================================

CREATE TABLE IF NOT EXISTS USUARIO (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL COLLATE NOCASE UNIQUE,
    telefono VARCHAR(20),
    contrasena VARCHAR(255) NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin', 'vendor', 'client')),
    estado TEXT CHECK (
        estado IS NULL OR estado IN ('activo', 'inactivo')
    ),
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. CLIENTES
-- =============================================

CREATE TABLE IF NOT EXISTS CLIENTE (
    id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NOT NULL UNIQUE,
    direccion TEXT,
    identificacion VARCHAR(30) NOT NULL,
    FOREIGN KEY (id_usuario)
        REFERENCES USUARIO(id_usuario)
        ON DELETE CASCADE
);

-- =============================================
-- 3. TOKENS DE RECUPERACIÓN
-- =============================================

CREATE TABLE IF NOT EXISTS TOKEN_RECUPERACION (
    id_token INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    fecha_expiracion DATETIME NOT NULL,
    usado INTEGER NOT NULL DEFAULT 0
        CHECK (usado IN (0, 1)),
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario)
        REFERENCES USUARIO(id_usuario)
        ON DELETE CASCADE
);

-- =============================================
-- 4. PRODUCTOS
-- =============================================

CREATE TABLE IF NOT EXISTS PRODUCTO (
    id_producto INTEGER PRIMARY KEY AUTOINCREMENT,
    sku VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(80) NOT NULL,
    subcategoria VARCHAR(80),
    precio DECIMAL(12, 2) NOT NULL CHECK (precio >= 0),
    imagen TEXT,
    activo INTEGER NOT NULL DEFAULT 1
        CHECK (activo IN (0, 1)),
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5. INVENTARIO
-- =============================================

CREATE TABLE IF NOT EXISTS INVENTARIO (
    id_inventario INTEGER PRIMARY KEY AUTOINCREMENT,
    id_producto INTEGER NOT NULL UNIQUE,
    cantidad INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    stock_minimo INTEGER NOT NULL DEFAULT 1 CHECK (stock_minimo >= 1),
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto)
        REFERENCES PRODUCTO(id_producto)
        ON DELETE CASCADE
);

-- =============================================
-- 6. ÓRDENES DE COMPRA
-- =============================================

CREATE TABLE IF NOT EXISTS ORDEN_COMPRA (
    id_orden INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_orden VARCHAR(50) NOT NULL UNIQUE,
    id_cliente INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN (
            'pendiente',
            'procesando',
            'despachado',
            'completado',
            'cancelado'
        )),
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
    impuesto DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (impuesto >= 0),
    tipo_impuesto TEXT NOT NULL CHECK (tipo_impuesto IN ('IVA', 'IGTF')),
    total DECIMAL(12, 2) NOT NULL CHECK (total >= 0),
    moneda TEXT NOT NULL CHECK (moneda IN ('USD', 'VES')),
    tasa_nombre VARCHAR(80),
    tasa_valor DECIMAL(12, 4),
    tasa_fecha DATETIME,
    nombre_facturacion VARCHAR(150) NOT NULL,
    identificacion_facturacion VARCHAR(30),
    correo_facturacion VARCHAR(150) NOT NULL,
    telefono_facturacion VARCHAR(20) NOT NULL,
    direccion_facturacion TEXT NOT NULL,
    nombre_destinatario VARCHAR(150),
    telefono_destinatario VARCHAR(20),
    direccion_entrega TEXT NOT NULL,
    solicitud_cliente_id VARCHAR(100) UNIQUE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cancelacion DATETIME,
    cancelado_por TEXT CHECK (
        cancelado_por IS NULL OR cancelado_por IN ('client', 'staff')
    ),
    FOREIGN KEY (id_cliente)
        REFERENCES CLIENTE(id_cliente)
        ON DELETE RESTRICT
);

-- =============================================
-- 7. DETALLES DE COMPRA
-- =============================================

CREATE TABLE IF NOT EXISTS DETALLE_COMPRA (
    id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
    id_orden INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    nombre_producto VARCHAR(150) NOT NULL,
    sku VARCHAR(50) NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
    FOREIGN KEY (id_orden)
        REFERENCES ORDEN_COMPRA(id_orden)
        ON DELETE CASCADE,
    FOREIGN KEY (id_producto)
        REFERENCES PRODUCTO(id_producto)
        ON DELETE RESTRICT
);

-- =============================================
-- 8. PAGOS
-- =============================================

CREATE TABLE IF NOT EXISTS PAGO (
    id_pago INTEGER PRIMARY KEY AUTOINCREMENT,
    id_orden INTEGER NOT NULL UNIQUE,
    metodo TEXT NOT NULL CHECK (metodo IN (
        'transferencia',
        'pago_movil',
        'zelle',
        'binance',
        'efectivo'
    )),
    numero_referencia VARCHAR(100) UNIQUE,
    monto DECIMAL(12, 2) NOT NULL CHECK (monto >= 0),
    moneda TEXT NOT NULL CHECK (moneda IN ('USD', 'VES')),
    estado TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    fecha_pago DATETIME,
    fecha_revision DATETIME,
    id_revisor INTEGER,
    motivo_rechazo TEXT,
    FOREIGN KEY (id_orden)
        REFERENCES ORDEN_COMPRA(id_orden)
        ON DELETE RESTRICT,
    FOREIGN KEY (id_revisor)
        REFERENCES USUARIO(id_usuario)
        ON DELETE RESTRICT
);

-- =============================================
-- 9. RECIBOS
-- =============================================

CREATE TABLE IF NOT EXISTS RECIBO (
    id_recibo INTEGER PRIMARY KEY AUTOINCREMENT,
    id_pago INTEGER NOT NULL UNIQUE,
    numero_recibo VARCHAR(50) NOT NULL UNIQUE,
    fecha_emision DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
    impuesto DECIMAL(12, 2) NOT NULL CHECK (impuesto >= 0),
    total DECIMAL(12, 2) NOT NULL CHECK (total >= 0),
    FOREIGN KEY (id_pago)
        REFERENCES PAGO(id_pago)
        ON DELETE RESTRICT
);

-- =============================================
-- 10. CARRITOS
-- =============================================

CREATE TABLE IF NOT EXISTS CARRITO (
    id_carrito INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'convertido')),
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente)
        REFERENCES CLIENTE(id_cliente)
        ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_carrito_activo_cliente
ON CARRITO(id_cliente)
WHERE estado = 'activo';

-- =============================================
-- 11. DETALLES DEL CARRITO
-- =============================================

CREATE TABLE IF NOT EXISTS DETALLE_CARRITO (
    id_detalle_carrito INTEGER PRIMARY KEY AUTOINCREMENT,
    id_carrito INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    FOREIGN KEY (id_carrito)
        REFERENCES CARRITO(id_carrito)
        ON DELETE CASCADE,
    FOREIGN KEY (id_producto)
        REFERENCES PRODUCTO(id_producto)
        ON DELETE CASCADE,
    UNIQUE (id_carrito, id_producto)
);

-- =============================================
-- 12. TASAS DE CAMBIO
-- =============================================

CREATE TABLE IF NOT EXISTS TASA_CAMBIO (
    id_tasa INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(30) NOT NULL COLLATE NOCASE UNIQUE,
    valor DECIMAL(12, 4) NOT NULL CHECK (
        valor > 0 AND valor < 1000000
    ),
    activa INTEGER NOT NULL DEFAULT 0
        CHECK (activa IN (0, 1)),
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INTEGER NOT NULL,
    FOREIGN KEY (id_usuario)
        REFERENCES USUARIO(id_usuario)
        ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tasa_activa
ON TASA_CAMBIO(activa)
WHERE activa = 1;

-- =============================================
-- 13. INFORMES
-- =============================================

CREATE TABLE IF NOT EXISTS INFORME (
    id_informe INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('ventas', 'inventario')),
    periodo TEXT NOT NULL CHECK (periodo IN ('diario', 'mensual', 'anual')),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    fecha_generacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (fecha_fin >= fecha_inicio),
    FOREIGN KEY (id_usuario)
        REFERENCES USUARIO(id_usuario)
        ON DELETE RESTRICT
);

-- =============================================
-- ÍNDICES DE CONSULTA
-- =============================================

CREATE INDEX IF NOT EXISTS idx_usuario_rol
ON USUARIO(rol);

CREATE INDEX IF NOT EXISTS idx_producto_categoria
ON PRODUCTO(categoria);

CREATE INDEX IF NOT EXISTS idx_orden_cliente
ON ORDEN_COMPRA(id_cliente);

CREATE INDEX IF NOT EXISTS idx_orden_estado
ON ORDEN_COMPRA(estado);

CREATE INDEX IF NOT EXISTS idx_orden_fecha
ON ORDEN_COMPRA(fecha_creacion);

CREATE INDEX IF NOT EXISTS idx_pago_estado
ON PAGO(estado);

CREATE INDEX IF NOT EXISTS idx_token_usuario
ON TOKEN_RECUPERACION(id_usuario);

`;
