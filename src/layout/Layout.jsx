// Layout.jsx
import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useMediaQuery } from "../hooks/useMediaQuery";
import SidebarDesktop from "../components/sidebar/SidebarDesktop";
import SidebarMobile from "../components/sidebar/SidebarMobile";
import AuthButtons from "../pages/home/pc/AuthButtons";

import { useCafeFinderState } from "../providers/CafeFinderStateProvider";
import { useCafeStatus } from "../providers/CafeStatusProvider";
import {
  getBrowserLocation,
  collectPlacesByLocation,
  fetchPlaces,
} from "../utils/cafeApi";

const HIDE_AUTH_PATHS = [
  "/login",
  "/signup",
  "/find",     // 빼고싶은 페이지 라우터 주소 
];

export default function Layout() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { pathname } = useLocation();

  const {
    distanceKm,
    setPlaces,
    setCenter,
    setMyLocation,
    setIsMyLocationMode,
  } = useCafeFinderState();

  const { warmupOrdered, setLogsPollingEnabled } = useCafeStatus();

  // ✅ StrictMode(개발)에서도 1회만 실행되도록 가드
  const bootOnceRef = useRef(false);
  const bootInflightRef = useRef(false);

  // 간단 haversine(m)
  const haversineMeters = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };

  // ✅ 앱 진입(라우팅 루트) 순간 부트스트랩:
  // collect -> places -> collect_details -> refresh_status -> open_status_logs
  useEffect(() => {
    if (bootOnceRef.current || bootInflightRef.current) return;
    bootInflightRef.current = true;

    (async () => {
      try {
        // 1) 브라우저 위치 선확보
        const { lat, lng } = await getBrowserLocation({ timeout: 10000 }).catch(() => ({}));
        if (typeof lat !== "number" || typeof lng !== "number") return;

        setMyLocation({ lat, lng });
        setCenter({ lat, lng });
        setIsMyLocationMode(true);

        // 2) collect -> places (전역 저장)
        const radius_m = Math.round((distanceKm ?? 1.0) * 1000);
        await collectPlacesByLocation({ lat, lng, radius_m }).catch(() => {});

        const list = await fetchPlaces({ lat, lng, radius_m }).catch(() => []);
        const normalized = (Array.isArray(list) ? list : []).map((p) => {
          const rawKakaoId = p.kakao_id ?? p.place_id ?? p.id;
          const kakaoId =
            rawKakaoId != null && /^\d+$/.test(String(rawKakaoId))
              ? String(rawKakaoId)
              : "";
          return {
            id: kakaoId || `${p.lat}-${p.lng}-${p.name}`,
            kakaoId,
            name: p.name ?? p.place_name ?? "카페",
            lat: Number(p.lat),
            lng: Number(p.lng),
            address: p.address ?? "",
            url: p.place_url ?? p.url ?? "",
            distM: haversineMeters(lat, lng, Number(p.lat), Number(p.lng)),
          };
        });
        normalized.sort((a, b) => a.distM - b.distM);
        setPlaces(normalized);

        // 3) collect_details -> refresh_status -> open_status_logs
        await warmupOrdered().catch(() => {});

        // 4) 이후부터 logs 폴링 켬
        setLogsPollingEnabled(true);
      } finally {
        bootOnceRef.current = true;
        bootInflightRef.current = false;
      }
    })();
  }, [distanceKm, setCenter, setIsMyLocationMode, setMyLocation, setPlaces, warmupOrdered, setLogsPollingEnabled]);

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
