class TanqueController {
    static getTanques(req, res) {
        const query = `
            SELECT t.*, 
                COALESCE((SELECT SUM(cantidad) FROM ingreso WHERE tanque_id = t.id), 0) as totalIngresos,
                COALESCE((SELECT SUM(cantidad) FROM venta WHERE tanque_id = t.id), 0) as totalVentas,
                (COALESCE((SELECT SUM(cantidad) FROM ingreso WHERE tanque_id = t.id), 0) - 
                 COALESCE((SELECT SUM(cantidad) FROM venta WHERE tanque_id = t.id), 0)) as stockActual
            FROM tanque t
        `;
        req.db.all(query, [], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        });
    }

    static getTanqueById(req, res) {
        const { id } = req.params;
        const query = `
            SELECT t.*, 
                (COALESCE((SELECT SUM(cantidad) FROM ingreso WHERE tanque_id = t.id), 0) - 
                 COALESCE((SELECT SUM(cantidad) FROM venta WHERE tanque_id = t.id), 0)) as stockActual
            FROM tanque t
            WHERE t.id = ?
        `;
        req.db.get(query, [id], (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!row) {
                return res.status(404).json({ error: "Tanque no encontrado" });
            }
            res.json(row);
        });
    }

    static createTanque(req, res) {
        const { identificador, tipoCarburante, capacidadMaxima, stockMinimoSeguridad } = req.body;
        const query = `INSERT INTO tanque (identificador, tipoCarburante, capacidadMaxima, stockMinimoSeguridad) 
                       VALUES (?, ?, ?, ?)`;
        req.db.run(query, [identificador, tipoCarburante, capacidadMaxima, stockMinimoSeguridad], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            // Emitir evento por socket.io
            req.io.emit('tanques_updated');
            
            res.status(201).json({ 
                id: this.lastID, 
                identificador, 
                tipoCarburante, 
                capacidadMaxima, 
                stockMinimoSeguridad,
                stockActual: 0 
            });
        });
    }
}

module.exports = TanqueController;
