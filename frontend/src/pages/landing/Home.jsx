import { Link } from "react-router-dom";
import {
  FaBuilding,
  FaBoxes,
  FaLaptop,
  FaUsers,
  FaChartLine,
  FaTools,
  FaClipboardCheck,
  FaArrowRight,
} from "react-icons/fa";

const Home = () => {
  return (
    <>
      {/* ================= HERO SECTION ================= */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row align-items-center">

            <div className="col-lg-6">
              <span className="badge bg-primary mb-3 px-3 py-2">
                Enterprise Asset & Resource Management SaaS
              </span>

              <h1
                className="fw-bold mb-4"
                style={{ fontSize: "3rem", color: "#0f172a" }}
              >
                Manage Your Company's Assets Smarter.
              </h1>

              <p
                className="lead mb-4"
                style={{ color: "#64748b" }}
              >
                AssetFlow helps organizations manage hardware,
                software, employee asset requests, vendors,
                maintenance, and inventory through one centralized
                cloud platform.
              </p>

              <div className="d-flex flex-wrap gap-3">
                <Link
                  to="/register-company"
                  className="btn btn-primary btn-lg px-4"
                >
                  Get Started
                </Link>

                <Link
                  to="/about"
                  className="btn btn-outline-primary btn-lg px-4"
                >
                  Learn More
                </Link>
              </div>
            </div>

            <div className="col-lg-6 text-center mt-5 mt-lg-0">
              <FaBuilding
                style={{
                  fontSize: "240px",
                  color: "#0d6efd",
                  opacity: "0.9",
                }}
              />
            </div>

          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}

      <section className="py-5">
        <div className="container">
          <div className="row g-4 text-center">

            <div className="col-md-3">
              <div className="card border-0 shadow-sm p-4 h-100">
                <h2 className="fw-bold text-primary">100+</h2>
                <p className="mb-0 text-secondary">
                  Registered Companies
                </p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm p-4 h-100">
                <h2 className="fw-bold text-primary">50K+</h2>
                <p className="mb-0 text-secondary">
                  Managed Assets
                </p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm p-4 h-100">
                <h2 className="fw-bold text-primary">10K+</h2>
                <p className="mb-0 text-secondary">
                  Employees
                </p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm p-4 h-100">
                <h2 className="fw-bold text-primary">99.9%</h2>
                <p className="mb-0 text-secondary">
                  Platform Uptime
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}

      <section className="py-5 bg-white">
        <div className="container">

          <div className="text-center mb-5">
            <h2 className="fw-bold">Core Platform Features</h2>
            <p className="text-secondary">
              Everything your organization needs to manage
              enterprise resources efficiently.
            </p>
          </div>

          <div className="row g-4">

            <div className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 shadow-sm p-4">
                <FaBoxes className="text-primary mb-3" size={40} />
                <h5>Asset Management</h5>
                <p className="text-secondary">
                  Track hardware, software and office resources
                  from one central inventory.
                </p>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 shadow-sm p-4">
                <FaLaptop className="text-primary mb-3" size={40} />
                <h5>Asset Requests</h5>
                <p className="text-secondary">
                  Employees can request new resources and monitor
                  approval status in real time.
                </p>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 shadow-sm p-4">
                <FaUsers className="text-primary mb-3" size={40} />
                <h5>Employee Management</h5>
                <p className="text-secondary">
                  Manage departments, employees, and assigned
                  company resources with ease.
                </p>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 shadow-sm p-4">
                <FaTools className="text-primary mb-3" size={40} />
                <h5>Maintenance Tracking</h5>
                <p className="text-secondary">
                  Schedule and monitor repairs, servicing and
                  warranty details for assets.
                </p>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 shadow-sm p-4">
                <FaClipboardCheck
                  className="text-primary mb-3"
                  size={40}
                />
                <h5>Approval Workflow</h5>
                <p className="text-secondary">
                  Streamlined approval process for requests,
                  purchases and allocations.
                </p>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 shadow-sm p-4">
                <FaChartLine className="text-primary mb-3" size={40} />
                <h5>Analytics & Reports</h5>
                <p className="text-secondary">
                  Generate reports and gain insights into resource
                  utilization and inventory trends.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}

      <section className="py-5 bg-light">
        <div className="container">

          <div className="text-center mb-5">
            <h2 className="fw-bold">How It Works</h2>
            <p className="text-secondary">
              A simple workflow for efficient resource management.
            </p>
          </div>

          <div className="row text-center g-4">

            <div className="col-md-4">
              <div className="p-4">
                <div
                  className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: "70px", height: "70px" }}
                >
                  1
                </div>

                <h5>Register Company</h5>
                <p className="text-secondary">
                  Sign up and create your organization workspace.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4">
                <div
                  className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: "70px", height: "70px" }}
                >
                  2
                </div>

                <h5>Manage Assets</h5>
                <p className="text-secondary">
                  Add inventory, employees and vendors to the system.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4">
                <div
                  className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: "70px", height: "70px" }}
                >
                  3
                </div>

                <h5>Track & Analyze</h5>
                <p className="text-secondary">
                  Monitor requests, allocations and reports through
                  a centralized dashboard.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}

      <section
        className="py-5"
        style={{
          background: "linear-gradient(90deg,#0d6efd,#2563eb)",
        }}
      >
        <div className="container text-center text-white">
          <h2 className="fw-bold mb-3">
            Ready to Transform Asset Management?
          </h2>

          <p className="mb-4">
            Start managing your company's resources through one
            secure and scalable SaaS platform.
          </p>

          <Link
            to="/register-company"
            className="btn btn-light btn-lg px-4 fw-semibold"
          >
            Register Your Company{" "}
            <FaArrowRight className="ms-2" />
          </Link>
        </div>
      </section>
    </>
  );
};

export default Home;