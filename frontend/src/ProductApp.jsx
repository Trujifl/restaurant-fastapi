import { useEffect, useState } from "react"
import api from "./api/axios"

export default function ProductApp() {
  const [products, setProducts] = useState([])
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")

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
      const res = await api.get("/products/")
      setProducts(res.data)
      setError("")
    } catch (error) {
      console.error("Error fetching products:", error)
      setError("No se pudieron cargar los productos.")
    }
  }

  const resetForm = () => {
    setName("")
    setPrice("")
    setCategory("")
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!name.trim()) {
      alert("El nombre es obligatorio.")
      return
    }

    if (!price || Number(price) <= 0) {
      alert("El precio debe ser mayor a 0.")
      return
    }

    const payload = {
      name: name.trim(),
      price: Number(price),
      category: category.trim() || null,
    }

    try {
      if (editingId) {
        await api.patch(`/products/${editingId}`, payload)
      } else {
        await api.post("/products/", payload)
      }

      resetForm()
      await fetchProducts()
    } catch (error) {
      console.error("Error saving product:", error)
      alert(getErrorMessage(error) || "No se pudo guardar el producto.")
    }
  }

  const handleEdit = (product) => {
    setEditingId(product.id)
    setName(product.name || "")
    setPrice(String(product.price ?? ""))
    setCategory(product.category || "")
  }

  const handleDelete = async (productId) => {
    const confirmDelete = window.confirm("¿Seguro que quieres eliminar este producto?")

    if (!confirmDelete) return

    try {
      await api.delete(`/products/${productId}`)
      await fetchProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      alert(getErrorMessage(error) || "No se pudo eliminar el producto.")
    }
  }

  const filteredProducts = products.filter((product) => {
    const query = searchTerm.toLowerCase()

    return (
      product.name.toLowerCase().includes(query) ||
      String(product.category || "").toLowerCase().includes(query)
    )
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 shadow">
        <h1 className="mb-6 text-center text-4xl font-bold text-slate-800">
          Product Manager
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-4 rounded-xl border bg-gray-50 p-4 md:grid-cols-4"
        >
          <input
            type="text"
            placeholder="Product name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-lg border p-3"
          />

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="rounded-lg border p-3"
            min="0"
            step="0.01"
          />

          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-lg border p-3"
          />

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            {editingId ? "Update" : "Create"}
          </button>
        </form>

        {editingId && (
          <div className="mb-4">
            <button
              onClick={resetForm}
              className="rounded-lg bg-gray-500 px-4 py-2 font-semibold text-white hover:bg-gray-600"
            >
              Cancel edit
            </button>
          </div>
        )}

        <input
          type="text"
          placeholder="Search by name or category..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="mb-6 w-full rounded-lg border p-3"
        />

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="rounded-xl border bg-gray-50 p-6 text-center text-gray-500">
            No products found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-sm font-semibold text-gray-600">ID</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Name</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Price</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Category</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b">
                    <td className="p-3 font-medium text-gray-800">#{product.id}</td>

                    <td className="p-3 font-medium text-gray-800">
                      {product.name}
                    </td>

                    <td className="p-3 text-gray-700">
                      ${Number(product.price).toFixed(2)}
                    </td>

                    <td className="p-3 text-gray-700">
                      {product.category || "-"}
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-600"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(product.id)}
                          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
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
    </div>
  )
}