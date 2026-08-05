import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaArrowRight, FaBuilding, FaEye, FaEyeSlash, FaShieldAlt } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { getApiErrorMessage, login } from "../../services/authService";
import { loginSuccess } from "../../store/authSlice";
import { getDashboardPath } from "../../utils/roleUtils";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", rememberMe: true });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const dispatch = useDispatch();
  const [params] = useSearchParams();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(form);
      dispatch(loginSuccess({ user: res.user, token: res.token, refreshToken: res.refreshToken }));
      nav(getDashboardPath(res.user?.role), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card row g-0">
        <aside className="auth-aside col-lg-5 d-none d-lg-flex flex-column justify-content-between">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="brand-mark">
                <FaBuilding />
              </span>
              <span className="brand-name">assetflow</span>
            </div>
            <div className="mt-5">
              <div className="eyebrow text-white-50">Enterprise asset operations</div>
              <h1 className="mt-3">Bring order to every asset.</h1>
              <p className="text-white-50 mt-3">
                A focused operational workspace for the teams that keep work moving.
              </p>
            </div>
          </div>
          <div className="d-flex gap-2 align-items-center text-white-50 small">
            <FaShieldAlt /> Secure, role-based company workspaces
          </div>
        </aside>
        <div className="col-lg-7 p-4 p-md-5">
          <div className="mx-auto" style={{ maxWidth: 420 }}>
            <Link to="/" className="d-lg-none d-inline-flex align-items-center gap-2 mb-5">
              <span className="brand-mark">
                <FaBuilding />
              </span>
              <span className="brand-name">assetflow</span>
            </Link>
            <div className="eyebrow mb-2">Welcome back</div>
            <h2>Login to your workspace</h2>
            <p className="muted mb-4">Enter your account details to continue.</p>
            {(error || params.get("expired")) && (
              <div className="alert alert-danger py-2">{error || "Your session expired. Please sign in again."}</div>
            )}
            <form onSubmit={submit}>
              <label className="form-label fw-semibold">Work email</label>
              <input
                className="form-control mb-3"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@company.com"
              />
              <div className="d-flex justify-content-between">
                <label className="form-label fw-semibold">Password</label>
                <Link className="small text-primary" to="/forgot-password">
                  Forgot password?
                </Link>
              </div>
              <div className="input-group mb-3">
                <input
                  className="form-control border-end-0"
                  required
                  minLength="8"
                  autoComplete="current-password"
                  type={show ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                />
                <button
                  className="btn btn-light border border-start-0"
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShow(!show)}
                >
                  {show ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <label className="form-check mb-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
                />{" "}
                <span className="form-check-label">Keep me signed in</span>
              </label>
              <button className="btn btn-primary w-100" disabled={loading}>
                {loading ? "Signing you in..." : (
                  <>
                    Login <FaArrowRight className="ms-2" />
                  </>
                )}
              </button>
            </form>
            <p className="muted text-center mt-4 mb-0">
              New to AssetFlow?{" "}
              <Link to="/register-company" className="text-primary fw-bold">
                Register Company
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
