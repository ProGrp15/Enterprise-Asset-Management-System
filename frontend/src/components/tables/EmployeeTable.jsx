const EmployeeTable = ({ employees }) => {
  if (!employees.length) {
    return (
      <div className="text-center text-secondary py-4">
        No employees created yet.
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.user_id || employee.id}>
              <td>{employee.user_id}</td>
              <td>{employee.full_name || [employee.first_name, employee.last_name].filter(Boolean).join(" ")}</td>
              <td>{employee.email}</td>
              <td>
                <span className="badge text-bg-success">{employee.role || "EMPLOYEE"}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
