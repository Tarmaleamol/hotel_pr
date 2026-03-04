import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '../api/client';
import { Order } from '../types/models';

const socket = io((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/kitchen', {
  auth: { apiKey: import.meta.env.VITE_API_KEY || '' }
});

export function KitchenPage() {
  const [queue, setQueue] = useState<Order[]>([]);

  useEffect(() => {
    api.get('/kitchen/queue').then((res) => setQueue(res.data));

    socket.on('order.updated', (data) => {
      if (data?.orders) {
        setQueue(data.orders.filter((o: Order) => o.status !== 'PAID'));
        return;
      }
      setQueue((prev) => [data, ...prev.filter((o) => o.id !== data.id)]);
    });

    socket.on('order.kot_sent', (data) => {
      setQueue((prev) => [data, ...prev.filter((o) => o.id !== data.id)]);
    });

    return () => {
      socket.off('order.updated');
      socket.off('order.kot_sent');
    };
  }, []);

  return (
    <div>
      <h2>Kitchen Display</h2>
      <div className="grid">
        {queue.map((order) => (
          <div key={order.id} className="card">
            <h3>{order.id.slice(0, 8)}</h3>
            <p>Status: {order.status}</p>
            <p>Total: {order.total}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
