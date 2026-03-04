import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  headers: {
    'x-api-key': import.meta.env.VITE_API_KEY || ''
  }
});

export async function fetchTables() {
  const { data } = await api.get('/tables');
  return data;
}

export async function fetchMenu() {
  const { data } = await api.get('/menu-items');
  return data;
}

export async function fetchActiveOrders() {
  const { data } = await api.get('/orders/active');
  return data;
}

export async function createOrder(payload: any) {
  const { data } = await api.post('/orders', payload);
  return data;
}

export async function addItems(orderId: string, payload: any) {
  const { data } = await api.patch(`/orders/${orderId}/items`, payload);
  return data;
}

export async function sendKot(orderId: string) {
  const { data } = await api.patch(`/orders/${orderId}/send-kot`);
  return data;
}

export async function generateBill(orderId: string) {
  const { data } = await api.patch(`/billing/${orderId}/generate`);
  return data;
}

export async function payBill(orderId: string, payment_mode: string) {
  const { data } = await api.patch(`/billing/${orderId}/pay`, { payment_mode });
  return data;
}
