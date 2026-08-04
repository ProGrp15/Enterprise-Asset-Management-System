import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaArrowLeft, FaKey } from "react-icons/fa";
import { getApiErrorMessage, resetPassword } from "../../services/authService";

export default function ResetPassword() {
  const [p, setP] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [params] = useSearchParams();

  const submit = async (e) => {
    e.preventDefault();
    if (p !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    try {
      await resetPassword({ token: params.get("token"), password: p });
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card p-4 p-md-5" style={{ maxWidth: 540 }}>
        <div className="text-center mx-auto" style={{ maxWidth: 380 }}>
          <span className="empty-icon">
            <FaKey />
          </span>
          <div className="eyebrow mt-4">Secure account</div>
          <h2>Create a new password</h2>
          <p className="muted">Use a strong password with at least 8 characters.</p>
          {error && <div className="alert alert-danger text-start">{error}</div>}
          {done ? (
            <div className="alert alert-success text-start">
              Your password has been updated. You can now log in again.
            </div>
          ) : (
            <form className="text-start" onSubmit={submit}>
              <label className="form-label fw-semibold">New password</label>
              <input
                className="form-control mb-3"
                type="password"
                required
                minLength="8"
                value={p}
                onChange={(e) => setP(e.target.value)}
              />
              <label className="form-label fw-semibold">Confirm password</label>
              <input
                className="form-control mb-3"
                type="password"
                required
                minLength="8"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <button className="btn btn-primary w-100">Reset password</button>
            </form>
          )}
          <Link className="d-inline-block mt-4 text-primary fw-bold" to="/login">
            <FaArrowLeft className="me-2" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
