import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  LayoutDashboard, 
  Fuel, 
  Settings, 
  Users, 
  Droplet,
  MapPin,
  Clock
} from 'lucide-react';
import { api } from './api';
import type { Empresa, Tanque, Cliente, Ingreso, Venta } from './api';

// Componentes
import { Dashboard } from './components/Dashboard';
import { PlayeroTerminal } from './components/PlayeroTerminal';
import { Tanques } from './components/Tanques';
import { Clientes } from './components/Clientes';
import { Configuracion } from './components/Configuracion';

function App() {
  const [tab, setTab] = useState('dashboard');
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [tanques, setTanques] = useState<Tanque[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Funciones de carga
  const loadEmpresa = async () => {
    try {
      const res = await api.get('/empresa');
      setEmpresa(res.data);
    } catch (e) {
      console.error('Error al cargar empresa:', e);
    }
  };

  const loadTanques = async () => {
    try {
      const res = await api.get('/tanques');
      setTanques(res.data);
    } catch (e) {
      console.error('Error al cargar tanques:', e);
    }
  };

  const loadClientes = async () => {
    try {
      const res = await api.get('/clientes');
      setClientes(res.data);
    } catch (e) {
      console.error('Error al cargar clientes:', e);
    }
  };

  const loadIngresos = async () => {
    try {
      const res = await api.get('/ingresos');
      setIngresos(res.data);
    } catch (e) {
      console.error('Error al cargar ingresos:', e);
    }
  };

  const loadVentas = async () => {
    try {
      const res = await api.get('/ventas');
      setVentas(res.data);
    } catch (e) {
      console.error('Error al cargar ventas:', e);
    }
  };

  const refreshAll = () => {
    loadEmpresa();
    loadTanques();
    loadClientes();
    loadIngresos();
    loadVentas();
  };

  // Carga inicial y Socket.io
  useEffect(() => {
    setLoading(true);
    refreshAll();
    setLoading(false);

    // Conectar WebSocket
    const socket = io('http://localhost:3001');

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Escuchadores de eventos en tiempo real
    socket.on('config_updated', loadEmpresa);
    socket.on('tanques_updated', loadTanques);
    socket.on('clientes_updated', loadClientes);
    socket.on('ingresos_updated', () => {
      loadIngresos();
      loadTanques();
    });
    socket.on('ventas_updated', () => {
      loadVentas();
      loadTanques();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 font-semibold font-display">Iniciando ErAra Petrol...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-slate-100 font-sans">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-slate-900 border-r border-white/5 flex flex-col justify-between shrink-0 hidden md:flex">
        <div>
          {/* Logo y Encabezado */}
          <div className="p-6 border-b border-white/5">
            <h1 className="text-2xl font-display font-extrabold flex items-center gap-2 text-white">
              <span className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg">⛽</span>
              ErAra Petrol
            </h1>
            <span className="text-[10px] text-slate-500 mt-1 block uppercase font-mono tracking-wider">
              Control de Carburantes
            </span>
          </div>

          {/* Menú de Navegación */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                tab === 'dashboard'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard size={18} />
              Panel de Control
            </button>

            <button
              onClick={() => setTab('playero')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                tab === 'playero'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Fuel size={18} />
              Terminal Playero
            </button>

            <button
              onClick={() => setTab('tanques')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                tab === 'tanques'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Droplet size={18} />
              Tanques e Ingresos
            </button>

            <button
              onClick={() => setTab('clientes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                tab === 'clientes'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users size={18} />
              Clientes
            </button>

            <button
              onClick={() => setTab('config')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                tab === 'config'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings size={18} />
              Configuración
            </button>
          </nav>
        </div>

        {/* Info Servidor / Estado */}
        <div className="p-4 border-t border-white/5 text-xs text-slate-500 space-y-2">
          <div className="flex items-center justify-between">
            <span>Conexión Server</span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-400">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              {isConnected ? 'Activo' : 'Offline'}
            </span>
          </div>
          <p className="text-[10px]">Cochabamba, BO</p>
        </div>
      </aside>

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Barra superior */}
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3 md:hidden">
            <span className="p-1 bg-emerald-500 text-slate-950 rounded font-bold text-sm">⛽</span>
            <span className="font-display font-extrabold text-white">ErAra Petrol</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="hidden sm:flex items-center gap-1.5">
              <MapPin size={14} className="text-emerald-500" />
              {empresa?.ciudad}, {empresa?.direccion}
            </span>
            <span className="w-px h-4 bg-slate-800 hidden sm:block"></span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-emerald-500" />
              {new Date().toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
        </header>

        {/* Contenido Dinámico */}
        <main className="p-6 md:p-8 flex-1">
          {tab === 'dashboard' && (
            <Dashboard 
              empresa={empresa} 
              tanques={tanques} 
              clientes={clientes} 
              ventas={ventas} 
              setTab={setTab} 
            />
          )}

          {tab === 'playero' && (
            <PlayeroTerminal
              empresa={empresa}
              tanques={tanques}
              onRefresh={refreshAll}
            />
          )}

          {tab === 'tanques' && (
            <Tanques 
              tanques={tanques} 
              ingresos={ingresos} 
              onRefresh={refreshAll} 
            />
          )}

          {tab === 'clientes' && (
            <Clientes 
              clientes={clientes} 
              onRefresh={refreshAll} 
            />
          )}

          {tab === 'config' && (
            <Configuracion 
              empresa={empresa} 
              onRefresh={refreshAll} 
            />
          )}
        </main>

        {/* Footer */}
        <footer className="h-14 border-t border-white/5 px-6 flex items-center justify-between text-xs text-slate-500 bg-slate-900/10">
          <span>&copy; {new Date().getFullYear()} ErAra Petrol - Ingeniería de Software</span>
          <span className="font-mono">SQLite + Express + React 19</span>
        </footer>
      </div>

      {/* Navegación Móvil (Tab Bar) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950 border-t border-white/10 flex items-center justify-around z-40 px-4">
        <button onClick={() => setTab('dashboard')} className={`flex flex-col items-center gap-1 cursor-pointer ${tab === 'dashboard' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px]">Dashboard</span>
        </button>
        <button onClick={() => setTab('playero')} className={`flex flex-col items-center gap-1 cursor-pointer ${tab === 'playero' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <Fuel size={20} />
          <span className="text-[10px]">Despacho</span>
        </button>
        <button onClick={() => setTab('tanques')} className={`flex flex-col items-center gap-1 cursor-pointer ${tab === 'tanques' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <Droplet size={20} />
          <span className="text-[10px]">Tanques</span>
        </button>
        <button onClick={() => setTab('clientes')} className={`flex flex-col items-center gap-1 cursor-pointer ${tab === 'clientes' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <Users size={20} />
          <span className="text-[10px]">Clientes</span>
        </button>
        <button onClick={() => setTab('config')} className={`flex flex-col items-center gap-1 cursor-pointer ${tab === 'config' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <Settings size={20} />
          <span className="text-[10px]">Config</span>
        </button>
      </div>
    </div>
  );
}

export default App;
