import { useEffect, useMemo, useState } from "react"
import api from "./api/axios"

const PAYMENT_METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
]

export default function TableOrders() {
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [activeOrder, setActiveOrder] = useState(null)
  const [orderHistory, setOrderHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const [error, setError] = useState(null)
  const [products, setProducts] = useState([])
  const [orderProducts, setOrderProducts] = useState([])
  const [orderNote, setOrderNote] = useState("")

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

  const fetchTables = async () => {
    try {
      setLoading(true)
      const res = await api.get("/tables/")
      setTables(res.data)
      setError(null)
      return res.data
    } catch (err) {
      console.error("Error fetching tables:", err)
      setError("No se pudieron cargar las mesas")
      return []
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      setProductsLoading(true)
      const res = await api.get("/products/?active_only=true")
      setProducts(res.data)
    } catch (err) {
      console.error("Error fetching products:", err)
    } finally {
      setProductsLoading(false)
    }
  }

  const fetchOrderByTable = async (tableId) => {
    try {
      const res = await api.get(`/orders/by_table/${tableId}`)
      setActiveOrder(res.data)
      return res.data
    } catch (err) {
      setActiveOrder(null)
      return null
    }
  }

  const fetchOrderHistory = async (tableId) => {
    try {
      const res = await api.get(`/orders/history/${tableId}`)
      setOrderHistory(res.data)
    } catch (err) {
      console.error("Error fetching order history:", err)
      setOrderHistory([])
    }
  }

  const refreshSelectedTable = async (tableId) => {
    const updatedTables = await fetchTables()
    const updatedSelectedTable =
      updatedTables.find((table) => table.id === tableId) || null

    setSelectedTable(updatedSelectedTable)

    await fetchOrderByTable(tableId)
    await fetchOrderHistory(tableId)
  }

  const handleTableClick = async (table) => {
    setSelectedTable(table)
    setOrderProducts([])
    setOrderNote("")

    await fetchOrderByTable(table.id)
    await fetchOrderHistory(table.id)
  }

  const selectedTableHasActiveOrder =
    selectedTable && activeOrder && selectedTable.id === activeOrder.table_id

  const toggleTableState = async (table) => {
    if (selectedTableHasActiveOrder && selectedTable?.id === table.id) {
      alert("No puedes cambiar manualmente el estado de una mesa con una orden activa.")
      return
    }

    const newState = table.status === "occupied" ? "available" : "occupied"

    try {
      await api.patch(`/tables/${table.id}/status`, { status: newState })
      await refreshSelectedTable(table.id)
    } catch (err) {
      console.error("Error changing table status:", err)
      alert(getErrorMessage(err) || "No se pudo cambiar el estado de la mesa.")
    }
  }

  const addProductToOrder = (product) => {
    const existingProduct = orderProducts.find((item) => item.id === product.id)

    if (existingProduct) {
      setOrderProducts(
        orderProducts.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
      return
    }

    setOrderProducts([...orderProducts, { ...product, quantity: 1 }])
  }

  const increaseQuantity = (productId) => {
    setOrderProducts(
      orderProducts.map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    )
  }

  const decreaseQuantity = (productId) => {
    setOrderProducts(
      orderProducts
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const clearOrderProducts = () => {
    setOrderProducts([])
  }

  const createOrder = async () => {
    if (!selectedTable) return

    if (activeOrder) {
      alert("Esta mesa ya tiene una orden activa.")
      return
    }

    if (orderProducts.length === 0) {
      alert("Debes agregar al menos un producto.")
      return
    }

    try {
      const res = await api.post("/orders/", {
        table_id: selectedTable.id,
        note: orderNote,
        items: orderProducts.map((product) => ({
          product_id: product.id,
          quantity: product.quantity,
        })),
      })

      setActiveOrder(res.data)
      setOrderProducts([])
      setOrderNote("")

      await refreshSelectedTable(selectedTable.id)
    } catch (err) {
      console.error("Error creating order:", err)
      alert(getErrorMessage(err) || "No se pudo crear la orden.")
    }
  }

  const markAsDelivered = async () => {
    if (!activeOrder) return

    try {
      setStatusLoading(true)

      await api.patch(`/orders/${activeOrder.id}/status`, {
        status: "delivered",
      })

      await refreshSelectedTable(selectedTable.id)
    } catch (err) {
      console.error("Error marking order as delivered:", err)
      alert(getErrorMessage(err) || "No se pudo marcar la orden como entregada.")
    } finally {
      setStatusLoading(false)
    }
  }

  const markAsUnpaid = async () => {
    if (!activeOrder) return

    const confirmUnpaid = window.confirm(
      "¿Seguro que quieres marcar esta orden como no pagada?\n\nLa mesa quedará disponible y la orden quedará registrada como incidencia."
    )

    if (!confirmUnpaid) return

    try {
      setStatusLoading(true)

      await api.patch(`/orders/${activeOrder.id}/status`, {
        status: "unpaid",
      })

      setActiveOrder(null)
      setOrderProducts([])
      setOrderNote("")

      await refreshSelectedTable(selectedTable.id)
    } catch (err) {
      console.error("Error marking order as unpaid:", err)
      alert(getErrorMessage(err) || "No se pudo marcar la orden como no pagada.")
    } finally {
      setStatusLoading(false)
    }
  }

  const cancelOrder = async () => {
    if (!activeOrder) return

    try {
      setStatusLoading(true)

      await api.patch(`/orders/${activeOrder.id}/cancel`)

      setActiveOrder(null)
      setOrderProducts([])
      setOrderNote("")

      await refreshSelectedTable(selectedTable.id)
    } catch (err) {
      console.error("Error cancelling order:", err)
      alert(getErrorMessage(err) || "No se pudo cancelar la orden.")
    } finally {
      setStatusLoading(false)
    }
  }

  const closeOrder = async (paymentMethod) => {
    if (!activeOrder) return

    try {
      setStatusLoading(true)

      await api.patch(`/orders/${activeOrder.id}/close`, {
        payment_method: paymentMethod,
      })

      setActiveOrder(null)
      setOrderProducts([])
      setOrderNote("")

      await refreshSelectedTable(selectedTable.id)
    } catch (err) {
      console.error("Error closing order:", err)
      alert(getErrorMessage(err) || "No se pudo cerrar la orden.")
    } finally {
      setStatusLoading(false)
    }
  }

  const orderTotal = useMemo(() => {
    return orderProducts.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    )
  }, [orderProducts])

  const activeOrderTotal = useMemo(() => {
    if (!activeOrder?.items) return 0

    return activeOrder.items.reduce(
      (total, item) => total + (item.product?.price ?? 0) * item.quantity,
      0
    )
  }, [activeOrder])

  const formatDate = (value) => {
    if (!value) return "-"
    return new Date(value).toLocaleString()
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

  const renderStatusActions = () => {
    if (!activeOrder) return null

    if (activeOrder.status === "ready") {
      return (
        <>
          <button
            onClick={markAsDelivered}
            disabled={statusLoading}
            className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 font-medium disabled:bg-gray-400"
          >
            🍽️ Entregar a la mesa
          </button>

          <button
            onClick={markAsUnpaid}
            disabled={statusLoading}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-medium disabled:bg-gray-400"
          >
            ⚠️ Marcar no pagada
          </button>
        </>
      )
    }

    if (activeOrder.status === "delivered") {
      return (
        <div className="w-full space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            Selecciona método de pago:
          </p>

          <div className="flex flex-wrap gap-3">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.value}
                onClick={() => closeOrder(method.value)}
                disabled={statusLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:bg-gray-400"
              >
                💳 Pagar con {method.label}
              </button>
            ))}

            <button
              onClick={markAsUnpaid}
              disabled={statusLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-medium disabled:bg-gray-400"
            >
              ⚠️ Marcar no pagada
            </button>
          </div>
        </div>
      )
    }

    return null
  }

  useEffect(() => {
    fetchTables()
    fetchProducts()
  }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-2xl shadow border border-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        🍽️ Table Orders
      </h1>

      {loading && <p className="text-center text-gray-500">Cargando mesas...</p>}

      {error && (
        <div className="text-red-600 text-center font-semibold mb-4">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Mesas</h2>

            <ul className="space-y-3">
              {tables.map((table) => {
                const isSelected = selectedTable?.id === table.id
                const disableToggle = isSelected && selectedTableHasActiveOrder

                return (
                  <li
                    key={table.id}
                    className={`p-3 border rounded-xl shadow flex justify-between items-center ${
                      isSelected
                        ? "bg-blue-50 border-blue-400"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <button
                      onClick={() => handleTableClick(table)}
                      className="text-left flex-1"
                    >
                      <div className="font-semibold text-base">
                        Mesa #{table.number}
                      </div>

                      <div className="text-sm text-gray-600">
                        {table.status === "occupied" ? "🟥 Ocupada" : "🟩 Disponible"}
                      </div>
                    </button>

                    <button
                      onClick={() => toggleTableState(table)}
                      disabled={disableToggle}
                      className={`ml-3 px-3 py-2 rounded text-sm text-white ${
                        disableToggle
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      Cambiar estado
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            {!selectedTable ? (
              <div className="p-6 border rounded-xl bg-gray-50 text-gray-500 text-center">
                Selecciona una mesa para ver o crear su orden.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 border rounded-xl bg-gray-50">
                  <h2 className="text-xl font-semibold mb-3">
                    Mesa seleccionada: #{selectedTable.number}
                  </h2>

                  <p className="text-sm text-gray-700 mb-1">
                    Estado actual:{" "}
                    <span className="font-medium">{selectedTable.status}</span>
                  </p>

                  <p className="text-sm text-gray-700 mb-4">
                    Orden activa:{" "}
                    <span className="font-medium">
                      {activeOrder ? "✅ Sí" : "❌ No"}
                    </span>
                  </p>

                  {!activeOrder && (
                    <>
                      {selectedTable.status !== "occupied" && (
                        <p className="mb-4 text-yellow-600">
                          ⚠️ Para crear una orden, la mesa debe estar en estado ocupada.
                        </p>
                      )}

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          📝 Instrucciones para cocina
                        </label>

                        <textarea
                          value={orderNote}
                          onChange={(e) => setOrderNote(e.target.value)}
                          placeholder="Ej: sin cebolla, término medio, extra queso..."
                          className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          rows={3}
                        />
                      </div>

                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">
                          🛒 Productos disponibles
                        </h3>

                        {productsLoading ? (
                          <p className="text-sm text-gray-500">Cargando productos...</p>
                        ) : (
                          <ul className="space-y-2 max-h-64 overflow-y-auto">
                            {products.map((product) => (
                              <li
                                key={product.id}
                                className="flex justify-between items-center border rounded-lg px-3 py-2 bg-white"
                              >
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-gray-500">
                                    ${product.price}
                                  </div>
                                </div>

                                <button
                                  onClick={() => addProductToOrder(product)}
                                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Añadir
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">
                            🧾 Productos añadidos
                          </h3>

                          {orderProducts.length > 0 && (
                            <button
                              onClick={clearOrderProducts}
                              className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Vaciar selección
                            </button>
                          )}
                        </div>

                        {orderProducts.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            Aún no has agregado productos.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {orderProducts.map((product) => (
                              <li
                                key={product.id}
                                className="flex justify-between items-center border rounded-lg px-3 py-2 bg-white"
                              >
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-gray-500">
                                    ${product.price} x {product.quantity}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => decreaseQuantity(product.id)}
                                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                  >
                                    -
                                  </button>

                                  <span className="min-w-6 text-center font-medium">
                                    {product.quantity}
                                  </span>

                                  <button
                                    onClick={() => increaseQuantity(product.id)}
                                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                  >
                                    +
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="mb-4 text-right">
                        <p className="text-xl font-bold text-gray-800">
                          Total: ${orderTotal.toFixed(2)}
                        </p>
                      </div>

                      <button
                        onClick={createOrder}
                        disabled={selectedTable.status !== "occupied"}
                        className={`px-4 py-2 rounded text-white font-medium ${
                          selectedTable.status === "occupied"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                      >
                        ➕ Crear Orden
                      </button>
                    </>
                  )}

                  {activeOrder && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">🧾 Orden activa</h3>

                        <span
                          className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusStyles(
                            activeOrder.status
                          )}`}
                        >
                          {getStatusLabel(activeOrder.status)}
                        </span>
                      </div>

                      <div className="mb-3 text-sm text-gray-700 space-y-1">
                        <p>
                          <span className="font-medium">Order ID:</span>{" "}
                          {activeOrder.id}
                        </p>

                        <p>
                          <span className="font-medium">Fecha:</span>{" "}
                          {formatDate(activeOrder.timestamp)}
                        </p>
                      </div>

                      {activeOrder.note && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                          📝 {activeOrder.note}
                        </div>
                      )}

                      {activeOrder.items && activeOrder.items.length > 0 ? (
                        <>
                          <ul className="space-y-3 mb-4">
                            {activeOrder.items.map((item) => (
                              <li
                                key={item.id}
                                className="border rounded-lg px-3 py-3 bg-white flex justify-between items-center"
                              >
                                <div>
                                  <div className="font-medium">
                                    {item.product?.name || `Producto #${item.product_id}`}
                                  </div>

                                  <div className="text-sm text-gray-500">
                                    ${item.product?.price ?? 0} x {item.quantity}
                                  </div>
                                </div>

                                <div className="text-sm font-semibold text-gray-700">
                                  ${((item.product?.price ?? 0) * item.quantity).toFixed(2)}
                                </div>
                              </li>
                            ))}
                          </ul>

                          <div className="mb-4 text-right">
                            <p className="text-xl font-bold text-gray-800">
                              Total orden: ${activeOrderTotal.toFixed(2)}
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-500 mb-4">
                          La orden no tiene productos.
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3">
                        {renderStatusActions()}

                        {activeOrder.status !== "completed" &&
                          activeOrder.status !== "cancelled" &&
                          activeOrder.status !== "unpaid" && (
                            <button
                              onClick={cancelOrder}
                              disabled={
                                statusLoading ||
                                !["pending", "in_progress"].includes(activeOrder.status)
                              }
                              className={`px-4 py-2 text-white rounded font-medium disabled:bg-gray-400 ${
                                ["pending", "in_progress"].includes(activeOrder.status)
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-gray-400 cursor-not-allowed"
                              }`}
                            >
                              ❌ Cancelar Orden
                            </button>
                          )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border rounded-xl bg-gray-50">
                  <h3 className="text-lg font-semibold mb-3">📜 Historial de órdenes</h3>

                  {orderHistory.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Esta mesa aún no tiene órdenes registradas.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {orderHistory.map((order) => {
                        const total =
                          order.items?.reduce(
                            (sum, item) =>
                              sum + (item.product?.price ?? 0) * item.quantity,
                            0
                          ) ?? 0

                        return (
                          <li
                            key={order.id}
                            className="border rounded-lg p-3 bg-white"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">Orden #{order.id}</p>

                                <p className="text-sm text-gray-500">
                                  {formatDate(order.timestamp)}
                                </p>
                              </div>

                              <span
                                className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusStyles(
                                  order.status
                                )}`}
                              >
                                {getStatusLabel(order.status)}
                              </span>
                            </div>

                            {order.payment_method && (
                              <div className="mb-2 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
                                Método de pago: {getPaymentLabel(order.payment_method)}
                              </div>
                            )}

                            {order.note && (
                              <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                📝 {order.note}
                              </div>
                            )}

                            {order.items && order.items.length > 0 ? (
                              <ul className="text-sm text-gray-700 space-y-1 mb-2">
                                {order.items.map((item) => (
                                  <li key={item.id}>
                                    {item.product?.name ||
                                      `Producto #${item.product_id}`}{" "}
                                    x {item.quantity}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500 mb-2">
                                Sin productos registrados.
                              </p>
                            )}

                            <div className="text-right font-semibold text-gray-800">
                              Total: ${total.toFixed(2)}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}