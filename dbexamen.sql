
CREATE DATABASE Sistemaexamen;
GO
USE Sistemaexamen;
GO

CREATE TABLE Unidades (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL UNIQUE,
    tipo_unidad NVARCHAR(20) NOT NULL CHECK (tipo_unidad IN ('DIRECCION', 'DEPARTAMENTO', 'PROYECTO')),
    descripcion NVARCHAR(MAX),
    estado NVARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_creacion DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE TiposLicencia (
    id INT IDENTITY(1,1) PRIMARY KEY,
    codigo NVARCHAR(10) NOT NULL UNIQUE,
    descripcion NVARCHAR(50) NOT NULL,
    categoria NCHAR(1) NOT NULL CHECK (categoria IN ('A', 'B', 'C', 'M'))
);

CREATE TABLE EstadosVehiculo (
    id INT IDENTITY(1,1) PRIMARY KEY,
    codigo NVARCHAR(20) NOT NULL UNIQUE,
    descripcion NVARCHAR(50) NOT NULL
);

CREATE TABLE TiposCombustible (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(30) NOT NULL UNIQUE,
    precio_unitario DECIMAL(8,2) NOT NULL CHECK (precio_unitario > 0)
);

CREATE TABLE Vehiculos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    placa NVARCHAR(10) NOT NULL UNIQUE,
    numero_economico NVARCHAR(20) NOT NULL UNIQUE,
    marca NVARCHAR(50) NOT NULL,
    modelo NVARCHAR(50) NOT NULL,
    anio INT NOT NULL,
    tipo_vehiculo NVARCHAR(20) NOT NULL CHECK (tipo_vehiculo IN ('SEDAN', 'PICKUP', 'MICROBUS', 'MOTO')),
    capacidad_personas INT NOT NULL CHECK (capacidad_personas > 0),
    kilometraje_actual DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (kilometraje_actual >= 0),
    id_estado INT NOT NULL,
    id_tipo_combustible INT NOT NULL,
    rendimiento_promedio DECIMAL(5,2) CHECK (rendimiento_promedio > 0),
    fecha_adquisicion DATE NOT NULL,
    fecha_ultimo_mantenimiento DATE,
    estado_operativo NVARCHAR(20) DEFAULT 'OPERATIVO' CHECK (estado_operativo IN ('OPERATIVO', 'MANTENIMIENTO', 'FUERA_SERVICIO')),
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (id_estado) REFERENCES EstadosVehiculo(id),
    FOREIGN KEY (id_tipo_combustible) REFERENCES TiposCombustible(id)
);


CREATE TABLE Conductores (
    id INT IDENTITY(1,1) PRIMARY KEY,
    numero_licencia NVARCHAR(20) NOT NULL UNIQUE,
    nombres NVARCHAR(100) NOT NULL,
    apellidos NVARCHAR(100) NOT NULL,
    dpi NVARCHAR(20) NOT NULL UNIQUE,
    telefono NVARCHAR(15),
    email NVARCHAR(100),
    id_tipo_licencia INT NOT NULL,
    fecha_vencimiento_licencia DATE NOT NULL,
    estado NVARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO')),
    fecha_contratacion DATE NOT NULL,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (id_tipo_licencia) REFERENCES TiposLicencia(id)
);


CREATE TABLE DocumentosVehiculos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    id_vehiculo INT NOT NULL,
    tipo_documento NVARCHAR(30) NOT NULL CHECK (tipo_documento IN ('SEGURO', 'REVISION_TECNICA', 'TARJETA_CIRCULACION')),
    numero_documento NVARCHAR(50) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    entidad_emisora NVARCHAR(100),
    monto DECIMAL(10,2),
    estado NVARCHAR(20) DEFAULT 'VIGENTE' CHECK (estado IN ('VIGENTE', 'VENCIDO', 'POR_VENCER')),
    archivo_documento NVARCHAR(255),
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (id_vehiculo) REFERENCES Vehiculos(id),
    
    CONSTRAINT chk_fechas_documento CHECK (fecha_vencimiento > fecha_emision)
);


CREATE TABLE SolicitudesViaje (
    id INT IDENTITY(1,1) PRIMARY KEY,
    id_unidad_solicitante INT NOT NULL,
    motivo NVARCHAR(200) NOT NULL,
    origen NVARCHAR(100) NOT NULL,
    destino NVARCHAR(100) NOT NULL,
    fecha_salida DATETIME2 NOT NULL,
    fecha_retorno_estimada DATETIME2,
    pasajeros_estimados INT NOT NULL CHECK (pasajeros_estimados > 0),
    responsable_solicitud NVARCHAR(100) NOT NULL,
    observaciones NVARCHAR(MAX),
    estado_solicitud NVARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado_solicitud IN ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'ASIGNADA')),
    fecha_solicitud DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (id_unidad_solicitante) REFERENCES Unidades(id),
    
    CONSTRAINT chk_fechas_viaje CHECK (fecha_retorno_estimada IS NULL OR fecha_retorno_estimada >= fecha_salida)
);


CREATE TABLE AsignacionesViaje (
    id INT IDENTITY(1,1) PRIMARY KEY,
    id_solicitud INT NOT NULL,
    id_vehiculo INT NOT NULL,
    id_conductor INT NOT NULL,
    odometro_salida DECIMAL(10,2) NOT NULL CHECK (odometro_salida >= 0),
    odometro_retorno DECIMAL(10,2),
    combustible_inicial DECIMAL(5,2) NOT NULL CHECK (combustible_inicial >= 0),
    combustible_final DECIMAL(5,2) CHECK (combustible_final >= 0),
    fecha_asignacion DATETIME2 DEFAULT GETDATE(),
    fecha_salida_real DATETIME2,
    fecha_retorno_real DATETIME2,
    estado_viaje NVARCHAR(20) DEFAULT 'ASIGNADO' CHECK (estado_viaje IN ('ASIGNADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO')),
    observaciones_viaje NVARCHAR(MAX),
    
    FOREIGN KEY (id_solicitud) REFERENCES SolicitudesViaje(id),
    FOREIGN KEY (id_vehiculo) REFERENCES Vehiculos(id),
    FOREIGN KEY (id_conductor) REFERENCES Conductores(id),
    
    CONSTRAINT chk_odometro_retorno CHECK (odometro_retorno IS NULL OR odometro_retorno >= odometro_salida)
);


CREATE TABLE CargasCombustible (
    id INT IDENTITY(1,1) PRIMARY KEY,
    id_vehiculo INT NOT NULL,
    id_asignacion INT,
    fecha_carga DATETIME2 NOT NULL DEFAULT GETDATE(),
    litros DECIMAL(6,2) NOT NULL CHECK (litros > 0),
    precio_unitario DECIMAL(8,2) NOT NULL CHECK (precio_unitario > 0),
    monto_total AS (litros * precio_unitario) PERSISTED,
    odometro DECIMAL(10,2) NOT NULL CHECK (odometro >= 0),
    estacion_servicio NVARCHAR(100),
    numero_factura NVARCHAR(50),
    usuario_registro NVARCHAR(50) NOT NULL,
    
    FOREIGN KEY (id_vehiculo) REFERENCES Vehiculos(id),
    FOREIGN KEY (id_asignacion) REFERENCES AsignacionesViaje(id)
);


CREATE TABLE CategoriasRepuesto (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(50) NOT NULL UNIQUE,
    descripcion NVARCHAR(MAX)
);

CREATE TABLE Repuestos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    codigo NVARCHAR(30) NOT NULL UNIQUE,
    nombre NVARCHAR(100) NOT NULL,
    descripcion NVARCHAR(MAX),
    id_categoria INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario > 0),
    stock_actual INT NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo INT NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    unidad_medida NVARCHAR(20) DEFAULT 'UNIDAD',
    proveedor_principal NVARCHAR(100),
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (id_categoria) REFERENCES CategoriasRepuesto(id)
);


CREATE TABLE OrdenesMantenimiento (
    id INT IDENTITY(1,1) PRIMARY KEY,
    id_vehiculo INT NOT NULL,
    tipo_mantenimiento NVARCHAR(20) NOT NULL CHECK (tipo_mantenimiento IN ('PREVENTIVO', 'CORRECTIVO')),
    descripcion_trabajo NVARCHAR(MAX) NOT NULL,
    fecha_programada DATE NOT NULL,
    fecha_inicio DATETIME2,
    fecha_finalizacion DATETIME2,
    kilometraje_orden DECIMAL(10,2) NOT NULL,
    estado_orden NVARCHAR(20) DEFAULT 'PROGRAMADA' CHECK (estado_orden IN ('PROGRAMADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA')),
    costo_mano_obra DECIMAL(10,2) DEFAULT 0,
    diagnostico NVARCHAR(MAX),
    observaciones NVARCHAR(MAX),
    mecanico_asignado NVARCHAR(100),
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (id_vehiculo) REFERENCES Vehiculos(id),
    
    CONSTRAINT chk_fechas_mantenimiento CHECK (fecha_finalizacion IS NULL OR fecha_finalizacion >= fecha_inicio)
);


CREATE TABLE DetalleMantenimientoRepuestos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    id_orden INT NOT NULL,
    id_repuesto INT NOT NULL,
    cantidad_utilizada INT NOT NULL CHECK (cantidad_utilizada > 0),
    precio_unitario_usado DECIMAL(10,2) NOT NULL CHECK (precio_unitario_usado > 0),
    subtotal AS (cantidad_utilizada * precio_unitario_usado) PERSISTED,
    
    FOREIGN KEY (id_orden) REFERENCES OrdenesMantenimiento(id),
    FOREIGN KEY (id_repuesto) REFERENCES Repuestos(id)
);


CREATE TABLE MovimientosInventario (
    id INT IDENTITY(1,1) PRIMARY KEY,
    id_repuesto INT NOT NULL,
    tipo_movimiento NVARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2),
    referencia NVARCHAR(100), -- Número de factura, orden, etc.
    motivo NVARCHAR(200) NOT NULL,
    usuario NVARCHAR(50) NOT NULL,
    fecha_movimiento DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (id_repuesto) REFERENCES Repuestos(id)
);


CREATE TABLE MultasSiniestros (
    id INT IDENTITY(1,1) PRIMARY KEY,
    id_vehiculo INT NOT NULL,
    id_conductor INT,
    tipo_incidente NVARCHAR(20) NOT NULL CHECK (tipo_incidente IN ('MULTA', 'SINIESTRO', 'ACCIDENTE')),
    fecha_incidente DATE NOT NULL,
    descripcion NVARCHAR(MAX) NOT NULL,
    monto DECIMAL(10,2),
    estado_pago NVARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado_pago IN ('PENDIENTE', 'PAGADO', 'EN_PROCESO')),
    numero_expediente NVARCHAR(50),
    entidad NVARCHAR(100), -- Policía, PMT, etc.
    fecha_vencimiento DATE,
    observaciones NVARCHAR(MAX),
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (id_vehiculo) REFERENCES Vehiculos(id),
    FOREIGN KEY (id_conductor) REFERENCES Conductores(id)
);


INSERT INTO EstadosVehiculo (codigo, descripcion) VALUES 
('NUEVO', 'Vehículo nuevo'),
('BUENO', 'Buen estado'),
('REGULAR', 'Estado regular'),
('MALO', 'Mal estado');

INSERT INTO TiposLicencia (codigo, descripcion, categoria) VALUES 
('A', 'Motocicletas', 'A'),
('B', 'Vehículos livianos', 'B'),
('C', 'Vehículos pesados', 'C'),
('M', 'Maquinaria', 'M');

INSERT INTO TiposCombustible (nombre, precio_unitario) VALUES 
('GASOLINA_REGULAR', 24.50),
('GASOLINA_SUPER', 26.80),
('DIESEL', 22.30);

INSERT INTO CategoriasRepuesto (nombre, descripcion) VALUES 
('MOTOR', 'Repuestos del motor'),
('TRANSMISION', 'Repuestos de transmisión'),
('SUSPENSION', 'Repuestos de suspensión'),
('FRENOS', 'Repuestos del sistema de frenos'),
('ELECTRICO', 'Repuestos eléctricos'),
('NEUMATICOS', 'Llantas y neumáticos');


INSERT INTO Unidades (nombre, tipo_unidad, descripcion) VALUES 
('Dirección General', 'DIRECCION', 'Dirección General de la Universidad'),
('Depto. Administración', 'DEPARTAMENTO', 'Departamento de Administración'),
('Depto. Académico', 'DEPARTAMENTO', 'Departamento Académico'),
('Proyecto Extensión', 'PROYECTO', 'Proyecto de Extensión Universitaria');

INSERT INTO Vehiculos (placa, numero_economico, marca, modelo, anio, tipo_vehiculo, capacidad_personas, 
                      kilometraje_actual, id_estado, id_tipo_combustible, rendimiento_promedio, 
                      fecha_adquisicion, fecha_ultimo_mantenimiento) VALUES
('P-123ABC', 'UMG-001', 'Toyota', 'Corolla', 2020, 'SEDAN', 5, 45000.50, 2, 1, 12.5, '2020-03-15', '2024-08-15'),
('P-456DEF', 'UMG-002', 'Ford', 'Ranger', 2019, 'PICKUP', 5, 62000.75, 2, 2, 10.2, '2019-07-22', '2024-07-20'),
('P-789GHI', 'UMG-003', 'Nissan', 'Urvan', 2021, 'MICROBUS', 15, 38000.20, 1, 3, 8.5, '2021-01-10', '2024-09-05'),
('P-101JKL', 'UMG-004', 'Honda', 'Civic', 2018, 'SEDAN', 5, 78000.90, 3, 1, 13.2, '2018-05-30', '2024-06-10'),
('P-202MNO', 'UMG-005', 'Mazda', 'BT-50', 2022, 'PICKUP', 5, 25000.00, 1, 3, 11.0, '2022-11-12', '2024-09-01'),
('M-303PQR', 'UMG-006', 'Yamaha', 'XTZ125', 2020, 'MOTO', 2, 15000.30, 2, 1, 35.0, '2020-08-18', '2024-08-30'),
('P-404STU', 'UMG-007', 'Isuzu', 'D-MAX', 2017, 'PICKUP', 5, 95000.45, 3, 3, 9.8, '2017-12-03', '2024-05-15'),
('P-505VWX', 'UMG-008', 'Toyota', 'Hiace', 2019, 'MICROBUS', 12, 55000.60, 2, 3, 9.2, '2019-09-25', '2024-08-25');

INSERT INTO Conductores (numero_licencia, nombres, apellidos, dpi, telefono, email, 
                        id_tipo_licencia, fecha_vencimiento_licencia, fecha_contratacion) VALUES
('GT12345678', 'Carlos Alberto', 'González Pérez', '1234567890101', '12345678', 'carlos.gonzalez@umg.edu.gt', 2, '2025-12-31', '2020-01-15'),
('GT23456789', 'María Elena', 'Rodríguez López', '2345678901012', '23456789', 'maria.rodriguez@umg.edu.gt', 2, '2025-11-30', '2019-05-20'),
('GT34567890', 'José Antonio', 'Martínez Silva', '3456789012123', '34567890', 'jose.martinez@umg.edu.gt', 3, '2026-03-15', '2018-08-10'),
('GT45678901', 'Ana Patricia', 'Hernández Cruz', '4567890123234', '45678901', 'ana.hernandez@umg.edu.gt', 2, '2025-10-20', '2021-02-28'),
('GT56789012', 'Roberto Carlos', 'Morales Vega', '5678901234345', '56789012', 'roberto.morales@umg.edu.gt', 3, '2026-01-10', '2017-11-05'),
('GT67890123', 'Lucía Isabel', 'Castillo Ramos', '6789012345456', '67890123', 'lucia.castillo@umg.edu.gt', 1, '2025-09-25', '2020-06-12'),
('GT78901234', 'Miguel Ángel', 'Torres Jiménez', '7890123456567', '78901234', 'miguel.torres@umg.edu.gt', 2, '2026-02-28', '2019-03-18'),
('GT89012345', 'Carmen Rosa', 'Flores Mendoza', '8901234567678', '89012345', 'carmen.flores@umg.edu.gt', 2, '2025-12-15', '2021-07-08');

INSERT INTO DocumentosVehiculos (id_vehiculo, tipo_documento, numero_documento, fecha_emision, 
                                fecha_vencimiento, entidad_emisora, monto, estado) VALUES
(1, 'SEGURO', 'SEG-2024-001', '2024-01-15', '2025-01-14', 'Seguros G&T', 2500.00, 'VIGENTE'),
(2, 'SEGURO', 'SEG-2024-002', '2024-02-10', '2025-02-09', 'Seguros G&T', 3200.00, 'VIGENTE'),
(3, 'SEGURO', 'SEG-2024-003', '2024-03-05', '2025-03-04', 'Aseguradora La Ceiba', 4500.00, 'VIGENTE'),
(4, 'SEGURO', 'SEG-2023-004', '2023-12-20', '2024-12-19', 'Seguros G&T', 2200.00, 'POR_VENCER'),
(5, 'SEGURO', 'SEG-2024-005', '2024-04-12', '2025-04-11', 'Mapfre Guatemala', 3800.00, 'VIGENTE'),

(1, 'REVISION_TECNICA', 'RT-2023-001', '2023-10-15', '2024-10-14', 'DIGESET', 150.00, 'VENCIDO'),
(2, 'REVISION_TECNICA', 'RT-2024-002', '2024-08-20', '2025-08-19', 'DIGESET', 150.00, 'VIGENTE'),
(3, 'REVISION_TECNICA', 'RT-2024-003', '2024-09-10', '2025-09-09', 'DIGESET', 200.00, 'VIGENTE'),
(4, 'REVISION_TECNICA', 'RT-2023-004', '2023-11-05', '2024-11-04', 'DIGESET', 150.00, 'POR_VENCER'),
(5, 'REVISION_TECNICA', 'RT-2024-005', '2024-07-30', '2025-07-29', 'DIGESET', 200.00, 'VIGENTE'),

(1, 'TARJETA_CIRCULACION', 'TC-2024-001', '2024-01-20', '2024-12-31', 'SAT', 350.00, 'POR_VENCER'),
(2, 'TARJETA_CIRCULACION', 'TC-2024-002', '2024-02-15', '2024-12-31', 'SAT', 400.00, 'POR_VENCER'),
(3, 'TARJETA_CIRCULACION', 'TC-2024-003', '2024-03-10', '2024-12-31', 'SAT', 450.00, 'POR_VENCER'),
(4, 'TARJETA_CIRCULACION', 'TC-2023-004', '2023-12-01', '2024-11-30', 'SAT', 350.00, 'POR_VENCER'),
(5, 'TARJETA_CIRCULACION', 'TC-2024-005', '2024-04-18', '2024-12-31', 'SAT', 400.00, 'POR_VENCER');

INSERT INTO SolicitudesViaje (id_unidad_solicitante, motivo, origen, destino, fecha_salida, 
                             fecha_retorno_estimada, pasajeros_estimados, responsable_solicitud, 
                             estado_solicitud) VALUES
(1, 'Reunión con autoridades municipales', 'Campus Central UMG', 'Municipalidad de Guatemala', '2024-09-15 08:00:00', '2024-09-15 16:00:00', 3, 'Dr. Juan Pérez', 'ASIGNADA'),
(2, 'Capacitación de personal administrativo', 'Campus Central UMG', 'Hotel Barceló', '2024-09-18 07:00:00', '2024-09-18 18:00:00', 8, 'Lic. María García', 'ASIGNADA'),
(3, 'Gestiones bancarias urgentes', 'Campus Central UMG', 'Banco Industrial Zona 10', '2024-09-20 09:00:00', '2024-09-20 12:00:00', 2, 'Contador Carlos López', 'ASIGNADA'),
(4, 'Supervisión proyecto extensión', 'Campus Central UMG', 'Chimaltenango', '2024-09-22 06:00:00', '2024-09-22 17:00:00', 4, 'Ing. Roberto Silva', 'ASIGNADA'),
(1, 'Entrega de documentos MINEDUC', 'Campus Central UMG', 'MINEDUC Zona 10', '2024-09-25 08:30:00', '2024-09-25 11:30:00', 2, 'Licda. Ana Morales', 'ASIGNADA'),
(2, 'Traslado estudiantes práctica', 'Campus Central UMG', 'Hospital Roosevelt', '2024-08-10 07:00:00', '2024-08-10 16:00:00', 12, 'Dr. Miguel Torres', 'ASIGNADA'),
(3, 'Reunión Consejo Directivo', 'Campus Central UMG', 'Hotel Westin Camino Real', '2024-08-15 14:00:00', '2024-08-15 20:00:00', 6, 'Rector Dr. Fernández', 'ASIGNADA'),
(4, 'Gestiones legales', 'Campus Central UMG', 'Organismo Judicial', '2024-07-20 08:00:00', '2024-07-20 15:00:00', 3, 'Abg. Patricia Ruiz', 'ASIGNADA');

INSERT INTO AsignacionesViaje (id_solicitud, id_vehiculo, id_conductor, odometro_salida, odometro_retorno,
                              combustible_inicial, combustible_final, fecha_salida_real, fecha_retorno_real, 
                              estado_viaje) VALUES
(1, 1, 1, 44800.50, 44900.50, 0.75, 0.25, '2024-09-15 08:00:00', '2024-09-15 16:30:00', 'COMPLETADO'),
(2, 3, 3, 37800.20, 37950.20, 0.80, 0.40, '2024-09-18 07:00:00', '2024-09-18 18:15:00', 'COMPLETADO'),
(3, 1, 2, 44900.50, 44950.50, 0.90, 0.65, '2024-09-20 09:00:00', '2024-09-20 12:45:00', 'COMPLETADO'),
(4, 2, 5, 61800.75, 62000.75, 0.85, 0.35, '2024-09-22 06:00:00', '2024-09-22 17:30:00', 'COMPLETADO'),
(5, 6, 6, 14900.30, 14950.30, 0.70, 0.55, '2024-09-25 08:30:00', '2024-09-25 11:45:00', 'COMPLETADO'),
(6, 8, 8, 54800.60, 55000.60, 0.90, 0.45, '2024-08-10 07:00:00', '2024-08-10 16:20:00', 'COMPLETADO'),
(7, 3, 4, 37950.20, 38000.20, 0.60, 0.35, '2024-08-15 14:00:00', '2024-08-15 20:10:00', 'COMPLETADO'),
(8, 1, 7, 44950.50, 45000.50, 0.40, 0.15, '2024-07-20 08:00:00', '2024-07-20 15:25:00', 'COMPLETADO');

INSERT INTO CargasCombustible (id_vehiculo, id_asignacion, fecha_carga, litros, precio_unitario, 
                              odometro, estacion_servicio, numero_factura, usuario_registro) VALUES
(1, 1, '2024-09-15 07:30:00', 45.50, 24.50, 44800.50, 'Shell Zona 1', 'FACT-001', 'operador1'),
(3, 2, '2024-09-18 06:30:00', 55.25, 22.30, 37800.20, 'Texaco Roosevelt', 'FACT-002', 'operador2'),
(1, 3, '2024-09-20 08:30:00', 25.75, 24.50, 44900.50, 'Esso Zona 4', 'FACT-003', 'operador1'),
(2, 4, '2024-09-22 05:30:00', 65.80, 26.80, 61800.75, 'Shell Mixco', 'FACT-004', 'operador3'),
(6, 5, '2024-09-25 08:00:00', 8.50, 24.50, 14900.30, 'Puma Villa Nueva', 'FACT-005', 'operador4'),
(8, 6, '2024-08-10 06:30:00', 70.25, 22.30, 54800.60, 'Texaco Zone 11', 'FACT-006', 'operador2'),
(3, 7, '2024-08-15 13:30:00', 30.40, 22.30, 37950.20, 'Shell Zona 10', 'FACT-007', 'operador1'),
(1, 8, '2024-07-20 07:30:00', 35.20, 24.80, 44950.50, 'Esso Zona 9', 'FACT-008', 'operador3'),
(1, NULL, '2024-08-05 10:00:00', 42.00, 24.30, 44700.00, 'Shell Zona 1', 'FACT-009', 'operador1'),
(2, NULL, '2024-08-12 14:30:00', 58.50, 26.90, 61500.00, 'Texaco Carretera', 'FACT-010', 'operador2'),
(4, NULL, '2024-09-01 09:15:00', 38.75, 24.60, 77500.00, 'Puma Centro', 'FACT-011', 'operador3'),
(5, NULL, '2024-09-10 11:45:00', 48.20, 22.50, 24800.00, 'Shell Sur', 'FACT-012', 'operador4');

INSERT INTO Repuestos (codigo, nombre, descripcion, id_categoria, precio_unitario, stock_actual, 
                      stock_minimo, unidad_medida, proveedor_principal) VALUES
('MOT-001', 'Filtro de Aceite', 'Filtro de aceite motor universal', 1, 85.50, 25, 10, 'UNIDAD', 'Repuestos García'),
('MOT-002', 'Aceite Motor 20W-50', 'Aceite multigrado para motor', 1, 145.00, 50, 15, 'LITRO', 'Lubricantes del Sur'),
('MOT-003', 'Bujías NGK', 'Bujías de encendido NGK', 1, 45.75, 30, 12, 'UNIDAD', 'Auto Repuestos Central'),
('MOT-004', 'Correa de Distribución', 'Correa de distribución reforzada', 1, 285.00, 8, 5, 'UNIDAD', 'Gates Guatemala'),
('TRA-001', 'Aceite Transmisión ATF', 'Aceite para transmisión automática', 2, 165.50, 35, 10, 'LITRO', 'Lubricantes del Sur'),
('TRA-002', 'Filtro Transmisión', 'Filtro interno transmisión', 2, 125.75, 15, 8, 'UNIDAD', 'Transmisiones Pro'),
('SUS-001', 'Amortiguador Delantero', 'Amortiguador delantero hidráulico', 3, 350.00, 20, 6, 'UNIDAD', 'Monroe Guatemala'),
('SUS-002', 'Resorte Helicoidal', 'Resorte de suspensión trasero', 3, 180.25, 12, 4, 'UNIDAD', 'Suspensiones Técnicas'),
('FRE-001', 'Pastillas de Freno', 'Pastillas freno delantero cerámicas', 4, 195.00, 40, 15, 'JUEGO', 'Frenos Brembo GT'),
('FRE-002', 'Líquido de Frenos DOT-3', 'Líquido de frenos alta temperatura', 4, 65.50, 25, 10, 'LITRO', 'Químicos Automotrices'),
('FRE-003', 'Discos de Freno', 'Discos freno delantero ventilados', 4, 425.00, 18, 6, 'PAR', 'Frenos Brembo GT'),
('ELE-001', 'Batería 12V', 'Batería 12V 70Ah libre mantenimiento', 5, 485.00, 12, 5, 'UNIDAD', 'Baterías Cosmos'),
('ELE-002', 'Alternador', 'Alternador 120A reconstruido', 5, 650.00, 6, 3, 'UNIDAD', 'Eléctricos Morales'),
('NEU-001', 'Llanta 185/65R15', 'Llanta radial para sedán', 6, 425.00, 20, 8, 'UNIDAD', 'Llantas Firestone'),
('NEU-002', 'Llanta 235/75R15', 'Llanta para pickup/SUV', 6, 580.00, 16, 6, 'UNIDAD', 'Llantas Bridgestone');

INSERT INTO OrdenesMantenimiento (id_vehiculo, tipo_mantenimiento, descripcion_trabajo, fecha_programada,
                                 fecha_inicio, fecha_finalizacion, kilometraje_orden, estado_orden, 
                                 costo_mano_obra, mecanico_asignado) VALUES
(1, 'PREVENTIVO', 'Cambio de aceite y filtros', '2024-08-15', '2024-08-15 08:00:00', '2024-08-15 12:00:00', 44000.00, 'COMPLETADA', 150.00, 'Mecánico López'),
(2, 'CORRECTIVO', 'Reparación sistema frenos', '2024-07-20', '2024-07-20 09:00:00', '2024-07-22 16:00:00', 61000.00, 'COMPLETADA', 350.00, 'Mecánico García'),
(3, 'PREVENTIVO', 'Servicio mayor 40,000 km', '2024-09-05', '2024-09-05 08:00:00', '2024-09-06 17:00:00', 37000.00, 'COMPLETADA', 450.00, 'Mecánico Morales'),
(4, 'CORRECTIVO', 'Cambio de transmisión', '2024-06-10', '2024-06-10 08:00:00', '2024-06-15 16:00:00', 76000.00, 'COMPLETADA', 800.00, 'Mecánico Especialista'),
(5, 'PREVENTIVO', 'Cambio aceite y revisión general', '2024-09-01', '2024-09-01 08:00:00', '2024-09-01 14:00:00', 24000.00, 'COMPLETADA', 200.00, 'Mecánico Rodríguez'),
(1, 'PREVENTIVO', 'Cambio pastillas freno y revisión suspensión', '2024-09-10', NULL, NULL, 45000.00, 'PROGRAMADA', 0, 'Mecánico López'),
(2, 'CORRECTIVO', 'Reparación sistema eléctrico - alternador', '2024-08-30', '2024-09-15 08:00:00', NULL, 62000.00, 'EN_PROCESO', 0, 'Mecánico García'),
(4, 'PREVENTIVO', 'Servicio 5,000 km - vencido', '2024-08-01', NULL, NULL, 78000.00, 'PROGRAMADA', 0, NULL),
(6, 'CORRECTIVO', 'Cambio de batería y revisión carga', '2024-09-05', NULL, NULL, 15000.00, 'PROGRAMADA', 0, 'Mecánico Eléctrico'),
(7, 'PREVENTIVO', 'Mantenimiento mayor - MUY VENCIDO', '2024-07-01', NULL, NULL, 95000.00, 'PROGRAMADA', 0, NULL);

INSERT INTO DetalleMantenimientoRepuestos (id_orden, id_repuesto, cantidad_utilizada, precio_unitario_usado) VALUES
(1, 1, 1, 85.50), (1, 2, 4, 145.00), (1, 3, 4, 45.75),
(2, 9, 1, 195.00), (2, 10, 2, 65.50), (2, 11, 1, 425.00),
(3, 1, 1, 85.50), (3, 2, 5, 145.00), (3, 4, 1, 285.00), (3, 7, 2, 350.00), (3, 9, 1, 195.00),
(4, 5, 3, 165.50), (4, 6, 1, 125.75),
(5, 1, 1, 85.50), (5, 2, 4, 145.00), (5, 10, 1, 65.50);

INSERT INTO MovimientosInventario (id_repuesto, tipo_movimiento, cantidad, precio_unitario, 
                                  referencia, motivo, usuario) VALUES
(1, 'ENTRADA', 50, 82.00, 'FACT-PROV-001', 'Compra mensual filtros', 'admin'),
(2, 'ENTRADA', 100, 142.00, 'FACT-PROV-002', 'Compra aceites motor', 'admin'),
(9, 'ENTRADA', 60, 190.00, 'FACT-PROV-003', 'Compra pastillas freno', 'admin'),
(12, 'ENTRADA', 20, 475.00, 'FACT-PROV-004', 'Compra baterías', 'admin'),
(1, 'SALIDA', 5, 85.50, 'OM-001-005', 'Uso en mantenimientos', 'mecanico1'),
(2, 'SALIDA', 20, 145.00, 'OM-001-005', 'Uso en mantenimientos', 'mecanico1'),
(9, 'SALIDA', 3, 195.00, 'OM-002-003', 'Cambios de pastillas', 'mecanico2'),
(10, 'SALIDA', 5, 65.50, 'OM-001-005', 'Cambios líquido frenos', 'mecanico1'),
(3, 'AJUSTE', -2, 0, 'INV-AJUST-001', 'Ajuste por inventario físico - faltante', 'admin'),
(11, 'AJUSTE', 1, 425.00, 'INV-AJUST-002', 'Ajuste por inventario físico - sobrante', 'admin');

INSERT INTO MultasSiniestros (id_vehiculo, id_conductor, tipo_incidente, fecha_incidente, 
                             descripcion, monto, estado_pago, numero_expediente, entidad) VALUES
(1, 1, 'MULTA', '2024-08-20', 'Exceso de velocidad en zona escolar', 500.00, 'PENDIENTE', 'PMT-2024-08-001', 'PMT Guatemala'),
(2, 3, 'MULTA', '2024-09-10', 'Estacionamiento indebido', 200.00, 'PAGADO', 'POL-2024-09-005', 'PNC Zona 1'),
(3, 4, 'ACCIDENTE', '2024-07-15', 'Colisión menor en estacionamiento', 1500.00, 'EN_PROCESO', 'SEG-2024-001', 'Seguros G&T'),
(4, 7, 'MULTA', '2024-09-05', 'No portar licencia al momento de inspección', 300.00, 'PENDIENTE', 'PMT-2024-09-012', 'PMT Mixco'),
(1, 2, 'SINIESTRO', '2024-06-30', 'Daños por granizada', 2500.00, 'PAGADO', 'SEG-2024-002', 'Seguros G&T');


PRINT '1. Costo por km del vehículo:';
SELECT 
    v.placa,
    v.numero_economico,
    v.marca,
    v.modelo,
    SUM(cc.litros) as total_litros,
    SUM(cc.monto_total) as costo_combustible,
    v.kilometraje_actual,
    CASE 
        WHEN v.kilometraje_actual > 0 
        THEN SUM(cc.monto_total) / v.kilometraje_actual
        ELSE 0 
    END as costo_por_km
FROM Vehiculos v
JOIN CargasCombustible cc ON v.id = cc.id_vehiculo
WHERE v.placa = 'P-001ABC'  
GROUP BY v.placa, v.numero_economico, v.marca, v.modelo, v.kilometraje_actual;
GO

PRINT '2. Rendimiento por vehículo (km/litro):';
SELECT 
    v.placa,
    v.numero_economico,
    v.tipo_vehiculo,
    SUM(cc.litros) as litros_consumidos,
    v.kilometraje_actual as km_totales,
    v.kilometraje_actual / SUM(cc.litros) as km_por_litro
FROM Vehiculos v
JOIN CargasCombustible cc ON v.id = cc.id_vehiculo
GROUP BY v.placa, v.numero_economico, v.tipo_vehiculo, v.kilometraje_actual
HAVING SUM(cc.litros) > 0
ORDER BY km_por_litro DESC;
GO

PRINT '3. Mantenimientos vencidos:';
SELECT 
    v.placa,
    v.marca,
    v.modelo,
    om.descripcion_trabajo,
    om.fecha_programada,
    DATEDIFF(day, om.fecha_programada, GETDATE()) as dias_vencido
FROM Vehiculos v
JOIN OrdenesMantenimiento om ON v.id = om.id_vehiculo
WHERE om.fecha_programada < GETDATE()
  AND om.estado_orden = 'PROGRAMADA'
ORDER BY dias_vencido DESC;
GO

PRINT '4. Top 10 repuestos más consumidos:';
SELECT TOP 10
    r.codigo,
    r.nombre,
    SUM(dmr.cantidad_utilizada) as cantidad_usada,
    SUM(dmr.subtotal) as costo_total
FROM Repuestos r
JOIN DetalleMantenimientoRepuestos dmr ON r.id = dmr.id_repuesto
GROUP BY r.codigo, r.nombre
ORDER BY cantidad_usada DESC;
GO

PRINT '5. Documentos de vehículos vencidos:';
SELECT 
    v.placa,
    v.numero_economico,
    dv.tipo_documento,
    dv.fecha_vencimiento,
    DATEDIFF(day, GETDATE(), dv.fecha_vencimiento) as dias_para_vencer
FROM Vehiculos v
JOIN DocumentosVehiculos dv ON v.id = dv.id_vehiculo
WHERE dv.fecha_vencimiento <= DATEADD(day, 30, GETDATE()) 
ORDER BY dv.fecha_vencimiento;
GO


PRINT '6. Vehículos operativos:';
SELECT 
    placa,
    numero_economico,
    marca,
    modelo,
    tipo_vehiculo,
    kilometraje_actual
FROM Vehiculos
WHERE estado_operativo = 'OPERATIVO'
ORDER BY placa;
GO


PRINT '7. Conductores con licencia por vencer:';
SELECT 
    nombres + ' ' + apellidos as conductor,
    numero_licencia,
    fecha_vencimiento_licencia,
    DATEDIFF(day, GETDATE(), fecha_vencimiento_licencia) as dias_vigencia
FROM Conductores
WHERE fecha_vencimiento_licencia <= DATEADD(day, 60, GETDATE())
  AND estado = 'ACTIVO'
ORDER BY fecha_vencimiento_licencia;
GO


PRINT '8. Repuestos con stock bajo:';
SELECT 
    codigo,
    nombre,
    stock_actual,
    stock_minimo
FROM Repuestos
WHERE stock_actual <= stock_minimo
ORDER BY stock_actual;
GO


PRINT '9. Últimas cargas de combustible:';
SELECT TOP 20
    v.placa,
    cc.fecha_carga,
    cc.litros,
    cc.precio_unitario,
    cc.monto_total,
    cc.estacion_servicio
FROM CargasCombustible cc
JOIN Vehiculos v ON cc.id_vehiculo = v.id
ORDER BY cc.fecha_carga DESC;
GO


PRINT '10. Viajes completados este mes:';
SELECT 
    v.placa,
    c.nombres + ' ' + c.apellidos as conductor,
    av.fecha_salida_real,
    av.fecha_retorno_real,
    av.odometro_salida,
    av.odometro_retorno,
    (av.odometro_retorno - av.odometro_salida) as km_recorridos
FROM AsignacionesViaje av
JOIN Vehiculos v ON av.id_vehiculo = v.id
JOIN Conductores c ON av.id_conductor = c.id
WHERE av.estado_viaje = 'COMPLETADO'
  AND MONTH(av.fecha_retorno_real) = MONTH(GETDATE())
  AND YEAR(av.fecha_retorno_real) = YEAR(GETDATE())
ORDER BY av.fecha_retorno_real DESC;
GO

PRINT '=== FIN DE CONSULTAS ===';
PRINT 'Todas las consultas ejecutadas correctamente.';
