const express = require('express');
const router = express.Router();
const VentaController = require('../controllers/venta.controller');

router.get('/', VentaController.getVentas);
router.get('/cupo/:identificador', VentaController.calcularCupoCliente);
router.post('/procesar', VentaController.procesarVenta);

module.exports = router;
