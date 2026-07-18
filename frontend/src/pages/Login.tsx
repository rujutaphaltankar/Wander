import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setSession(data.user, data.accessToken, data.refreshToken);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Couldn't log you in. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="font-display text-2xl font-semibold mb-1">Welcome back</div>
        <div className="text-sm text-muted mb-6">Log in to keep planning your route.</div>

        <label className="text-xs text-muted block mb-3">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="card w-full rounded-xl px-3 py-2.5 mt-1 text-sm"
          />
        </label>
        <label className="text-xs text-muted block mb-4">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="card w-full rounded-xl px-3 py-2.5 mt-1 text-sm"
          />
        </label>

        {error && (
          <div className="rounded-xl px-3 py-2.5 text-xs flex items-start gap-2 bg-red-100 text-red-700 mb-4">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Log in"}
        </button>

        <div className="text-xs text-muted text-center mt-4">
          New to Wander? <Link to="/register" className="text-green font-medium">Create an account</Link>
        </div>
      </form>
    </div>
  );
}
