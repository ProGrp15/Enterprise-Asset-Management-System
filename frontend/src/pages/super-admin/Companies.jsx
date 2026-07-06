import { useEffect, useState } from "react";

import { getSuperAdminDashboard } from "../../services/dashboardService";

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await getSuperAdminDashboard();
        setCompanies(response.companies || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load companies.");
      }
    };

    loadCompanies();
  }, []);

  return (
    <div>
      <h1 className="h3 fw-bold mb-3">Companies</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <section className="bg-white border rounded p-4">
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
              {companies.map((company) => (
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

export default Companies;
