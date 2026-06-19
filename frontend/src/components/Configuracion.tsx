import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, AlertCircle, Info, Calculator, FileText } from 'lucide-react';
import { Empresa, api } from '../api';

interface ConfiguracionProps {
  empresa: Empresa | null;
  onRefresh: () => void;
}

export const Configuracion: React.FC<ConfiguracionProps> = ({ empresa, onRefresh }) => {
  const [nombre, setNombre] = useState('');
  const [nit, setNit] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [contacto, setContacto] = useState('');
  const [alertStockMinimo, setAlertStockMinimo] = useState('0.15');
  const [factorHolgura, setFactorHolgura] = useState('0.10');
  const [cupoBaseNuevo, setCupoBaseNuevo] = useState('120');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Sincronizar estados locales con los props iniciales
  useEffect(() => {
    if (empresa) {
      setNombre(empresa.nombre);
      setNit(empresa.nit);
      setDireccion(empresa.direccion);
      setCiudad(empresa.ciudad);
      setContacto(empresa.contacto);
      setAlertStockMinimo(String(empresa.alertStockMinimo));
      setFactorHolgura(String(empresa.factorHolgura));
      setCupoBaseNuevo(String(empresa.cupoBaseNuevo));
    }
  }, [empresa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      await api.put('/empresa', {
        nombre,
        nit,
        direccion,
        ciudad,
        contacto,
        alertStockMinimo: Number(alertStockMinimo),
        factorHolgura: Number(factorHolgura),
        cupoBaseNuevo: Number(cupoBaseNuevo)
      });
      
      setSuccess(true);
      onRefresh();
      
      // Auto-ocultar mensaje de éxito
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar la configuración.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold">Configuración de la Empresa</h2>
          <p className="text-slate-400 text-sm">Parámetros globales y controles de la estación de servicio.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulario (2/3) */}
        <div className="glass-card p-6 md:col-span-2 space-y-6">
          <h3 className="text-base font-semibold font-display mb-4 text-white flex items-center gap-2">
            <FileText size={18} className="text-emerald-400" />
            Parámetros y Datos Globales
          </h3>

          {success && (
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-sm rounded-xl flex items-center gap-2 animate-fadeIn">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span>Configuración guardada correctamente. ¡Parámetros aplicados!</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-950/40 border border-red-500/30 text-red-300 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle size={18} className="text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nombre de la Estación</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. ErAra Petrol"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">NIT / Identificación Tributaria</label>
                <input
                  type="text"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  placeholder="Ej. 10283742023"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Dirección Física</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej. Av. Blanco Galindo Km 4.5"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ciudad</label>
                <input
                  type="text"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Ej. Cochabamba"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Datos de Contacto</label>
                <input
                  type="text"
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  placeholder="Ej. Tel: 44123456 - info@erara.com"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="border-t border-slate-800/80 my-6 pt-6">
              <h4 className="text-sm font-semibold font-display text-white mb-4">Parámetros de Control (Críticos)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Factor Holgura */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Holgura Promedio</label>
                  <select
                    value={factorHolgura}
                    onChange={(e) => setFactorHolgura(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="0.05">5% adicional</option>
                    <option value="0.10">10% adicional</option>
                    <option value="0.15">15% adicional</option>
                    <option value="0.20">20% adicional</option>
                  </select>
                </div>

                {/* Stock Mínimo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Alerta Stock Mínimo</label>
                  <select
                    value={alertStockMinimo}
                    onChange={(e) => setAlertStockMinimo(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="0.10">10% de capacidad</option>
                    <option value="0.15">15% de capacidad</option>
                    <option value="0.20">20% de capacidad</option>
                    <option value="0.25">25% de capacidad</option>
                  </select>
                </div>

                {/* Cupo Base Nuevo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Cupo Cliente Nuevo</label>
                  <input
                    type="number"
                    step="any"
                    value={cupoBaseNuevo}
                    onChange={(e) => setCupoBaseNuevo(e.target.value)}
                    placeholder="Litros semanales..."
                    required
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded-xl text-sm transition-all cursor-pointer disabled:opacity-50 mt-4 flex items-center justify-center"
            >
              {loading ? 'Guardando cambios...' : 'Guardar y Aplicar Configuración'}
            </button>
          </form>
        </div>

        {/* Panel Explicativo (1/3) */}
        <div className="glass-card p-6 md:col-span-1 space-y-6 h-fit text-xs leading-relaxed text-slate-300">
          <h3 className="text-base font-semibold font-display text-white flex items-center gap-2">
            <Calculator size={18} className="text-emerald-400" />
            Regla de Negocio
          </h3>
          
          <div className="space-y-4">
            <p>
              Para mitigar el sobreabastecimiento, el sistema calcula un límite de compra semanal basado en el promedio de consumo histórico.
            </p>

            <div className="bg-slate-950 p-4 border border-white/5 rounded-xl font-mono text-center space-y-2">
              <span className="text-[10px] text-slate-400 block font-sans uppercase">Fórmula de Cupo</span>
              <div className="text-white font-bold text-sm">
                P_s = Total Litros (28 días) / 4
              </div>
              <div className="text-emerald-400 font-bold text-sm">
                Límite = P_s * (1 + Holgura)
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white flex items-center gap-1">
                <Info size={12} className="text-emerald-400" />
                Clientes Nuevos
              </h4>
              <p>
                Si un cliente posee un historial inferior a una semana (7 días transcurridos desde su primer consumo registrado), el promedio no es representativo.
              </p>
              <p>
                En este escenario, el sistema aplica automáticamente la excepción y le asigna el <strong>Cupo Cliente Nuevo</strong> parametrizado (actualmente: {cupoBaseNuevo} Litros).
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white flex items-center gap-1">
                <AlertCircle size={12} className="text-emerald-400" />
                Control de Excesos
              </h4>
              <p>
                Si la cantidad ingresada por el playero excede el límite permitido, el sistema no rechaza la venta completa, sino que la <strong>trunca y despacha la cantidad exacta del límite permitido</strong>, imprimiendo una advertencia en el comprobante de pago.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
