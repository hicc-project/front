// src/components/sidebar/SidebarDesktop.jsx
import { NavLink } from "react-router-dom";
import { icons } from "../../icon/icons";
import { navItems } from "./navItems";

export default function SidebarDesktop() {
  return (
    <aside className="sidebar">
      {/* Top */}
      <div className="sidebarTop">
        <div className="appName">로고</div>
      </div>

      {/* Middle: main nav */}
      <nav className="nav">
        {navItems.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === "/"}
            className={({ isActive }) =>
              "navItem" + (isActive ? " navItemActive" : "")
            }
          >
            {({ isActive }) => (
              <>
                <img
                  className={it.iconClass ?? "navIcon"}
                  src={isActive ? icons[it.key].blue : icons[it.key].gray}
                  alt=""
                  aria-hidden="true"
                />
                <span className="navLabel">{it.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: settings (always at bottom) */}
      <div className="sidebarBottom">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            "navItem" + (isActive ? " navItemActive" : "")
          }
        >
          {({ isActive }) => (
            <>
              <img
                className="navIcon5"
                src={isActive ? icons.settings.blue : icons.settings.gray}
                alt=""
                aria-hidden="true"
              />
             
            </>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
