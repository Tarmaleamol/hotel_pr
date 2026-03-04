import { NavLink, Route, Routes } from 'react-router-dom';
import { TableDashboardPage } from './pages/TableDashboardPage';
import { OrderPage } from './pages/OrderPage';
import { KitchenPage } from './pages/KitchenPage';
import { BillingPage } from './pages/BillingPage';

export default function App() {
  return (
    <div className="layout">
      <header>
        <h1>Hotel POS</h1>
        <nav>
          <NavLink to="/">Tables</NavLink>
          <NavLink to="/kitchen">Kitchen</NavLink>
          <NavLink to="/billing">Billing</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<TableDashboardPage />} />
          <Route path="/order/:tableId" element={<OrderPage />} />
          <Route path="/kitchen" element={<KitchenPage />} />
          <Route path="/billing" element={<BillingPage />} />
        </Routes>
      </main>
    </div>
  );
}
