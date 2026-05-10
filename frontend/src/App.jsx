import { useEffect, useState } from "react"
import KitchenView from "./KitchenView"
import TableOrders from "./TableOrders"
import CashierView from "./CashierView"
import AdminPanel from "./AdminPanel"
import AdminProducts from "./AdminProducts"
import AdminTables from "./AdminTables"
import Login from "./Login"

export default function App() {
  const [user, setUser] = useState(null)
  const [adminView, setAdminView] = useState("admin")

  useEffect(() => {
    const savedUser = localStorage.getItem("user")

    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData))
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    setUser(null)
    setAdminView("admin")
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  const normalizedRole = user.role?.trim().toLowerCase()
  const currentView = normalizedRole === "admin" ? adminView : normalizedRole

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-5xl font-bold text-slate-800">
              Restaurant System
            </h1>

            <p className="mt-3 text-lg text-gray-600">
              👤 {user.name} — Role: {normalizedRole}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-fit rounded-lg bg-red-500 px-5 py-3 font-semibold text-white hover:bg-red-600"
          >
            Cerrar sesión
          </button>
        </div>

        {normalizedRole === "admin" && (
          <div className="mb-6 inline-flex flex-wrap overflow-hidden rounded-2xl border border-gray-200 bg-white shadow">
            <button
              onClick={() => setAdminView("admin")}
              className={`px-6 py-4 text-2xl font-semibold ${
                adminView === "admin"
                  ? "bg-gray-100 ring-2 ring-inset ring-gray-800"
                  : "hover:bg-gray-50"
              }`}
            >
              🛠️ Admin
            </button>

            <button
              onClick={() => setAdminView("products")}
              className={`px-6 py-4 text-2xl font-semibold ${
                adminView === "products"
                  ? "bg-gray-100 ring-2 ring-inset ring-gray-800"
                  : "hover:bg-gray-50"
              }`}
            >
              📦 Products
            </button>

            <button
              onClick={() => setAdminView("tables")}
              className={`px-6 py-4 text-2xl font-semibold ${
                adminView === "tables"
                  ? "bg-gray-100 ring-2 ring-inset ring-gray-800"
                  : "hover:bg-gray-50"
              }`}
            >
              🪑 Tables
            </button>

            <button
              onClick={() => setAdminView("waiter")}
              className={`px-6 py-4 text-2xl font-semibold ${
                adminView === "waiter"
                  ? "bg-gray-100 ring-2 ring-inset ring-gray-800"
                  : "hover:bg-gray-50"
              }`}
            >
              🧑‍🍳 Waiter
            </button>

            <button
              onClick={() => setAdminView("kitchen")}
              className={`px-6 py-4 text-2xl font-semibold ${
                adminView === "kitchen"
                  ? "bg-gray-100 ring-2 ring-inset ring-gray-800"
                  : "hover:bg-gray-50"
              }`}
            >
              🍳 Kitchen
            </button>

            <button
              onClick={() => setAdminView("cashier")}
              className={`px-6 py-4 text-2xl font-semibold ${
                adminView === "cashier"
                  ? "bg-gray-100 ring-2 ring-inset ring-gray-800"
                  : "hover:bg-gray-50"
              }`}
            >
              💳 Cashier
            </button>
          </div>
        )}

        {currentView === "admin" && <AdminPanel />}
        {currentView === "products" && <AdminProducts />}
        {currentView === "tables" && <AdminTables />}
        {currentView === "waiter" && <TableOrders />}
        {currentView === "kitchen" && <KitchenView />}
        {currentView === "cashier" && <CashierView />}

        {!["waiter", "kitchen", "cashier", "admin"].includes(normalizedRole) && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            Invalid role: {user.role}
          </div>
        )}
      </div>
    </div>
  )
}