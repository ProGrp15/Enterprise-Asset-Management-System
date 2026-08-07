import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { FaBars, FaBuilding, FaMoon, FaSun, FaTimes } from "react-icons/fa";
import { useThemeContext } from "../../context/ThemeContext";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/#features" },
  { label: "About", to: "/about" },
  { label: "Pricing", to: "/pricing" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useThemeContext();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar navbar-expand-lg sticky-top marketing-nav ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container">
        <NavLink className="navbar-brand d-flex align-items-center gap-2" to="/">
          <span className="brand-mark">
            <FaBuilding />
          </span>
          <span className="brand-name">AssetFlow</span>
        </NavLink>

        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}>
          <ul className="navbar-nav mx-auto mb-3 mb-lg-0 align-items-lg-center gap-lg-1">
            {navItems.map((item) => (
              <li className="nav-item" key={item.label}>
                <NavLink className="nav-link" to={item.to} onClick={() => setIsOpen(false)}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="d-flex flex-column flex-lg-row gap-2 align-items-stretch align-items-lg-center">
            <button className="btn btn-ghost" onClick={toggleTheme} type="button" aria-label="Toggle theme">
              {theme === "dark" ? <FaSun className="me-2" /> : <FaMoon className="me-2" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <NavLink to="/login" className="btn btn-outline-primary">
              Login
            </NavLink>
            <NavLink to="/register-company" className="btn btn-primary">
              Register Company
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}
