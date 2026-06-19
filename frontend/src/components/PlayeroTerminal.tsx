import React, { useState } from 'react';
import { 
  Fuel, 
  Search, 
  User, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle,
  Clock,
  ChevronRight,
  Info,
  Printer
} from 'lucide-react';
import { api } from '../api';
import type { Tanque, CupoInfo, Empresa } from '../api';

interface PlayeroTerminalProps {
  empresa: Empresa | null;
  tanques: Tanque[];
  onRefresh: () => void;
}

export const PlayeroTerminal: React.FC<PlayeroTerminalProps> = ({ empresa, tanques, onRefresh }) => {
  const [identificador, setIdentificador] = useState('');
  const [loadingCupo, setLoadingCupo] = useState(false);
  const [cupoInfo, setCupoInfo] = useState<CupoInfo | null>(null);
  const [cupoError, setCupoError] = useState('');

  // Form de venta
  const [selectedTanqueId, setSelectedTanqueId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [tipoNuevo, setTipoNuevo] = useState('Particular');
  const [procesando, setProcesando] = useState(false);
  const [ventaError, setVentaError] = useState('');
  
  // Recibo
  const [receipt, setReceipt] = useState<any | null>(null);

  // Tanque seleccionado actualmente
  const activeTank = tanques.find(t => t.id === Number(selectedTanqueId));

  const handleSearchCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificador.trim()) return;

    setLoadingCupo(true);
    setCupoInfo(null);
    setCupoError('');
    setVentaError('');
    setReceipt(null);

    try {
      const res = await api.get(`/ventas/cupo/${identificador.trim()}`);
      setCupoInfo(res.data);
      
      // Auto-seleccionar primer tanque si hay tanques disponibles
      if (tanques.length > 0 && !selectedTanqueId) {
        setSelectedTanqueId(String(tanques[0].id));
      }
      
      // Si el cliente no está registrado, rellenar sugerencias
      if (!res.data.isRegistered) {
        setNombreNuevo('Cliente Nuevo');
      }
    } catch (err: any) {
      setCupoError(err.response?.data?.error || 'Error al buscar el cliente.');
    } finally {
      setLoadingCupo(false);
    }
  };

  const handleProcesarDespacho = async (e: React.FormEvent) => {
    e.preventDefault();
    setVentaError('');

    if (!cupoInfo) return;
    if (!selectedTanqueId || !cantidad) {
      setVentaError('Por favor seleccione tanque e ingrese la cantidad.');
      return;
    }

    const liters = Number(cantidad);
    if (isNaN(liters) || liters <= 0) {
      setVentaError('Ingrese una cantidad válida mayor a 0.');
      return;
    }

    if (activeTank && activeTank.stockActual < liters && activeTank.stockActual < cupoInfo.limite) {
      setVentaError('El stock actual en el tanque es inferior al volumen solicitado.');
      return;
    }

    setProcesando(true);
    try {
      // Si el cliente no está registrado, pasamos los datos para auto-registro
      const payload = {
        placa: cupoInfo.cliente?.placa || (identificador.includes('-') ? identificador.toUpperCase() : `PL-${identificador.toUpperCase()}`),
        ciNit: cupoInfo.cliente?.ciNit || (identificador.includes('-') ? `CI-${identificador}` : identificador),
        nombreRazonSocial: cupoInfo.cliente?.nombreRazonSocial || nombreNuevo || 'Cliente Particular',
        tipoCliente: cupoInfo.cliente?.tipoCliente || tipoNuevo,
        tanque_id: Number(selectedTanqueId),
        cantidad: liters
      };

      const res = await api.post('/ventas/procesar', payload);
      setReceipt(res.data);
      
      // Limpiar terminal y refrescar datos globales
      setIdentificador('');
      setCupoInfo(null);
      setCantidad('');
      onRefresh();
    } catch (err: any) {
      setVentaError(err.response?.data?.error || 'Error al procesar el despacho.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
          <Fuel size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold">Terminal POS del Playero</h2>
          <p className="text-slate-400 text-sm">Control e ingreso de transacciones en la bomba de despacho.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel de Búsqueda (1/3) */}
        <div className="glass-card p-6 md:col-span-1 h-fit">
          <h3 className="text-base font-semibold font-display mb-4 text-white">Identificación del Vehículo</h3>
          <form onSubmit={handleSearchCliente} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Placa o Cédula de Identidad</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  placeholder="Ej. 3456-ABC o 1234567"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 uppercase"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loadingCupo || !identificador.trim()}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingCupo ? 'Buscando...' : 'Consultar Cliente'}
              <ChevronRight size={16} />
            </button>
          </form>

          {cupoError && (
            <div className="mt-4 p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              <span>{cupoError}</span>
            </div>
          )}

          {/* Información rápida */}
          <div className="mt-6 border-t border-slate-800/80 pt-4 text-xs text-slate-400 space-y-2">
            <h4 className="font-semibold text-slate-300 mb-2 flex items-center gap-1">
              <Info size={14} className="text-emerald-400" />
              Instrucciones de Uso
            </h4>
            <p>1. Ingrese la placa (Ej: 3456-ABC) o documento para consultar el cupo restante semanal.</p>
            <p>2. Si el cliente no existe, el sistema habilitará su registro automático con el cupo base de nuevo cliente.</p>
          </div>
        </div>

        {/* Panel de Despacho y Cupo (2/3) */}
        <div className="md:col-span-2 space-y-6">
          {cupoInfo ? (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Información del Cliente & Cupo */}
              <div className="glass-card p-6 bg-slate-900/40 border-slate-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-800 rounded-xl text-slate-300 border border-white/5">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white leading-tight">
                        {cupoInfo.isRegistered ? cupoInfo.cliente?.nombreRazonSocial : 'Cliente Nuevo (Sin registrar)'}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 rounded uppercase">
                          Placa: {cupoInfo.cliente?.placa || identificador.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 rounded">
                          CI: {cupoInfo.cliente?.ciNit || identificador}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Estado de Cupo</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-block border mt-1 ${
                      cupoInfo.cliente?.estado === 'Suspendido'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {cupoInfo.cliente?.estado === 'Suspendido' ? 'Bloqueado / Suspendido' : 'Habilitado'}
                    </span>
                  </div>
                </div>

                {/* Cupo semanal */}
                {cupoInfo.cliente?.estado === 'Suspendido' ? (
                  <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                    <div>
                      <h5 className="font-bold">Cliente Suspendido</h5>
                      <p className="text-xs text-red-400/90 mt-0.5">
                        Este cliente se encuentra suspendido de la plataforma administrativa y no tiene cupo habilitado para transacciones de carburante.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                    {/* Visual de litros */}
                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-center">
                      <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">Cupo Máximo Semanal</span>
                      <span className="text-4xl font-display font-extrabold text-emerald-400 mt-1 block">
                        {cupoInfo.limite.toFixed(2)} <span className="text-lg font-normal text-slate-300">Litros</span>
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1.5 block">Incluye holgura del factor actual</span>
                    </div>

                    {/* Detalle del cálculo */}
                    <div className="text-xs text-slate-300 space-y-2 border-l border-slate-800/80 pl-6 h-full flex flex-col justify-center">
                      <h5 className="font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Clock size={12} className="text-emerald-400" />
                        Lógica de Cupos Aplicada
                      </h5>
                      <p>{cupoInfo.motivo}</p>
                      {!cupoInfo.isNew && (
                        <div className="border-t border-slate-800/80 pt-2 mt-2 space-y-1 text-slate-400">
                          <p>Consumo total 28 días: <strong className="text-white">{cupoInfo.total28Dias?.toFixed(1)} L</strong></p>
                          <p>Promedio semanal (P_s): <strong className="text-white">{cupoInfo.promedioSemanal?.toFixed(2)} L</strong></p>
                          <p>Margen de Holgura (+{(cupoInfo.factorHolgura || 0.1) * 100}%): <strong className="text-white">+{cupoInfo.holguraExplicada?.toFixed(2)} L</strong></p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Formulario de Venta (sólo si no está suspendido) */}
              {cupoInfo.cliente?.estado !== 'Suspendido' && (
                <div className="glass-card p-6 border-slate-800">
                  <h4 className="text-base font-semibold font-display mb-4 text-white flex items-center gap-2">
                    <Fuel size={18} className="text-emerald-400" />
                    Registrar Despacho de Combustible
                  </h4>

                  {ventaError && (
                    <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-start gap-2">
                      <AlertCircle className="shrink-0 mt-0.5" size={16} />
                      <span>{ventaError}</span>
                    </div>
                  )}

                  <form onSubmit={handleProcesarDespacho} className="space-y-4">
                    {/* Si el cliente es nuevo y no está registrado en DB, pedimos sus datos opcionales */}
                    {!cupoInfo.isRegistered && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950/50 rounded-xl border border-white/5 mb-4">
                        <div className="sm:col-span-2">
                          <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider mb-2">
                            ⚠️ Auto-registro de Nuevo Cliente
                          </span>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre Razón Social</label>
                          <input
                            type="text"
                            value={nombreNuevo}
                            onChange={(e) => setNombreNuevo(e.target.value)}
                            placeholder="Nombre del Cliente"
                            required
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Tipo de Cliente</label>
                          <select
                            value={tipoNuevo}
                            onChange={(e) => setTipoNuevo(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                          >
                            <option value="Particular">Particular</option>
                            <option value="Transporte Público">Transporte Público</option>
                            <option value="Empresa">Empresa</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Selección Tanque */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tanque / Carburante</label>
                        <select
                          value={selectedTanqueId}
                          onChange={(e) => setSelectedTanqueId(e.target.value)}
                          required
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        >
                          {tanques.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.identificador} - (Stock: {t.stockActual.toLocaleString('es-BO')} L)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Cantidad litros */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Litros a Despachar</label>
                        <input
                          type="number"
                          step="any"
                          value={cantidad}
                          onChange={(e) => setCantidad(e.target.value)}
                          placeholder="Ingrese litros..."
                          required
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Alertas dinámicas en el POS */}
                    {cantidad && Number(cantidad) > cupoInfo.limite && (
                      <div className="p-3 bg-amber-950/40 border border-amber-500/20 text-amber-300 text-xs rounded-xl flex items-start gap-2">
                        <AlertTriangle className="shrink-0 mt-0.5 text-amber-400" size={16} />
                        <div>
                          <strong>Excede cupo semanal.</strong> El sistema bloqueará el excedente y despachará únicamente <strong>{cupoInfo.limite.toFixed(2)} L</strong> (el límite permitido).
                        </div>
                      </div>
                    )}

                    {cantidad && activeTank && activeTank.stockActual < Number(cantidad) && (
                      <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-start gap-2">
                        <AlertCircle className="shrink-0 mt-0.5 text-red-400" size={16} />
                        <div>
                          <strong>Stock Insuficiente en Depósito.</strong> El tanque seleccionado posee únicamente <strong>{activeTank.stockActual.toLocaleString('es-BO')} L</strong> disponibles. No se puede despachar {cantidad} L.
                        </div>
                      </div>
                    )}

                    {/* Previsualización del costo */}
                    {cantidad && Number(cantidad) > 0 && activeTank && (
                      <div className="p-4 bg-slate-950/60 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-slate-400">Precio unitario aproximado:</span>
                        <div className="text-right">
                          <span className="text-slate-300 block font-semibold">
                            {activeTank.tipoCarburante === 'Gasolina' ? '3.74' : '3.72'} Bs / Litro
                          </span>
                          <span className="text-sm font-bold text-emerald-400 font-display block mt-0.5">
                            Costo estimado: {(Math.min(Number(cantidad), cupoInfo.limite) * (activeTank.tipoCarburante === 'Gasolina' ? 3.74 : 3.72)).toFixed(2)} Bs
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Botón Procesar */}
                    <button
                      type="submit"
                      disabled={
                        procesando || 
                        !cantidad || 
                        (activeTank && activeTank.stockActual < Math.min(Number(cantidad), cupoInfo.limite))
                      }
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-900 font-bold rounded-xl text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                    >
                      {procesando ? 'Procesando despacho...' : 'Autorizar y Despachar'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-12 text-center text-slate-500 flex flex-col items-center justify-center">
              <Fuel size={48} className="text-slate-600 mb-4" />
              <h4 className="text-base font-semibold text-slate-400 font-display">Bomba de Despacho en Espera</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mx-auto">
                Ingrese una placa o CI del cliente en el panel lateral para iniciar las validaciones del cupo dinámico y autorizar el despacho.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recibo / Comprobante de venta (Overlay Modal) */}
      {receipt && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden animate-fadeIn">
            {/* Elemento estético */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <h3 className="text-xl font-display font-extrabold text-white text-center mb-6 flex items-center justify-center gap-2">
              <CheckCircle className="text-emerald-400" size={24} />
              Comprobante de Venta
            </h3>

            {/* Recibo Premium */}
            <div className="bg-slate-950 border border-white/5 rounded-xl p-5 space-y-4 font-mono text-xs text-slate-300 relative">
              <div className="text-center border-b border-slate-800 pb-3">
                <h4 className="font-bold text-white text-sm">{empresa?.nombre || 'ErAra Petrol'}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">NIT: {empresa?.nit || '---'} | {empresa?.ciudad || 'Bolivia'}</p>
                <p className="text-[10px] text-slate-500">{empresa?.direccion || ''}</p>
              </div>

              <div className="space-y-1">
                <p className="flex justify-between"><span>Nro Transacción:</span> <span className="text-white font-bold">#{receipt.id}</span></p>
                <p className="flex justify-between"><span>Fecha/Hora:</span> <span className="text-white">{new Date(receipt.fechaHora).toLocaleString('es-BO')}</span></p>
              </div>

              <div className="border-t border-b border-slate-800/80 py-3 my-2 space-y-1">
                <p className="flex justify-between"><span>Cliente:</span> <span className="text-white max-w-[200px] text-right truncate">{receipt.cliente_nombre}</span></p>
                <p className="flex justify-between"><span>CI/NIT:</span> <span className="text-white">{receipt.cliente_ci}</span></p>
                <p className="flex justify-between"><span>Placa Vehículo:</span> <span className="text-white font-bold">{receipt.cliente_placa}</span></p>
              </div>

              <div className="space-y-1">
                <p className="flex justify-between"><span>Carburante:</span> <span className="text-white">{receipt.tipoCarburante}</span></p>
                
                {receipt.fueLimitado ? (
                  <>
                    <p className="flex justify-between text-amber-400 font-semibold">
                      <span>Solicitado:</span> <span>{receipt.cantidadOriginalSolicitada.toFixed(2)} L</span>
                    </p>
                    <p className="flex justify-between text-emerald-400 font-bold">
                      <span>Despachado (Cupo):</span> <span>{receipt.cantidadDespachada.toFixed(2)} L</span>
                    </p>
                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 rounded font-sans mt-2 leading-relaxed">
                      ⚠️ La cantidad superó el cupo promedio semanal permitido del cliente ({receipt.limiteSemanal.toFixed(2)} L). La venta fue limitada al cupo.
                    </div>
                  </>
                ) : (
                  <p className="flex justify-between text-emerald-400 font-bold">
                    <span>Despachado:</span> <span>{receipt.cantidadDespachada.toFixed(2)} L</span>
                  </p>
                )}
                
                <p className="flex justify-between border-t border-dashed border-slate-800 pt-3 text-sm font-bold text-white">
                  <span>TOTAL A PAGAR:</span> <span className="text-emerald-400">{receipt.precioTotal.toFixed(2)} Bs</span>
                </p>
              </div>

              <div className="text-center text-[10px] text-slate-500 border-t border-slate-800/80 pt-3">
                <p>GRACIAS POR SU COMPRA</p>
                <p className="mt-1 text-[8px] text-emerald-500/70">REGISTRO DE BASE DE DATOS SQLITE EXITOSO</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer size={16} />
                Imprimir
              </button>
              <button
                onClick={() => setReceipt(null)}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded-xl text-xs flex items-center justify-center cursor-pointer"
              >
                Cerrar / Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
