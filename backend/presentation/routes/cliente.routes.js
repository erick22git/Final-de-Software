const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/cliente.controller');

router.get('/', ClienteController.getClientes);
router.get('/placa/:placa', ClienteController.getClienteByPlaca);
router.post('/', ClienteController.createCliente);
router.put('/:id/estado', ClienteController.updateClienteEstado);

module.exports = router;
