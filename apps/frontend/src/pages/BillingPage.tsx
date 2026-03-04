import { useEffect, useState } from 'react';
import { fetchActiveOrders, generateBill, payBill } from '../api/client';
import { Order } from '../types/models';

export function BillingPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  async function refresh() {
    const data: Order[] = await fetchActiveOrders();
    setOrders(data.filter((o) => o.status !== 'PAID'));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onGenerate(orderId: string) {
    await generateBill(orderId);
    await refresh();
  }

  async function onPay(orderId: string) {
    await payBill(orderId, 'CASH');
    await refresh();
  }

  return (
    <div>
      <h2>Billing Screen</h2>
      <div className="grid">
        {orders.map((order) => (
          <div key={order.id} className="card">
            <p>{order.id.slice(0, 8)}</p>
            <p>Status: {order.status}</p>
            <p>Total: {order.total}</p>
            <button onClick={() => onGenerate(order.id)}>Generate Bill</button>
            <button onClick={() => onPay(order.id)}>Mark Paid</button>
          </div>
        ))}
      </div>
    </div>
  );
}
