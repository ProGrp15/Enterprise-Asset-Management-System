import { useState } from "react";

const EmployeeForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

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
      fullName: "",
      email: "",
      password: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="row g-3">
      <div className="col-md-4">
        <label className="form-label">Full Name</label>
        <input
          className="form-control"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Employee name"
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
        <label className="form-label">Password</label>
        <input
          type="password"
          className="form-control"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Temporary password"
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
