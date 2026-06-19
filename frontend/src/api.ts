import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Empresa {
  id: number;
  nombre: string;
  nit: string;
  direccion: string;
  ciudad: string;
  contacto: string;
  alertStockMinimo: number;
  factorHolgura: number;
  cupoBaseNuevo: number;
}

export interface Tanque {
  id: number;
  identificador: string;
  tipoCarburante: 'Gasolina' | 'Diésel';
  capacidadMaxima: number;
  stockMinimoSeguridad: number;
  stockActual: number;
  totalIngresos: number;
  totalVentas: number;
}

export interface Cliente {
  id: number;
  ciNit: string;
  nombreRazonSocial: string;
  placa: string;
  tipoCliente: 'Particular' | 'Transporte Público' | 'Empresa';
  estado: 'Activo' | 'Suspendido';
}

export interface Ingreso {
  id: number;
  tanque_id: number;
  tanque_identificador?: string;
  tipoCarburante?: string;
  cantidad: number;
  nroFactura: string;
  fechaHora: string;
}

export interface Venta {
  id: number;
  tanque_id: number;
  tanque_identificador?: string;
  tipoCarburante?: string;
  cliente_id: number;
  cliente_nombre?: string;
  cliente_placa?: string;
  cliente_ci?: string;
  cantidad: number;
  precioTotal: number;
  fechaHora: string;
}

export interface CupoInfo {
  cliente: Cliente | null;
  isRegistered: boolean;
  isNew: boolean;
  promedioSemanal?: number;
  total28Dias?: number;
  factorHolgura?: number;
  holguraExplicada?: number;
  limite: number;
  motivo: string;
  error?: string;
}
