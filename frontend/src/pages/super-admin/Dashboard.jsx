import { useEffect, useState } from "react";
import { FaBuilding, FaUsers, FaBoxes, FaBan, FaCheckCircle, FaSyncAlt } from "react-icons/fa";
import { getSuperAdminDashboard } from "../../services/dashboardService";
import { updatePlatformCompanyStatus } from "../../services/authService";

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [toggling, setToggling] = useState(null);

  const load = async () => {
    try {
      const response = await getSuperAdminDashboard();
      setDashboard(response);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load dashboard.");
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (company) => {
    const action = company.active ? "Suspend" : "Activate";
    if (!window.confirm(`${action} "${company.name}"?`)) return;
    setToggling(company.id);
    try {
      await updatePlatformCompanyStatus(company.id, !company.active);
      setSuccess(`"${company.name}" has been ${company.active ? "suspended" : "activated"}.`);
      load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to update company status.");
    } finally {
      setToggling(null);
    }
  };

  const stats = dashboard?.stats || {};
  const companies = dashboard?.companies || [];
  const activeCount = companies.filter(c => c.active).length;
  const suspendedCount = companies.filter(c => !c.active).length;

  return (
    <div>
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
        <div>
          <div className="eyebrow">Platform control</div>
          <h1 className="h3 fw-bold mb-1">Super Admin Dashboard</h1>
          <p className="text-secondary mb-0">Monitor and manage all companies on the platform.</p>
        </div>
        <button className="btn btn-ghost" onClick={load}>
          <FaSyncAlt className="me-2" />Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center mb-3">
          <span>{error}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setError("")}>✕</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success d-flex justify-content-between align-items-center mb-3">
          <span>{success}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setSuccess("")}>✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="surface p-4">
            <div className="d-flex align-items-center gap-3 mb-2">
              <FaBuilding className="text-primary fs-5" />
              <span className="text-secondary small">Total Companies</span>
            </div>
            <div className="display-6 fw-bold">{stats.companies ?? 0}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="surface p-4">
            <div className="d-flex align-items-center gap-3 mb-2">
              <FaCheckCircle className="text-success fs-5" />
              <span className="text-secondary small">Active</span>
            </div>
            <div className="display-6 fw-bold text-success">{activeCount}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="surface p-4">
            <div className="d-flex align-items-center gap-3 mb-2">
              <FaBan className="text-danger fs-5" />
              <span className="text-secondary small">Suspended</span>
            </div>
            <div className="display-6 fw-bold text-danger">{suspendedCount}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="surface p-4">
            <div className="d-flex align-items-center gap-3 mb-2">
              <FaUsers className="text-primary fs-5" />
              <span className="text-secondary small">Platform Users</span>
            </div>
            <div className="display-6 fw-bold">{stats.users ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Companies table with controls */}
      <section className="surface p-4">
        <h2 className="h5 fw-semibold mb-3">Companies</h2>
        {!dashboard ? (
          <div className="p-4 text-center"><div className="spinner-border text-primary" /></div>
        ) : companies.length === 0 ? (
          <div className="empty-state py-4 text-center">
            <FaBuilding className="fs-1 text-muted mb-2" />
            <p className="muted">No companies registered yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table workspace-table mb-0 align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Industry</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id || company.company_id}>
                    <td className="text-muted small">{company.id || company.company_id}</td>
                    <td className="fw-semibold">{company.name || company.company_name}</td>
                    <td>{company.email || company.official_email}</td>
                    <td>{company.industry || "—"}</td>
                    <td>
                      <span className={`status-pill ${company.active ? "success" : "danger"}`}>
                        <span />
                        {company.active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        className={`btn btn-sm ${company.active ? "btn-outline-danger" : "btn-outline-success"}`}
                        onClick={() => toggle(company)}
                        disabled={toggling === company.id}
                        title={company.active ? "Suspend this company" : "Activate this company"}
                      >
                        {toggling === company.id ? (
                          <span className="spinner-border spinner-border-sm" />
                        ) : company.active ? (
                          <><FaBan className="me-1" />Suspend</>
                        ) : (
                          <><FaCheckCircle className="me-1" />Activate</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
