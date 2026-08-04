import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaArrowRight, FaBuilding, FaEye, FaEyeSlash, FaShieldAlt } from "react-icons/fa";
import { getApiErrorMessage, registerCompany } from "../../services/authService";
import { loginSuccess } from "../../store/authSlice";
import { getDashboardPath } from "../../utils/roleUtils";

const emptyForm = {
  companyName: "",
  industry: "",
  companySize: "",
  adminName: "",
  officialEmail: "",
  mobileNumber: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  password: "",
};

export default function RegisterCompany() {
  const [f, setF] = useState(emptyForm);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const nav = useNavigate();

  const strength =
    f.password.length < 8 ? "Weak" : f.password.length < 12 ? "Good" : "Strong";

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await registerCompany(f);
      dispatch(loginSuccess({ user: r.user, token: r.token, refreshToken: r.refreshToken }));
      nav(getDashboardPath(r.user?.role), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const field = (name, label, type = "text", required = false) => (
    <div className="col-md-6">
      <label className="form-label fw-semibold">{label}</label>
      <input
        className="form-control"
        name={name}
        type={type}
        required={required}
        value={f[name]}
        onChange={(e) => setF({ ...f, [name]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="auth-shell">
      <div className="auth-card row g-0">
        <aside className="auth-aside col-lg-4 d-none d-lg-flex flex-column justify-content-between">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="brand-mark">
                <FaBuilding />
              </span>
              <span className="brand-name">assetflow</span>
            </div>
            <h2 className="mt-5">Start with a workspace your whole company can trust.</h2>
            <p className="text-white-50 mt-3">
              Set up your company account. You&apos;ll become its first administrator.
            </p>
          </div>
          <div className="small text-white-50">
            <FaShieldAlt className="me-2" />
            Secure company workspace setup
          </div>
        </aside>
        <div className="col-lg-8 p-4 p-md-5">
          <div className="mb-4">
            <div className="eyebrow">Create workspace</div>
            <h2>Register your company</h2>
            <p className="muted">Your company administrator account is created instantly.</p>
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={submit}>
            <div className="row g-3">
              {field("companyName", "Company name", "text", true)}
              {field("industry", "Industry", "text", true)}
              {field("companySize", "Company size", "text", true)}
              {field("adminName", "Your full name", "text", true)}
              {field("officialEmail", "Official work email", "email", true)}
              {field("mobileNumber", "Phone number", "tel", true)}
              {field("address", "Address", "text", true)}
              {field("city", "City", "text", true)}
              {field("state", "State", "text", true)}
              {field("country", "Country", "text", true)}
              {field("postalCode", "Postal code", "text", true)}
              <div className="col-12">
                <div className="d-flex justify-content-between">
                  <label className="form-label fw-semibold">Password</label>
                  <small className={strength === "Weak" ? "text-danger" : "text-success"}>
                    {f.password && strength}
                  </small>
                </div>
                <div className="input-group">
                  <input
                    className="form-control border-end-0"
                    type={show ? "text" : "password"}
                    required
                    minLength="8"
                    value={f.password}
                    onChange={(e) => setF({ ...f, password: e.target.value })}
                    placeholder="At least 8 characters"
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
              </div>
            </div>
            <div className="form-check mt-4">
              <input className="form-check-input" required id="terms" type="checkbox" />
              <label className="form-check-label" htmlFor="terms">
                I agree to the <Link className="text-primary" to="/terms">terms of service</Link>.
              </label>
            </div>
            <button className="btn btn-primary mt-4" disabled={busy}>
              {busy ? "Creating workspace..." : (
                <>
                  Register Company <FaArrowRight className="ms-2" />
                </>
              )}
            </button>
            <p className="muted mt-4 mb-0">
              Already have an account?{" "}
              <Link className="text-primary fw-bold" to="/login">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
