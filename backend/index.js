require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

const dbPath = path.resolve(__dirname, 'database', 'erara_petrol.db');
const db = new sqlite3.Database(dbPath);

// Habilitar llaves foráneas en SQLite
db.run("PRAGMA foreign_keys = ON");

// Middleware para inyectar la DB y Socket.io
app.use((req, res, next) => {
    req.db = db;
    req.io = io;
    next();
});

// Importar rutas
const empresaRoutes = require('./presentation/routes/empresa.routes');
const tanqueRoutes = require('./presentation/routes/tanque.routes');
const clienteRoutes = require('./presentation/routes/cliente.routes');
const ingresoRoutes = require('./presentation/routes/ingreso.routes');
const ventaRoutes = require('./presentation/routes/venta.routes');

// Registrar rutas
app.use('/api/empresa', empresaRoutes);
app.use('/api/tanques', tanqueRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/ingresos', ingresoRoutes);
app.use('/api/ventas', ventaRoutes);

// Socket.io Events
io.on('connection', (socket) => {
    console.log('Cliente Web conectado:', socket.id);
    socket.on('disconnect', () => {
        console.log('Cliente Web desconectado');
    });
});

app.get('/', (req, res) => {
    res.send('Servidor ErAra Petrol - Activo');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Servidor de ErAra Petrol corriendo en el puerto ${PORT}`);
});
