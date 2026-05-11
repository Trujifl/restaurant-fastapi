import { useState } from "react";
import { login, getCurrentUser, saveToken } from "../auth/authService";

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("admin@restaurant.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const loginData = await login(email, password);

      saveToken(loginData.access_token);

      const user = await getCurrentUser();

      onLoginSuccess(user);
    } catch (error) {
      console.error(error);
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-800">
            Restaurant Login
          </h1>
          <p className="text-slate-500 mt-2">
            Enter your account to access the system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
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
            <label className="block text-sm font-semibold text-slate-700 mb-1">
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
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 text-white font-bold py-3 hover:bg-blue-700 disabled:bg-blue-300 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-700 mb-1">Development admin:</p>
          <p>Email: admin@restaurant.com</p>
          <p>Password: 123456</p>
        </div>
      </div>
    </div>
  );
}

export default Login;