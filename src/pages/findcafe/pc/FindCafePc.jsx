// src/pages/findcafe/pc/FindCafePc.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import myLocationIcon from "../../../icon/location.png";

export default function FindCafePc() {
  return <MapLayout />;
}

function MapLayout() {
  const distanceOptions = useMemo(
    () => [
      { label: "300m", km: 0.3 },
      { label: "500m", km: 0.5 },
      { label: "1km", km: 1.0 },
      { label: "2km", km: 2.0 },
    ],
    []
  );

  const [distanceKm, setDistanceKm] = useState(1.0);
  const [places, setPlaces] = useState([]);

  // ✅ 내 위치 모드(버튼 활성화 여부) - 버튼 누르면 ON, 다시 누르면 OFF
  const [isMyLocationMode, setIsMyLocationMode] = useState(false);

  // 드롭다운 상태
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Kakao Map
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);

  // ✅ 내 위치 마커 ref
  const myMarkerRef = useRef(null);

  // ✅ 실제 “내 위치 좌표” 저장 (내 위치 모드 ON일 때만 사용)
  const myLocationRef = useRef(null);

  // 초기 중심 좌표(현위치 실패 시 fallback)
  const centerRef = useRef({ lat: 37.5563, lng: 126.922 });

  const selectedLabel =
    distanceOptions.find((o) => o.km === distanceKm)?.label ?? `${distanceKm}km`;

  /* -------------------- 1) 현재 위치 얻기(Promise) -------------------- */
  function getMyLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GEO_NOT_SUPPORTED"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  /* -------------------- helpers: 내 위치 마커/원 제거 -------------------- */
  function clearMyLocationMarker() {
    if (myMarkerRef.current) {
      myMarkerRef.current.setMap(null);
      myMarkerRef.current = null;
    }
  }

  function clearCircle() {
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }
  }

  /* -------------------- 2) 내 위치 마커(커스텀 이미지) -------------------- */
  function drawMyLocationMarker(lat, lng) {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!kakao?.maps || !map) return;

    const position = new kakao.maps.LatLng(lat, lng);

    clearMyLocationMarker();

    const imageSize = new kakao.maps.Size(36, 36);
    const imageOption = { offset: new kakao.maps.Point(18, 36) };
    const markerImage = new kakao.maps.MarkerImage(
      myLocationIcon,
      imageSize,
      imageOption
    );

    myMarkerRef.current = new kakao.maps.Marker({
      position,
      image: markerImage,
      zIndex: 999,
    });

    myMarkerRef.current.setMap(map);
  }

  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    const onDocClick = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  /* -------------------- 3) 지도 초기화 -------------------- */
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      for (let i = 0; i < 50; i += 1) {
        if (cancelled) return;
        if (window.kakao?.maps?.services && mapContainerRef.current) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      if (cancelled) return;
      if (!window.kakao?.maps?.services) return;

      const kakao = window.kakao;

      const centerLatLng = new kakao.maps.LatLng(
        centerRef.current.lat,
        centerRef.current.lng
      );

      const map = new kakao.maps.Map(mapContainerRef.current, {
        center: centerLatLng,
        level: 4,
      });
      mapRef.current = map;

      // ✅ 시작은 내 위치 모드 OFF (모바일 요구사항과 동일)
      // 내 위치 마커는 찍지 않음
      drawRadiusCircle(distanceKm); // 내부에서 OFF면 숨김 처리
      searchCafes(distanceKm);

      // ✅ 지도 이동/확대축소 후
      kakao.maps.event.addListener(map, "idle", () => {
        const c = map.getCenter();
        const newCenter = { lat: c.getLat(), lng: c.getLng() };
        centerRef.current = newCenter;

        // ✅ 내 위치 모드 ON 상태에서만: 중심이 내 위치에서 멀어지면 OFF
        const my = myLocationRef.current;
        if (isMyLocationMode && my) {
          const dist = haversineMeters(my.lat, my.lng, newCenter.lat, newCenter.lng);
          if (dist > 80) setIsMyLocationMode(false);
        }

        drawRadiusCircle(distanceKm);
        searchCafes(distanceKm);
      });
    };

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 내 위치 모드 OFF되면: 내 위치/원/마커 제거
  useEffect(() => {
    if (!isMyLocationMode) {
      myLocationRef.current = null;
      clearMyLocationMarker();
      clearCircle();
    } else {
      // ON일 때는 현재 상태 기준으로 원 다시 그림(내 위치 클릭 직후 안전)
      drawRadiusCircle(distanceKm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyLocationMode]);

  // 거리 변경 시 원/재검색
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps?.services) return;
    drawRadiusCircle(distanceKm);
    searchCafes(distanceKm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distanceKm]);

  function clearMarkers() {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  }

  // ✅ 내 위치 OFF일 때 원 숨김
  function drawRadiusCircle(km) {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!kakao?.maps || !map) return;

    // OFF면 원 제거하고 끝
    if (!isMyLocationMode) {
      clearCircle();
      return;
    }

    const radiusM = Math.round(km * 1000);
    const centerLatLng = new kakao.maps.LatLng(
      centerRef.current.lat,
      centerRef.current.lng
    );

    clearCircle();

    circleRef.current = new kakao.maps.Circle({
      center: centerLatLng,
      radius: radiusM,
      strokeWeight: 2,
      strokeColor: PINK,
      strokeOpacity: 0.9,
      strokeStyle: "solid",
      fillColor: PINK,
      fillOpacity: 0.12,
    });

    circleRef.current.setMap(map);
  }

  function searchCafes(km) {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!kakao?.maps?.services || !map) return;

    const ps = new kakao.maps.services.Places();
    const radius = Math.round(km * 1000);
    const centerLatLng = new kakao.maps.LatLng(
      centerRef.current.lat,
      centerRef.current.lng
    );

    ps.categorySearch(
      "CE7",
      (data, status) => {
        if (status !== kakao.maps.services.Status.OK) {
          setPlaces([]);
          clearMarkers();
          return;
        }

        clearMarkers();

        const nextPlaces = data
          .map((p) => {
            const distM = haversineMeters(
              centerRef.current.lat,
              centerRef.current.lng,
              Number(p.y),
              Number(p.x)
            );

            return {
              id: p.id,
              name: p.place_name,
              lat: Number(p.y),
              lng: Number(p.x),
              url: p.place_url,
              distM,
            };
          })
          .sort((a, b) => a.distM - b.distM);

        nextPlaces.forEach((p) => {
          const marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(p.lat, p.lng),
          });
          marker.setMap(map);

          const iw = new kakao.maps.InfoWindow({
            content: `<div style="padding:8px 10px;font-size:12px;">${escapeHtml(
              p.name
            )}</div>`,
          });

          kakao.maps.event.addListener(marker, "mouseover", () =>
            iw.open(map, marker)
          );
          kakao.maps.event.addListener(marker, "mouseout", () => iw.close());

          markersRef.current.push(marker);
        });

        setPlaces(nextPlaces);
      },
      { location: centerLatLng, radius, sort: kakao.maps.services.SortBy.DISTANCE }
    );
  }

  function handleCenterTo(place) {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!kakao?.maps || !map) return;
    map.panTo(new kakao.maps.LatLng(place.lat, place.lng));
  }

  /* -------------------- 4) 내 위치 버튼 클릭 (토글) -------------------- */
  async function handleGoMyLocation() {
    const kakao = window.kakao;
    const map = mapRef.current;

    // ✅ ON 상태에서 다시 누르면 OFF(해제)
    if (isMyLocationMode) {
      setIsMyLocationMode(false);

      // 해제 시 현재 지도 중심 기준 유지
      if (map) {
        const c = map.getCenter();
        centerRef.current = { lat: c.getLat(), lng: c.getLng() };
      }

      // 원/내마커 제거는 useEffect에서 처리됨
      searchCafes(distanceKm);
      return;
    }

    // ✅ OFF 상태면 내 위치로 이동(켜기)
    try {
      const my = await getMyLocation();

      myLocationRef.current = my;
      centerRef.current = my;

      if (!kakao?.maps || !map) return;

      const myLatLng = new kakao.maps.LatLng(my.lat, my.lng);
      map.panTo(myLatLng);

      drawMyLocationMarker(my.lat, my.lng);
      setIsMyLocationMode(true); // ✅ ON

      drawRadiusCircle(distanceKm);
      searchCafes(distanceKm);
    } catch (e) {
      alert("위치 정보를 가져올 수 없습니다. 브라우저 위치 권한을 확인해주세요.");
    }
  }

  return (
    <div style={styles.page}>
      <main style={styles.main}>
        <div ref={mapContainerRef} style={styles.mapWrap} />

        {/* ✅ 내 위치 버튼: 토글 + OFF면 점 비활성화 */}
        <button
          type="button"
          style={{
            ...styles.myLocBtn,
            ...(isMyLocationMode ? styles.myLocBtnActive : null),
          }}
          onClick={handleGoMyLocation}
        >
          <span
            style={{
              ...styles.myLocDot,
              ...(isMyLocationMode ? styles.myLocDotOn : styles.myLocDotOff),
            }}
          />
          내 위치
        </button>

        {/* 거리 드롭다운 */}
        <div style={styles.mapOverlay} ref={dropdownRef}>
          <button
            type="button"
            style={styles.dropBtn}
            onClick={() => setIsOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span style={styles.dropBtnLeft}>거리</span>
            <span style={styles.dropBtnValue}>{selectedLabel}</span>
            <span style={styles.dropBtnArrow}>▾</span>
          </button>

          {isOpen && (
            <div style={styles.menu} role="listbox" aria-label="거리 선택">
              {distanceOptions.map((o) => (
                <button
                  key={o.km}
                  type="button"
                  style={{
                    ...styles.menuItem,
                    ...(o.km === distanceKm ? styles.menuItemActive : null),
                  }}
                  onClick={() => {
                    setDistanceKm(o.km);
                    setIsOpen(false);
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <aside style={styles.rightPanel}>
        <RightPanel places={places} onCenterTo={handleCenterTo} />
      </aside>
    </div>
  );
}

function RightPanel({ places, onCenterTo }) {
  return (
    <div style={styles.rightInner}>
      {places.length === 0 ? (
        <div style={styles.emptyBox}>표시할 카페가 없습니다.</div>
      ) : (
        places.map((p) => (
          <div key={p.id} style={styles.card}>
            <div style={styles.cardRow}>
              <div style={styles.thumbnail} aria-hidden="true">
                카페사진
              </div>

              <div style={styles.cardBody}>
                <div style={styles.cardTitle}>{p.name}</div>
                <div style={styles.cardMeta}>거리 {formatDistance(p.distM)}</div>
              </div>

              <div style={styles.cardActions}>
                <button
                  type="button"
                  style={styles.routeBtn}
                  onClick={() => onCenterTo(p)}
                >
                  길찾기
                </button>
                <button type="button" style={styles.starBtn} title="즐겨찾기(미구현)">
                  ☆
                </button>
              </div>
            </div>

            <div style={styles.cardLinkRow}>
              <a href={p.url} target="_blank" rel="noreferrer" style={styles.link}>
                상세보기
              </a>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ---------------- 유틸 ---------------- */

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDistance(m) {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${m} m`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------------- 스타일 ---------------- */

const PINK = "#84DEEE";

const styles = {
  page: {
    width: "92vw",
    height: "100vh",
    margin: 0,
    padding: 0,
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    overflow: "hidden",
    background: "#ffffff",
  },

  main: {
    position: "relative",
    margin: 0,
    padding: 0,
  },

  mapWrap: {
    width: "100%",
    height: "100%",
  },

  // 내 위치 버튼
  myLocBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10000,
    height: 40,
    padding: "0 14px",
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 12,
    background: "rgba(255,255,255,0.95)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#333",
  },
  myLocBtnActive: {
    border: "1px solid rgba(97,141,255,0.35)",
  },

  myLocDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    display: "inline-block",
  },
  // ✅ ON / OFF
  myLocDotOn: {
    background: "#618DFF",
    boxShadow: "0 0 0 3px rgba(97,141,255,0.20)",
  },
  myLocDotOff: {
    background: "#C9C9C9",
    boxShadow: "0 0 0 3px rgba(0,0,0,0.06)",
  },

  // 거리 드롭다운 오버레이
  mapOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 9999,
    width: 180,
  },

  dropBtn: {
    width: 180,
    height: 44,
    borderRadius: 12,
    border: `1px solid ${PINK}`,
    background: "#ffffff",
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: 8,
    padding: "0 12px",
    cursor: "pointer",
    fontWeight: 800,
    color: "#333",
    boxShadow: "0 8px 20px rgba(0,0,0,0.10)",
  },
  dropBtnLeft: { fontSize: 13 },
  dropBtnValue: { justifySelf: "end", fontWeight: 700, color: "#666" },
  dropBtnArrow: { color: PINK, fontSize: 12 },

  menu: {
    marginTop: 8,
    border: "1px solid #eee",
    borderRadius: 12,
    background: "#fff",
    overflow: "hidden",
    boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
  },
  menuItem: {
    width: "100%",
    height: 44,
    border: "none",
    background: "#fff",
    textAlign: "left",
    padding: "0 12px",
    cursor: "pointer",
    fontSize: 13,
    color: "#444",
    fontWeight: 700,
  },
  menuItemActive: {
    background: PINK,
    color: "#fff",
  },

  rightPanel: {
    borderLeft: "1px solid #eee",
    background: "#fff",
  },
  rightInner: {
    height: "100%",
    overflowY: "auto",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  emptyBox: {
    padding: 14,
    border: "1px solid #eee",
    borderRadius: 10,
    color: "#666",
    fontSize: 13,
  },

  card: {
    border: "1px solid #e9e9e9",
    borderRadius: 12,
    background: "#fff",
    padding: 10,
    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
  },
  cardRow: {
    display: "grid",
    gridTemplateColumns: "80px 1fr 84px",
    gap: 10,
    alignItems: "start",
  },
  thumbnail: {
    width: 80,
    height: 72,
    borderRadius: 10,
    border: "1px solid #eee",
    background: "#fafafa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    color: "#aaa",
  },
  cardBody: { minWidth: 0 },
  cardTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#222",
    marginBottom: 6,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardMeta: { fontSize: 12, color: "#666", lineHeight: 1.5 },

  cardActions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 8,
  },
  routeBtn: {
    border: "none",
    background: PINK,
    color: "#fff",
    fontWeight: 800,
    fontSize: 12,
    padding: "8px 10px",
    borderRadius: 18,
    cursor: "pointer",
  },
  starBtn: {
    border: `1px solid ${PINK}`,
    background: "#fff",
    color: PINK,
    width: 34,
    height: 34,
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 16,
    lineHeight: "32px",
  },

  cardLinkRow: {
    marginTop: 8,
    display: "flex",
    justifyContent: "flex-end",
  },
  link: { fontSize: 12, color: "#888", textDecoration: "none" },
};
