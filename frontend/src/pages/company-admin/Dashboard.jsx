import { useEffect, useState } from "react";

import { getCompanyAdminDashboard } from "../../services/dashboardService";

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await getCompanyAdminDashboard();
        setDashboard(response);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load dashboard.");
      }
    };

    loadDashboard();
  }, []);

  const stats = dashboard?.stats || {};
  const company = dashboard?.company;

  return (
    <div>
      <div className="mb-4">
        <h1 className="h3 fw-bold mb-1">
          {company?.company_name || "Company Dashboard"}
        </h1>
        <p className="text-secondary mb-0">
          Manage employees, assets and company operations.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="bg-white border rounded p-4">
            <div className="text-secondary">Employees</div>
            <div className="display-6 fw-bold">{stats.employees ?? 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white border rounded p-4">
            <div className="text-secondary">Admins</div>
            <div className="display-6 fw-bold">{stats.admins ?? 0}</div>
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
            <div className="text-secondary">Requests</div>
            <div className="display-6 fw-bold">{stats.requests ?? 0}</div>
          </div>
        </div>
      </div>

      <section className="bg-white border rounded p-4">
        <h2 className="h5 fw-semibold mb-3">Company Details</h2>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="text-secondary">Official Email</div>
            <div className="fw-semibold">{company?.official_email || "-"}</div>
          </div>
          <div className="col-md-6">
            <div className="text-secondary">Industry</div>
            <div className="fw-semibold">{company?.industry || "-"}</div>
          </div>
          <div className="col-md-6">
            <div className="text-secondary">Company Size</div>
            <div className="fw-semibold">{company?.company_size || "-"}</div>
          </div>
          <div className="col-md-6">
            <div className="text-secondary">Mobile</div>
            <div className="fw-semibold">{company?.mobile_number || "-"}</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
