import { useEffect, useState } from "react"
import api from "./api/axios"

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    is_active: true,
  })

  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    category: "",
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

  const fetchProducts = async () => {
    try {
      setLoading(true)

      const res = await api.get("/products/")

      setProducts(res.data)
      setError("")
    } catch (err) {
      console.error("Error fetching products:", err)
      setError("No se pudieron cargar los productos.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      name: "",
      price: "",
      category: "",
      is_active: true,
    })
  }

  const handleCreateProduct = async (e) => {
    e.preventDefault()

    if (!form.name.trim()) {
      alert("El nombre del producto es obligatorio.")
      return
    }

    if (!form.price || Number(form.price) <= 0) {
      alert("El precio debe ser mayor a 0.")
      return
    }

    try {
      setSaving(true)

      await api.post("/products/", {
        name: form.name.trim(),
        price: Number(form.price),
        category: form.category.trim() || null,
        is_active: form.is_active,
      })

      resetForm()
      await fetchProducts()
    } catch (err) {
      console.error("Error creating product:", err)
      alert(getErrorMessage(err) || "No se pudo crear el producto.")
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (product) => {
    setEditingId(product.id)
    setEditForm({
      name: product.name || "",
      price: String(product.price ?? ""),
      category: product.category || "",
      is_active: Boolean(product.is_active),
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditForm({
      name: "",
      price: "",
      category: "",
      is_active: true,
    })
  }

  const saveProduct = async (productId) => {
    if (!editForm.name.trim()) {
      alert("El nombre del producto es obligatorio.")
      return
    }

    if (!editForm.price || Number(editForm.price) <= 0) {
      alert("El precio debe ser mayor a 0.")
      return
    }

    try {
      setSaving(true)

      await api.patch(`/products/${productId}`, {
        name: editForm.name.trim(),
        price: Number(editForm.price),
        category: editForm.category.trim() || null,
        is_active: editForm.is_active,
      })

      cancelEditing()
      await fetchProducts()
    } catch (err) {
      console.error("Error updating product:", err)
      alert(getErrorMessage(err) || "No se pudo actualizar el producto.")
    } finally {
      setSaving(false)
    }
  }

  const toggleProductStatus = async (product) => {
    try {
      setSaving(true)

      await api.patch(`/products/${product.id}/status?is_active=${!product.is_active}`)

      await fetchProducts()
    } catch (err) {
      console.error("Error changing product status:", err)
      alert(getErrorMessage(err) || "No se pudo cambiar el estado del producto.")
    } finally {
      setSaving(false)
    }
  }

  const deleteProduct = async (product) => {
    const confirmDelete = window.confirm(
      `¿Seguro que quieres desactivar "${product.name}"?\n\nNo se eliminará del historial, solo dejará de aparecer para nuevas órdenes.`
    )

    if (!confirmDelete) return

    try {
      setSaving(true)

      await api.delete(`/products/${product.id}`)

      await fetchProducts()
    } catch (err) {
      console.error("Error disabling product:", err)
      alert(getErrorMessage(err) || "No se pudo desactivar el producto.")
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return "bg-green-100 text-green-700"
    }

    return "bg-red-100 text-red-700"
  }

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            📦 Products Manager
          </h2>
          <p className="mt-1 text-gray-500">
            Create, edit, activate and deactivate restaurant products.
          </p>
        </div>

        <button
          onClick={fetchProducts}
          disabled={saving}
          className="w-fit rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          Refresh
        </button>
      </div>

      <form
        onSubmit={handleCreateProduct}
        className="mb-6 rounded-xl border bg-gray-50 p-4"
      >
        <h3 className="mb-4 text-xl font-bold text-gray-800">
          ➕ Create product
        </h3>

        <div className="grid gap-4 md:grid-cols-5">
          <input
            type="text"
            placeholder="Product name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border p-3"
          />

          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="rounded-lg border p-3"
            min="0"
            step="0.01"
          />

          <input
            type="text"
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-lg border p-3"
          />

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
        <p className="text-center text-gray-500">Loading products...</p>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="rounded-xl border bg-gray-50 p-6 text-center text-gray-500">
          No products registered yet.
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3 text-sm font-semibold text-gray-600">ID</th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Name
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Price
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600">
                  Category
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
              {products.map((product) => {
                const isEditing = editingId === product.id

                return (
                  <tr key={product.id} className="border-b">
                    <td className="p-3 font-medium text-gray-800">
                      #{product.id}
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
                          {product.name}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.price}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              price: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border p-2"
                          min="0"
                          step="0.01"
                        />
                      ) : (
                        <span className="text-gray-700">
                          ${Number(product.price).toFixed(2)}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.category}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              category: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border p-2"
                        />
                      ) : (
                        <span className="text-gray-700">
                          {product.category || "-"}
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
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadge(
                            product.is_active
                          )}`}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => saveProduct(product.id)}
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
                            onClick={() => startEditing(product)}
                            className="rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-600"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleProductStatus(product)}
                            disabled={saving}
                            className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:bg-gray-400 ${
                              product.is_active
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {product.is_active ? "Deactivate" : "Activate"}
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteProduct(product)}
                            disabled={saving || !product.is_active}
                            className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:bg-gray-400 ${
                              product.is_active
                                ? "bg-red-800 hover:bg-red-900"
                                : "bg-gray-400 cursor-not-allowed"
                            }`}
                          >
                            Disable
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