import { useEffect, useMemo, useState } from "react"
import api from "./api/axios"

const ORDER_STATUSES = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "in_progress", label: "En preparación" },
  { value: "ready", label: "Entregada al garzón" },
  { value: "delivered", label: "Entregada a la mesa" },
  { value: "completed", label: "Pagada" },
  { value: "cancelled", label: "Cancelada" },
  { value: "unpaid", label: "No pagada" },
]

const PAYMENT_METHODS = [
  { value: "all", label: "Todos" },
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
  { value: "none", label: "Sin método" },
]

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [tableFilter, setTableFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const getErrorMessage = (error) => {
    const detail = error.response?.data?.detail

    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).join("\n")
    }

    if (typeof detail === "string") {
      return detail
    }

    return "No se pudieron cargar las órdenes."
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)

      const res = await api.get("/orders/")

      setOrders(res.data)
      setError("")
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const getOrderTotal = (order) => {
    if (!order.items) return 0

    return order.items.reduce((total, item) => {
      const price = item.product?.price || 0
      return total + price * item.quantity
    }, 0)
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

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-300"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border border-blue-300"
      case "ready":
        return "bg-purple-100 text-purple-800 border border-purple-300"
      case "delivered":
        return "bg-cyan-100 text-cyan-800 border border-cyan-300"
      case "completed":
        return "bg-green-100 text-green-800 border border-green-300"
      case "cancelled":
        return "bg-red-100 text-red-800 border border-red-300"
      case "unpaid":
        return "bg-orange-100 text-orange-800 border border-orange-300"
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300"
    }
  }

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

  const formatDate = (value) => {
    if (!value) return "-"
    return new Date(value).toLocaleString()
  }

  const availableTables = useMemo(() => {
    const tableIds = orders.map((order) => order.table_id)
    return [...new Set(tableIds)].sort((a, b) => a - b)
  }, [orders])

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return orders
      .filter((order) => {
        if (statusFilter !== "all" && order.status !== statusFilter) {
          return false
        }

        if (paymentFilter === "none" && order.payment_method) {
          return false
        }

        if (
          paymentFilter !== "all" &&
          paymentFilter !== "none" &&
          order.payment_method !== paymentFilter
        ) {
          return false
        }

        if (tableFilter !== "all" && String(order.table_id) !== String(tableFilter)) {
          return false
        }

        if (!query) {
          return true
        }

        const idMatch = String(order.id).includes(query)
        const noteMatch = String(order.note || "").toLowerCase().includes(query)
        const productMatch = order.items?.some((item) =>
          String(item.product?.name || "").toLowerCase().includes(query)
        )

        return idMatch || noteMatch || productMatch
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [orders, statusFilter, paymentFilter, tableFilter, searchTerm])

  const paidTotal = useMemo(() => {
    return filteredOrders
      .filter((order) => order.status === "completed")
      .reduce((total, order) => total + getOrderTotal(order), 0)
  }, [filteredOrders])

  const unpaidTotal = useMemo(() => {
    return filteredOrders
      .filter((order) => order.status === "unpaid")
      .reduce((total, order) => total + getOrderTotal(order), 0)
  }, [filteredOrders])

  const activeCount = useMemo(() => {
    return filteredOrders.filter((order) =>
      ["pending", "in_progress", "ready", "delivered"].includes(order.status)
    ).length
  }, [filteredOrders])

  useEffect(() => {
    fetchOrders()
  }, [])

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            📜 Orders History
          </h2>

          <p className="mt-1 text-gray-500">
            Revisión general de órdenes, pagos, incidencias y estados.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="w-fit rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Actualizar
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Órdenes visibles</p>
          <p className="text-3xl font-bold text-gray-800">
            {filteredOrders.length}
          </p>
        </div>

        <div className="rounded-xl border bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Activas visibles</p>
          <p className="text-3xl font-bold text-blue-600">
            {activeCount}
          </p>
        </div>

        <div className="rounded-xl border bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Total pagado visible</p>
          <p className="text-3xl font-bold text-green-700">
            ${paidTotal.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Total no pagado visible</p>
          <p className="text-3xl font-bold text-orange-600">
            ${unpaidTotal.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Estado
          </label>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border p-3"
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Método de pago
          </label>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full rounded-lg border p-3"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Mesa
          </label>

          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="w-full rounded-lg border p-3"
          >
            <option value="all">Todas</option>

            {availableTables.map((tableId) => (
              <option key={tableId} value={tableId}>
                Mesa #{tableId}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Buscar
          </label>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ID, nota o producto..."
            className="w-full rounded-lg border p-3"
          />
        </div>
      </div>

      {loading && (
        <p className="text-center text-gray-500">Cargando órdenes...</p>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && filteredOrders.length === 0 && (
        <div className="rounded-xl border bg-gray-50 p-6 text-center text-gray-500">
          No hay órdenes para los filtros seleccionados.
        </div>
      )}

      {!loading && !error && filteredOrders.length > 0 && (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const total = getOrderTotal(order)

            return (
              <div
                key={order.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Orden #{order.id}
                    </h3>

                    <p className="text-sm text-gray-500">
                      Mesa #{order.table_id}
                    </p>

                    <p className="text-sm text-gray-500">
                      Creada: {formatDate(order.timestamp)}
                    </p>

                    {order.paid_at && (
                      <p className="text-sm text-green-700">
                        Pagada: {formatDate(order.paid_at)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClasses(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>

                    {order.payment_method && (
                      <span className="w-fit rounded-full border border-green-300 bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                        {getPaymentLabel(order.payment_method)}
                      </span>
                    )}
                  </div>
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
                              {item.product?.name || `Producto #${item.product_id}`}
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
                    Esta orden no tiene productos.
                  </p>
                )}

                <div className="flex justify-end border-t pt-4">
                  <p className="text-2xl font-bold text-gray-800">
                    Total: ${total.toFixed(2)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}