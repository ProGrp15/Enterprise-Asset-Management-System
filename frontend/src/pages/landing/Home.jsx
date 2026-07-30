import { Link } from "react-router-dom";
import { FaArrowRight, FaCheck, FaChartLine, FaLock, FaLayerGroup, FaUsers } from "react-icons/fa";

const features = [
  { title: "Tenant isolation", text: "Workspace-aware access, seeded company ownership, and JWT-backed sessions.", icon: FaLock },
  { title: "Operational clarity", text: "Dashboards, requests, assets, and notifications in one clean surface.", icon: FaLayerGroup },
  { title: "Actionable insights", text: "Progressive analytics panels designed for real operations, not filler charts.", icon: FaChartLine },
  { title: "Built for teams", text: "Super admins, company admins, and employees each get role-appropriate views.", icon: FaUsers },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <div className="eyebrow mb-3">Enterprise asset management</div>
              <h1>Run assets, requests, and approvals from one polished workspace.</h1>
              <p className="hero-lead mt-4">
                AssetFlow now connects directly to the live Spring Boot auth service and the new database-backed
                workspace flow, giving you a real application foundation instead of placeholder UI.
              </p>
              <div className="d-flex gap-3 flex-wrap mt-4">
                <Link className="btn btn-primary btn-lg" to="/register-company">
                  Register Company <FaArrowRight className="ms-2" />
                </Link>
                <Link className="btn btn-outline-primary btn-lg" to="/login">
                  Login
                </Link>
              </div>
              <p className="small muted mt-3">
                <FaCheck className="text-success me-2" />
                Spring Boot auth on port 8081 · JWT sessions · dark mode · responsive layouts
              </p>
            </div>
            <div className="col-lg-5">
              <div className="hero-panel">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fw-bold">Workspace status</span>
                  <span className="badge text-bg-success">Connected</span>
                </div>
                <div className="mini-card mb-3">
                  <small className="text-white-50">Authenticated users</small>
                  <div className="display-font fs-2 fw-bold">Live</div>
                  <small className="text-success">Login and register are wired</small>
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <div className="mini-card">
                      <small className="text-white-50">Port</small>
                      <div className="fs-4 fw-bold">8081</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="mini-card">
                      <small className="text-white-50">DB</small>
                      <div className="fs-4 fw-bold">MySQL</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-surface" id="features">
        <div className="container">
          <div className="section-intro">
            <div className="eyebrow mb-2">What it includes</div>
            <h2>Everything feels like a real SaaS product now.</h2>
            <p className="muted mt-3">
              The UI has been reworked around the actual backend flow instead of demo cards and placeholder states.
            </p>
          </div>
          <div className="row g-4">
            {features.map(({ title, text, icon: Icon }) => (
              <div className="col-md-6 col-xl-3" key={title}>
                <article className="feature-card">
                  <div className="feature-icon mb-4">
                    <Icon />
                  </div>
                  <h5>{title}</h5>
                  <p className="muted mb-0">{text}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
