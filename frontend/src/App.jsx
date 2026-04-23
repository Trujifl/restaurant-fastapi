import { useState } from "react"
import KitchenView from "./KitchenView"
import TableOrders from "./TableOrders"
import CashierView from "./CashierView"
import Login from "./Login"

export default function App() {
  const [user, setUser] = useState(null)

  if (!user) {
    return <Login onLogin={setUser} />
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-5xl font-bold text-slate-800">
          Restaurant System
        </h1>

        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setUser(null)}
            className="rounded-lg bg-red-500 px-4 py-2 text-white"
          >
            Cerrar sesión
          </button>
        </div>

        {user.role === "waiter" && <TableOrders />}
        {user.role === "kitchen" && <KitchenView />}
        {user.role === "cashier" && <CashierView />}
      </div>
    </div>
  )
}