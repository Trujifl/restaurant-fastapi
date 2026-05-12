import { useEffect, useState } from "react"
import api from "./api/axios"

const ROLES = ["admin", "waiter", "kitchen", "cashier"]

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "waiter",
    password: "",
  })

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "waiter",
    is_active: true,
    password: "",
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

  const fetchUsers = async () => {
    try {
      setLoading(true)

      const res = await api.get("/users/")

      setUsers(res.data)
      setError("")
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("No se pudieron cargar los usuarios.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      role: "waiter",
      password: "",
    })
  }

  const createUser = async (e) => {
    e.preventDefault()

    if (!form.name.trim()) {
      alert("El nombre es obligatorio.")
      return
    }

    if (!form.email.trim()) {
      alert("El email es obligatorio.")
      return
    }

    if (!form.password.trim()) {
      alert("La contraseña es obligatoria.")
      return
    }

    try {
      setSaving(true)

      await api.post("/users/", {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        password: form.password,
      })

      resetForm()
      await fetchUsers()
    } catch (err) {
      console.error("Error creating user:", err)
      alert(getErrorMessage(err) || "No se pudo crear el usuario.")
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (user) => {
    setEditingId(user.id)

    setEditForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "waiter",
      is_active: Boolean(user.is_active),
      password: "",
    })
  }

  const cancelEditing = () => {
    setEditingId(null)

    setEditForm({
      name: "",
      email: "",
      role: "waiter",
      is_active: true,
      password: "",
    })
  }

  const saveUser = async (userId) => {
    if (!editForm.name.trim()) {
      alert("El nombre es obligatorio.")
      return
    }

    if (!editForm.email.trim()) {
      alert("El email es obligatorio.")
      return
    }

    const payload = {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      role: editForm.role,
      is_active: editForm.is_active,
    }

    if (editForm.password.trim()) {
      payload.password = editForm.password
    }

    try {
      setSaving(true)

      await api.patch(`/users/${userId}`, payload)

      cancelEditing()
      await fetchUsers()
    } catch (err) {
      console.error("Error updating user:", err)
      alert(getErrorMessage(err) || "No se pudo actualizar el usuario.")
    } finally {
      setSaving(false)
    }
  }

  const toggleUserStatus = async (user) => {
    try {
      setSaving(true)

      await api.patch(`/users/${user.id}/status?is_active=${!user.is_active}`)

      await fetchUsers()
    } catch (err) {
      console.error("Error changing user status:", err)
      alert(getErrorMessage(err) || "No se pudo cambiar el estado.")
    } finally {
      setSaving(false)
    }
  }

  const deleteUser = async (user) => {
    const confirmDelete = window.confirm(
      `¿Seguro que quieres eliminar al usuario "${user.name}"?\n\nSi tiene órdenes asociadas, el backend no permitirá borrarlo.`
    )

    if (!confirmDelete) return

    try {
      setSaving(true)

      await api.delete(`/users/${user.id}`)

      await fetchUsers()
    } catch (err) {
      console.error("Error deleting user:", err)
      alert(
        getErrorMessage(err) ||
          "No se pudo eliminar el usuario. Prueba desactivarlo."
      )
    } finally {
      setSaving(false)
    }
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700"
      case "waiter":
        return "bg-blue-100 text-blue-700"
      case "kitchen":
        return "bg-orange-100 text-orange-700"
      case "cashier":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            👥 Users Manager
          </h2>

          <p className="mt-1 text-gray-500">
            Create, edit and manage restaurant staff accounts.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={saving}
          className="w-fit rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          Refresh
        </button>
      </div>

      <form
        onSubmit={createUser}
        className="mb-6 rounded-xl border bg-gray-50 p-4"
      >
        <h3 className="mb-4 text-xl font-bold text-gray-800">
          ➕ Create user
        </h3>

        <div className="grid gap-4 md:grid-cols-5">
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border p-3"
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-lg border p-3"
          />

          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="rounded-lg border p-3"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="rounded-lg border p-3"
          />

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

      {loading && <p className="text-center text-gray-500">Loading users...</p>}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {!loading && users.length === 0 && (
        <div className="rounded-xl border bg-gray-50 p-6 text-center text-gray-500">
          No users registered yet.
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3 text-sm font-semibold text-gray-600">ID</th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Name
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Email
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Role
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Active
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  New password
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => {
                const isEditing = editingId === user.id

                return (
                  <tr key={user.id} className="border-b">
                    <td className="p-3 font-medium text-gray-800">
                      #{user.id}
                    </td>

                    <td className="p-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border p-2"
                        />
                      ) : (
                        <span className="font-medium text-gray-800">
                          {user.name}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {isEditing ? (
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              email: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border p-2"
                        />
                      ) : (
                        <span className="text-gray-700">{user.email}</span>
                      )}
                    </td>

                    <td className="p-3">
                      {isEditing ? (
                        <select
                          value={editForm.role}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              role: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border p-2"
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${getRoleBadge(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {isEditing ? (
                        <select
                          value={String(editForm.is_active)}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              is_active: e.target.value === "true",
                            })
                          }
                          className="w-full rounded-lg border p-2"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      ) : (
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${
                            user.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {isEditing ? (
                        <input
                          type="password"
                          placeholder="Leave blank to keep"
                          value={editForm.password}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              password: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border p-2"
                        />
                      ) : (
                        <span className="text-gray-400">Hidden</span>
                      )}
                    </td>

                    <td className="p-3">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => saveUser(user.id)}
                            disabled={saving}
                            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-gray-400"
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            onClick={cancelEditing}
                            disabled={saving}
                            className="rounded-lg bg-gray-500 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-600 disabled:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(user)}
                            className="rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-600"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleUserStatus(user)}
                            disabled={saving}
                            className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:bg-gray-400 ${
                              user.is_active
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {user.is_active ? "Deactivate" : "Activate"}
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteUser(user)}
                            disabled={saving}
                            className="rounded-lg bg-red-800 px-3 py-2 text-sm font-semibold text-white hover:bg-red-900 disabled:bg-gray-400"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}