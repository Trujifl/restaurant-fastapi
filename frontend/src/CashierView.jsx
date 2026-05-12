import { useEffect, useMemo, useState } from "react"
import api from "./api/axios"

const PAYMENT_METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
]

export default function CashierView() {
  const [orders, setOrders] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [error, setError] = useState("")
  const [tableFilter, setTableFilter] = useState("all")

  const getErrorMessage = (error) => {
    const detail = error.response?.data?.detail

    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).join("\n")
    }

    if (typeof detail === "string") {
      return detail
    }

    return "Ocurrió un error inesperado."
  }

  const getPaymentLabel = (method) => {
    const found = PAYMENT_METHODS.find((item) => item.value === method)
    return found ? found.label : method || "-"
  }

  const fetchCollectableOrders = async () => {
    try {
      const res = await api.get("/orders/")

      const collectableOrders = res.data.filter(
        (order) => order.status === "ready" || order.status === "delivered"
      )

      setOrders(collectableOrders)
      setError("")
    } catch (err) {
      console.error("Error fetching cashier orders:", err)
      setError("No se pudieron cargar las órdenes de caja.")
    } finally {
      setLoading(false)
    }
  }

  const fetchDailySummary = async () => {
    try {
      const res = await api.get("/orders/summary/daily")
      setSummary(res.data)
    } catch (err) {
      console.error("Error fetching daily summary:", err)
    }
  }

  const fetchCashierData = async () => {
    await fetchCollectableOrders()
    await fetchDailySummary()
  }

  const markAsDelivered = async (order) => {
    try {
      setProcessingId(order.id)

      await api.patch(`/orders/${order.id}/status`, {
        status: "delivered",
      })

      await fetchCashierData()
    } catch (err) {
      console.error("Error marking order as delivered:", err)
      alert(getErrorMessage(err) || "No se pudo marcar la orden como entregada.")
    } finally {
      setProcessingId(null)
    }
  }

  const markAsUnpaid = async (order) => {
    const confirmUnpaid = window.confirm(
      "¿Seguro que quieres marcar esta orden como no pagada?\n\nLa mesa quedará disponible y la orden quedará registrada como incidencia."
    )

    if (!confirmUnpaid) return

    try {
      setProcessingId(order.id)

      await api.patch(`/orders/${order.id}/status`, {
        status: "unpaid",
      })

      await fetchCashierData()
    } catch (err) {
      console.error("Error marking order as unpaid:", err)
      alert(getErrorMessage(err) || "No se pudo marcar la orden como no pagada.")
    } finally {
      setProcessingId(null)
    }
  }

  const closeOrder = async (order, paymentMethod) => {
    try {
      setProcessingId(order.id)

      await api.patch(`/orders/${order.id}/close`, {
        payment_method: paymentMethod,
      })

      await fetchCashierData()
    } catch (err) {
      console.error("Error closing order:", err)
      alert(getErrorMessage(err) || "No se pudo cerrar la orden.")
    } finally {
      setProcessingId(null)
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

  const getStatusLabel = (status) => {
    switch (status) {
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
          <h2 className="text-3xl font-bold text-gray-800">💳 Caja</h2>
          <p className="mt-1 text-gray-500">
            Órdenes listas para cobrar, cierre de pagos y resumen diario.
          </p>
        </div>

        <button
          onClick={fetchCashierData}
          className="w-fit rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Actualizar
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Órdenes listas para cobrar</p>
          <p className="text-3xl font-bold text-gray-800">
            {filteredOrders.length}
          </p>
        </div>

        <div className="rounded-xl border bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Total pendiente de cobro</p>
          <p className="text-3xl font-bold text-green-700">
            ${totalToCollect.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border bg-gray-50 p-4">
          <label className="mb-2 block text-sm font-medium text-gray-600">
            Filtrar por mesa
          </label>

          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="w-full rounded-lg border p-2"
          >
            <option value="all">Todas las mesas</option>

            {availableTables.map((tableId) => (
              <option key={tableId} value={tableId}>
                Mesa #{tableId}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <p className="text-center text-gray-500">Cargando órdenes de caja...</p>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {!loading && filteredOrders.length === 0 && (
        <div className="mb-8 rounded-xl border bg-gray-50 p-6 text-center text-gray-500">
          No hay órdenes listas para cobrar.
        </div>
      )}

      <div className="mb-8 space-y-4">
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
                    Orden #{order.id}
                  </h3>

                  <p className="text-sm text-gray-500">
                    Mesa #{order.table_id}
                  </p>

                  <p className="text-sm text-gray-500">
                    Creada: {formatDate(order.timestamp)}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClasses(
                    order.status
                  )}`}
                >
                  {getStatusLabel(order.status)}
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

              <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
                <p className="text-2xl font-bold text-gray-800">
                  Total: ${total.toFixed(2)}
                </p>

                <div className="flex flex-wrap gap-3">
                  {order.status === "ready" && (
                    <button
                      onClick={() => markAsDelivered(order)}
                      disabled={processingId === order.id}
                      className={`rounded-lg px-5 py-3 font-semibold text-white ${
                        processingId === order.id
                          ? "cursor-not-allowed bg-gray-400"
                          : "bg-cyan-600 hover:bg-cyan-700"
                      }`}
                    >
                      {processingId === order.id
                        ? "Procesando..."
                        : "🍽️ Marcar entregada"}
                    </button>
                  )}

                  {order.status === "delivered" &&
                    PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.value}
                        onClick={() => closeOrder(order, method.value)}
                        disabled={processingId === order.id}
                        className={`rounded-lg px-5 py-3 font-semibold text-white ${
                          processingId === order.id
                            ? "cursor-not-allowed bg-gray-400"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {processingId === order.id
                          ? "Cerrando..."
                          : `💳 ${method.label}`}
                      </button>
                    ))}

                  {(order.status === "ready" || order.status === "delivered") && (
                    <button
                      onClick={() => markAsUnpaid(order)}
                      disabled={processingId === order.id}
                      className={`rounded-lg px-5 py-3 font-semibold text-white ${
                        processingId === order.id
                          ? "cursor-not-allowed bg-gray-400"
                          : "bg-orange-600 hover:bg-orange-700"
                      }`}
                    >
                      {processingId === order.id
                        ? "Procesando..."
                        : "⚠️ Marcar no pagada"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t pt-6">
        <h3 className="mb-4 text-2xl font-bold text-gray-800">
          📊 Resumen diario
        </h3>

        <div className="mb-6 grid gap-4 md:grid-cols-5">
          <div className="rounded-xl border bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Órdenes pagadas</p>
            <p className="text-3xl font-bold text-gray-800">
              {summary ? summary.completed_orders : 0}
            </p>
          </div>

          <div className="rounded-xl border bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Órdenes canceladas</p>
            <p className="text-3xl font-bold text-red-600">
              {summary ? summary.cancelled_orders : 0}
            </p>
          </div>

          <div className="rounded-xl border bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Órdenes no pagadas</p>
            <p className="text-3xl font-bold text-orange-600">
              {summary ? summary.unpaid_orders : 0}
            </p>
          </div>

          <div className="rounded-xl border bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Órdenes activas</p>
            <p className="text-3xl font-bold text-blue-600">
              {summary ? summary.active_orders : 0}
            </p>
          </div>

          <div className="rounded-xl border bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Ventas del día</p>
            <p className="text-3xl font-bold text-green-700">
              ${summary ? Number(summary.total_sales).toFixed(2) : "0.00"}
            </p>
          </div>
        </div>

        {summary && (
          <>
            <div className="mb-4 rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-800">
              📅 Fecha:{" "}
              <span className="font-semibold">{summary.date}</span>
              {" "}— Total no pagado:{" "}
              <span className="font-semibold">
                ${Number(summary.unpaid_total || 0).toFixed(2)}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
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
            </div>
          </>
        )}
      </div>
    </div>
  )
}