import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";

export default function Register() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      setSession(data.user, data.accessToken, data.refreshToken);
      navigate("/");
    } catch (err: any) {
      const message =
        err.response?.data?.errors?.[0]?.message ??
        err.response?.data?.message ??
        "Couldn't create your account. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="font-display text-2xl font-semibold mb-1">Create your account</div>
        <div className="text-sm text-muted mb-6">Plan smarter trips in a few taps.</div>

        <label className="text-xs text-muted block mb-3">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="card w-full rounded-xl px-3 py-2.5 mt-1 text-sm"
          />
        </label>
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="card w-full rounded-xl px-3 py-2.5 mt-1 text-sm"
          />
          <span className="text-[10px] text-muted">At least 8 characters</span>
        </label>

        {error && (
          <div className="rounded-xl px-3 py-2.5 text-xs flex items-start gap-2 bg-red-100 text-red-700 mb-4">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Create account"}
        </button>

        <div className="text-xs text-muted text-center mt-4">
          Already have an account? <Link to="/login" className="text-green font-medium">Log in</Link>
        </div>
      </form>
    </div>
  );
}
