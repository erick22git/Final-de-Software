const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'erara_petrol.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Enable Foreign Key support in SQLite
    db.run("PRAGMA foreign_keys = ON");

    // 1. Empresa
    db.run(`CREATE TABLE IF NOT EXISTS empresa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        nit TEXT,
        direccion TEXT,
        ciudad TEXT,
        contacto TEXT,
        alertStockMinimo REAL DEFAULT 0.15, -- Alerta si stock actual < 15% de capacidad
        factorHolgura REAL DEFAULT 0.10,     -- 10% adicional
        cupoBaseNuevo REAL DEFAULT 120.0     -- Cupo base inicial para clientes nuevos (litros)
    )`);

    // 2. Tanque
    db.run(`CREATE TABLE IF NOT EXISTS tanque (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        identificador TEXT UNIQUE,
        tipoCarburante TEXT, -- 'Gasolina' o 'Diésel'
        capacidadMaxima REAL,
        stockMinimoSeguridad REAL
    )`);

    // 3. Cliente
    db.run(`CREATE TABLE IF NOT EXISTS cliente (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ciNit TEXT UNIQUE,
        nombreRazonSocial TEXT,
        placa TEXT UNIQUE,
        tipoCliente TEXT, -- 'Particular', 'Transporte Público', 'Empresa'
        estado TEXT DEFAULT 'Activo' -- 'Activo', 'Suspendido'
    )`);

    // 4. Ingreso
    db.run(`CREATE TABLE IF NOT EXISTS ingreso (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tanque_id INTEGER,
        cantidad REAL,
        nroFactura TEXT,
        fechaHora DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tanque_id) REFERENCES tanque(id) ON DELETE CASCADE
    )`);

    // 5. Venta
    db.run(`CREATE TABLE IF NOT EXISTS venta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tanque_id INTEGER,
        cliente_id INTEGER,
        cantidad REAL,
        precioTotal REAL,
        fechaHora DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tanque_id) REFERENCES tanque(id) ON DELETE CASCADE,
        FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE
    )`);

    console.log("Tablas creadas. Insertando datos de prueba...");

    // Insertar Empresa
    db.run(`INSERT OR IGNORE INTO empresa (id, nombre, nit, direccion, ciudad, contacto, alertStockMinimo, factorHolgura, cupoBaseNuevo) 
            VALUES (1, 'ErAra Petrol', '10283742023', 'Av. Blanco Galindo Km 4.5', 'Cochabamba', '44123456 - info@erara.com', 0.15, 0.10, 120.0)`);

    // Insertar Tanques
    // Tanque 1: Gasolina, Capacidad 20,000 L, Stock Mínimo de Seguridad 2,000 L
    db.run(`INSERT OR IGNORE INTO tanque (id, identificador, tipoCarburante, capacidadMaxima, stockMinimoSeguridad)
            VALUES (1, 'Tanque T-01 (Gasolina)', 'Gasolina', 20000.0, 2000.0)`);
    // Tanque 2: Diésel, Capacidad 25,000 L, Stock Mínimo de Seguridad 2,500 L
    db.run(`INSERT OR IGNORE INTO tanque (id, identificador, tipoCarburante, capacidadMaxima, stockMinimoSeguridad)
            VALUES (2, 'Tanque T-02 (Diésel)', 'Diésel', 25000.0, 2500.0)`);

    // Insertar Clientes de prueba
    // Cliente 1: Carlos Perez, Particular, con historial completo
    db.run(`INSERT OR IGNORE INTO cliente (id, ciNit, nombreRazonSocial, placa, tipoCliente, estado)
            VALUES (1, '1234567', 'Carlos Perez', '3456-ABC', 'Particular', 'Activo')`);
    // Cliente 2: Juan Quispe, Transporte Público, con historial que excede
    db.run(`INSERT OR IGNORE INTO cliente (id, ciNit, nombreRazonSocial, placa, tipoCliente, estado)
            VALUES (2, '7654321', 'Juan Quispe (Sind. Litoral)', '4589-KLD', 'Transporte Público', 'Activo')`);
    // Cliente 3: Maria Gomez, Particular, Nuevo cliente (registrado recientemente, sin historial lejano)
    db.run(`INSERT OR IGNORE INTO cliente (id, ciNit, nombreRazonSocial, placa, tipoCliente, estado)
            VALUES (3, '9988776', 'Maria Gomez', '1020-XYZ', 'Particular', 'Activo')`);
    // Cliente 4: Empresa TransCopacabana, Empresa, Suspendido
    db.run(`INSERT OR IGNORE INTO cliente (id, ciNit, nombreRazonSocial, placa, tipoCliente, estado)
            VALUES (4, '300400500', 'Trans Copacabana S.A.', '2545-ERT', 'Empresa', 'Suspendido')`);

    // Insertar Abastecimientos (Ingresos)
    // Abastecer Tanque 1 con 15,000 litros
    db.run(`INSERT OR IGNORE INTO ingreso (id, tanque_id, cantidad, nroFactura, fechaHora)
            VALUES (1, 1, 15000.0, 'FAC-9081', datetime('now', '-28 days'))`);
    // Abastecer Tanque 2 con 18,000 litros
    db.run(`INSERT OR IGNORE INTO ingreso (id, tanque_id, cantidad, nroFactura, fechaHora)
            VALUES (2, 2, 18000.0, 'FAC-9082', datetime('now', '-28 days'))`);

    // Insertar Historial de Ventas para simular promedios
    // Cliente 1 (Carlos Perez):
    // Semana 4 (hace 25 días): 80 L
    db.run(`INSERT OR IGNORE INTO venta (id, tanque_id, cliente_id, cantidad, precioTotal, fechaHora)
            VALUES (1, 1, 1, 80.0, 300.0, datetime('now', '-25 days'))`);
    // Semana 3 (hace 18 días): 90 L
    db.run(`INSERT OR IGNORE INTO venta (id, tanque_id, cliente_id, cantidad, precioTotal, fechaHora)
            VALUES (2, 1, 1, 90.0, 337.5, datetime('now', '-18 days'))`);
    // Semana 2 (hace 11 días): 75 L
    db.run(`INSERT OR IGNORE INTO venta (id, tanque_id, cliente_id, cantidad, precioTotal, fechaHora)
            VALUES (3, 1, 1, 75.0, 281.25, datetime('now', '-11 days'))`);
    // Semana 1 (hace 4 días): 100 L
    db.run(`INSERT OR IGNORE INTO venta (id, tanque_id, cliente_id, cantidad, precioTotal, fechaHora)
            VALUES (4, 1, 1, 100.0, 375.0, datetime('now', '-4 days'))`);
    // Total = 345 litros en 28 días. Promedio semanal = 345 / 4 = 86.25 L.
    // Límite semanal (con 10% holgura) = 86.25 * 1.10 = 94.88 L.

    // Cliente 2 (Juan Quispe):
    // Semana 4 (hace 26 días): 300 L (Diésel)
    db.run(`INSERT OR IGNORE INTO venta (id, tanque_id, cliente_id, cantidad, precioTotal, fechaHora)
            VALUES (5, 2, 2, 300.0, 1116.0, datetime('now', '-26 days'))`);
    // Semana 3 (hace 19 días): 280 L
    db.run(`INSERT OR IGNORE INTO venta (id, tanque_id, cliente_id, cantidad, precioTotal, fechaHora)
            VALUES (6, 2, 2, 280.0, 1041.6, datetime('now', '-19 days'))`);
    // Semana 2 (hace 12 días): 320 L
    db.run(`INSERT OR IGNORE INTO venta (id, tanque_id, cliente_id, cantidad, precioTotal, fechaHora)
            VALUES (7, 2, 2, 320.0, 1190.4, datetime('now', '-12 days'))`);
    // Semana 1 (hace 5 días): 290 L
    db.run(`INSERT OR IGNORE INTO venta (id, tanque_id, cliente_id, cantidad, precioTotal, fechaHora)
            VALUES (8, 2, 2, 290.0, 1078.8, datetime('now', '-5 days'))`);
    // Total = 1190 litros. Promedio semanal = 1190 / 4 = 297.5 L.
    // Límite semanal (con 10% holgura) = 297.5 * 1.10 = 327.25 L.

    // Cliente 3 (Maria Gomez):
    // Solo tiene una venta hace 3 días. Como su primer consumo fue hace menos de 7 días, se le considerará "Nuevo"
    // y aplicará el cupo base (120 litros) en lugar del promedio semanal.
    db.run(`INSERT OR IGNORE INTO venta (id, tanque_id, cliente_id, cantidad, precioTotal, fechaHora)
            VALUES (9, 1, 3, 50.0, 187.5, datetime('now', '-3 days'))`);

    console.log("Base de datos de ErAra Petrol inicializada con éxito.");
});

db.close();
