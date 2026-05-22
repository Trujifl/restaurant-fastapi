import { useEffect, useState } from "react"

import KitchenView from "./KitchenView"
import TableOrders from "./TableOrders"
import CashierView from "./CashierView"
import AdminPanel from "./AdminPanel"
import AdminProducts from "./AdminProducts"
import AdminTables from "./AdminTables"
import AdminUsers from "./AdminUsers"
import AdminOrders from "./AdminOrders"
import CashClosing from "./CashClosing"
import DailyReports from "./DailyReports"

import Login from "./components/Login"
import { getCurrentUser, getToken, removeToken } from "./auth/authService"

const VALID_ROLES = ["admin", "waiter", "kitchen", "cashier"]

const ADMIN_VIEWS = [
  { id: "admin", label: "🛠️ Admin" },
  { id: "products", label: "📦 Products" },
  { id: "tables", label: "🪑 Tables" },
  { id: "users", label: "👥 Users" },
  { id: "orders", label: "📜 Orders" },
  { id: "closing", label: "🧾 Closing" },
  { id: "reports", label: "📊 Reports" },
  { id: "waiter", label: "🧑‍🍳 Waiter" },
  { id: "kitchen", label: "🍳 Kitchen" },
  { id: "cashier", label: "💳 Cashier" },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [adminView, setAdminView] = useState("admin")
  const [loadingSession, setLoadingSession] = useState(true)

  useEffect(() => {
    async function loadSession() {
      const savedToken = getToken()

      if (!savedToken) {
        setLoadingSession(false)
        return
      }

      try {
        const currentUser = await getCurrentUser()

        setUser(currentUser)
        setToken(savedToken)
      } catch (error) {
        console.error("Session could not be loaded:", error)

        removeToken()
        setUser(null)
        setToken(null)
      } finally {
        setLoadingSession(false)
      }
    }

    loadSession()
  }, [])

  function handleLoginSuccess(userData) {
    const savedToken = getToken()

    setUser(userData)
    setToken(savedToken)
  }

  function handleLogout() {
    removeToken()

    setUser(null)
    setToken(null)
    setAdminView("admin")
  }

  if (loadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white px-8 py-6 text-xl font-semibold text-slate-700 shadow">
          Loading session...
        </div>
      </div>
    )
  }

  if (!user || !token) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  const normalizedRole = user.role?.trim().toLowerCase()

  if (!VALID_ROLES.includes(normalizedRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="max-w-xl rounded-2xl border border-red-200 bg-white p-8 shadow">
          <h1 className="text-3xl font-bold text-red-600">
            Invalid user role
          </h1>

          <p className="mt-4 text-lg text-slate-700">
            Your account has an invalid role:
          </p>

          <p className="mt-2 rounded-lg bg-red-50 px-4 py-3 font-mono text-red-700">
            {user.role || "No role"}
          </p>

          <button
            onClick={handleLogout}
            className="mt-6 rounded-lg bg-red-500 px-5 py-3 font-semibold text-white hover:bg-red-600"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

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
              👤 {user.name || user.email} — Role: {normalizedRole}
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
            {ADMIN_VIEWS.map((view) => (
              <button
                key={view.id}
                onClick={() => setAdminView(view.id)}
                className={`px-6 py-4 text-2xl font-semibold ${
                  adminView === view.id
                    ? "bg-gray-100 ring-2 ring-inset ring-gray-800"
                    : "hover:bg-gray-50"
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
        )}

        {currentView === "admin" && <AdminPanel />}
        {currentView === "products" && <AdminProducts />}
        {currentView === "tables" && <AdminTables />}
        {currentView === "users" && <AdminUsers />}
        {currentView === "orders" && <AdminOrders />}
        {currentView === "closing" && <CashClosing />}
        {currentView === "reports" && <DailyReports />}
        {currentView === "waiter" && <TableOrders />}
        {currentView === "kitchen" && <KitchenView />}
        {currentView === "cashier" && <CashierView />}
      </div>
    </div>
  )
}