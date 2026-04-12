import { useState } from "react"
import KitchenView from "./KitchenView"
import TableOrders from "./TableOrders"
import CashierView from "./CashierView"

export default function App() {
  const [role, setRole] = useState("kitchen")

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-5xl font-bold text-slate-800 md:text-6xl">
          Restaurant System
        </h1>

        <div className="inline-flex flex-wrap overflow-hidden rounded-2xl border border-gray-200 bg-white shadow">
          <button
            onClick={() => setRole("waiter")}
            className={`px-6 py-4 text-2xl font-semibold ${
              role === "waiter"
                ? "bg-gray-100 ring-2 ring-inset ring-gray-800"
                : "hover:bg-gray-50"
            }`}
          >
            🧑‍🍳 Garzón
          </button>

          <button
            onClick={() => setRole("kitchen")}
            className={`px-6 py-4 text-2xl font-semibold ${
              role === "kitchen"
                ? "bg-gray-100 ring-2 ring-inset ring-gray-800"
                : "hover:bg-gray-50"
            }`}
          >
            🍳 Cocina
          </button>

          <button
            onClick={() => setRole("cashier")}
            className={`px-6 py-4 text-2xl font-semibold ${
              role === "cashier"
                ? "bg-gray-100 ring-2 ring-inset ring-gray-800"
                : "hover:bg-gray-50"
            }`}
          >
            💳 Caja
          </button>
        </div>

        {role === "waiter" && (
          <div className="mt-6">
            <TableOrders />
          </div>
        )}

        {role === "kitchen" && <KitchenView />}

        {role === "cashier" && (
          <div className="mt-6">
            <CashierView />
          </div>
        )}
      </div>
    </div>
  )
}