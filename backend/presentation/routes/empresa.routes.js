const express = require('express');
const router = express.Router();
const EmpresaController = require('../controllers/empresa.controller');

router.get('/', EmpresaController.getEmpresa);
router.put('/', EmpresaController.updateEmpresa);

module.exports = router;
