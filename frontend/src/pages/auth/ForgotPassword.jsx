import { useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaEnvelope, FaPaperPlane } from "react-icons/fa";
import { forgotPassword, getApiErrorMessage } from "../../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card p-4 p-md-5" style={{ maxWidth: 540 }}>
        <div className="text-center mx-auto" style={{ maxWidth: 380 }}>
          <span className="empty-icon">
            <FaEnvelope />
          </span>
          <div className="eyebrow mt-4">Account recovery</div>
          <h2>Reset your password</h2>
          <p className="muted">Enter your work email and we&apos;ll send reset instructions.</p>
          {error && <div className="alert alert-danger text-start">{error}</div>}
          {sent ? (
            <div className="alert alert-success text-start">
              If an account exists for this email, reset instructions were queued.
            </div>
          ) : (
            <form onSubmit={submit} className="text-start">
              <label className="form-label fw-semibold">Work email</label>
              <input
                className="form-control mb-3"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
              <button className="btn btn-primary w-100">
                Send reset instructions <FaPaperPlane className="ms-2" />
              </button>
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
