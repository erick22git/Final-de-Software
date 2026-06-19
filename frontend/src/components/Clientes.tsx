import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  Plus,
  Car
} from 'lucide-react';
import { Cliente, api } from '../api';

interface ClientesProps {
  clientes: Cliente[];
  onRefresh: () => void;
}

export const Clientes: React.FC<ClientesProps> = ({ clientes, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterState, setFilterState] = useState('');
  
  // States for manual creation form
  const [showAddForm, setShowAddForm] = useState(false);
  const [ciNit, setCiNit] = useState('');
  const [nombre, setNombre] = useState('');
  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState('Particular');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!ciNit || !nombre || !placa) {
      setError('Cédula de Identidad, Nombre Completo y Placa son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/clientes', {
        ciNit,
        nombreRazonSocial: nombre,
        placa: placa.toUpperCase(),
        tipoCliente: tipo,
        estado: 'Activo'
      });

      // Limpiar y refrescar
      setCiNit('');
      setNombre('');
      setPlaca('');
      setTipo('Particular');
      setShowAddForm(false);
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar el cliente. Verifique que el CI/NIT o Placa no existan ya.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEstado = async (id: number, estadoActual: 'Activo' | 'Suspendido') => {
    const nuevoEstado = estadoActual === 'Activo' ? 'Suspendido' : 'Activo';
    try {
      await api.put(`/clientes/${id}/estado`, { estado: nuevoEstado });
      onRefresh();
    } catch (err) {
      alert('Error al cambiar el estado del cliente.');
    }
  };

  // Filtrado de clientes en frontend
  const filteredClientes = clientes.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchSearch = c.nombreRazonSocial.toLowerCase().includes(term) || 
                        c.ciNit.includes(term) || 
                        c.placa.toLowerCase().includes(term);
    
    const matchType = filterType === '' || c.tipoCliente === filterType;
    const matchState = filterState === '' || c.estado === filterState;

    return matchSearch && matchType && matchState;
  });

  return (
    <div className="space-y-8">
      {/* Encabezado y Acción */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Registro de Clientes</h2>
          <p className="text-slate-400 text-sm mt-0.5">Control de padrón de clientes habilitados para la compra controlada.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-900 font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
        >
          <UserPlus size={18} />
          {showAddForm ? 'Cerrar Formulario' : 'Registrar Cliente'}
        </button>
      </div>

      {/* Formulario de Creación */}
      {showAddForm && (
        <div className="glass-card p-6 border-emerald-500/20 bg-slate-900/60 max-w-2xl animate-fadeIn">
          <h3 className="text-lg font-semibold font-display mb-4 text-white">Nuevo Registro de Cliente</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreateCliente} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Cédula de Identidad / NIT</label>
              <input
                type="text"
                value={ciNit}
                onChange={(e) => setCiNit(e.target.value)}
                placeholder="Ej. 1234567"
                required
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nombre Completo / Razón Social</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Carlos Perez"
                required
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Placa del Vehículo (Control Obligatorio)</label>
              <input
                type="text"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                placeholder="Ej. 3456-ABC"
                required
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tipo de Cliente</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Particular">Particular</option>
                <option value="Transporte Público">Transporte Público</option>
                <option value="Empresa">Empresa</option>
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold text-xs rounded-xl cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Registro'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="glass-card p-4 flex flex-col md:flex-row md:items-center gap-4">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nombre, Placa o CI/NIT..."
            className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Filtro Tipo */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none"
        >
          <option value="">Todos los Tipos</option>
          <option value="Particular">Particular</option>
          <option value="Transporte Público">Transporte Público</option>
          <option value="Empresa">Empresa</option>
        </select>

        {/* Filtro Estado */}
        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none"
        >
          <option value="">Todos los Estados</option>
          <option value="Activo">Activo</option>
          <option value="Suspendido">Suspendido</option>
        </select>
      </div>

      {/* Tabla de Clientes */}
      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">CI / NIT</th>
                <th className="py-3 px-4">Nombre / Razón Social</th>
                <th className="py-3 px-4">Placa de Vehículo</th>
                <th className="py-3 px-4">Tipo Cliente</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {filteredClientes.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/10 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-300">{c.ciNit}</td>
                  <td className="py-3 px-4 font-medium text-white">{c.nombreRazonSocial}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-white flex items-center gap-1.5 w-max">
                      <Car size={12} className="text-slate-400" />
                      {c.placa}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{c.tipoCliente}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold inline-block border ${
                      c.estado === 'Activo' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleEstado(c.id, c.estado)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 mx-auto ${
                        c.estado === 'Activo'
                          ? 'border border-red-500/20 text-red-400 hover:bg-red-500/10'
                          : 'border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      {c.estado === 'Activo' ? (
                        <>
                          <ShieldAlert size={14} />
                          Suspender
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={14} />
                          Habilitar
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClientes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No se encontraron clientes que coincidan con la búsqueda.
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
