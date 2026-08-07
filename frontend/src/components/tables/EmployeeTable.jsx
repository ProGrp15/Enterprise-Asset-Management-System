const EmployeeTable = ({ employees = [] }) => {
  if (!employees.length) {
    return (
      <div className="text-center text-secondary py-4">
        No employees registered yet.
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.user_id || employee.id}>
              <td className="fw-semibold">{employee.full_name || [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "—"}</td>
              <td>{employee.email || "—"}</td>
              <td>{employee.department_name || "—"}</td>
              <td>{employee.phone || "—"}</td>
              <td>
                <span className="badge text-bg-primary">{employee.role || "EMPLOYEE"}</span>
              </td>
              <td>
                <span className={`badge ${employee.is_active !== false ? "text-bg-success" : "text-bg-secondary"}`}>
                  {employee.is_active !== false ? "Active" : "Inactive"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
