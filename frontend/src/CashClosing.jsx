import { useEffect, useState } from "react"
import api from "./api/axios"

export default function CashClosing() {
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

    return "No se pudo cargar el cierre de caja."
  }

  const fetchSummary = async () => {
    try {
      setLoading(true)

      const res = await api.get("/orders/summary/daily")

      setSummary(res.data)
      setError("")
    } catch (err) {
      console.error("Error fetching cash closing:", err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (value) => {
    return `$${Number(value || 0).toFixed(2)}`
  }

  const cashTotal = summary?.payment_totals?.cash || 0
  const cardTotal = summary?.payment_totals?.card || 0
  const transferTotal = summary?.payment_totals?.transfer || 0
  const totalSales = summary?.total_sales || 0
  const unpaidTotal = summary?.unpaid_total || 0

  const expectedTotal = cashTotal + cardTotal + transferTotal

  useEffect(() => {
    fetchSummary()
  }, [])

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            🧾 Cierre de caja
          </h2>

          <p className="mt-1 text-gray-500">
            Resumen operativo del día antes de cerrar caja.
          </p>
        </div>

        <button
          onClick={fetchSummary}
          className="w-fit rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Actualizar
        </button>
      </div>

      {loading && (
        <p className="text-center text-gray-500">Cargando cierre de caja...</p>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && summary && (
        <>
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-800">
            <p className="text-sm">Fecha del cierre</p>
            <p className="text-2xl font-bold">{summary.date}</p>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border bg-green-50 p-4">
              <p className="text-sm text-gray-600">Ventas totales</p>
              <p className="text-3xl font-bold text-green-700">
                {formatMoney(totalSales)}
              </p>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Órdenes pagadas</p>
              <p className="text-3xl font-bold text-gray-800">
                {summary.completed_orders || 0}
              </p>
            </div>

            <div className="rounded-xl border bg-orange-50 p-4">
              <p className="text-sm text-gray-600">Órdenes no pagadas</p>
              <p className="text-3xl font-bold text-orange-700">
                {summary.unpaid_orders || 0}
              </p>
            </div>

            <div className="rounded-xl border bg-red-50 p-4">
              <p className="text-sm text-gray-600">Canceladas</p>
              <p className="text-3xl font-bold text-red-700">
                {summary.cancelled_orders || 0}
              </p>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-green-50 p-5">
              <p className="text-sm text-gray-600">Efectivo</p>
              <p className="text-4xl font-bold text-green-700">
                {formatMoney(cashTotal)}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {summary.payment_counts?.cash || 0} órdenes
              </p>
            </div>

            <div className="rounded-xl border bg-blue-50 p-5">
              <p className="text-sm text-gray-600">Tarjeta</p>
              <p className="text-4xl font-bold text-blue-700">
                {formatMoney(cardTotal)}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {summary.payment_counts?.card || 0} órdenes
              </p>
            </div>

            <div className="rounded-xl border bg-purple-50 p-5">
              <p className="text-sm text-gray-600">Transferencia</p>
              <p className="text-4xl font-bold text-purple-700">
                {formatMoney(transferTotal)}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {summary.payment_counts?.transfer || 0} órdenes
              </p>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-orange-50 p-4">
              <p className="text-sm text-gray-600">Total no pagado</p>
              <p className="text-3xl font-bold text-orange-700">
                {formatMoney(unpaidTotal)}
              </p>
            </div>

            <div className="rounded-xl border bg-blue-50 p-4">
              <p className="text-sm text-gray-600">Órdenes activas</p>
              <p className="text-3xl font-bold text-blue-700">
                {summary.active_orders || 0}
              </p>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                Suma por métodos de pago
              </p>
              <p className="text-3xl font-bold text-gray-800">
                {formatMoney(expectedTotal)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-slate-50 p-5">
            <h3 className="mb-3 text-xl font-bold text-gray-800">
              ✅ Revisión antes de cerrar
            </h3>

            <div className="space-y-2 text-gray-700">
              <p>
                Ventas totales registradas:{" "}
                <span className="font-bold">{formatMoney(totalSales)}</span>
              </p>

              <p>
                Total calculado por método de pago:{" "}
                <span className="font-bold">{formatMoney(expectedTotal)}</span>
              </p>

              <p>
                Incidencias no pagadas:{" "}
                <span className="font-bold text-orange-700">
                  {summary.unpaid_orders || 0} órdenes / {formatMoney(unpaidTotal)}
                </span>
              </p>

              <p>
                Órdenes activas pendientes:{" "}
                <span className="font-bold text-blue-700">
                  {summary.active_orders || 0}
                </span>
              </p>
            </div>

            {Number(totalSales) === Number(expectedTotal) ? (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-100 p-3 text-green-800">
                Los totales por método coinciden con las ventas del día.
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-100 p-3 text-red-800">
                Atención: las ventas totales no coinciden con la suma por método de pago.
              </div>
            )}

            {summary.active_orders > 0 && (
              <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-100 p-3 text-yellow-800">
                Todavía existen órdenes activas. Idealmente deben pagarse, marcarse como no pagadas o resolverse antes del cierre.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}