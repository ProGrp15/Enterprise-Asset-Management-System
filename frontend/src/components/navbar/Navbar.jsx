import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaBuilding, FaBars, FaTimes } from "react-icons/fa";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top py-3"
      style={{ zIndex: "1000" }}
    >
      <div className="container">

        {/* Logo */}
        <NavLink
          className="navbar-brand d-flex align-items-center"
          to="/"
        >
          <FaBuilding
            className="me-2"
            style={{ color: "#0d6efd", fontSize: "28px" }}
          />
          <div>
            <div
              style={{
                fontWeight: "700",
                fontSize: "22px",
                color: "#1e293b",
                lineHeight: "20px",
              }}
            >
              AssetFlow
            </div>
            <small
              style={{
                color: "#64748b",
                fontSize: "11px",
                letterSpacing: "1px",
              }}
            >
              ENTERPRISE SAAS
            </small>
          </div>
        </NavLink>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Navbar Menu */}
        <div
          className={`collapse navbar-collapse ${
            isOpen ? "show" : ""
          }`}
        >
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">

            <li className="nav-item mx-2">
              <NavLink className="nav-link fw-semibold" to="/">
                Home
              </NavLink>
            </li>

            <li className="nav-item mx-2">
              <NavLink className="nav-link fw-semibold" to="/about">
                About
              </NavLink>
            </li>

            <li className="nav-item mx-2">
              <NavLink className="nav-link fw-semibold" to="/pricing">
                Pricing
              </NavLink>
            </li>

            <li className="nav-item mx-2">
              <NavLink className="nav-link fw-semibold" to="/contact">
                Contact
              </NavLink>
            </li>
          </ul>

          {/* Right Buttons */}
          <div className="d-flex gap-2">
            <NavLink
              to="/login"
              className="btn btn-outline-primary px-4"
            >
              Login
            </NavLink>

            <NavLink
              to="/register-company"
              className="btn btn-primary px-4"
            >
              Register Company
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;