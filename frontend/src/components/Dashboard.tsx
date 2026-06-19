import React from 'react';
import { 
  Fuel, 
  Users, 
  TrendingUp, 
  Settings, 
  AlertTriangle, 
  Droplet, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck
} from 'lucide-react';
import type { Empresa, Tanque, Cliente, Venta } from '../api';

interface DashboardProps {
  empresa: Empresa | null;
  tanques: Tanque[];
  clientes: Cliente[];
  ventas: Venta[];
  setTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ empresa, tanques, clientes, ventas, setTab }) => {
  // Calcular estadísticas rápidas
  const totalClientes = clientes.length;
  const clientesSuspendidos = clientes.filter(c => c.estado === 'Suspendido').length;
  const totalVentasMonto = ventas.reduce((acc, v) => acc + v.precioTotal, 0);
  
  // Filtrar ventas de hoy
  const ventasHoy = ventas.filter(v => {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaVenta = new Date(v.fechaHora).toISOString().split('T')[0];
    return hoy === fechaVenta;
  });
  const totalLitrosHoy = ventasHoy.reduce((acc, v) => acc + v.cantidad, 0);

  // Alertas de stock crítico
  const tanquesCriticos = tanques.filter(t => {
    const alertThreshold = empresa ? empresa.alertStockMinimo : 0.15;
    return t.stockActual < (t.capacidadMaxima * alertThreshold) || t.stockActual < t.stockMinimoSeguridad;
  });

  return (
    <div className="space-y-8">
      {/* Banner de Bienvenida */}
      <div className="glass-card p-6 bg-gradient-to-r from-slate-900 to-slate-800 border-emerald-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
              Estación de Servicio Oficial
            </span>
            <h2 className="text-3xl md:text-4xl mt-2 font-display bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              {empresa?.nombre || 'ErAra Petrol'}
            </h2>
            <p className="text-slate-400 mt-1 max-w-xl text-sm md:text-base">
              Sistema de monitoreo de inventario en tanques y despacho controlado de carburantes para prevenir la especulación y sobreabastecimiento.
            </p>
          </div>
          <button 
            onClick={() => setTab('playero')}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-900 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 cursor-pointer flex items-center gap-2 self-start md:self-auto"
          >
            <Fuel size={20} />
            Terminal Playero (Vender)
          </button>
        </div>
      </div>

      {/* Alertas Críticas */}
      {tanquesCriticos.length > 0 && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-start gap-4 animate-pulse">
          <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 className="text-red-300 font-semibold font-display">¡Alerta de Stock Crítico!</h4>
            <p className="text-red-400/90 text-sm mt-1">
              Los siguientes tanques se encuentran por debajo del nivel mínimo de seguridad o del límite de alerta de la empresa ({empresa ? (empresa.alertStockMinimo * 100) : 15}%):
            </p>
            <ul className="list-disc list-inside text-sm text-red-300 mt-2 space-y-1">
              {tanquesCriticos.map(t => (
                <li key={t.id}>
                  <strong className="font-semibold">{t.identificador}</strong>: {t.stockActual.toLocaleString('es-BO')} L restantes (Mín. seguridad: {t.stockMinimoSeguridad.toLocaleString('es-BO')} L)
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="glass-card p-6 flex items-center justify-between hover:scale-[1.02]">
          <div className="space-y-2">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Ventas de Hoy</span>
            <h3 className="text-3xl font-display">{totalLitrosHoy.toLocaleString('es-BO', { maximumFractionDigits: 1 })} L</h3>
            <span className="text-emerald-400 text-xs flex items-center gap-1">
              <ArrowUpRight size={14} />
              En operaciones hoy
            </span>
          </div>
          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card p-6 flex items-center justify-between hover:scale-[1.02]">
          <div className="space-y-2">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Recaudación Total</span>
            <h3 className="text-3xl font-display">{totalVentasMonto.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-semibold">Bs</span></h3>
            <span className="text-cyan-400 text-xs flex items-center gap-1">
              <ArrowUpRight size={14} />
              Total histórico
            </span>
          </div>
          <div className="p-4 bg-cyan-500/10 text-cyan-400 rounded-2xl">
            <ArrowUpRight size={24} />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card p-6 flex items-center justify-between hover:scale-[1.02]">
          <div className="space-y-2">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Clientes Habilitados</span>
            <h3 className="text-3xl font-display">{totalClientes - clientesSuspendidos} <span className="text-sm font-normal text-slate-500">/ {totalClientes}</span></h3>
            <span className="text-slate-400 text-xs flex items-center gap-1">
              <Users size={14} />
              {clientesSuspendidos} suspendidos
            </span>
          </div>
          <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl">
            <Users size={24} />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-card p-6 flex items-center justify-between hover:scale-[1.02]">
          <div className="space-y-2">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Parámetros Control</span>
            <div className="space-y-0.5 text-xs text-slate-300">
              <p>Holgura: <span className="text-emerald-400 font-semibold">{empresa ? (empresa.factorHolgura * 100) : 10}%</span></p>
              <p>Cupo Base: <span className="text-emerald-400 font-semibold">{empresa?.cupoBaseNuevo || 120} L</span></p>
            </div>
            <span className="text-emerald-400 text-xs flex items-center gap-1">
              <ShieldCheck size={14} />
              Filtro activo
            </span>
          </div>
          <div className="p-4 bg-slate-500/10 text-slate-400 rounded-2xl">
            <Settings size={24} />
          </div>
        </div>
      </div>

      {/* Niveles de Tanques */}
      <div>
        <h3 className="text-xl font-display mb-6 flex items-center gap-2">
          <Droplet className="text-emerald-400" />
          Infraestructura de Depósito: Nivel de Tanques
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tanques.map(t => {
            const pct = (t.stockActual / t.capacidadMaxima) * 100;
            const esBajo = t.stockActual < t.stockMinimoSeguridad || pct < (empresa ? empresa.alertStockMinimo * 100 : 15);
            
            return (
              <div key={t.id} className={`glass-card p-6 relative overflow-hidden ${esBajo ? 'border-red-500/25 glow-red' : 'border-slate-800'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold">{t.identificador}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border mt-1 inline-block ${
                      t.tipoCarburante === 'Gasolina' 
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                        : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                    }`}>
                      {t.tipoCarburante}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Stock Actual</span>
                    <span className="text-2xl font-bold text-white font-display">
                      {t.stockActual.toLocaleString('es-BO', { maximumFractionDigits: 1 })} <span className="text-sm">L</span>
                    </span>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-slate-800 h-6 rounded-full overflow-hidden border border-white/5 relative">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${
                      esBajo 
                        ? 'bg-gradient-to-r from-red-600 to-rose-500' 
                        : t.tipoCarburante === 'Gasolina' 
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' 
                          : 'bg-gradient-to-r from-cyan-600 to-cyan-400'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white tracking-wider drop-shadow-md">
                    {pct.toFixed(1)}% ({t.stockActual.toLocaleString('es-BO', { maximumFractionDigits: 0 })} / {t.capacidadMaxima.toLocaleString('es-BO', { maximumFractionDigits: 0 })} L)
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
                  <span>Mínimo Seguridad: <strong className="text-slate-200">{t.stockMinimoSeguridad.toLocaleString('es-BO')} L</strong></span>
                  {esBajo && (
                    <span className="text-red-400 flex items-center gap-1 font-semibold">
                      <AlertTriangle size={12} />
                      ¡Reabastecimiento requerido!
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historial Reciente de Ventas */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-display flex items-center gap-2">
            <Fuel className="text-emerald-400" />
            Últimas Ventas Controladas
          </h3>
          <button 
            onClick={() => setTab('clientes')}
            className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1"
          >
            Ver Clientes
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Fecha/Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Placa</th>
                <th className="py-3 px-4">Tipo Carburante</th>
                <th className="py-3 px-4 text-right">Litros</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {ventas.slice(0, 5).map(v => (
                <tr key={v.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(v.fechaHora).toLocaleString('es-BO')}
                  </td>
                  <td className="py-3 px-4 font-medium text-white">{v.cliente_nombre}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded font-mono">
                      {v.cliente_placa}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      v.tipoCarburante === 'Gasolina' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'
                    }`}>
                      {v.tipoCarburante}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-white">{v.cantidad.toFixed(2)} L</td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-400">{v.precioTotal.toFixed(2)} Bs</td>
                </tr>
              ))}
              {ventas.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No se han registrado ventas en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
