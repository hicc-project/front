// src/pages/findcafe/pc/FindCafePc.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import myLocationIcon from "../../../icon/my_location.png";
import cafeMarkerIcon from "../../../icon/location.png";

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

  //  오른쪽 패널 상세보기 상태 (null이면 목록)
  const [selectedPlace, setSelectedPlace] = useState(null);

  //  내 위치 모드(버튼 활성화 여부) - 버튼 누르면 ON, 다시 누르면 OFF
  const [isMyLocationMode, setIsMyLocationMode] = useState(false);

  // 드롭다운 상태
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Kakao Map
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);

  //  내 위치 마커 ref
  const myMarkerRef = useRef(null);

  // 실제 “내 위치 좌표” 저장 (내 위치 모드 ON일 때만 사용)
  const myLocationRef = useRef(null);

  // 초기 중심 좌표(현위치 실패 시 fallback)
  const centerRef = useRef({ lat: 37.5506, lng: 126.9258 });

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

     
      drawRadiusCircle(distanceKm);
      searchCafes(distanceKm);

     
      kakao.maps.event.addListener(map, "idle", () => {
        const c = map.getCenter();
        const newCenter = { lat: c.getLat(), lng: c.getLng() };
        centerRef.current = newCenter;

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


  useEffect(() => {
    if (!isMyLocationMode) {
      myLocationRef.current = null;
      clearMyLocationMarker();
      clearCircle();
    } else {
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

  // 내 위치 OFF일 때 원 숨김
  function drawRadiusCircle(km) {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!kakao?.maps || !map) return;

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
          const imageSize = new kakao.maps.Size(36, 44); // 핀 비율에 맞춤
          const imageOption = {
            offset: new kakao.maps.Point(18, 44), // 핀 끝이 좌표
          };

          const markerImage = new kakao.maps.MarkerImage(
            cafeMarkerIcon,
            imageSize,
            imageOption
          );
          const marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(p.lat, p.lng),
            image: markerImage,
            zIndex: 100,
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

    if (isMyLocationMode) {
      setIsMyLocationMode(false);

      if (map) {
        const c = map.getCenter();
        centerRef.current = { lat: c.getLat(), lng: c.getLng() };
      }

      searchCafes(distanceKm);
      return;
    }

    try {
      const my = await getMyLocation();

      myLocationRef.current = my;
      centerRef.current = my;

      if (!kakao?.maps || !map) return;

      const myLatLng = new kakao.maps.LatLng(my.lat, my.lng);
      map.panTo(myLatLng);

      drawMyLocationMarker(my.lat, my.lng);
      setIsMyLocationMode(true);

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

        {/* ✅ 내 위치 버튼 */}
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

      {/* ✅ 오른쪽 패널: 목록 / 상세 뷰 전환 */}
      <aside style={styles.rightPanel}>
        {selectedPlace ? (
          <PlaceDetailPanel
            place={selectedPlace}
            onBack={() => setSelectedPlace(null)}
            onCenterTo={() => handleCenterTo(selectedPlace)}
          />
        ) : (
          <RightPanel
            places={places}
            onCenterTo={handleCenterTo}
            onOpenDetail={(p) => {
              setSelectedPlace(p);
              handleCenterTo(p);
            }}
          />
        )}
      </aside>
    </div>
  );
}

/* -------------------- Right Panel (List) -------------------- */

function RightPanel({ places, onCenterTo, onOpenDetail }) {
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
                <button type="button" style={styles.starBtn} title="즐겨찾기(미구현)">
                  ☆
                </button>

                <button
                  type="button"
                  style={styles.routeBtn}
                  onClick={() => onCenterTo(p)}
                >
                  길찾기
                </button>

                <button
                  type="button"
                  style={styles.detailBtn}
                  onClick={() => onOpenDetail(p)}
                >
                  상세보기
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* -------------------- Right Panel (Detail) -------------------- */

function PlaceDetailPanel({ place, onBack, onCenterTo }) {
  return (
    <div style={styles.detailPanel}>
      {/* 상단 바 */}
      <div style={styles.detailTopBar}>
        <button type="button" onClick={onBack} style={styles.backBtn} aria-label="뒤로가기">
          ←
        </button>

        <div style={styles.detailTopTitleRow}>
          <div style={styles.detailTitle}>{place.name}</div>
          <button type="button" style={styles.detailStar} title="즐겨찾기(미구현)">
            ☆
          </button>
        </div>

        <button type="button" style={styles.routeBtn} onClick={onCenterTo}>
          길찾기
        </button>
      </div>

      {/* 메타 */}
      <div style={styles.detailMetaRow2}>
        <div style={styles.detailMetaItem2}>거리 {formatDistance(place.distM)}</div>
        <div style={styles.detailMetaItem2}>소요시간 2분</div>
      </div>

      {/* 사진 */}
      <div style={styles.detailPhotos2}>
        <div style={styles.detailPhotoBox2}>카페사진1</div>
        <div style={styles.detailPhotoBox2}>카페사진2</div>
      </div>

      {/* 정보 */}
      <div style={styles.detailInfo2}>
        <div style={styles.detailInfoRow2}>영업시간 00:00 - 00:00</div>
        <div style={styles.detailInfoRow2}>주소 00시 00구 00길 00 0층</div>
        <div style={styles.detailInfoRow2}>리뷰 0,000개</div>
      </div>

      {/* 방문자 리뷰 입력 */}
      <div style={styles.detailReviewList2}>
        {Array.from({ length: 8 }).map((_, i) => (
          <input key={i} style={styles.detailReviewInput2} placeholder="방문자 리뷰" />
        ))}
      </div>
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
    minHeight: 0,
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
    height: 80,
    borderRadius: 10,
    border: "1px solid #eee",
    background: "#fafafa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    color: "#aaa",
  },

  cardBody: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    textAlign: "left",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#222",
    marginBottom: 6,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
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
    border: "none",
    background: "transparent",
    color: PINK,
    cursor: "pointer",
    fontSize: 22,
    lineHeight: 1,
    padding: 0,
  },

  detailBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    border: `1px solid ${PINK}`,
    background: "#fff",
    color: PINK,
    fontWeight: 800,
    fontSize: 12,
    padding: "8px 10px",
    borderRadius: 18,
    cursor: "pointer",
  },

  /* ---------- Detail Panel ---------- */

  detailPanel: {
    height: "100%",
    overflowY: "auto",
    padding: 12,
  },

  detailTopBar: {
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

  detailTopTitleRow: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  detailTitle: {
    minWidth: 0,
    fontSize: 18,
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

  detailMetaRow2: {
    marginTop: 12,
    display: "flex",
    gap: 10,
    color: "#7A7A7A",
    fontWeight: 800,
    fontSize: 12,
    padding: "0 6px",
  },
  detailMetaItem2: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #eee",
    background: "#fff",
  },

  detailPhotos2: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    padding: "0 6px",
  },
  detailPhotoBox2: {
    height: 120,
    borderRadius: 14,
    background: "#D9D9D9",
    color: "#fff",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  detailInfo2: {
    marginTop: 12,
    padding: "0 6px",
    color: "#7A7A7A",
    fontWeight: 700,
    fontSize: 13,
  },
  detailInfoRow2: { marginTop: 6 },

  detailReviewList2: {
    marginTop: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "0 6px 18px",
  },
  detailReviewInput2: {
    height: 42,
    borderRadius: 12,
    border: "1px solid #E6E6E6",
    padding: "0 12px",
    outline: "none",
    fontSize: 13,
  },
};
