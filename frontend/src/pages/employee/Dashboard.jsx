import { useEffect, useState } from "react";

import { getEmployeeDashboard } from "../../services/dashboardService";

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await getEmployeeDashboard();
        setDashboard(response);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load dashboard.");
      }
    };

    loadDashboard();
  }, []);

  const stats = dashboard?.stats || {};
  const employee = dashboard?.employee;
  const company = dashboard?.company;

  return (
    <div>
      <div className="mb-4">
        <h1 className="h3 fw-bold mb-1">
          Welcome, {employee?.full_name || "Employee"}
        </h1>
        <p className="text-secondary mb-0">
          {company?.company_name || "Your company workspace"}
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="bg-white border rounded p-4">
            <div className="text-secondary">Assigned Assets</div>
            <div className="display-6 fw-bold">{stats.assignedAssets ?? 0}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="bg-white border rounded p-4">
            <div className="text-secondary">Open Requests</div>
            <div className="display-6 fw-bold">{stats.openRequests ?? 0}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="bg-white border rounded p-4">
            <div className="text-secondary">Notifications</div>
            <div className="display-6 fw-bold">{stats.notifications ?? 0}</div>
          </div>
        </div>
      </div>

      <section className="bg-white border rounded p-4">
        <h2 className="h5 fw-semibold mb-3">My Login Details</h2>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="text-secondary">Name</div>
            <div className="fw-semibold">{employee?.full_name || "-"}</div>
          </div>
          <div className="col-md-6">
            <div className="text-secondary">Email</div>
            <div className="fw-semibold">{employee?.email || "-"}</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
