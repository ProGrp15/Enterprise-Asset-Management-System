import { NavLink } from "react-router-dom";
import { FaClipboardList, FaTachometerAlt, FaUser } from "react-icons/fa";

const EmployeeSidebar = () => {
  const links = [
    {
      to: "/employee/dashboard",
      label: "Dashboard",
      icon: <FaTachometerAlt />,
    },
    {
      to: "/employee/my-assets",
      label: "My Assets",
      icon: <FaClipboardList />,
    },
    {
      to: "/employee/profile",
      label: "Profile",
      icon: <FaUser />,
    },
  ];

  return (
    <aside className="app-sidebar bg-white border-end">
      <h5 className="fw-bold mb-4">Employee</h5>
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

export default EmployeeSidebar;
