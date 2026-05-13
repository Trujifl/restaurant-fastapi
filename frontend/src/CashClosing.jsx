import { useEffect, useState } from "react"
import api from "./api/axios"

export default function CashClosing() {
  const [summary, setSummary] = useState(null)
  const [closings, setClosings] = useState([])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const getErrorMessage = (error) => {
    const detail = error.response?.data?.detail

    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).join("\n")
    }

    if (typeof detail === "string") {
      return detail
    }

    return "No se pudo procesar el cierre de caja."
  }

  const fetchSummary = async () => {
    try {
      const res = await api.get("/cash-closings/preview/today")
      setSummary(res.data)
      setError("")
    } catch (err) {
      console.error("Error fetching cash closing preview:", err)
      setError(getErrorMessage(err))
    }
  }

  const fetchClosings = async () => {
    try {
      const res = await api.get("/cash-closings/")
      setClosings(res.data)
    } catch (err) {
      console.error("Error fetching cash closings:", err)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      await fetchSummary()
      await fetchClosings()
    } finally {
      setLoading(false)
    }
  }

  const createCashClosing = async () => {
    if (!summary) return

    if (summary.active_orders > 0) {
      alert(
        "No puedes cerrar caja mientras existan órdenes activas. Deben pagarse, cancelarse o marcarse como no pagadas."
      )
      return
    }

    const confirmClose = window.confirm(
      "¿Seguro que quieres guardar el cierre de caja de hoy?\n\nEsta acción dejará registrado el cierre del día."
    )

    if (!confirmClose) return

    try {
      setSaving(true)

      await api.post("/cash-closings/", {
        notes: notes.trim() || null,
      })

      setNotes("")
      await fetchData()

      alert("Cierre de caja guardado correctamente.")
    } catch (err) {
      console.error("Error creating cash closing:", err)
      alert(getErrorMessage(err) || "No se pudo guardar el cierre de caja.")
    } finally {
      setSaving(false)
    }
  }

  const formatMoney = (value) => {
    return `$${Number(value || 0).toFixed(2)}`
  }

  const formatDate = (value) => {
    if (!value) return "-"
    return new Date(value).toLocaleString()
  }

  const cashTotal = summary?.payment_totals?.cash || 0
  const cardTotal = summary?.payment_totals?.card || 0
  const transferTotal = summary?.payment_totals?.transfer || 0
  const totalSales = summary?.total_sales || 0
  const unpaidTotal = summary?.unpaid_total || 0
  const expectedTotal = cashTotal + cardTotal + transferTotal

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            🧾 Cierre de caja
          </h2>

          <p className="mt-1 text-gray-500">
            Guarda y revisa los cierres diarios de caja.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={saving}
          className="w-fit rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
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

          <div className="mb-8 rounded-xl border bg-slate-50 p-5">
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
                Todavía existen órdenes activas. Deben pagarse, marcarse como no pagadas o cancelarse antes del cierre.
              </div>
            )}

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Notas del cierre
              </label>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: cierre sin diferencias, faltó comprobante de transferencia, etc."
                className="w-full rounded-lg border p-3"
                rows={3}
              />
            </div>

            <button
              onClick={createCashClosing}
              disabled={saving || summary.active_orders > 0}
              className={`mt-4 rounded-lg px-5 py-3 font-semibold text-white ${
                saving || summary.active_orders > 0
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {saving ? "Guardando..." : "💾 Guardar cierre de caja"}
            </button>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h3 className="mb-4 text-2xl font-bold text-gray-800">
              📚 Historial de cierres
            </h3>

            {closings.length === 0 ? (
              <div className="rounded-lg border bg-gray-50 p-4 text-center text-gray-500">
                Todavía no hay cierres guardados.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        ID
                      </th>
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        Fecha
                      </th>
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        Cerrado en
                      </th>
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        Ventas
                      </th>
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        Efectivo
                      </th>
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        Tarjeta
                      </th>
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        Transferencia
                      </th>
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        No pagado
                      </th>
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        Notas
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {closings.map((closing) => (
                      <tr key={closing.id} className="border-b">
                        <td className="p-3 font-medium text-gray-800">
                          #{closing.id}
                        </td>

                        <td className="p-3 text-gray-700">
                          {closing.closing_date}
                        </td>

                        <td className="p-3 text-gray-700">
                          {formatDate(closing.closed_at)}
                        </td>

                        <td className="p-3 font-semibold text-green-700">
                          {formatMoney(closing.total_sales)}
                        </td>

                        <td className="p-3 text-gray-700">
                          {formatMoney(closing.cash_total)}
                        </td>

                        <td className="p-3 text-gray-700">
                          {formatMoney(closing.card_total)}
                        </td>

                        <td className="p-3 text-gray-700">
                          {formatMoney(closing.transfer_total)}
                        </td>

                        <td className="p-3 text-orange-700">
                          {formatMoney(closing.unpaid_total)}
                        </td>

                        <td className="p-3 text-gray-600">
                          {closing.notes || "-"}
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