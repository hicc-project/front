// src/pages/findcafe/mobile/FindCafeMobile.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import myLocationIcon from "../../../icon/my_location.png";

// ✅ 카페 마커(핀) 이미지
import cafeMarkerIcon from "../../../icon/location.png";

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

  // ✅ 상세보기 상태 (null이면 목록, 있으면 상세)
  const [selectedPlace, setSelectedPlace] = useState(null);

  //  내 위치 모드 (ON일 때만 파란점/내마커/원 표시)
  const [isMyLocationMode, setIsMyLocationMode] = useState(false);

  const dropdownRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);
  const myMarkerRef = useRef(null);

  // 현재 검색 중심(지도 중심)
  const centerRef = useRef({ lat: 37.5506, lng: 126.9258 }); // fallback 홍대
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

  function formatDistance(m) {
    if (m >= 1000) return `${(m / 1000).toFixed(1)}km`;
    return `${m}m`;
  }

  function escapeForUrl(s) {
    return encodeURIComponent(String(s || "").trim());
  }

  // ✅ 카카오맵 길찾기 URL (내 위치 -> 카페)
  //  - start 좌표를 알면 ?sName&sX&sY&eName&eX&eY 로 정확히 가능
  //  - start 좌표를 못 얻으면 link/to 로 fallback (카카오에서 현재 위치 기반 길찾기로 이어지는 경우가 많음)
  async function openKakaoRouteTo(place) {
    try {
      const my = myLocationRef.current ?? (await getMyLocation());

      const url =
        `https://map.kakao.com/?` +
        `sName=${escapeForUrl("내 위치")}` +
        `&sX=${my.lng}&sY=${my.lat}` +
        `&eName=${escapeForUrl(place.name)}` +
        `&eX=${place.lng}&eY=${place.lat}`;

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      const fallback = `https://map.kakao.com/link/to/${escapeForUrl(
        place.name
      )},${place.lat},${place.lng}`;
      window.open(fallback, "_blank", "noopener,noreferrer");
    }
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

    // ✅ 원형 아이콘(중앙 기준)
    const imageSize = new kakao.maps.Size(34, 34);
    const imageOption = { offset: new kakao.maps.Point(17, 17) };

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

  // ✅ 카페 검색 + 커스텀(핀) 마커로 표시
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
          .map((p) => {
            const dist = haversine(
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
              dist,
            };
          })
          .sort((a, b) => a.dist - b.dist);

        // ✅ 카페 핀 마커 이미지
        const imageSize = new kakao.maps.Size(36, 44);
        const imageOption = { offset: new kakao.maps.Point(18, 44) };
        const markerImage = new kakao.maps.MarkerImage(
          cafeMarkerIcon,
          imageSize,
          imageOption
        );

        list.forEach((p) => {
          const m = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(p.lat, p.lng),
            image: markerImage,
            zIndex: 100,
          });

          m.setMap(map);
          markersRef.current.push(m);
        });

        setPlaces(list);

        // ✅ 상세 화면에서 “선택된 카페”가 목록에 없어지는 상황 대비
        // (검색 반경 바뀌면 상세 닫기)
        if (selectedPlace) {
          const stillExists = list.some((x) => x.id === selectedPlace.id);
          if (!stillExists) setSelectedPlace(null);
        }
      },
      { location: center, radius: Math.round(km * 1000) }
    );
  }

  function panToPlace(place) {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!kakao?.maps || !map) return;
    map.panTo(new kakao.maps.LatLng(place.lat, place.lng));
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
      drawCircle(distanceKm);
      search(distanceKm);

      kakao.maps.event.addListener(map, "idle", () => {
        const c = map.getCenter();
        centerRef.current = { lat: c.getLat(), lng: c.getLng(), reminder: false };

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

  // ✅ 내 위치 모드 OFF되면: 내마커/원 모두 비활성화
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
          <span
            style={{
              ...styles.myLocDot,
              opacity: isMyLocationMode ? 1 : 0,
            }}
          />
          내 위치
        </button>

        {/* ✅ 거리 드롭다운 */}
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

      {/* ✅ 아래 영역: 목록 / 상세 뷰 전환 */}
      {!selectedPlace ? (
        <div style={styles.list}>
          {places.map((p) => (
            <div key={p.id} style={styles.card}>
              <div style={styles.textBlock}>
                <div style={styles.name}>{p.name}</div>
                <div style={styles.meta}>거리 {formatDistance(p.dist)}</div>
              </div>

              <div style={styles.actions}>
                <button
                  type="button"
                  style={styles.detailBtn}
                  onClick={() => {
                    setSelectedPlace(p);
                    panToPlace(p);
                  }}
                >
                  상세보기
                </button>

                <button
                  type="button"
                  style={styles.routeBtn}
                  onClick={() => openKakaoRouteTo(p)}
                >
                  길찾기
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.detailWrap}>
          <div style={styles.detailHeader}>
            <button
              type="button"
              style={styles.backBtn}
              onClick={() => setSelectedPlace(null)}
              aria-label="뒤로"
            >
              ←
            </button>

            <div style={styles.detailTitleRow}>
              <div style={styles.detailTitle}>{selectedPlace.name}</div>
              <button type="button" style={styles.detailStar} title="즐겨찾기(미구현)">
                ☆
              </button>
            </div>

            <button
              type="button"
              style={styles.routeBtn}
              onClick={() => openKakaoRouteTo(selectedPlace)}
            >
              길찾기
            </button>
          </div>

          <div style={styles.detailMetaRow}>
            <div style={styles.detailMetaPill}>거리 {formatDistance(selectedPlace.dist)}</div>
            <div style={styles.detailMetaPill}>소요시간 2분</div>
          </div>

          <div style={styles.detailPhotos}>
            <div style={styles.detailPhoto}>카페사진1</div>
            <div style={styles.detailPhoto}>카페사진2</div>
          </div>

          <div style={styles.detailInfo}>
            <div style={styles.detailInfoRow}>영업시간 00:00 - 00:00</div>
            <div style={styles.detailInfoRow}>주소 00시 00구 00길 00 0층</div>
            <div style={styles.detailInfoRow}>리뷰 0,000개</div>

            {selectedPlace.url ? (
              <a
                href={selectedPlace.url}
                target="_blank"
                rel="noreferrer"
                style={styles.kakaoLink}
              >
                카카오 장소페이지 열기
              </a>
            ) : null}
          </div>

          <div style={styles.reviewList}>
            {Array.from({ length: 6 }).map((_, i) => (
              <input key={i} style={styles.reviewInput} placeholder="방문자 리뷰" />
            ))}
          </div>
        </div>
      )}
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
    background: "#fff",
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

  // 드롭다운 (거리 선택 버튼)
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

  /* ---- list ---- */
  list: {
    flex: 1,
    overflowY: "auto",
    paddingBottom: 90,
  },

  card: {
    padding: 12,
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  textBlock: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    textAlign: "left",
  },

  name: { fontWeight: 900, color: "#222" },
  meta: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
    alignSelf: "flex-start",
    textAlign: "left",
  },

  actions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },

  detailBtn: {
    border: `1px solid ${PINK}`,
    background: "#fff",
    color: PINK,
    padding: "6px 10px",
    borderRadius: 14,
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 12,
  },

  routeBtn: {
    background: PINK,
    border: "none",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 14,
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 12,
  },

  /* ---- detail ---- */
  detailWrap: {
    flex: 1,
    overflowY: "auto",
    padding: 12,
    paddingBottom: 90,
  },

  detailHeader: {
    display: "grid",
    gridTemplateColumns: "40px 1fr auto",
    alignItems: "center",
    gap: 10,
    padding: "10px 8px",
    border: "1px solid #eee",
    borderRadius: 14,
    background: "#fff",
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: "none",
    background: "rgba(0,0,0,0.05)",
    cursor: "pointer",
    fontSize: 18,
  },

  detailTitleRow: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  detailTitle: {
    minWidth: 0,
    fontSize: 16,
    fontWeight: 900,
    color: "#222",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  detailStar: {
    border: "none",
    background: "transparent",
    color: PINK,
    cursor: "pointer",
    fontSize: 22,
    lineHeight: 1,
  },

  detailMetaRow: {
    marginTop: 12,
    display: "flex",
    gap: 10,
    color: "#7A7A7A",
    fontWeight: 800,
    fontSize: 12,
    padding: "0 6px",
  },

  detailMetaPill: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #eee",
    background: "#fff",
  },

  detailPhotos: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    padding: "0 6px",
  },

  detailPhoto: {
    height: 120,
    borderRadius: 14,
    background: "#D9D9D9",
    color: "#fff",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  detailInfo: {
    marginTop: 12,
    padding: "0 6px",
    color: "#7A7A7A",
    fontWeight: 700,
    fontSize: 13,
  },

  detailInfoRow: { marginTop: 6 },

  kakaoLink: {
    display: "inline-block",
    marginTop: 10,
    color: "#666",
    textDecoration: "none",
    fontSize: 12,
    fontWeight: 800,
  },

  reviewList: {
    marginTop: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "0 6px 18px",
  },

  reviewInput: {
    height: 42,
    borderRadius: 12,
    border: "1px solid #E6E6E6",
    padding: "0 12px",
    outline: "none",
    fontSize: 13,
  },
};
