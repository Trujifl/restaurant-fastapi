import { useEffect, useState } from "react"
import api from "./api/axios"

export default function DailyReports() {
  const today = new Date().toISOString().split("T")[0]

  const [reportDate, setReportDate] = useState(today)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const getErrorMessage = (error) => {
    const detail = error.response?.data?.detail

    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).join("\n")
    }

    if (typeof detail === "string") {
      return detail
    }

    return "No se pudo cargar el reporte diario."
  }

  const fetchReport = async () => {
    if (!reportDate) {
      alert("Debes seleccionar una fecha.")
      return
    }

    try {
      setLoading(true)

      const res = await api.get(`/reports/daily?report_date=${reportDate}`)

      setReport(res.data)
      setError("")
    } catch (err) {
      console.error("Error fetching daily report:", err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (value) => {
    return `$${Number(value || 0).toFixed(2)}`
  }

  const cashTotal = report?.payment_totals?.cash || 0
  const cardTotal = report?.payment_totals?.card || 0
  const transferTotal = report?.payment_totals?.transfer || 0
  const totalSales = report?.total_sales || 0
  const unpaidTotal = report?.unpaid_total || 0
  const expectedTotal = cashTotal + cardTotal + transferTotal

  useEffect(() => {
    fetchReport()
  }, [])

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            📊 Reportes diarios
          </h2>

          <p className="mt-1 text-gray-500">
            Consulta ventas, pagos e incidencias por fecha.
          </p>
        </div>

        <button
          onClick={fetchReport}
          disabled={loading}
          className="w-fit rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Cargando..." : "Consultar"}
        </button>
      </div>

      <div className="mb-6 rounded-xl border bg-gray-50 p-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Fecha del reporte
        </label>

        <input
          type="date"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
          className="w-full rounded-lg border p-3 md:w-64"
        />
      </div>

      {loading && (
        <p className="text-center text-gray-500">Cargando reporte...</p>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && report && (
        <>
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-800">
            <p className="text-sm">Fecha consultada</p>
            <p className="text-2xl font-bold">{report.date}</p>
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
                {report.completed_orders || 0}
              </p>
            </div>

            <div className="rounded-xl border bg-orange-50 p-4">
              <p className="text-sm text-gray-600">Órdenes no pagadas</p>
              <p className="text-3xl font-bold text-orange-700">
                {report.unpaid_orders || 0}
              </p>
            </div>

            <div className="rounded-xl border bg-red-50 p-4">
              <p className="text-sm text-gray-600">Canceladas</p>
              <p className="text-3xl font-bold text-red-700">
                {report.cancelled_orders || 0}
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
                {report.payment_counts?.cash || 0} órdenes
              </p>
            </div>

            <div className="rounded-xl border bg-blue-50 p-5">
              <p className="text-sm text-gray-600">Tarjeta</p>
              <p className="text-4xl font-bold text-blue-700">
                {formatMoney(cardTotal)}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {report.payment_counts?.card || 0} órdenes
              </p>
            </div>

            <div className="rounded-xl border bg-purple-50 p-5">
              <p className="text-sm text-gray-600">Transferencia</p>
              <p className="text-4xl font-bold text-purple-700">
                {formatMoney(transferTotal)}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {report.payment_counts?.transfer || 0} órdenes
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
              <p className="text-sm text-gray-600">Órdenes activas actuales</p>
              <p className="text-3xl font-bold text-blue-700">
                {report.active_orders || 0}
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
              Resumen del día
            </h3>

            <div className="space-y-2 text-gray-700">
              <p>
                Ventas totales:{" "}
                <span className="font-bold">{formatMoney(totalSales)}</span>
              </p>

              <p>
                Total por métodos de pago:{" "}
                <span className="font-bold">{formatMoney(expectedTotal)}</span>
              </p>

              <p>
                Incidencias no pagadas:{" "}
                <span className="font-bold text-orange-700">
                  {report.unpaid_orders || 0} órdenes / {formatMoney(unpaidTotal)}
                </span>
              </p>

              <p>
                Órdenes canceladas:{" "}
                <span className="font-bold text-red-700">
                  {report.cancelled_orders || 0}
                </span>
              </p>
            </div>

            {Number(totalSales) === Number(expectedTotal) ? (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-100 p-3 text-green-800">
                Los totales por método coinciden con las ventas consultadas.
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-100 p-3 text-red-800">
                Atención: las ventas totales no coinciden con la suma por método de pago.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}