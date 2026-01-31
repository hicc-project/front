// Layout.jsx
import { Outlet, useLocation } from "react-router-dom";
import { useMediaQuery } from "../hooks/useMediaQuery";
import SidebarDesktop from "../components/sidebar/SidebarDesktop";
import SidebarMobile from "../components/sidebar/SidebarMobile";
import AuthButtons from "../pages/home/pc/AuthButtons";

const HIDE_AUTH_PATHS = [
  "/login",
  "/signup",
  "/find",     // 빼고싶은 페이지 라우터 주소 
];

export default function Layout() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { pathname } = useLocation();

  const hideAuth = HIDE_AUTH_PATHS.some((p) => pathname.startsWith(p));

  return (
    <div style={styles.page}>
      {!hideAuth && (
        <div style={styles.authFloating}>
          <AuthButtons />
        </div>
      )}

      {!isMobile && (
        <aside style={styles.sidebar}>
          <SidebarDesktop />
        </aside>
      )}

      <main style={styles.main}>
        <Outlet />
      </main>

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
  authFloating: {
    top: 10,
    right: 14,
    zIndex: 9999,
  },
};
