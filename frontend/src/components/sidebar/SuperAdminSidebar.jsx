import { NavLink } from "react-router-dom";
import { FaBuilding, FaChartLine, FaTachometerAlt } from "react-icons/fa";

const SuperAdminSidebar = () => {
  const links = [
    {
      to: "/super-admin/dashboard",
      label: "Dashboard",
      icon: <FaTachometerAlt />,
    },
    {
      to: "/super-admin/companies",
      label: "Companies",
      icon: <FaBuilding />,
    },
    {
      to: "/super-admin/analytics",
      label: "Analytics",
      icon: <FaChartLine />,
    },
  ];

  return (
    <aside className="app-sidebar bg-white border-end">
      <h5 className="fw-bold mb-4">Super Admin</h5>
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

export default SuperAdminSidebar;
