class ClienteController {
    static getClientes(req, res) {
        const query = `SELECT * FROM cliente ORDER BY id DESC`;
        req.db.all(query, [], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        });
    }

    static getClienteByPlaca(req, res) {
        const { placa } = req.params;
        const query = `SELECT * FROM cliente WHERE UPPER(placa) = UPPER(?)`;
        req.db.get(query, [placa], (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!row) {
                return res.status(404).json({ message: "Cliente no encontrado" });
            }
            res.json(row);
        });
    }

    static createCliente(req, res) {
        const { ciNit, nombreRazonSocial, placa, tipoCliente, estado } = req.body;
        const query = `INSERT INTO cliente (ciNit, nombreRazonSocial, placa, tipoCliente, estado) 
                       VALUES (?, ?, ?, ?, ?)`;
        req.db.run(query, [
            ciNit, 
            nombreRazonSocial || 'Cliente Particular', 
            placa, 
            tipoCliente || 'Particular', 
            estado || 'Activo'
        ], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            req.io.emit('clientes_updated');
            
            res.status(201).json({ 
                id: this.lastID, 
                ciNit, 
                nombreRazonSocial, 
                placa, 
                tipoCliente, 
                estado 
            });
        });
    }

    static updateClienteEstado(req, res) {
        const { id } = req.params;
        const { estado } = req.body; // 'Activo' o 'Suspendido'
        const query = `UPDATE cliente SET estado = ? WHERE id = ?`;
        req.db.run(query, [estado, id], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            req.io.emit('clientes_updated');
            
            res.json({ message: "Estado del cliente actualizado correctamente" });
        });
    }
}

module.exports = ClienteController;
