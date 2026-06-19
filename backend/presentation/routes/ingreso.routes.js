const express = require('express');
const router = express.Router();
const IngresoController = require('../controllers/ingreso.controller');

router.get('/', IngresoController.getIngresos);
router.post('/', IngresoController.createIngreso);

module.exports = router;
