import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTables } from '../api/client';
import { DiningTable } from '../types/models';

export function TableDashboardPage() {
  const [tables, setTables] = useState<DiningTable[]>([]);

  useEffect(() => {
    fetchTables().then(setTables);
  }, []);

  return (
    <div>
      <h2>Table Dashboard</h2>
      <div className="grid">
        {tables.map((table) => (
          <Link key={table.id} className={`card ${table.is_occupied ? 'occupied' : 'free'}`} to={`/order/${table.id}`}>
            <h3>Table {table.table_no}</h3>
            <p>{table.is_occupied ? 'Occupied' : 'Available'}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
