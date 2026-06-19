class VentaController {
    // Listar todas las ventas con detalles del cliente y tanque
    static getVentas(req, res) {
        const query = `
            SELECT v.*, 
                c.nombreRazonSocial as cliente_nombre, c.placa as cliente_placa, c.ciNit as cliente_ci,
                t.identificador as tanque_identificador, t.tipoCarburante
            FROM venta v
            JOIN cliente c ON v.cliente_id = c.id
            JOIN tanque t ON v.tanque_id = t.id
            ORDER BY v.fechaHora DESC
        `;
        req.db.all(query, [], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        });
    }

    // Método auxiliar para calcular el cupo de un cliente
    static async helperCalcularCupo(db, clienteIdentificador) {
        return new Promise((resolve, reject) => {
            // 1. Obtener parámetros globales de la empresa
            db.get(`SELECT * FROM empresa WHERE id = 1`, [], (err, empresa) => {
                if (err) return reject(err);
                if (!empresa) return reject(new Error("Configuración de empresa no encontrada"));

                const { factorHolgura, cupoBaseNuevo } = empresa;

                // 2. Buscar cliente por placa o ciNit
                const queryCliente = `
                    SELECT * FROM cliente 
                    WHERE UPPER(placa) = UPPER(?) OR ciNit = ?
                `;
                db.get(queryCliente, [clienteIdentificador, clienteIdentificador], (err, cliente) => {
                    if (err) return reject(err);

                    // Si no existe, es un cliente nuevo y no registrado aún
                    if (!cliente) {
                        return resolve({
                            cliente: null,
                            isRegistered: false,
                            isNew: true,
                            limite: cupoBaseNuevo,
                            holguraExplicada: 0,
                            motivo: "Cliente no registrado. Se asigna cupo base inicial."
                        });
                    }

                    // Si está suspendido, su cupo es 0
                    if (cliente.estado === 'Suspendido') {
                        return resolve({
                            cliente,
                            isRegistered: true,
                            isNew: false,
                            limite: 0,
                            motivo: "Cliente suspendido. Ventas bloqueadas.",
                            error: "El cliente se encuentra suspendido."
                        });
                    }

                    // 3. Verificar historial de compras
                    // Consultar la primera compra histórica del cliente
                    db.get(`SELECT MIN(fechaHora) as primeraVenta FROM venta WHERE cliente_id = ?`, [cliente.id], (err, rowPrimera) => {
                        if (err) return reject(err);

                        const primeraVenta = rowPrimera ? rowPrimera.primeraVenta : null;

                        // Determinar si es un cliente nuevo (< 7 días desde su primera compra o sin compras)
                        let esNuevo = false;
                        if (!primeraVenta) {
                            esNuevo = true;
                        } else {
                            const fechaPrimera = new Date(primeraVenta);
                            const haceUnaSemana = new Date();
                            haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);
                            if (fechaPrimera > haceUnaSemana) {
                                esNuevo = true; // Primera venta fue hace menos de una semana
                            }
                        }

                        if (esNuevo) {
                            return resolve({
                                cliente,
                                isRegistered: true,
                                isNew: true,
                                limite: cupoBaseNuevo,
                                motivo: "Cliente nuevo (menos de 7 días de consumo). Se asigna cupo base inicial."
                            });
                        }

                        // 4. Calcular promedio semanal (últimos 28 días)
                        const queryVentasRecientes = `
                            SELECT COALESCE(SUM(cantidad), 0) as total28Dias 
                            FROM venta 
                            WHERE cliente_id = ? AND fechaHora >= datetime('now', '-28 days')
                        `;
                        db.get(queryVentasRecientes, [cliente.id], (err, rowVentas) => {
                            if (err) return reject(err);

                            const total28Dias = rowVentas ? rowVentas.total28Dias : 0;
                            const promedioSemanal = total28Dias / 4;
                            const holgura = promedioSemanal * factorHolgura;
                            const limiteCalculado = promedioSemanal + holgura;

                            return resolve({
                                cliente,
                                isRegistered: true,
                                isNew: false,
                                promedioSemanal: parseFloat(promedioSemanal.toFixed(2)),
                                total28Dias: parseFloat(total28Dias.toFixed(2)),
                                factorHolgura: factorHolgura,
                                holguraExplicada: parseFloat(holgura.toFixed(2)),
                                limite: parseFloat(limiteCalculado.toFixed(2)),
                                motivo: "Límite calculado en base al consumo promedio de los últimos 28 días + holgura."
                            });
                        });
                    });
                });
            });
        });
    }

    // Endpoint GET para calcular el cupo de un cliente
    static async calcularCupoCliente(req, res) {
        try {
            const { identificador } = req.params;
            const resultado = await VentaController.helperCalcularCupo(req.db, identificador);
            res.json(resultado);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Endpoint POST para procesar una venta controlada
    static async procesarVenta(req, res) {
        const { placa, ciNit, nombreRazonSocial, tipoCliente, tanque_id, cantidad } = req.body;
        const db = req.db;

        if (!placa || !ciNit || !tanque_id || !cantidad) {
            return res.status(400).json({ error: "Faltan campos obligatorios (placa, ciNit, tanque_id, cantidad)" });
        }

        db.serialize(async () => {
            try {
                // 1. Obtener o crear el cliente (Auto-registro si no existe)
                let cliente = await new Promise((resolve, reject) => {
                    db.get(`SELECT * FROM cliente WHERE UPPER(placa) = UPPER(?) OR ciNit = ?`, [placa, ciNit], (err, row) => {
                        if (err) return reject(err);
                        resolve(row);
                    });
                });

                if (!cliente) {
                    // Auto-registrar cliente
                    cliente = await new Promise((resolve, reject) => {
                        const insertCliente = `
                            INSERT INTO cliente (ciNit, nombreRazonSocial, placa, tipoCliente, estado)
                            VALUES (?, ?, ?, ?, 'Activo')
                        `;
                        db.run(insertCliente, [
                            ciNit,
                            nombreRazonSocial || 'Cliente Auto-registrado',
                            placa.toUpperCase(),
                            tipoCliente || 'Particular'
                        ], function(err) {
                            if (err) return reject(err);
                            
                            db.get(`SELECT * FROM cliente WHERE id = ?`, [this.lastID], (err, newClient) => {
                                if (err) return reject(err);
                                resolve(newClient);
                            });
                        });
                    });
                    console.log(`Cliente auto-registrado con éxito: ID ${cliente.id}, Placa ${placa}`);
                    req.io.emit('clientes_updated');
                } else if (cliente.estado === 'Suspendido') {
                    return res.status(400).json({ error: "El cliente está suspendido y no puede realizar compras." });
                }

                // 2. Calcular cupo actual del cliente
                const cupoInfo = await VentaController.helperCalcularCupo(db, cliente.placa);
                const limite = cupoInfo.limite;

                // 3. Validar cupo disponible
                let cantidadAprobada = Number(cantidad);
                let fueLimitado = false;

                if (cantidadAprobada > limite) {
                    // "Si la cantidad supera el promedio semanal, el sistema bloquea la transacción... realizando la venta tan solo con el límite permitido"
                    cantidadAprobada = limite;
                    fueLimitado = true;
                }

                if (cantidadAprobada <= 0) {
                    return res.status(400).json({ 
                        error: "El cliente ha alcanzado su límite de compra para esta semana (Cupo: 0L)." 
                    });
                }

                // 4. Verificar stock del tanque seleccionado
                const tanque = await new Promise((resolve, reject) => {
                    const queryTanque = `
                        SELECT t.*, 
                            (COALESCE((SELECT SUM(cantidad) FROM ingreso WHERE tanque_id = t.id), 0) - 
                             COALESCE((SELECT SUM(cantidad) FROM venta WHERE tanque_id = t.id), 0)) as stockActual
                        FROM tanque t
                        WHERE t.id = ?
                    `;
                    db.get(queryTanque, [tanque_id], (err, row) => {
                        if (err) return reject(err);
                        resolve(row);
                    });
                });

                if (!tanque) {
                    return res.status(404).json({ error: "Tanque no encontrado" });
                }

                if (tanque.stockActual < cantidadAprobada) {
                    return res.status(400).json({ 
                        error: `Stock insuficiente en el tanque. Disponible: ${tanque.stockActual}L, Solicitado: ${cantidadAprobada}L.` 
                    });
                }

                // 5. Calcular precio aproximado (ejemplo: 3.74 Bs/Litro para Gasolina, 3.72 Bs/Litro para Diésel)
                const precioPorLitro = tanque.tipoCarburante === 'Gasolina' ? 3.74 : 3.72;
                const precioTotal = parseFloat((cantidadAprobada * precioPorLitro).toFixed(2));

                // 6. Registrar la venta
                const insertVenta = `
                    INSERT INTO venta (tanque_id, cliente_id, cantidad, precioTotal, fechaHora)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                `;
                
                db.run(insertVenta, [tanque_id, cliente.id, cantidadAprobada, precioTotal], function(err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    // Emitir eventos por Socket.io
                    req.io.emit('ventas_updated');
                    req.io.emit('tanques_updated');

                    res.status(201).json({
                        id: this.lastID,
                        cliente_id: cliente.id,
                        cliente_nombre: cliente.nombreRazonSocial,
                        cliente_placa: cliente.placa,
                        cliente_ci: cliente.ciNit,
                        tanque_id,
                        tipoCarburante: tanque.tipoCarburante,
                        cantidadOriginalSolicitada: Number(cantidad),
                        cantidadDespachada: cantidadAprobada,
                        fueLimitado,
                        limiteSemanal: limite,
                        precioTotal,
                        fechaHora: new Date().toISOString()
                    });
                });

            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
}

module.exports = VentaController;
