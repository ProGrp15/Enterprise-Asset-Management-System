import { Link } from "react-router-dom";
import {
  FaBuilding,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaLinkedin,
  FaGithub,
  FaTwitter,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer
      className="text-light pt-5 pb-3 mt-5"
      style={{ backgroundColor: "#0f172a" }}
    >
      <div className="container">
        <div className="row g-4">

          {/* Company Info */}
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center mb-3">
              <FaBuilding
                className="me-2"
                style={{ fontSize: "28px", color: "#0d6efd" }}
              />
              <div>
                <h4 className="mb-0 fw-bold">AssetFlow</h4>
                <small style={{ color: "#94a3b8" }}>
                  Enterprise SaaS Platform
                </small>
              </div>
            </div>

            <p style={{ color: "#cbd5e1", lineHeight: "1.8" }}>
              AssetFlow is a multi-tenant Enterprise Asset & Resource
              Management SaaS platform that helps organizations manage
              hardware, software, inventory, employee requests, vendors,
              and maintenance operations from a centralized dashboard.
            </p>

            <div className="d-flex gap-3 mt-3">
              <a href="#" className="text-light fs-5">
                <FaLinkedin />
              </a>
              <a href="#" className="text-light fs-5">
                <FaGithub />
              </a>
              <a href="#" className="text-light fs-5">
                <FaTwitter />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6">
            <h5 className="fw-bold mb-3">Quick Links</h5>

            <ul className="list-unstyled">
              <li className="mb-2">
                <Link className="text-decoration-none text-secondary" to="/">
                  Home
                </Link>
              </li>

              <li className="mb-2">
                <Link className="text-decoration-none text-secondary" to="/about">
                  About
                </Link>
              </li>

              <li className="mb-2">
                <Link className="text-decoration-none text-secondary" to="/pricing">
                  Pricing
                </Link>
              </li>

              <li className="mb-2">
                <Link className="text-decoration-none text-secondary" to="/contact">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div className="col-lg-3 col-md-6">
            <h5 className="fw-bold mb-3">Platform</h5>

            <ul className="list-unstyled">
              <li className="mb-2">
                <Link
                  className="text-decoration-none text-secondary"
                  to="/login"
                >
                  Login
                </Link>
              </li>

              <li className="mb-2">
                <Link
                  className="text-decoration-none text-secondary"
                  to="/register-company"
                >
                  Register Company
                </Link>
              </li>

              <li className="mb-2">
                <span className="text-secondary">
                  Asset Management
                </span>
              </li>

              <li className="mb-2">
                <span className="text-secondary">
                  Vendor Management
                </span>
              </li>

              <li className="mb-2">
                <span className="text-secondary">
                  Reports & Analytics
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-lg-3 col-md-6">
            <h5 className="fw-bold mb-3">Contact Us</h5>

            <div className="d-flex align-items-start mb-3">
              <FaEnvelope className="me-2 mt-1 text-primary" />
              <span style={{ color: "#cbd5e1" }}>
                support@assetflow.com
              </span>
            </div>

            <div className="d-flex align-items-start mb-3">
              <FaPhoneAlt className="me-2 mt-1 text-primary" />
              <span style={{ color: "#cbd5e1" }}>
                +91 98765 43210
              </span>
            </div>

            <div className="d-flex align-items-start">
              <FaMapMarkerAlt className="me-2 mt-1 text-primary" />
              <span style={{ color: "#cbd5e1" }}>
                Pune, Maharashtra, India
              </span>
            </div>
          </div>
        </div>

        <hr className="my-4 border-secondary" />

        {/* Bottom Footer */}
        <div className="row">
          <div className="col-md-6 text-center text-md-start">
            <small style={{ color: "#94a3b8" }}>
              © {new Date().getFullYear()} AssetFlow. All Rights Reserved.
            </small>
          </div>

          <div className="col-md-6 text-center text-md-end mt-2 mt-md-0">
            <small>
              <Link
                to="#"
                className="text-decoration-none text-secondary me-3"
              >
                Privacy Policy
              </Link>

              <Link
                to="#"
                className="text-decoration-none text-secondary"
              >
                Terms & Conditions
              </Link>
            </small>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;