import { Link } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";

const plans = [
  {
    name: "Starter",
    price: "Free",
    features: [
      "1 Company",
      "Up to 20 Employees",
      "Basic Asset Tracking",
      "Email Support",
    ],
    button: "Get Started",
  },
  {
    name: "Professional",
    price: "₹999 / month",
    features: [
      "Unlimited Employees",
      "Asset Request Workflow",
      "Vendor Management",
      "Reports & Analytics",
    ],
    button: "Choose Plan",
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: [
      "Unlimited Companies",
      "Dedicated Support",
      "Custom Integrations",
      "Advanced Analytics",
    ],
    button: "Contact Sales",
  },
];

const Pricing = () => {
  return (
    <section className="py-5 bg-light">
      <div className="container">

        <div className="text-center mb-5">
          <h1 className="fw-bold">
            Simple & Transparent Pricing
          </h1>
          <p className="text-secondary">
            Flexible plans for startups, businesses and enterprises.
          </p>
        </div>

        <div className="row g-4">

          {plans.map((plan, index) => (
            <div className="col-lg-4" key={index}>
              <div
                className={`card h-100 shadow-sm border-0 ${
                  index === 1 ? "border border-primary border-2" : ""
                }`}
              >
                <div className="card-body p-4 text-center">

                  <h3 className="fw-bold">{plan.name}</h3>

                  <h2 className="text-primary my-4">
                    {plan.price}
                  </h2>

                  <ul className="list-unstyled text-start">
                    {plan.features.map((item, i) => (
                      <li key={i} className="mb-3">
                        <FaCheckCircle className="text-success me-2" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/register-company"
                    className={`btn ${
                      index === 1
                        ? "btn-primary"
                        : "btn-outline-primary"
                    } w-100 mt-3`}
                  >
                    {plan.button}
                  </Link>

                </div>
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
};

export default Pricing;