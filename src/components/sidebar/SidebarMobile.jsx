// src/components/sidebar/SidebarMobile.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { icons } from "../../icon/icons";
import { navItems } from "./navItems";

export default function SidebarMobile() {
  return (
    <nav className="mnav" aria-label="모바일 네비게이션">
      {navItems.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === "/"}
          className={({ isActive }) =>
            "mnavItem" + (isActive ? " mnavActive" : "")
          }
        >
          {({ isActive }) => (
            <>
              <img
                className={
                  it.key === "star"
                    ? "mnavIcon mnavIconStar" //  즐겨찾기만 따로 관리
                    : "mnavIcon"
                }
                src={isActive ? icons[it.key].blue : icons[it.key].gray}
                alt=""
                aria-hidden="true"
              />
              <div className="mnavLabel">{it.label}</div>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}


