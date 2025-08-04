import { useEffect, useState } from "react";
import axios from "axios";

export default function TableOrders() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = "http://localhost:8000/tables/";

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE);
      setTables(res.data);
      setError(null);
    } catch (err) {
      console.error("Error al obtener mesas:", err);
      setError("No se pudieron cargar las mesas");
    } finally {
      setLoading(false);
    }
  };

  const toggleTableState = async (table) => {
    const newState = table.status === "occupied" ? "available" : "occupied";
    try {
      await axios.patch(`${API_BASE}${table.id}/status`, { status: newState });
      fetchTables();
    } catch (err) {
      console.error("Error al cambiar el estado de la mesa:", err);
    }
  };

  const fetchOrderByTable = async (tableId) => {
    try {
      const res = await axios.get(
        `http://localhost:8000/orders/by_table/${tableId}`
      );
      setActiveOrder(res.data);
    } catch (err) {
      console.log("No hay orden activa o error:", err);
      setActiveOrder(null);
    }
  };

  const handleTableClick = async (table) => {
    setSelectedTable(table);
    await fetchOrderByTable(table.id);
  };

  useEffect(() => {
    fetchTables();
  }, []);

  
  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-2xl shadow border border-gray-200">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
        🍽️ Gestión de Mesas
      </h1>

      {loading && (
        <p className="text-center text-gray-500">Cargando mesas...</p>
      )}

      {error && (
        <div className="text-red-600 text-center font-semibold">⚠️ {error}</div>
      )}

      {!loading && !error && (
        <ul className="space-y-2">
          {tables.map((table) => (
            <li
              key={table.id}
              className="p-3 border rounded bg-white shadow flex justify-between items-center cursor-pointer hover:bg-gray-100"
            >
              <span onClick={() => handleTableClick(table)}>
                Mesa #{table.number} —{" "}
                {table.status === "occupied" ? "🟥 Ocupada" : "🟩 Disponible"}
              </span>
              <button
                onClick={() => toggleTableState(table)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Cambiar estado
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedTable && (
        <div className="mt-6 p-4 border-t">
          <h2>Mesa seleccionada: #{selectedTable.number}</h2>
          <p>Estado: {selectedTable.status}</p>
          {activeOrder ? (
            <div className="mt-4">
              <h3 className="text-md font-semibold mb-2">🧾 Orden activa</h3>
              <ul className="list-disc pl-6 text-sm text-gray-700">
                {activeOrder.productos.map((prod, idx) => (
                  <li key={idx}>
                    {prod.name} — ${prod.price}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-gray-500">❌ Sin orden activa</p>
          )}
        </div>
      )}
    </div>
  );
}
