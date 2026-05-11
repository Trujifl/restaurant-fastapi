import { useState } from "react"
import { login, getCurrentUser, saveToken } from "../auth/authService"

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("admin@restaurant.com")
  const [password, setPassword] = useState("123456")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setError("")
    setLoading(true)

    try {
      const loginData = await login(email, password)

      saveToken(loginData.access_token)

      const user = await getCurrentUser()

      onLoginSuccess(user)
    } catch (error) {
      console.error(error)

      const detail = error.response?.data?.detail

      if (typeof detail === "string") {
        setError(detail)
      } else {
        setError("Invalid email or password")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-800">
            Restaurant Login
          </h1>
          <p className="mt-2 text-slate-500">
            Enter your account to access the system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@restaurant.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="mb-1 font-semibold text-slate-700">
            Development admin:
          </p>
          <p>Email: admin@restaurant.com</p>
          <p>Password: 123456</p>
        </div>
      </div>
    </div>
  )
}

export default Login