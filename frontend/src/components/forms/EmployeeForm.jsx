import { useEffect, useState } from "react";
import { departments } from "../../services/companyService";

const EmployeeForm = ({ onSubmit, loading }) => {
  const [departmentList, setDepartmentList] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    departmentId: "",
  });

  useEffect(() => {
    departments.list({ size: 100 }).then((res) => {
      const items = Array.isArray(res) ? res : res?.items || res?.content || [];
      setDepartmentList(items);
      if (items.length > 0) {
        setFormData((prev) => (prev.departmentId ? prev : { ...prev, departmentId: String(items[0].department_id || items[0].id) }));
      }
    }).catch(() => setDepartmentList([]));
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      departmentId: departmentList.length > 0 ? String(departmentList[0].department_id || departmentList[0].id) : "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="row g-3">
      <div className="col-md-4">
        <label className="form-label">First Name</label>
        <input
          className="form-control"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="First name"
          required
        />
      </div>

      <div className="col-md-4">
        <label className="form-label">Last Name</label>
        <input
          className="form-control"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Last name"
          required
        />
      </div>

      <div className="col-md-4">
        <label className="form-label">Email</label>
        <input
          type="email"
          className="form-control"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="employee@company.com"
          required
        />
      </div>

      <div className="col-md-4">
        <label className="form-label">Phone</label>
        <input
          className="form-control"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone number"
        />
      </div>

      <div className="col-md-4">
        <label className="form-label">Department</label>
        {departmentList.length > 0 ? (
          <select
            className="form-select"
            name="departmentId"
            value={formData.departmentId}
            onChange={handleChange}
            required
          >
            {departmentList.map((d) => (
              <option key={d.department_id || d.id} value={d.department_id || d.id}>
                {d.department_name || d.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="form-control"
            name="departmentId"
            value={formData.departmentId}
            onChange={handleChange}
            placeholder="Department ID"
            required
          />
        )}
      </div>

      <div className="col-md-4">
        <label className="form-label">Password</label>
        <input
          type="password"
          className="form-control"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Temporary password (min 8 chars)"
          minLength={8}
          required
        />
      </div>

      <div className="col-12">
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Creating..." : "Create Employee"}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;
