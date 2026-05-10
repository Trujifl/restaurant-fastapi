import { useEffect, useState } from "react"
import axios from "axios"

const PRODUCTS_API = "http://localhost:8000/products/"

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
  })

  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    category: "",
  })

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await axios.get(PRODUCTS_API)
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

      await axios.post(PRODUCTS_API, {
        name: form.name.trim(),
        price: Number(form.price),
        category: form.category.trim() || null,
      })

      resetForm()
      await fetchProducts()
    } catch (err) {
      console.error("Error creating product:", err)
      alert(err.response?.data?.detail || "No se pudo crear el producto.")
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
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditForm({
      name: "",
      price: "",
      category: "",
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

      await axios.patch(`${PRODUCTS_API}${productId}`, {
        name: editForm.name.trim(),
        price: Number(editForm.price),
        category: editForm.category.trim() || null,
      })

      cancelEditing()
      await fetchProducts()
    } catch (err) {
      console.error("Error updating product:", err)
      alert(err.response?.data?.detail || "No se pudo actualizar el producto.")
    } finally {
      setSaving(false)
    }
  }

  const deleteProduct = async (product) => {
    const confirmDelete = window.confirm(
      `¿Seguro que quieres eliminar "${product.name}"?`
    )

    if (!confirmDelete) return

    try {
      setSaving(true)

      await axios.delete(`${PRODUCTS_API}${product.id}`)

      await fetchProducts()
    } catch (err) {
      console.error("Error deleting product:", err)
      alert(err.response?.data?.detail || "No se pudo eliminar el producto.")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            📦 Products Manager
          </h2>
          <p className="mt-1 text-gray-500">
            Create, edit and manage restaurant products.
          </p>
        </div>

        <button
          onClick={fetchProducts}
          className="w-fit rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
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

        <div className="grid gap-4 md:grid-cols-4">
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
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => saveProduct(product.id)}
                            disabled={saving}
                            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-gray-400"
                          >
                            Save
                          </button>

                          <button
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
                            onClick={() => startEditing(product)}
                            className="rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-600"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deleteProduct(product)}
                            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
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