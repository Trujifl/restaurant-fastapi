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
    is_active: true,
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
      is_active: true,
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
        is_active: form.is_active,
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
    if (!table.is_active) {
      alert("No puedes cambiar el estado de una mesa inactiva.")
      return
    }

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

  const toggleTableActiveStatus = async (table) => {
    try {
      setSaving(true)

      await api.patch(`/tables/${table.id}/active?is_active=${!table.is_active}`)

      await fetchTables()
    } catch (err) {
      console.error("Error changing table active status:", err)
      alert(getErrorMessage(err) || "No se pudo cambiar el estado activo de la mesa.")
    } finally {
      setSaving(false)
    }
  }

  const deleteTable = async (table) => {
    const confirmDelete = window.confirm(
      `¿Seguro que quieres desactivar la mesa #${table.number}?\n\nNo se eliminará del historial, solo dejará de aparecer para nuevas operaciones.`
    )

    if (!confirmDelete) return

    try {
      setSaving(true)

      await api.delete(`/tables/${table.id}`)

      await fetchTables()
    } catch (err) {
      console.error("Error disabling table:", err)
      alert(
        getErrorMessage(err) ||
          "No se pudo desactivar la mesa. Puede que tenga una orden activa."
      )
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status) => {
    if (status === "occupied") {
      return "bg-red-100 text-red-700"
    }

    if (status === "reserved") {
      return "bg-yellow-100 text-yellow-700"
    }

    return "bg-green-100 text-green-700"
  }

  const getActiveBadge = (isActive) => {
    if (isActive) {
      return "bg-green-100 text-green-700"
    }

    return "bg-red-100 text-red-700"
  }

  const getStatusLabel = (status) => {
    if (status === "occupied") return "Occupied"
    if (status === "available") return "Available"
    if (status === "reserved") return "Reserved"
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
            Create, monitor, activate and deactivate restaurant tables.
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

        <div className="grid gap-4 md:grid-cols-4">
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
            <option value="reserved">Reserved</option>
          </select>

          <select
            value={String(form.is_active)}
            onChange={(e) =>
              setForm({ ...form, is_active: e.target.value === "true" })
            }
            className="rounded-lg border p-3"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
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
                  Active
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
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${getActiveBadge(
                        table.is_active
                      )}`}
                    >
                      {table.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => changeTableStatus(table)}
                        disabled={saving || !table.is_active}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:bg-gray-400 ${
                          table.is_active
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Change status
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleTableActiveStatus(table)}
                        disabled={saving}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:bg-gray-400 ${
                          table.is_active
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {table.is_active ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteTable(table)}
                        disabled={saving || !table.is_active}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:bg-gray-400 ${
                          table.is_active
                            ? "bg-red-800 hover:bg-red-900"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Disable
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