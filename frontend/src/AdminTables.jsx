import { useEffect, useState } from "react"
import api from "./api/axios"

export default function AdminTables() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    number: "",
    status: "available",
  })

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

  const fetchTables = async () => {
    try {
      setLoading(true)

      const res = await api.get("/tables/")

      setTables(res.data)
      setError("")
    } catch (err) {
      console.error("Error fetching tables:", err)
      setError("No se pudieron cargar las mesas.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      number: "",
      status: "available",
    })
  }

  const createTable = async (e) => {
    e.preventDefault()

    if (!form.number || Number(form.number) <= 0) {
      alert("El número de mesa debe ser mayor a 0.")
      return
    }

    const tableExists = tables.some(
      (table) => Number(table.number) === Number(form.number)
    )

    if (tableExists) {
      alert("Ya existe una mesa con ese número.")
      return
    }

    try {
      setSaving(true)

      await api.post("/tables/", {
        number: Number(form.number),
        status: form.status,
      })

      resetForm()
      await fetchTables()
    } catch (err) {
      console.error("Error creating table:", err)
      alert(getErrorMessage(err) || "No se pudo crear la mesa.")
    } finally {
      setSaving(false)
    }
  }

  const changeTableStatus = async (table) => {
    const newStatus = table.status === "occupied" ? "available" : "occupied"

    try {
      setSaving(true)

      await api.patch(`/tables/${table.id}/status`, {
        status: newStatus,
      })

      await fetchTables()
    } catch (err) {
      console.error("Error changing table status:", err)
      alert(getErrorMessage(err) || "No se pudo cambiar el estado.")
    } finally {
      setSaving(false)
    }
  }

  const deleteTable = async (table) => {
    const confirmDelete = window.confirm(
      `¿Seguro que quieres eliminar la mesa #${table.number}?`
    )

    if (!confirmDelete) return

    try {
      setSaving(true)

      await api.delete(`/tables/${table.id}`)

      await fetchTables()
    } catch (err) {
      console.error("Error deleting table:", err)
      alert(
        getErrorMessage(err) ||
          "No se pudo eliminar la mesa. Puede que tenga órdenes asociadas."
      )
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status) => {
    if (status === "occupied") {
      return "bg-red-100 text-red-700"
    }

    return "bg-green-100 text-green-700"
  }

  const getStatusLabel = (status) => {
    if (status === "occupied") return "Occupied"
    if (status === "available") return "Available"
    return status
  }

  useEffect(() => {
    fetchTables()
  }, [])

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            🪑 Tables Manager
          </h2>
          <p className="mt-1 text-gray-500">
            Create, monitor and manage restaurant tables.
          </p>
        </div>

        <button
          onClick={fetchTables}
          disabled={saving}
          className="w-fit rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          Refresh
        </button>
      </div>

      <form
        onSubmit={createTable}
        className="mb-6 rounded-xl border bg-gray-50 p-4"
      >
        <h3 className="mb-4 text-xl font-bold text-gray-800">
          ➕ Create table
        </h3>

        <div className="grid gap-4 md:grid-cols-3">
          <input
            type="number"
            placeholder="Table number"
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            className="rounded-lg border p-3"
            min="1"
          />

          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="rounded-lg border p-3"
          >
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
          </select>

          <button
            type="submit"
            disabled={saving}
            className={`rounded-lg px-4 py-3 font-semibold text-white ${
              saving
                ? "cursor-not-allowed bg-gray-400"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {saving ? "Saving..." : "Create"}
          </button>
        </div>
      </form>

      {loading && (
        <p className="text-center text-gray-500">Loading tables...</p>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {!loading && tables.length === 0 && (
        <div className="rounded-xl border bg-gray-50 p-6 text-center text-gray-500">
          No tables registered yet.
        </div>
      )}

      {!loading && tables.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3 text-sm font-semibold text-gray-600">ID</th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Table number
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Status
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {tables.map((table) => (
                <tr key={table.id} className="border-b">
                  <td className="p-3 font-medium text-gray-800">
                    #{table.id}
                  </td>

                  <td className="p-3 font-medium text-gray-800">
                    Table #{table.number}
                  </td>

                  <td className="p-3">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadge(
                        table.status
                      )}`}
                    >
                      {getStatusLabel(table.status)}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => changeTableStatus(table)}
                        disabled={saving}
                        className="rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-600 disabled:bg-gray-400"
                      >
                        Change status
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteTable(table)}
                        disabled={saving}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-gray-400"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}