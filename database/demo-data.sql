
PRAGMA foreign_keys = ON;

BEGIN IMMEDIATE;

-- =============================================
-- USUARIOS DE DEMOSTRACION
-- ContraseÃ±a de todas las cuentas: Demo123!
-- Se conserva el administrador existente.
-- =============================================

INSERT INTO USUARIO
(id_usuario, nombre, correo, telefono, contrasena, rol, estado)
VALUES
(2, 'AndrÃ©s Castillo', 'andres.castillo@gmail.com', '04141234567',
 '$2b$10$edhhnvFW9brHvE.9ZXqHhewIWYudc/5nE7cS.Bpc6sIMsA6LQ3n1G', 'vendor', 'activo'),
(3, 'Valentina Rojas', 'valentina.rojas@gmail.com', '04161234567',
 '$2b$10$edhhnvFW9brHvE.9ZXqHhewIWYudc/5nE7cS.Bpc6sIMsA6LQ3n1G', 'vendor', 'activo'),
(4, 'Daniela PÃ©rez', 'daniela.perez@gmail.com', '04121234567',
 '$2b$10$edhhnvFW9brHvE.9ZXqHhewIWYudc/5nE7cS.Bpc6sIMsA6LQ3n1G', 'client', 'activo'),
(5, 'Gabriel Mendoza', 'gabriel.mendoza@gmail.com', '04141234568',
 '$2b$10$edhhnvFW9brHvE.9ZXqHhewIWYudc/5nE7cS.Bpc6sIMsA6LQ3n1G', 'client', 'activo'),
(6, 'Mariana Torres', 'mariana.torres@gmail.com', '04161234568',
 '$2b$10$edhhnvFW9brHvE.9ZXqHhewIWYudc/5nE7cS.Bpc6sIMsA6LQ3n1G', 'client', 'activo'),
(7, 'SebastiÃ¡n Herrera', 'sebastian.herrera@gmail.com', '04121234568',
 '$2b$10$edhhnvFW9brHvE.9ZXqHhewIWYudc/5nE7cS.Bpc6sIMsA6LQ3n1G', 'client', 'activo'),
(8, 'Camila FernÃ¡ndez', 'camila.fernandez@gmail.com', '04141234569',
 '$2b$10$edhhnvFW9brHvE.9ZXqHhewIWYudc/5nE7cS.Bpc6sIMsA6LQ3n1G', 'client', 'activo'),
(9, 'Ricardo Salazar', 'ricardo.salazar@gmail.com', '04161234569',
 '$2b$10$edhhnvFW9brHvE.9ZXqHhewIWYudc/5nE7cS.Bpc6sIMsA6LQ3n1G', 'client', 'activo');

-- =============================================
-- CLIENTES
-- =============================================

INSERT INTO CLIENTE
(id_cliente, id_usuario, direccion, identificacion)
VALUES
(1, 4, 'Av. Francisco de Miranda, Caracas', 'V-28456789'),
(2, 5, 'Urb. El Trigal, Valencia', 'V-26789451'),
(3, 6, 'Av. Las Delicias, Maracay', 'V-30124567'),
(4, 7, 'Urb. La Lago, Maracaibo', 'V-25478963'),
(5, 8, 'Av. BolÃ­var, Barquisimeto', 'V-28963415'),
(6, 9, 'Urb. Los Naranjos, Caracas', 'V-27654389');

-- =============================================
-- PRODUCTOS DE MUSICA, DEPORTES Y FITNESS
-- =============================================

INSERT INTO PRODUCTO
(id_producto, sku, nombre, descripcion, categoria, subcategoria, precio, activo)
VALUES
(1, 'MS-MUS-001', 'Guitarra acÃºstica Yamaha F310',
 'Guitarra acÃºstica de seis cuerdas ideal para principiantes.',
 'MÃºsica', 'Guitarras', 249.99, 1),

(2, 'MS-MUS-002', 'Teclado musical Casio CT-S300',
 'Teclado electrÃ³nico portÃ¡til de 61 teclas.',
 'MÃºsica', 'Teclados', 179.50, 1),

(3, 'MS-MUS-003', 'MicrÃ³fono dinÃ¡mico Shure SM58',
 'MicrÃ³fono profesional para voces y presentaciones.',
 'MÃºsica', 'MicrÃ³fonos', 59.99, 1),

(4, 'MS-DEP-004', 'BalÃ³n de fÃºtbol Adidas',
 'BalÃ³n de fÃºtbol para entrenamiento y recreaciÃ³n.',
 'Deportes', 'FÃºtbol', 29.99, 1),

(5, 'MS-DEP-005', 'BalÃ³n de baloncesto Spalding',
 'BalÃ³n de baloncesto de tamaÃ±o oficial.',
 'Deportes', 'Baloncesto', 34.99, 1),

(6, 'MS-DEP-006', 'BalÃ³n de voleibol Mikasa',
 'BalÃ³n de voleibol para entrenamiento y competiciÃ³n.',
 'Deportes', 'Voleibol', 24.99, 1),

(7, 'MS-FIT-007', 'Set de mancuernas ajustables',
 'Juego de pesas para entrenamiento de fuerza.',
 'Fitness', 'Pesas', 44.50, 1),

(8, 'MS-FIT-008', 'Colchoneta deportiva',
 'Colchoneta antideslizante para yoga y ejercicios.',
 'Fitness', 'Yoga', 19.99, 1),

(9, 'MS-DEP-009', 'Raqueta de tenis Wilson',
 'Raqueta ligera para jugadores recreativos.',
 'Deportes', 'Tenis', 79.99, 1),

(10, 'MS-MUS-010', 'Baquetas Vic Firth 5A',
 'Par de baquetas de madera para baterÃ­a.',
 'MÃºsica', 'PercusiÃ³n', 14.99, 1);

-- =============================================
-- INVENTARIO
-- =============================================

INSERT INTO INVENTARIO
(id_producto, cantidad, stock_minimo)
VALUES
(1, 8, 2),
(2, 5, 2),
(3, 14, 4),
(4, 25, 6),
(5, 18, 5),
(6, 3, 4),
(7, 11, 3),
(8, 20, 5),
(9, 6, 2),
(10, 30, 8);

-- =============================================
-- TASAS DE CAMBIO
-- Valores ficticios para demostraciÃ³n.
-- =============================================

INSERT INTO TASA_CAMBIO
(id_tasa, nombre, valor, activa, id_usuario)
VALUES
(1, 'BCV', 365.2500, 1, 1),
(2, 'Referencia', 367.8000, 0, 1);

-- =============================================
-- ORDENES DE COMPRA
-- =============================================

INSERT INTO ORDEN_COMPRA (
 id_orden, numero_orden, id_cliente, estado,
 subtotal, impuesto, tipo_impuesto, total, moneda,
 tasa_nombre, tasa_valor, tasa_fecha,
 nombre_facturacion, identificacion_facturacion,
 correo_facturacion, telefono_facturacion,
 direccion_facturacion, nombre_destinatario,
 telefono_destinatario, direccion_entrega,
 fecha_creacion, fecha_actualizacion
)
VALUES
(1, 'MS-2026-001', 1, 'completado',
 264.98, 42.40, 'IVA', 307.38, 'USD',
 'BCV', 365.2500, '2026-11-04 10:00:00',
 'Daniela PÃ©rez', 'V-28456789', 'daniela.perez@gmail.com',
 '04121234567', 'Av. Francisco de Miranda, Caracas',
 'Daniela PÃ©rez', '04121234567', 'Av. Francisco de Miranda, Caracas',
 '2026-11-04 10:00:00', '2026-11-05 15:30:00'),

(2, 'MS-2026-002', 2, 'despachado',
 64.98, 10.40, 'IVA', 75.38, 'USD',
 'BCV', 365.2500, '2026-11-12 11:00:00',
 'Gabriel Mendoza', 'V-26789451', 'gabriel.mendoza@gmail.com',
 '04141234568', 'Urb. El Trigal, Valencia',
 'Gabriel Mendoza', '04141234568', 'Urb. El Trigal, Valencia',
 '2026-11-12 11:00:00', '2026-11-15 09:30:00'),

(3, 'MS-2026-003', 3, 'procesando',
 74.98, 12.00, 'IVA', 86.98, 'USD',
 'BCV', 365.2500, '2026-11-18 14:20:00',
 'Mariana Torres', 'V-30124567', 'mariana.torres@gmail.com',
 '04161234568', 'Av. Las Delicias, Maracay',
 'Mariana Torres', '04161234568', 'Av. Las Delicias, Maracay',
 '2026-11-18 14:20:00', '2026-11-19 10:00:00'),

(4, 'MS-2026-004', 4, 'pendiente',
 49.98, 8.00, 'IVA', 57.98, 'USD',
 'BCV', 365.2500, '2026-11-21 09:15:00',
 'SebastiÃ¡n Herrera', 'V-25478963', 'sebastian.herrera@gmail.com',
 '04121234568', 'Urb. La Lago, Maracaibo',
 'SebastiÃ¡n Herrera', '04121234568', 'Urb. La Lago, Maracaibo',
 '2026-11-21 09:15:00', '2026-11-21 09:15:00'),

(5, 'MS-2026-005', 5, 'pendiente',
 64.49, 10.32, 'IVA', 74.81, 'USD',
 'BCV', 365.2500, '2026-11-22 16:40:00',
 'Camila FernÃ¡ndez', 'V-28963415', 'camila.fernandez@gmail.com',
 '04141234569', 'Av. BolÃ­var, Barquisimeto',
 'Camila FernÃ¡ndez', '04141234569', 'Av. BolÃ­var, Barquisimeto',
 '2026-11-22 16:40:00', '2026-11-22 16:40:00'),

(6, 'MS-2026-006', 6, 'completado',
 259.49, 41.52, 'IVA', 301.01, 'USD',
 'BCV', 365.2500, '2026-11-23 08:30:00',
 'Ricardo Salazar', 'V-27654389', 'ricardo.salazar@gmail.com',
 '04161234569', 'Urb. Los Naranjos, Caracas',
 'Ricardo Salazar', '04161234569', 'Urb. Los Naranjos, Caracas',
 '2026-11-23 08:30:00', '2026-11-23 12:00:00');

-- =============================================
-- DETALLES DE COMPRA
-- =============================================

INSERT INTO DETALLE_COMPRA
(id_detalle, id_orden, id_producto, nombre_producto, sku, cantidad, precio_unitario, subtotal)
VALUES
(1, 1, 1, 'Guitarra acÃºstica Yamaha F310', 'MS-MUS-001', 1, 249.99, 249.99),
(2, 1, 10, 'Baquetas Vic Firth 5A', 'MS-MUS-010', 1, 14.99, 14.99),

(3, 2, 4, 'BalÃ³n de fÃºtbol Adidas', 'MS-DEP-004', 1, 29.99, 29.99),
(4, 2, 5, 'BalÃ³n de baloncesto Spalding', 'MS-DEP-005', 1, 34.99, 34.99),

(5, 3, 3, 'MicrÃ³fono dinÃ¡mico Shure SM58', 'MS-MUS-003', 1, 59.99, 59.99),
(6, 3, 10, 'Baquetas Vic Firth 5A', 'MS-MUS-010', 1, 14.99, 14.99),

(7, 4, 6, 'BalÃ³n de voleibol Mikasa', 'MS-DEP-006', 2, 24.99, 49.98),

(8, 5, 8, 'Colchoneta deportiva', 'MS-FIT-008', 1, 19.99, 19.99),
(9, 5, 7, 'Set de mancuernas ajustables', 'MS-FIT-007', 1, 44.50, 44.50),

(10, 6, 2, 'Teclado musical Casio CT-S300', 'MS-MUS-002', 1, 179.50, 179.50),
(11, 6, 9, 'Raqueta de tenis Wilson', 'MS-DEP-009', 1, 79.99, 79.99);

-- =============================================
-- PAGOS
-- =============================================

INSERT INTO PAGO
(id_pago, id_orden, metodo, numero_referencia, monto, moneda,
 estado, fecha_pago, fecha_revision, id_revisor, motivo_rechazo)
VALUES
(1, 1, 'zelle', 'ZEL-84920175', 307.38, 'USD',
 'aprobado', '2026-11-04 10:25:00', '2026-11-04 11:00:00', 1, NULL),

(2, 2, 'transferencia', 'TRF-73910582', 75.38, 'USD',
 'aprobado', '2026-11-12 11:45:00', '2026-11-12 13:00:00', 1, NULL),

(3, 3, 'pago_movil', 'PM-62849103', 86.98, 'USD',
 'aprobado', '2026-11-18 15:00:00', '2026-11-18 16:10:00', 1, NULL),

(4, 4, 'binance', 'BNB-49281037', 57.98, 'USD',
 'pendiente', '2026-11-21 09:40:00', NULL, NULL, NULL),

(5, 5, 'transferencia', 'TRF-19384720', 74.81, 'USD',
 'rechazado', '2026-11-22 17:00:00', '2026-11-22 18:00:00', 1,
 'El comprobante no permite verificar el monto recibido.'),

(6, 6, 'zelle', 'ZEL-57291048', 301.01, 'USD',
 'aprobado', '2026-11-23 09:00:00', '2026-11-23 10:00:00', 1, NULL);

-- =============================================
-- RECIBOS DE PAGOS APROBADOS
-- =============================================

INSERT INTO RECIBO
(id_recibo, id_pago, numero_recibo, fecha_emision, subtotal, impuesto, total)
VALUES
(1, 1, 'REC-2026-001', '2026-11-04 11:05:00', 264.98, 42.40, 307.38),
(2, 2, 'REC-2026-002', '2026-11-12 13:05:00', 64.98, 10.40, 75.38),
(3, 3, 'REC-2026-003', '2026-11-18 16:15:00', 74.98, 12.00, 86.98),
(4, 6, 'REC-2026-004', '2026-11-23 10:05:00', 259.49, 41.52, 301.01);

-- =============================================
-- CARRITOS ACTIVOS
-- =============================================

INSERT INTO CARRITO
(id_carrito, id_cliente, estado)
VALUES
(1, 2, 'activo'),
(2, 4, 'activo');

INSERT INTO DETALLE_CARRITO
(id_detalle_carrito, id_carrito, id_producto, cantidad)
VALUES
(1, 1, 3, 1),
(2, 1, 6, 1),
(3, 2, 1, 1),
(4, 2, 8, 2);

-- =============================================
-- INFORMES DE DEMOSTRACION
-- =============================================

INSERT INTO INFORME
(id_informe, id_usuario, tipo, periodo, fecha_inicio, fecha_fin)
VALUES
(1, 1, 'ventas', 'mensual', '2026-11-01', '2026-11-30'),
(2, 1, 'inventario', 'mensual', '2026-11-01', '2026-11-30');

COMMIT;
