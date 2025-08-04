import { Routes, Route, Link } from "react-router-dom";
import ProductApp from "./ProductApp";
import TableOrders from "./TableOrders";

export default function App() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <nav className="flex gap-4 mb-6 text-lg">
        <Link to="/" className="text-blue-600 hover:underline">🛒 Productos</Link>
        <Link to="/mesas" className="text-green-600 hover:underline">🍽️ Mesas</Link>
      </nav>

      <Routes>
        <Route path="/" element={<ProductApp />} />
        <Route path="/mesas" element={<TableOrders />} />
      </Routes>
    </div>
  );
}


