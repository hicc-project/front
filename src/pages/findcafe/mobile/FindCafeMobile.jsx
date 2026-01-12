// src/pages/findcafe/mobile/FindCafeMobile.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import myLocationIcon from "../../../icon/location.png";

export default function FindCafeMobile() {
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
  const [isOpen, setIsOpen] = useState(false);

  // ✅ 내 위치 모드 (ON일 때만 파란점/내마커/원 표시)
  const [isMyLocationMode, setIsMyLocationMode] = useState(false);

  const dropdownRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);
  const myMarkerRef = useRef(null);

  // 현재 검색 중심(지도 중심)
  const centerRef = useRef({ lat: 37.5563, lng: 126.922 }); // fallback 홍대
  // 실제 내 위치(내 위치 모드 ON일 때만 값 존재)
  const myLocationRef = useRef(null);

  const selectedLabel =
    distanceOptions.find((o) => o.km === distanceKm)?.label ?? `${distanceKm}km`;

  /* ---------------- utils ---------------- */
  function getMyLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GEO_NOT_SUPPORTED"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        reject,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  /* ---------------- 지도 helpers ---------------- */
  function clearMarkers() {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  }

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

  function drawMyLocationMarker(lat, lng) {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!kakao?.maps || !map) return;

    clearMyLocationMarker();

    const imageSize = new kakao.maps.Size(34, 34);
    const imageOption = { offset: new kakao.maps.Point(17, 34) };
    const markerImage = new kakao.maps.MarkerImage(
      myLocationIcon,
      imageSize,
      imageOption
    );

    myMarkerRef.current = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(lat, lng),
      image: markerImage,
      zIndex: 9999,
    });

    myMarkerRef.current.setMap(map);
  }

  // ✅ 내 위치 OFF이면 원을 숨김(그리지 않음)
  function drawCircle(km) {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!kakao?.maps || !map) return;

    if (!isMyLocationMode) {
      clearCircle();
      return;
    }

    clearCircle();

    circleRef.current = new kakao.maps.Circle({
      center: new kakao.maps.LatLng(centerRef.current.lat, centerRef.current.lng),
      radius: Math.round(km * 1000),
      strokeWeight: 2,
      strokeColor: PINK,
      strokeOpacity: 0.9,
      fillColor: PINK,
      fillOpacity: 0.12,
    });

    circleRef.current.setMap(map);
  }

  function search(km) {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!kakao?.maps?.services || !map) return;

    const ps = new kakao.maps.services.Places();
    const center = new kakao.maps.LatLng(
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

        const list = data
          .map((p) => ({
            id: p.id,
            name: p.place_name,
            lat: Number(p.y),
            lng: Number(p.x),
            dist: haversine(
              centerRef.current.lat,
              centerRef.current.lng,
              Number(p.y),
              Number(p.x)
            ),
          }))
          .sort((a, b) => a.dist - b.dist);

        list.forEach((p) => {
          const m = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(p.lat, p.lng),
          });
          m.setMap(map);
          markersRef.current.push(m);
        });

        setPlaces(list);
      },
      { location: center, radius: Math.round(km * 1000) }
    );
  }

  /* ---------------- dropdown 외부 클릭 닫기 ---------------- */
  useEffect(() => {
    const onClick = (e) => {
      if (!dropdownRef.current?.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  /* ---------------- 초기 지도 ---------------- */
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      for (let i = 0; i < 50; i++) {
        if (cancelled) return;
        if (window.kakao?.maps?.services && mapContainerRef.current) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      if (cancelled) return;
      if (!window.kakao?.maps?.services) return;

      const kakao = window.kakao;

      const map = new kakao.maps.Map(mapContainerRef.current, {
        center: new kakao.maps.LatLng(centerRef.current.lat, centerRef.current.lng),
        level: 4,
      });
      mapRef.current = map;

      // 시작 시: 내 위치 모드 자동 ON 하지 않음
      drawCircle(distanceKm); // 내 위치 OFF라면 내부에서 숨김 처리
      search(distanceKm);

      kakao.maps.event.addListener(map, "idle", () => {
        const c = map.getCenter();
        centerRef.current = { lat: c.getLat(), lng: c.getLng() };

        // ✅ 내 위치 모드 ON인데 중심이 내 위치에서 멀어지면 OFF
        if (isMyLocationMode && myLocationRef.current) {
          const d = haversine(
            c.getLat(),
            c.getLng(),
            myLocationRef.current.lat,
            myLocationRef.current.lng
          );
          if (d > 80) setIsMyLocationMode(false);
        }

        drawCircle(distanceKm);
        search(distanceKm);
      });
    };

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 내 위치 모드 OFF되면: 파란점/내마커/원 모두 비활성화
  useEffect(() => {
    if (!isMyLocationMode) {
      myLocationRef.current = null;
      clearMyLocationMarker();
      clearCircle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyLocationMode]);

  // 거리 바뀌면 재검색(원은 내 위치 모드일 때만)
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps?.services) return;
    drawCircle(distanceKm);
    search(distanceKm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distanceKm]);

  /* ---------------- 내 위치 버튼 (토글) ---------------- */
  async function handleGoMyLocation() {
    const kakao = window.kakao;
    const map = mapRef.current;

    // ✅ ON 상태에서 다시 누르면 OFF(해제)
    if (isMyLocationMode) {
      setIsMyLocationMode(false);

      // 해제 즉시 현재 지도 중심 기준으로 검색 유지
      if (map) {
        const c = map.getCenter();
        centerRef.current = { lat: c.getLat(), lng: c.getLng() };
      }
      search(distanceKm);
      return;
    }

    // ✅ OFF 상태면 내 위치로 이동(켜기)
    try {
      const my = await getMyLocation();

      myLocationRef.current = my;
      centerRef.current = my;
      setIsMyLocationMode(true);

      if (!kakao?.maps || !map) return;

      map.panTo(new kakao.maps.LatLng(my.lat, my.lng));

      drawMyLocationMarker(my.lat, my.lng);
      drawCircle(distanceKm);
      search(distanceKm);
    } catch {
      alert("위치 정보를 가져올 수 없습니다. 브라우저 위치 권한을 확인해주세요.");
    }
  }

  return (
    <div style={styles.page}>
      {/* 지도 */}
      <div style={styles.mapArea}>
        <div ref={mapContainerRef} style={styles.map} />

        {/* ✅ 내 위치 버튼 */}
        <button
          type="button"
          style={{
            ...styles.myLocBtn,
            ...(isMyLocationMode ? styles.myLocActive : null),
          }}
          onClick={handleGoMyLocation}
        >
          {/* 파란 점: 내 위치 모드일 때만 보임 */}
          <span
            style={{
              ...styles.myLocDot,
              opacity: isMyLocationMode ? 1 : 0,
            }}
          />
          내 위치
        </button>

        {/* ✅ 거리 드롭다운 (오른쪽 이미지 스타일) */}
        <div style={styles.overlay} ref={dropdownRef}>
          <button
            type="button"
            style={{
              ...styles.dropBtn,
              ...(isOpen ? styles.dropBtnOpen : null),
            }}
            onClick={() => setIsOpen((v) => !v)}
          >
            <span style={styles.dropLeft}>거리</span>

            <span style={styles.dropRight}>
              {selectedLabel}
              <span style={{ ...styles.chev, ...(isOpen ? styles.chevUp : null) }}>
                ▾
              </span>
            </span>
          </button>

          {isOpen && (
            <div style={styles.menu}>
              {distanceOptions.map((o) => (
                <button
                  key={o.km}
                  type="button"
                  style={{
                    ...styles.menuItem,
                    ...(o.km === distanceKm ? styles.menuActive : null),
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
      </div>

      {/* 리스트 */}
      <div style={styles.list}>
        {places.map((p) => (
          <div key={p.id} style={styles.card}>
            <div>
              <div style={styles.name}>{p.name}</div>
              <div style={styles.meta}>
                거리{" "}
                {p.dist >= 1000
                  ? `${(p.dist / 1000).toFixed(1)}km`
                  : `${p.dist}m`}
              </div>
            </div>
            <button type="button" style={styles.routeBtn}>
              길찾기
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- styles ---------------- */
const PINK = "#84DEEE";

const styles = {
  page: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },

  mapArea: {
    height: 320,
    position: "relative",
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },

  // 내 위치 버튼
  myLocBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 100000,
    pointerEvents: "auto",
    height: 36,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.95)",
    boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  myLocActive: {
    background: "#E9F1FF",
    border: "1px solid #618DFF",
  },
  myLocDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    background: "#618DFF",
    boxShadow: "0 0 0 3px rgba(97,141,255,0.2)",
    display: "inline-block",
  },

  //  드롭다운 (거리 선택 버튼)
  overlay: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 100000,
    pointerEvents: "auto",
    width: 140,
  },
  dropBtn: {
    width: "100%",
    height: 38,
    background: "#fff",
    border: "2px solid rgba(132, 222, 238, 0.8)",
    borderRadius: 16,
    padding: "0 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(0,0,0,0.08)",
  },
  dropBtnOpen: {
    border: "2px solid rgba(132, 222, 238, 1)",
  },
  dropLeft: {
    fontSize: 12,
    fontWeight: 900,
    color: "#222",
  },
  dropRight: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    fontWeight: 900,
    color: "#666",
  },
  chev: {
    fontSize: 12,
    color: "rgba(132, 222, 238, 1)",
    transform: "translateY(-1px)",
  },
  chevUp: {
    transform: "rotate(180deg) translateY(1px)",
  },

  menu: {
    position: "absolute",
    top: 40,
    left: 0,
    width: "100%",
    background: "#fff",
    borderRadius: 18,
    boxShadow: "0 18px 30px rgba(0,0,0,0.12)",
    overflow: "hidden",
  },
  menuItem: {
    width: "100%",
    height: 40,
    border: "none",
    background: "#fff",
    fontWeight: 900,
    fontSize: 12,
    cursor: "pointer",
    textAlign: "left",
    padding: "0 16px",
    color: "#333",
  },
  menuActive: {
    background: "rgba(132, 222, 238, 0.6)",
    color: "#fff",
  },

  list: {
    flex: 1,
    overflowY: "auto",
    paddingBottom: 80,
  },
  card: {
    padding: 12,
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontWeight: 900 },
  meta: { fontSize: 12, color: "#777", marginTop: 2 },
  routeBtn: {
    background: PINK,
    border: "none",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 14,
    fontWeight: 900,
    cursor: "pointer",
  },
};
