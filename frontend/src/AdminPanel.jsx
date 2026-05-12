import { useEffect, useMemo, useState } from "react"
import api from "./api/axios"

export default function AdminPanel() {
  const [tables, setTables] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const getErrorMessage = (error) => {
    const detail = error.response?.data?.detail

    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).join("\n")
    }

    if (typeof detail === "string") {
      return detail
    }

    return "No se pudo cargar la información del panel de administración."
  }

  const fetchAdminData = async () => {
    try {
      setLoading(true)

      const [tablesRes, productsRes, ordersRes, summaryRes] = await Promise.all([
        api.get("/tables/"),
        api.get("/products/"),
        api.get("/orders/"),
        api.get("/orders/summary/daily"),
      ])

      setTables(tablesRes.data)
      setProducts(productsRes.data)
      setOrders(ordersRes.data)
      setSummary(summaryRes.data)
      setError("")
    } catch (err) {
      console.error("Error fetching admin data:", err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  const occupiedTables = useMemo(() => {
    return tables.filter((table) => table.status === "occupied").length
  }, [tables])

  const availableTables = useMemo(() => {
    return tables.filter((table) => table.status === "available").length
  }, [tables])

  const activeOrders = useMemo(() => {
    return orders.filter((order) =>
      ["pending", "in_progress", "ready", "delivered"].includes(order.status)
    ).length
  }, [orders])

  const completedOrders = useMemo(() => {
    return orders.filter((order) => order.status === "completed").length
  }, [orders])

  const cancelledOrders = useMemo(() => {
    return orders.filter((order) => order.status === "cancelled").length
  }, [orders])

  const unpaidOrders = useMemo(() => {
    return orders.filter((order) => order.status === "unpaid").length
  }, [orders])

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5)
  }, [orders])

  const getPaymentLabel = (method) => {
    switch (method) {
      case "cash":
        return "Efectivo"
      case "card":
        return "Tarjeta"
      case "transfer":
        return "Transferencia"
      default:
        return "-"
    }
  }

  const getStatusStyles = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "ready":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-cyan-100 text-cyan-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "unpaid":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "in_progress":
        return "En preparación"
      case "ready":
        return "Entregada al garzón"
      case "delivered":
        return "Entregada a la mesa"
      case "completed":
        return "Pagada"
      case "cancelled":
        return "Cancelada"
      case "unpaid":
        return "No pagada"
      default:
        return status
    }
  }

  const formatDate = (value) => {
    if (!value) return "-"
    return new Date(value).toLocaleString()
  }

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">🛠️ Admin Panel</h2>
          <p className="mt-1 text-gray-500">
            General overview of restaurant operations.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="w-fit rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <p className="text-center text-gray-500">Loading admin data...</p>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-5">
            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Daily sales</p>
              <p className="text-3xl font-bold text-green-700">
                ${summary ? Number(summary.total_sales).toFixed(2) : "0.00"}
              </p>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Completed today</p>
              <p className="text-3xl font-bold text-gray-800">
                {summary ? summary.completed_orders : 0}
              </p>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Cancelled today</p>
              <p className="text-3xl font-bold text-red-600">
                {summary ? summary.cancelled_orders : 0}
              </p>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Unpaid today</p>
              <p className="text-3xl font-bold text-orange-600">
                {summary ? summary.unpaid_orders : 0}
              </p>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Active orders</p>
              <p className="text-3xl font-bold text-blue-600">
                {activeOrders}
              </p>
            </div>
          </div>

          {summary && (
            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border bg-green-50 p-4">
                <p className="text-sm text-gray-600">Efectivo</p>
                <p className="text-2xl font-bold text-green-700">
                  ${Number(summary.payment_totals?.cash || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {summary.payment_counts?.cash || 0} órdenes
                </p>
              </div>

              <div className="rounded-xl border bg-blue-50 p-4">
                <p className="text-sm text-gray-600">Tarjeta</p>
                <p className="text-2xl font-bold text-blue-700">
                  ${Number(summary.payment_totals?.card || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {summary.payment_counts?.card || 0} órdenes
                </p>
              </div>

              <div className="rounded-xl border bg-purple-50 p-4">
                <p className="text-sm text-gray-600">Transferencia</p>
                <p className="text-2xl font-bold text-purple-700">
                  ${Number(summary.payment_totals?.transfer || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {summary.payment_counts?.transfer || 0} órdenes
                </p>
              </div>

              <div className="rounded-xl border bg-orange-50 p-4">
                <p className="text-sm text-gray-600">No pagado</p>
                <p className="text-2xl font-bold text-orange-700">
                  ${Number(summary.unpaid_total || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {summary.unpaid_orders || 0} incidencias
                </p>
              </div>
            </div>
          )}

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total tables</p>
              <p className="text-3xl font-bold text-gray-800">
                {tables.length}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Available tables</p>
              <p className="text-3xl font-bold text-green-700">
                {availableTables}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Occupied tables</p>
              <p className="text-3xl font-bold text-red-600">
                {occupiedTables}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Products</p>
              <p className="text-3xl font-bold text-gray-800">
                {products.length}
              </p>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Total orders</p>
              <p className="text-3xl font-bold text-gray-800">
                {orders.length}
              </p>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Completed orders</p>
              <p className="text-3xl font-bold text-green-700">
                {completedOrders}
              </p>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Cancelled orders</p>
              <p className="text-3xl font-bold text-red-600">
                {cancelledOrders}
              </p>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Unpaid orders</p>
              <p className="text-3xl font-bold text-orange-600">
                {unpaidOrders}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-xl font-bold text-gray-800">
              🧾 Recent orders
            </h3>

            {recentOrders.length === 0 ? (
              <p className="text-gray-500">No orders registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        Order
                      </th>
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        Table
                      </th>
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        Status
                      </th>
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        Payment
                      </th>
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        Created at
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b">
                        <td className="p-3 font-medium text-gray-800">
                          #{order.id}
                        </td>

                        <td className="p-3 text-gray-700">
                          Table #{order.table_id}
                        </td>

                        <td className="p-3">
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusStyles(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </td>

                        <td className="p-3 text-gray-700">
                          {getPaymentLabel(order.payment_method)}
                        </td>

                        <td className="p-3 text-gray-600">
                          {formatDate(order.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}