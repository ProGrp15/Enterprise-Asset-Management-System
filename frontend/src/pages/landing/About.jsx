import { FaBullseye, FaEye, FaShieldAlt, FaCloud, FaUsers } from "react-icons/fa";

const About = () => {
  return (
    <>
      {/* Hero */}
      <section className="py-5 bg-light">
        <div className="container text-center">
          <h1 className="display-5 fw-bold mb-3">
            About <span className="text-primary">AssetFlow</span>
          </h1>
          <p className="lead text-secondary mx-auto" style={{ maxWidth: "800px" }}>
            AssetFlow is a multi-tenant Enterprise Asset & Resource Management
            SaaS platform designed to help organizations manage hardware,
            software, employee requests, vendors and inventory through a
            centralized cloud-based solution.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-5">
        <div className="container">
          <div className="row g-4">

            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100 p-4">
                <FaBullseye size={40} className="text-primary mb-3" />
                <h3 className="fw-bold">Our Mission</h3>
                <p className="text-secondary">
                  To simplify enterprise resource management by providing
                  a secure, scalable and easy-to-use SaaS platform for
                  organizations of every size.
                </p>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100 p-4">
                <FaEye size={40} className="text-primary mb-3" />
                <h3 className="fw-bold">Our Vision</h3>
                <p className="text-secondary">
                  To become the preferred digital platform for managing
                  organizational assets, enabling smarter decisions and
                  greater operational efficiency.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="py-5 bg-light">
        <div className="container">

          <div className="text-center mb-5">
            <h2 className="fw-bold">Why Choose AssetFlow?</h2>
            <p className="text-secondary">
              Built for modern enterprises with scalability and security.
            </p>
          </div>

          <div className="row g-4">

            <div className="col-md-4">
              <div className="text-center p-4">
                <FaCloud size={45} className="text-primary mb-3" />
                <h5>Cloud Based</h5>
                <p className="text-secondary">
                  Access your organization’s resources securely from anywhere.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="text-center p-4">
                <FaShieldAlt size={45} className="text-primary mb-3" />
                <h5>Secure Platform</h5>
                <p className="text-secondary">
                  Multi-tenant architecture with secure and isolated company data.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="text-center p-4">
                <FaUsers size={45} className="text-primary mb-3" />
                <h5>Role Based Access</h5>
                <p className="text-secondary">
                  Super Admin, Company Admin and Employee roles with dedicated dashboards.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

export default About;