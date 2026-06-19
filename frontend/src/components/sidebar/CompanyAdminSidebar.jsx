import { NavLink } from "react-router-dom";
import { FaTachometerAlt, FaUsers, FaBoxOpen } from "react-icons/fa";

const CompanyAdminSidebar = () => {
  const links = [
    {
      to: "/company-admin/dashboard",
      label: "Dashboard",
      icon: <FaTachometerAlt />,
    },
    {
      to: "/company-admin/employees",
      label: "Employees",
      icon: <FaUsers />,
    },
    {
      to: "/company-admin/assets",
      label: "Assets",
      icon: <FaBoxOpen />,
    },
  ];

  return (
    <aside className="app-sidebar bg-white border-end">
      <h5 className="fw-bold mb-4">Company Admin</h5>
      <nav className="d-grid gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `app-nav-link ${isActive ? "active" : ""}`
            }
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default CompanyAdminSidebar;
