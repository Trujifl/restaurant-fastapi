import { useEffect, useMemo, useState } from "react"
import axios from "axios"

const ORDERS_API = "http://localhost:8000/orders/"
const DAILY_SUMMARY_API = "http://localhost:8000/orders/summary/daily"

export default function CashierView() {
  const [orders, setOrders] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [closingId, setClosingId] = useState(null)
  const [error, setError] = useState("")
  const [tableFilter, setTableFilter] = useState("all")

  const fetchDeliveredOrders = async () => {
    try {
      const res = await axios.get(ORDERS_API)

      const deliveredOrders = res.data.filter(
        (order) => order.status === "delivered"
      )

      setOrders(deliveredOrders)
      setError("")
    } catch (err) {
      console.error("Error fetching delivered orders:", err)
      setError("No se pudieron cargar las órdenes entregadas.")
    } finally {
      setLoading(false)
    }
  }

  const fetchDailySummary = async () => {
    try {
      const res = await axios.get(DAILY_SUMMARY_API)
      setSummary(res.data)
    } catch (err) {
      console.error("Error fetching daily summary:", err)
    }
  }

  const fetchCashierData = async () => {
    await fetchDeliveredOrders()
    await fetchDailySummary()
  }

  const closeOrder = async (order) => {
    try {
      setClosingId(order.id)

      await axios.patch(`${ORDERS_API}${order.id}/close`)

      await fetchCashierData()
    } catch (err) {
      console.error("Error closing order:", err)
      alert(err.response?.data?.detail || "No se pudo cerrar la orden.")
    } finally {
      setClosingId(null)
    }
  }

  const getOrderTotal = (order) => {
    if (!order.items) return 0

    return order.items.reduce((total, item) => {
      const price = item.product?.price || 0
      return total + price * item.quantity
    }, 0)
  }

  const filteredOrders = useMemo(() => {
    if (tableFilter === "all") return orders

    return orders.filter(
      (order) => String(order.table_id) === String(tableFilter)
    )
  }, [orders, tableFilter])

  const availableTables = useMemo(() => {
    const tableIds = orders.map((order) => order.table_id)
    return [...new Set(tableIds)]
  }, [orders])

  const totalToCollect = useMemo(() => {
    return filteredOrders.reduce((total, order) => {
      return total + getOrderTotal(order)
    }, 0)
  }, [filteredOrders])

  const formatDate = (value) => {
    if (!value) return "-"
    return new Date(value).toLocaleString()
  }

  useEffect(() => {
    fetchCashierData()

    const interval = setInterval(() => {
      fetchCashierData()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">💳 Cashier</h2>
          <p className="mt-1 text-gray-500">
            Manage delivered orders, close payments and review daily sales.
          </p>
        </div>

        <button
          onClick={fetchCashierData}
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Completed orders</p>
          <p className="text-3xl font-bold text-gray-800">
            {summary ? summary.completed_orders : 0}
          </p>
        </div>

        <div className="rounded-xl border bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Cancelled orders</p>
          <p className="text-3xl font-bold text-red-600">
            {summary ? summary.cancelled_orders : 0}
          </p>
        </div>

        <div className="rounded-xl border bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Active orders</p>
          <p className="text-3xl font-bold text-blue-600">
            {summary ? summary.active_orders : 0}
          </p>
        </div>

        <div className="rounded-xl border bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Daily sales</p>
          <p className="text-3xl font-bold text-green-700">
            ${summary ? Number(summary.total_sales).toFixed(2) : "0.00"}
          </p>
        </div>
      </div>

      {summary && (
        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          📅 Daily summary date: <span className="font-semibold">{summary.date}</span>
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Delivered orders ready to collect</p>
          <p className="text-3xl font-bold text-gray-800">
            {filteredOrders.length}
          </p>
        </div>

        <div className="rounded-xl border bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Pending collection total</p>
          <p className="text-3xl font-bold text-green-700">
            ${totalToCollect.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border bg-gray-50 p-4">
          <label className="mb-2 block text-sm font-medium text-gray-600">
            Filter by table
          </label>

          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="w-full rounded-lg border p-2"
          >
            <option value="all">All tables</option>

            {availableTables.map((tableId) => (
              <option key={tableId} value={tableId}>
                Table #{tableId}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <p className="text-center text-gray-500">Loading delivered orders...</p>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {!loading && filteredOrders.length === 0 && (
        <div className="rounded-xl border bg-gray-50 p-6 text-center text-gray-500">
          No delivered orders ready for payment.
        </div>
      )}

      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const total = getOrderTotal(order)

          return (
            <div
              key={order.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Order #{order.id}
                  </h3>

                  <p className="text-sm text-gray-500">
                    Table #{order.table_id}
                  </p>

                  <p className="text-sm text-gray-500">
                    Created at: {formatDate(order.timestamp)}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-800">
                  Delivered
                </span>
              </div>

              {order.note && (
                <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  📝 {order.note}
                </div>
              )}

              {order.items && order.items.length > 0 ? (
                <ul className="mb-4 divide-y rounded-lg border">
                  {order.items.map((item) => {
                    const price = item.product?.price || 0
                    const subtotal = price * item.quantity

                    return (
                      <li
                        key={item.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            {item.product?.name ||
                              `Product #${item.product_id}`}
                          </p>

                          <p className="text-sm text-gray-500">
                            ${price.toFixed(2)} x {item.quantity}
                          </p>
                        </div>

                        <p className="font-semibold text-gray-800">
                          ${subtotal.toFixed(2)}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="mb-4 text-sm text-gray-500">
                  This order has no products.
                </p>
              )}

              <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
                <p className="text-2xl font-bold text-gray-800">
                  Total: ${total.toFixed(2)}
                </p>

                <button
                  onClick={() => closeOrder(order)}
                  disabled={closingId === order.id}
                  className={`rounded-lg px-5 py-3 font-semibold text-white ${
                    closingId === order.id
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {closingId === order.id ? "Closing..." : "💳 Close Order"}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}