<<<<<<< HEAD
import { useEffect, useState } from "react";
import axios from "axios";
import { FaTrash, FaEdit } from "react-icons/fa";

export default function ProductApp() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", category: "" });

  const API_BASE = "http://localhost:8000/products/";

  const fetchProducts = async () => {
    const res = await axios.get(API_BASE);
    console.log("Productos desde backend:", res.data);
    setProducts(res.data);
  };
  const deleteProduct = async (id) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar este producto?"
    );
    if (!confirmDelete) return;
    await axios.delete(`${API_BASE}${id}`);
    fetchProducts();
  };
  const createProduct = async () => {
    if (!form.name || !form.price) return;
    await axios.post(API_BASE, {
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
    });
    setForm({ name: "", price: "", category: "" });
    fetchProducts();
  };

  const updateProduct = async () => {
    if (!form.name.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    if (!form.price || parseFloat(form.price) <= 0) {
      alert("El precio debe ser mayor a 0");
      return;
    }

    await axios.patch(`${API_BASE}${editingId}`, {
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
    });

    setForm({ name: "", price: "", category: "" });
    setEditingId(null);
    fetchProducts();
  };

  const [searchTerm, setSearchTerm] = useState("");
  const filteredProducts = products.filter((product) => {
    const query = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      (product.category && product.category.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        🧾Gestión de Productos
      </h1>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <input
          type="text"
          placeholder="Buscar por nombre o categoría"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="col-span-3 p-2 border border-gray-400 rounded"
        />
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="p-2 border rounded"
        />
        <button
          onClick={() => {
            if (editingId) {
              updateProduct();
            } else {
              createProduct();
            }
          }}
          className="col-span-3 p-2 bg-blue-600 text-white rounded"
        >
          {editingId ? "Update Product" : "Add Product"}
        </button>
      </div>

      <table className="w-full border mt-6">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">ID</th>
            <th className="p-2">Name</th>
            <th className="p-2">Price</th>
            <th className="p-2">Category</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center p-4 text-gray-500">
                🔍 No se encontraron productos que coincidan.
              </td>
            </tr>
          ) : (
            filteredProducts.map((product) => (
              <tr key={product.id} className="text-center border-t">
                <td className="p-2">{product.id}</td>
                <td className="p-2">{product.name}</td>
                <td className="p-2">${product.price}</td>
                <td className="p-2">{product.category}</td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => {
                      setForm(product);
                      setEditingId(product.id);
                    }}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <FaEdit />
                    Editar
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <FaTrash />
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
=======
import { useEffect, useState } from "react";
import axios from "axios";
import { FaTrash, FaEdit } from "react-icons/fa";

export default function ProductApp() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", category: "" });

  const API_BASE = "http://localhost:8000/products/";

  const fetchProducts = async () => {
    const res = await axios.get(API_BASE);
    console.log("Productos desde backend:", res.data);
    setProducts(res.data);
  };
  const deleteProduct = async (id) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar este producto?"
    );
    if (!confirmDelete) return;
    await axios.delete(`${API_BASE}${id}`);
    fetchProducts();
  };
  const createProduct = async () => {
    if (!form.name || !form.price) return;
    await axios.post(API_BASE, {
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
    });
    setForm({ name: "", price: "", category: "" });
    fetchProducts();
  };

  const updateProduct = async () => {
    if (!form.name.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    if (!form.price || parseFloat(form.price) <= 0) {
      alert("El precio debe ser mayor a 0");
      return;
    }

    await axios.patch(`${API_BASE}${editingId}`, {
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
    });

    setForm({ name: "", price: "", category: "" });
    setEditingId(null);
    fetchProducts();
  };

  const [searchTerm, setSearchTerm] = useState("");
  const filteredProducts = products.filter((product) => {
    const query = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      (product.category && product.category.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        🧾Gestión de Productos
      </h1>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <input
          type="text"
          placeholder="Buscar por nombre o categoría"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="col-span-3 p-2 border border-gray-400 rounded"
        />
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="p-2 border rounded"
        />
        <button
          onClick={() => {
            if (editingId) {
              updateProduct();
            } else {
              createProduct();
            }
          }}
          className="col-span-3 p-2 bg-blue-600 text-white rounded"
        >
          {editingId ? "Update Product" : "Add Product"}
        </button>
      </div>

      <table className="w-full border mt-6">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">ID</th>
            <th className="p-2">Name</th>
            <th className="p-2">Price</th>
            <th className="p-2">Category</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center p-4 text-gray-500">
                🔍 No se encontraron productos que coincidan.
              </td>
            </tr>
          ) : (
            filteredProducts.map((product) => (
              <tr key={product.id} className="text-center border-t">
                <td className="p-2">{product.id}</td>
                <td className="p-2">{product.name}</td>
                <td className="p-2">${product.price}</td>
                <td className="p-2">{product.category}</td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => {
                      setForm(product);
                      setEditingId(product.id);
                    }}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <FaEdit />
                    Editar
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <FaTrash />
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
>>>>>>> 88aa4b9671e6c4e767141c467d19c6a98d9323b6
