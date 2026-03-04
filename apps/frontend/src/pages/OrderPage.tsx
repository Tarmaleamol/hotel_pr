import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addItems, createOrder, fetchActiveOrders, fetchMenu, sendKot } from '../api/client';
import { MenuItem, Order } from '../types/models';

export function OrderPage() {
  const { tableId = '' } = useParams();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchMenu().then(setMenu);
    fetchActiveOrders().then((orders: Order[]) => {
      const existing = orders.find((o) => o.table_id === tableId);
      if (existing) setOrder(existing);
    });
  }, [tableId]);

  const selectedItems = useMemo(() => menu.slice(0, 4), [menu]);

  async function onCreateOrder() {
    if (!tableId || selectedItems.length === 0) return;
    const payload = {
      table_id: tableId,
      items: selectedItems.map((m) => ({ menu_item_id: m.id, quantity: 1 }))
    };
    const created = await createOrder(payload);
    setOrder(created);
  }

  async function onAddItem(menuItemId: string) {
    if (!order) return;
    const updated = await addItems(order.id, { items: [{ menu_item_id: menuItemId, quantity: 1 }] });
    setOrder(updated);
  }

  async function onSendKot() {
    if (!order) return;
    const updated = await sendKot(order.id);
    setOrder(updated);
  }

  return (
    <div>
      <h2>Order Screen</h2>
      <p>Table: {tableId}</p>
      {!order && <button onClick={onCreateOrder}>Create Order</button>}
      {order && (
        <div className="card">
          <p>Order ID: {order.id}</p>
          <p>Status: {order.status}</p>
          <p>Total: {order.total}</p>
          <button onClick={onSendKot}>Send KOT</button>
        </div>
      )}
      <div className="grid">
        {menu.map((item) => (
          <button key={item.id} className="card" onClick={() => onAddItem(item.id)}>
            {item.name} - {item.price}
          </button>
        ))}
      </div>
    </div>
  );
}
