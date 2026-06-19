class EmpresaController {
    static getEmpresa(req, res) {
        const query = `SELECT * FROM empresa WHERE id = 1`;
        req.db.get(query, [], (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(row);
        });
    }

    static updateEmpresa(req, res) {
        const { nombre, nit, direccion, ciudad, contacto, alertStockMinimo, factorHolgura, cupoBaseNuevo } = req.body;
        const query = `UPDATE empresa SET 
            nombre = ?, 
            nit = ?, 
            direccion = ?, 
            ciudad = ?, 
            contacto = ?, 
            alertStockMinimo = ?, 
            factorHolgura = ?, 
            cupoBaseNuevo = ? 
            WHERE id = 1`;

        req.db.run(query, [
            nombre, 
            nit, 
            direccion, 
            ciudad, 
            contacto, 
            alertStockMinimo, 
            factorHolgura, 
            cupoBaseNuevo
        ], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            // Emitir evento por socket.io para notificar cambios de configuración a los clientes frontend
            req.io.emit('config_updated');
            
            res.json({ message: "Configuración actualizada correctamente" });
        });
    }
}

module.exports = EmpresaController;
