import { useEffect, useState } from "react";
import axios from "axios";

export default function TableOrders() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [orderProducts, setOrderProducts] = useState([]);

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

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:8000/products/");
      setProducts(res.data);
    } catch (err) {
      console.error("Error al obtener productos:", err);
    }
  };

  const fetchOrderByTable = async (tableId) => {
    try {
      const res = await axios.get(`http://localhost:8000/orders/by_table/${tableId}`);
      console.log("Orden activa:", res.data);
      setActiveOrder(res.data);
    } catch (err) {
      console.log("No hay orden activa o error:", err);
      setActiveOrder(null);
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

  const handleTableClick = async (table) => {
    console.log("Mesa seleccionada:", table);
    setSelectedTable(table);
    await fetchOrderByTable(table.id);
  };

  const createOrder = async () => {
    try {
      const res = await axios.post("http://localhost:8000/orders/", {
        table_id: selectedTable.id,
        user_id: 1,
        status: "pending",
        note: "Nueva orden desde frontend",
        items: orderProducts.map((p) => ({ product_id: p.id, quantity: 1 }))
      });
      setActiveOrder(res.data);
      setOrderProducts([]);
      fetchTables();
    } catch (err) {
      console.error("Error al crear orden:", err);
    }
  };

  const cancelOrder = async () => {
    try {
      await axios.patch(`http://localhost:8000/orders/${activeOrder.id}/cancel`);
      setActiveOrder(null);
      fetchTables();
    } catch (err) {
      console.error("Error al cancelar la orden:", err);
    }
  };

  const addProductToOrder = (product) => {
    setOrderProducts([...orderProducts, product]);
  };

  useEffect(() => {
    fetchTables();
    fetchProducts();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-2xl shadow border border-gray-200">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
        🍽️ Gestión de Mesas
      </h1>

      {loading && <p className="text-center text-gray-500">Cargando mesas...</p>}

      {error && <div className="text-red-600 text-center font-semibold">⚠️ {error}</div>}

      {!loading && !error && (
        <ul className="space-y-2">
          {tables.map((table) => (
            <li
              key={table.id}
              className="p-3 border rounded bg-white shadow flex justify-between items-center cursor-pointer hover:bg-gray-100"
            >
              <span onClick={() => handleTableClick(table)}>
                Mesa #{table.number} — {table.status === "occupied" ? "🟥 Ocupada" : "🟩 Disponible"}
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
          <p>Estado actual: {selectedTable.status}</p>
          <p className="text-sm text-gray-500">Orden activa: {activeOrder ? "✅ Sí" : "❌ No"}</p>

          {selectedTable.status === "occupied" && !activeOrder && (
            <>
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">🛒 Añadir productos a la orden</h3>
                <ul className="grid grid-cols-2 gap-2 text-sm mb-4">
                  {products.map((product) => (
                    <li key={product.id} className="flex justify-between items-center">
                      <span>{product.name} - ${product.price}</span>
                      <button
                        onClick={() => addProductToOrder(product)}
                        className="text-blue-600 hover:underline"
                      >
                        Añadir
                      </button>
                    </li>
                  ))}
                </ul>

                <h4 className="font-semibold mb-1">🧾 Productos añadidos:</h4>
                <ul className="list-disc pl-6 text-sm text-gray-700">
                  {orderProducts.map((prod, idx) => (
                    <li key={idx}>{prod.name} — ${prod.price}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={createOrder}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                ➕ Crear Orden
              </button>
            </>
          )}

          {selectedTable.status !== "occupied" && (
            <p className="mt-4 text-yellow-600">⚠️ Para crear una orden, primero cambia la mesa a "🟥 Ocupada".</p>
          )}

          {activeOrder && (
            <button
              onClick={cancelOrder}
              className="mt-4 ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              ❌ Cancelar Orden
            </button>
          )}

          {activeOrder ? (
            <div className="mt-4">
              <h3 className="text-md font-semibold mb-2">🧾 Orden activa</h3>
              {activeOrder.productos && activeOrder.productos.length > 0 ? (
                <ul className="list-disc pl-6 text-sm text-gray-700">
                  {activeOrder.productos.map((prod, idx) => (
                    <li key={idx}>{prod.name} — ${prod.price}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">❌ La orden no tiene productos.</p>
              )}
            </div>
          ) : (
            <p className="mt-4 text-gray-500">❌ Sin orden activa</p>
          )}
        </div>
      )}
    </div>
  );
}
