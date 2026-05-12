import { useEffect, useRef, useState } from "react"
import api from "./api/axios"

export default function KitchenView() {
  const [orders, setOrders] = useState([])
  const [audioEnabled, setAudioEnabled] = useState(() => {
    return localStorage.getItem("kitchenAudioEnabled") === "true"
  })
  const [newOrderIds, setNewOrderIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const audioRef = useRef(null)
  const initializedRef = useRef(false)
  const knownIdsRef = useRef(new Set())

  const getPendingKitchenOrders = (list) => {
    return list.filter(
      (order) =>
        order.status === "pending" ||
        order.status === "in_progress" ||
        order.status === "ready"
    )
  }

  const enableAudio = async () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        await audioRef.current.play()
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      setAudioEnabled(true)
      localStorage.setItem("kitchenAudioEnabled", "true")
    } catch (error) {
      console.log("No se pudo habilitar el audio:", error)
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
        return "Entregada"
      default:
        return status
    }
  }

  const getStatusCardClasses = (status, isNew) => {
    if (isNew) {
      return "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300"
    }

    switch (status) {
      case "pending":
        return "border-yellow-300 bg-yellow-50"
      case "in_progress":
        return "border-blue-300 bg-blue-50"
      case "ready":
        return "border-purple-300 bg-purple-50"
      default:
        return "border-gray-200 bg-white"
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
        return "bg-green-100 text-green-800 border border-green-300"
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300"
    }
  }

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

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders/")
      const data = Array.isArray(res.data) ? res.data : []
      const filtered = getPendingKitchenOrders(data)

      const currentIds = new Set(filtered.map((order) => order.id))

      if (!initializedRef.current) {
        knownIdsRef.current = currentIds
        setOrders([...filtered].sort((a, b) => b.id - a.id))
        setNewOrderIds([])
        setError("")
        setLoading(false)
        initializedRef.current = true
        return
      }

      const incomingIds = filtered
        .filter((order) => !knownIdsRef.current.has(order.id))
        .map((order) => order.id)

      if (audioEnabled && incomingIds.length > 0 && audioRef.current) {
        try {
          audioRef.current.currentTime = 0
          await audioRef.current.play()
          console.log("🔔 Nueva orden detectada")
        } catch (error) {
          console.log("Error reproduciendo audio:", error)
        }
      }

      setNewOrderIds((prev) => {
        const merged = Array.from(new Set([...prev, ...incomingIds]))

        const sortedOrders = [...filtered].sort((a, b) => {
          const aIsNew = merged.includes(a.id)
          const bIsNew = merged.includes(b.id)

          if (aIsNew && !bIsNew) return -1
          if (!aIsNew && bIsNew) return 1

          return b.id - a.id
        })

        setOrders(sortedOrders)
        return merged
      })

      knownIdsRef.current = currentIds
      setError("")
    } catch (error) {
      console.error(error)
      setError(getErrorMessage(error) || "No se pudieron cargar las órdenes de cocina.")
    } finally {
      setLoading(false)
    }
  }

  const clearNewBadge = (orderId) => {
    setNewOrderIds((prev) => prev.filter((id) => id !== orderId))
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, {
        status: newStatus,
      })

      clearNewBadge(orderId)
      await fetchOrders()
    } catch (error) {
      console.error(error)
      alert(getErrorMessage(error) || "No se pudo actualizar el estado de la orden.")
    }
  }

  const renderActionButton = (order) => {
    if (order.status === "pending") {
      return (
        <button
          onClick={() => updateOrderStatus(order.id, "in_progress")}
          className="rounded-xl bg-blue-600 px-5 py-3 text-lg font-semibold text-white hover:bg-blue-700"
        >
          🍳 Iniciar preparación
        </button>
      )
    }

    if (order.status === "in_progress") {
      return (
        <button
          onClick={() => updateOrderStatus(order.id, "ready")}
          className="rounded-xl bg-purple-600 px-5 py-3 text-lg font-semibold text-white hover:bg-purple-700"
        >
          📤 Entregar al garzón
        </button>
      )
    }

    if (order.status === "ready") {
      return (
        <span className="rounded-xl border border-purple-300 bg-purple-100 px-5 py-3 text-lg font-semibold text-purple-800">
          Entregada al garzón
        </span>
      )
    }

    return null
  }

  useEffect(() => {
    fetchOrders()

    const interval = setInterval(() => {
      fetchOrders()
    }, 5000)

    return () => clearInterval(interval)
  }, [audioEnabled])

  return (
    <div className="mt-8">
      <audio ref={audioRef} src="/alert.wav" preload="auto" />

      <div className="mb-6">
        <h2 className="text-4xl font-bold text-slate-800">🍳 Cocina</h2>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={fetchOrders}
          className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-lg font-semibold text-slate-800 shadow hover:bg-gray-50"
        >
          Refresh
        </button>

        {!audioEnabled ? (
          <button
            onClick={enableAudio}
            className="rounded-xl bg-emerald-600 px-5 py-3 text-lg font-semibold text-white hover:bg-emerald-700"
          >
            Activar sonido
          </button>
        ) : (
          <span className="rounded-xl border border-emerald-300 bg-emerald-100 px-4 py-3 text-base font-semibold text-emerald-800">
            Sonido activado
          </span>
        )}
      </div>

      <p className="mb-8 text-2xl text-slate-700">
        Actualización automática cada 5s
      </p>

      {loading && <p className="text-lg text-gray-500">Cargando órdenes...</p>}

      {error && <p className="text-lg font-semibold text-red-600">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow">
          <p className="text-lg text-gray-600">
            No hay órdenes pendientes en cocina.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {orders.map((order) => {
          const isNew = newOrderIds.includes(order.id)

          return (
            <div
              key={order.id}
              className={`rounded-2xl border p-6 shadow transition ${getStatusCardClasses(
                order.status,
                isNew
              )}`}
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-3xl font-bold text-slate-800">
                  Orden #{order.id}
                </h3>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClasses(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>

                  {isNew && (
                    <span className="rounded-full border border-emerald-400 bg-emerald-600 px-3 py-1 text-sm font-bold text-white">
                      NUEVA
                    </span>
                  )}
                </div>
              </div>

              <p className="mb-2 text-2xl text-slate-700">
                Mesa #{order.table?.number ?? order.table_id}
              </p>

              {order.note && (
                <div className="mb-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-lg text-yellow-800">
                  📝 {order.note}
                </div>
              )}

              <ul className="list-disc space-y-2 pl-8 text-2xl text-slate-700">
                {order.items?.map((item) => (
                  <li key={item.id ?? `${order.id}-${item.product_id}`}>
                    {item.product?.name ||
                      item.product_name ||
                      `Producto #${item.product_id}`}{" "}
                    x {item.quantity}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-3">
                {renderActionButton(order)}

                {isNew && (
                  <button
                    onClick={() => clearNewBadge(order.id)}
                    className="rounded-xl bg-slate-200 px-5 py-3 text-lg font-semibold text-slate-700 hover:bg-slate-300"
                  >
                    Quitar alerta
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}