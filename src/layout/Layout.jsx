// src/layout/Layout.jsx
import { Outlet } from "react-router-dom";
import { useMediaQuery } from "../hooks/useMediaQuery";

import SidebarDesktop from "../components/sidebar/SidebarDesktop";
import SidebarMobile from "../components/sidebar/SidebarMobile";

export default function Layout() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div style={styles.page}>
      {/* PC일 때만 사이드바 표시 */}
      {!isMobile && (
        <aside style={styles.sidebar}>
          <SidebarDesktop />
        </aside>
      )}

      <main style={styles.main}>
        <Outlet />
      </main>

      {/* 모바일일 때만 하단 네비(또는 모바일 사이드바) */}
      {isMobile && (
        <nav style={styles.mobileNav}>
          <SidebarMobile />
        </nav>
      )}
    </div>
  );
}

const styles = {
  root: {
    margin: 0,
    padding: 0,
  },
  page: {
    width: "100vw",
    height: "100dvh",
    margin: 0,
    padding: 0, // ✅
    display: "flex",
  },
  main: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,  
    margin: 0, // ✅
    padding: 0, // ✅
    overflow: "hidden", // ✅ 페이지(Outlet)가 넘치면 여기서 잘 관리
    display: "flex",     // ✅ Outlet 페이지가 column 레이아웃일 때 안정적
    flexDirection: "column",
  },
  sidebar: { width: 110, borderRight: "1px solid #eee" },
  mobileNav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    borderTop: "1px solid #eee",
    background: "#fff",
    zIndex: 10000,
  },
};
