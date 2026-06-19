const express = require('express');
const router = express.Router();
const TanqueController = require('../controllers/tanque.controller');

router.get('/', TanqueController.getTanques);
router.get('/:id', TanqueController.getTanqueById);
router.post('/', TanqueController.createTanque);

module.exports = router;
