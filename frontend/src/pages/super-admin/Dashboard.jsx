import { useEffect, useState } from "react";

import { getSuperAdminDashboard } from "../../services/dashboardService";

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await getSuperAdminDashboard();
        setDashboard(response);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load dashboard.");
      }
    };

    loadDashboard();
  }, []);

  const stats = dashboard?.stats || {};

  return (
    <div>
      <div className="mb-4">
        <h1 className="h3 fw-bold mb-1">Super Admin Dashboard</h1>
        <p className="text-secondary mb-0">
          Monitor all companies and users on the platform.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="bg-white border rounded p-4">
            <div className="text-secondary">Companies</div>
            <div className="display-6 fw-bold">{stats.companies ?? 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white border rounded p-4">
            <div className="text-secondary">Users</div>
            <div className="display-6 fw-bold">{stats.users ?? 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white border rounded p-4">
            <div className="text-secondary">Assets</div>
            <div className="display-6 fw-bold">{stats.assets ?? 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white border rounded p-4">
            <div className="text-secondary">Subscriptions</div>
            <div className="display-6 fw-bold">{stats.subscriptions ?? 0}</div>
          </div>
        </div>
      </div>

      <section className="bg-white border rounded p-4">
        <h2 className="h5 fw-semibold mb-3">Recent Companies</h2>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Company</th>
                <th>Email</th>
                <th>Industry</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard?.companies || []).map((company) => (
                <tr key={company.company_id}>
                  <td>{company.company_id}</td>
                  <td>{company.company_name}</td>
                  <td>{company.official_email}</td>
                  <td>{company.industry || "-"}</td>
                  <td>{company.company_size || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
