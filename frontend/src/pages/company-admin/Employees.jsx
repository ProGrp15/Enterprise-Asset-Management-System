import { useEffect, useState } from "react";

import EmployeeForm from "../../components/forms/EmployeeForm";
import EmployeeTable from "../../components/tables/EmployeeTable";
import { createEmployee, getEmployees } from "../../services/employeeService";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadEmployees = async () => {
    setPageLoading(true);
    try {
      const response = await getEmployees();
      setEmployees(response.employees || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load employees.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleCreateEmployee = async (formData) => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await createEmployee(formData);
      setMessage(response.message || "Employee created successfully.");
      setEmployees((currentEmployees) => [
        response.employee,
        ...currentEmployees,
      ]);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create employee.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Employees</h1>
          <p className="text-secondary mb-0">
            Create employee logins for your company workspace.
          </p>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <section className="bg-white border rounded p-4 mb-4">
        <h2 className="h5 fw-semibold mb-3">Register Employee</h2>
        <EmployeeForm onSubmit={handleCreateEmployee} loading={loading} />
      </section>

      <section className="bg-white border rounded p-4">
        <h2 className="h5 fw-semibold mb-3">Company Employees</h2>
        {pageLoading ? (
          <div className="text-secondary py-4">Loading employees...</div>
        ) : (
          <EmployeeTable employees={employees} />
        )}
      </section>
    </div>
  );
};

export default Employees;
