class IngresoController {
    static getIngresos(req, res) {
        const query = `
            SELECT i.*, t.identificador as tanque_identificador, t.tipoCarburante
            FROM ingreso i
            JOIN tanque t ON i.tanque_id = t.id
            ORDER BY i.fechaHora DESC
        `;
        req.db.all(query, [], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        });
    }

    static createIngreso(req, res) {
        const { tanque_id, cantidad, nroFactura, fechaHora } = req.body;
        
        // Validar que el tanque exista y no superemos la capacidad máxima
        const queryTanque = `
            SELECT t.*, 
                (COALESCE((SELECT SUM(cantidad) FROM ingreso WHERE tanque_id = t.id), 0) - 
                 COALESCE((SELECT SUM(cantidad) FROM venta WHERE tanque_id = t.id), 0)) as stockActual
            FROM tanque t
            WHERE t.id = ?
        `;
        
        req.db.get(queryTanque, [tanque_id], (err, tanque) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!tanque) {
                return res.status(404).json({ error: "Tanque no encontrado" });
            }
            
            const nuevoStock = tanque.stockActual + Number(cantidad);
            if (nuevoStock > tanque.capacidadMaxima) {
                return res.status(400).json({ 
                    error: `El ingreso de ${cantidad}L excede la capacidad máxima del tanque (${tanque.capacidadMaxima}L). Capacidad disponible: ${tanque.capacidadMaxima - tanque.stockActual}L.` 
                });
            }
            
            const insertQuery = `INSERT INTO ingreso (tanque_id, cantidad, nroFactura, fechaHora) 
                                 VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`;
            
            req.db.run(insertQuery, [tanque_id, cantidad, nroFactura, fechaHora], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                // Emitir eventos por Socket.io
                req.io.emit('ingresos_updated');
                req.io.emit('tanques_updated');
                
                res.status(201).json({ 
                    id: this.lastID, 
                    tanque_id, 
                    cantidad, 
                    nroFactura, 
                    fechaHora: fechaHora || new Date().toISOString() 
                });
            });
        });
    }
}

module.exports = IngresoController;
