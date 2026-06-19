import React, { useState } from 'react';
import { 
  Droplet, 
  Plus, 
  FileText, 
  ArrowDownLeft, 
  AlertCircle,
  Truck,
  Calendar,
  X
} from 'lucide-react';
import { Tanque, Ingreso, api } from '../api';

interface TanquesProps {
  tanques: Tanque[];
  ingresos: Ingreso[];
  onRefresh: () => void;
}

export const Tanques: React.FC<TanquesProps> = ({ tanques, ingresos, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTanqueId, setSelectedTanqueId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [nroFactura, setNroFactura] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegisterIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedTanqueId || !cantidad || !nroFactura) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    const liters = Number(cantidad);
    if (isNaN(liters) || liters <= 0) {
      setError('La cantidad ingresada debe ser un número mayor a 0.');
      return;
    }

    const selectedTank = tanques.find(t => t.id === Number(selectedTanqueId));
    if (selectedTank) {
      const capacityLeft = selectedTank.capacidadMaxima - selectedTank.stockActual;
      if (liters > capacityLeft) {
        setError(`Cantidad excede la capacidad disponible del tanque. Capacidad máxima disponible: ${capacityLeft.toFixed(1)} L.`);
        return;
      }
    }

    setLoading(true);
    try {
      await api.post('/ingresos', {
        tanque_id: Number(selectedTanqueId),
        cantidad: liters,
        nroFactura: nroFactura
      });
      
      // Limpiar y refrescar
      setSelectedTanqueId('');
      setCantidad('');
      setNroFactura('');
      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar el abastecimiento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Encabezado y Acción */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Gestión de Tanques e Inventario</h2>
          <p className="text-slate-400 text-sm mt-0.5">Control de infraestructura de almacenamiento y abastecimiento de cisternas.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-900 font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
        >
          <Truck size={18} />
          Registrar Cisterna (Ingreso)
        </button>
      </div>

      {/* Grid de Tanques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tanques.map(t => {
          const pct = (t.stockActual / t.capacidadMaxima) * 100;
          const capacityLeft = t.capacidadMaxima - t.stockActual;
          const isLow = t.stockActual < t.stockMinimoSeguridad;

          return (
            <div key={t.id} className="glass-card p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${t.tipoCarburante === 'Gasolina' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                    <Droplet size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{t.identificador}</h3>
                    <span className="text-slate-400 text-xs mt-0.5 block">Depósito Virtual de {t.tipoCarburante}</span>
                  </div>
                </div>
                {isLow && (
                  <span className="px-2.5 py-1 bg-red-500/20 text-red-300 text-xs font-semibold rounded-full border border-red-500/30 flex items-center gap-1 animate-pulse">
                    <AlertCircle size={12} />
                    Bajo Nivel
                  </span>
                )}
              </div>

              {/* Animación de combustible líquida */}
              <div className="relative w-full h-40 bg-slate-900 border border-white/5 rounded-2xl overflow-hidden mb-6 flex flex-col justify-end">
                {/* Olas animadas */}
                <div 
                  className={`absolute left-0 right-0 bottom-0 transition-all duration-1000 ease-out opacity-40 ${
                    t.tipoCarburante === 'Gasolina' ? 'bg-emerald-500' : 'bg-cyan-500'
                  }`}
                  style={{ height: `${pct}%` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-4 bg-white/20 -translate-y-2 animate-pulse rounded-t-full"></div>
                </div>
                
                {/* Detalle interno */}
                <div className="relative z-10 p-4 text-center w-full flex flex-col justify-center h-full">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Volumen Almacenado</span>
                  <span className="text-3xl font-display font-extrabold text-white mt-1">
                    {t.stockActual.toLocaleString('es-BO', { maximumFractionDigits: 1 })} <span className="text-lg font-normal">Litros</span>
                  </span>
                  <span className="text-xs text-slate-300 mt-2 font-semibold bg-slate-950/50 py-1 px-3 rounded-full mx-auto backdrop-blur-sm border border-white/5">
                    {pct.toFixed(1)}% de capacidad
                  </span>
                </div>
              </div>

              {/* Fila de Capacidad */}
              <div className="grid grid-cols-3 gap-4 border-t border-slate-800 pt-4 text-xs text-slate-400">
                <div>
                  <span>Capacidad Total</span>
                  <strong className="text-white block mt-1 font-semibold text-sm">{t.capacidadMaxima.toLocaleString('es-BO')} L</strong>
                </div>
                <div>
                  <span>Espacio Libre</span>
                  <strong className="text-white block mt-1 font-semibold text-sm">{capacityLeft.toLocaleString('es-BO')} L</strong>
                </div>
                <div>
                  <span>Mínimo Seguridad</span>
                  <strong className="text-white block mt-1 font-semibold text-sm">{t.stockMinimoSeguridad.toLocaleString('es-BO')} L</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Historial de Abastecimientos */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-display mb-6 flex items-center gap-2">
          <FileText className="text-emerald-400" />
          Historial de Ingresos de Combustible
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Fecha/Hora</th>
                <th className="py-3 px-4">Tanque</th>
                <th className="py-3 px-4">Carburante</th>
                <th className="py-3 px-4">Factura Proveedor</th>
                <th className="py-3 px-4 text-right">Litros Ingresados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {ingresos.map(i => (
                <tr key={i.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(i.fechaHora).toLocaleString('es-BO')}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">{i.tanque_identificador}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      i.tipoCarburante === 'Gasolina' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'
                    }`}>
                      {i.tipoCarburante}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">{i.nroFactura}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400">
                    +{i.cantidad.toLocaleString('es-BO')} L
                  </td>
                </tr>
              ))}
              {ingresos.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No se han registrado ingresos de cisterna.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Registrar Ingreso */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-display font-bold text-white mb-2 flex items-center gap-2">
              <Truck className="text-emerald-400" />
              Abastecimiento de Tanque
            </h3>
            <p className="text-slate-400 text-xs mb-6">Registra la llegada de un camión cisterna y añade stock al tanque seleccionado.</p>

            {error && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="shrink-0" size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegisterIngreso} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tanque de Destino</label>
                <select
                  value={selectedTanqueId}
                  onChange={(e) => setSelectedTanqueId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Seleccione un tanque...</option>
                  {tanques.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.identificador} ({t.tipoCarburante}) - Disp: {(t.capacidadMaxima - t.stockActual).toLocaleString('es-BO')} L
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Volumen a Ingresar (Litros)</label>
                <input
                  type="number"
                  step="any"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="Ej. 10000"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nro Factura / Remisión del Proveedor</label>
                <input
                  type="text"
                  value={nroFactura}
                  onChange={(e) => setNroFactura(e.target.value)}
                  placeholder="Ej. FAC-12345"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold text-xs rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Registrando...' : 'Registrar Ingreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
