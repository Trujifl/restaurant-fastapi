import { useEffect, useMemo, useState } from "react"
import axios from "axios"

const ORDERS_API = "http://localhost:8000/orders/"
const TABLES_API = "http://localhost:8000/tables/"

export default function CashierView() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [closingId, setClosingId] = useState(null)
  const [error, setError] = useState("")
  const [tableFilter, setTableFilter] = useState("")

  const fetchDeliveredOrders = async () => {
    try {
      setLoading(true)
      const res = await axios.get(ORDERS_API)

      const delivered = Array.isArray(res.data)
        ? res.data.filter((order) => order.status === "delivered")
        : []

      setOrders(delivered)
      setError("")
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError("No se pudieron cargar las órdenes listas para cobro.")
    } finally {
      setLoading(false)
    }
  }

  const closeOrder = async (order) => {
    try {
      setClosingId(order.id)

      await axios.patch(`${ORDERS_API}${order.id}/close`)
      await axios.patch(`${TABLES_API}${order.table_id}/status`, {
        status: "available",
      })

      await fetchDeliveredOrders()
    } catch (err) {
      console.error("Error closing order:", err)
      alert("No se pudo cerrar la orden.")
    } finally {
      setClosingId(null)
    }
  }

  const getTotal = (order) => {
    return (
      order.items?.reduce((sum, item) => {
        return sum + (item.product?.price ?? 0) * item.quantity
      }, 0) ?? 0
    )
  }

  const formatDate = (value) => {
    if (!value) return "-"
    return new Date(value).toLocaleString()
  }

  const filteredOrders = useMemo(() => {
    const filter = tableFilter.trim()

    if (!filter) return orders

    return orders.filter((order) =>
      String(order.table?.number ?? order.table_id).includes(filter)
    )
  }, [orders, tableFilter])

  const totalPendingAmount = useMemo(() => {
    return filteredOrders.reduce((sum, order) => sum + getTotal(order), 0)
  }, [filteredOrders])

  useEffect(() => {
    fetchDeliveredOrders()

    const interval = setInterval(() => {
      fetchDeliveredOrders()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">💳 Caja</h2>
          <p className="mt-1 text-gray-600">
            Órdenes entregadas listas para cobro
          </p>
        </div>

        <button
          onClick={fetchDeliveredOrders}
          className="rounded-xl bg-slate-800 px-4 py-2 font-medium text-white hover:opacity-90"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
          <p className="text-sm text-gray-500">Órdenes listas</p>
          <p className="mt-2 text-3xl font-bold text-gray-800">
            {filteredOrders.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
          <p className="text-sm text-gray-500">Total por cobrar</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            ${totalPendingAmount.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-medium text-gray-600">
            Filtrar por mesa
          </label>
          <input
            type="text"
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            placeholder="Ej: 4"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {loading && (
        <p className="text-center text-gray-500">Cargando órdenes...</p>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && filteredOrders.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-gray-500">
          No hay órdenes listas para cobro.
        </div>
      )}

      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm"
          >
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xl font-bold text-gray-800">
                  🧾 Orden #{order.id}
                </p>
                <p className="text-sm text-gray-600">
                  Mesa #{order.table?.number ?? order.table_id}
                </p>
                <p className="text-sm text-gray-500">
                  Fecha: {formatDate(order.timestamp)}
                </p>
              </div>

              <span className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-800">
                Entregada
              </span>
            </div>

            {order.note && (
              <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                📝 {order.note}
              </div>
            )}

            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Detalle
              </h3>

              <ul className="space-y-2">
                {order.items?.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <span>
                      {item.product?.name || `Producto #${item.product_id}`} x{" "}
                      {item.quantity}
                    </span>
                    <span className="font-semibold text-gray-700">
                      ${(((item.product?.price ?? 0) * item.quantity)).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-2xl font-bold text-gray-800">
                Total: ${getTotal(order).toFixed(2)}
              </p>

              <button
                onClick={() => closeOrder(order)}
                disabled={closingId === order.id}
                className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:bg-gray-400"
              >
                {closingId === order.id
                  ? "Procesando..."
                  : "💳 Cobrar / Cerrar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}