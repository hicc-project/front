// src/pages/findcafe/pc/FindCafePc.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import myLocationIcon from "../../../icon/my_location.png";
import cafeMarkerIcon from "../../../icon/cafeMarker.png";
import gotomyloc from "../../../icon/gotomylocation.png";

import {
  collectPlacesByBrowser,
  fetchPlaces,
  openKakaoRouteToPlace,
  collectDetails,
  refreshStatus,
  fetchOpenStatusByKakaoId,
  fetchOpenStatusLogs,
} from "../../../utils/cafeApi";

/* ---------------------------
  상세 영업정보 최적화(캐시/쿨다운)
  - open_status_logs: 30초 캐시
  - collect_details/refresh_status: 2분 쿨다운(너무 자주 호출 금지)
---------------------------- */
const OPEN_LOGS_TTL_MS = 30_000;
const WARMUP_COOLDOWN_MS = 120_000;

let _openLogsCache = {
  ts: 0,
  data: null,
};

let _lastWarmupAt = 0;

async function getOpenLogsCached({ force = false } = {}) {
  const now = Date.now();
  if (
    !force &&
    _openLogsCache.data &&
    now - _openLogsCache.ts < OPEN_LOGS_TTL_MS
  ) {
    return _openLogsCache.data;
  }
  const logs = await fetchOpenStatusLogs();
  _openLogsCache = { ts: now, data: logs };
  return logs;
}

// collect_details -> refresh_status 트리거를 "가끔만" 하도록
async function warmupStatusIfNeeded() {
  const now = Date.now();
  if (now - _lastWarmupAt < WARMUP_COOLDOWN_MS) return;

  _lastWarmupAt = now;

  // warmup은 실패해도 화면은 뜨게(로그 조회는 계속 시도)
  await collectDetails({}).catch(() => {});
  await refreshStatus({}).catch(() => {});
}

async function getLiveStatusFast(kakaoId) {
  if (!kakaoId) return null;

  function isUsableStatus(x) {
    if (!x) return false;
    // 이 중 하나라도 있으면 "쓸만한 상태"로 판단
    const hasOpenFlag = x.is_open_now === true || x.is_open_now === false;
    const hasNote =
      typeof x.today_status_note === "string" &&
      x.today_status_note.trim() !== "";
    const hasTimes = !!x.today_open_time || !!x.today_close_time;
    return hasOpenFlag || hasNote || hasTimes;
  }

  // 1) 캐시된 logs에서 먼저 찾기
  const cachedLogs = await getOpenLogsCached({ force: false }).catch(
    () => null
  );
  if (cachedLogs) {
    const list = Array.isArray(cachedLogs) ? cachedLogs : [];
    const hit =
      list.find((x) => String(x.kakao_id) === String(kakaoId)) || null;

    // hit이 있고 내용도 괜찮으면 바로 반환
    if (isUsableStatus(hit)) return hit;

    // hit이 있지만 null 투성이면 -> warmup 후 fresh로 다시 찾기
  }

  // 2) warmup (쿨다운 통과 시에만 실제 호출됨)
  await warmupStatusIfNeeded();

  // 3) fresh logs로 매칭
  const freshLogs = await getOpenLogsCached({ force: true }).catch(() => null);
  const list2 = Array.isArray(freshLogs) ? freshLogs : [];
  const hit2 =
    list2.find((x) => String(x.kakao_id) === String(kakaoId)) || null;

  return hit2;
}

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
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isMyLocationMode, setIsMyLocationMode] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);
  const ignoreNextIdleRef = useRef(false);

  const myMarkerRef = useRef(null);
  const myLocationRef = useRef(null);
  const centerRef = useRef({ lat: 37.5506, lng: 126.9258 });

  const selectedLabel =
    distanceOptions.find((o) => o.km === distanceKm)?.label ??
    `${distanceKm}km`;

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

    const position = new kakao.maps.LatLng(lat, lng);

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

  function clearMarkers() {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  }

  function drawRadiusCircle(km) {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!kakao?.maps || !map) return;

    if (!isMyLocationMode) {
      clearCircle();
      return;
    }

    const radiusM = Math.round(km * 1000);

    clearCircle();

    circleRef.current = new kakao.maps.Circle({
      center: new kakao.maps.LatLng(
        centerRef.current.lat,
        centerRef.current.lng
      ),
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

  function drawCafeMarkers(list) {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!kakao?.maps || !map) return;

    clearMarkers();

    list.forEach((p) => {
      const imageSize = new kakao.maps.Size(18, 22);
      const imageOption = { offset: new kakao.maps.Point(11, 22) };

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
  }

  function handleCenterTo(place) {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!kakao?.maps || !map) return;

    ignoreNextIdleRef.current = true;
    map.panTo(new kakao.maps.LatLng(place.lat, place.lng));
  }

  async function loadPlacesFromBackendByBrowser(km) {
    const radius_m = Math.round(km * 1000);

    const { lat, lng, result } = await collectPlacesByBrowser({ km });
    console.log("collect 성공:", result);

    const list = await fetchPlaces({ lat, lng, radius_m });

    const normalized = (Array.isArray(list) ? list : []).map((p) => ({
      id: String(p.kakao_id ?? p.id ?? `${p.lat}-${p.lng}-${p.name}`),
      kakaoId: String(p.kakao_id ?? p.id ?? ""),
      name: p.name ?? p.place_name ?? "카페",
      lat: Number(p.lat),
      lng: Number(p.lng),
      address: p.address ?? "",
      url: p.place_url ?? p.url ?? "",
      distM: haversineMeters(lat, lng, Number(p.lat), Number(p.lng)),
    }));

    normalized.sort((a, b) => a.distM - b.distM);

    setPlaces(normalized);
    drawCafeMarkers(normalized);

    if (mapRef.current && window.kakao?.maps) {
      mapRef.current.panTo(new window.kakao.maps.LatLng(lat, lng));
      centerRef.current = { lat, lng };
      drawMyLocationMarker(lat, lng);
      drawRadiusCircle(km);
    }

    // 리스트를 불러온 직후 warmup을 "가끔만" 한번 돌려두면
    // 상세 들어갈 때 logs 매칭이 더 빨라질 수 있음
    warmupStatusIfNeeded().catch(() => {});
  }

  useEffect(() => {
    const onDocClick = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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

      const map = new kakao.maps.Map(mapContainerRef.current, {
        center: new kakao.maps.LatLng(
          centerRef.current.lat,
          centerRef.current.lng
        ),
        level: 3,
      });
      mapRef.current = map;

      kakao.maps.event.addListener(map, "idle", () => {
        const c = map.getCenter();
        centerRef.current = { lat: c.getLat(), lng: c.getLng() };

        if (!isMyLocationMode) return;

        if (ignoreNextIdleRef.current) {
          ignoreNextIdleRef.current = false;
          return;
        }

        const my = myLocationRef.current;
        if (my) {
          const dist = haversineMeters(my.lat, my.lng, c.getLat(), c.getLng());
          if (dist > 80) setIsMyLocationMode(false);
        }
      });
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [isMyLocationMode]);

  useEffect(() => {
    if (!isMyLocationMode) {
      myLocationRef.current = null;
      clearMyLocationMarker();
      clearCircle();
      setSelectedPlace(null);
      return;
    }

    loadPlacesFromBackendByBrowser(distanceKm).catch((e) => {
      console.error(e);
      alert(
        "collect/places 요청에 실패했습니다. 콘솔/네트워크를 확인해주세요."
      );
      setIsMyLocationMode(false);
    });
  }, [isMyLocationMode]);

  useEffect(() => {
    if (!isMyLocationMode) return;

    loadPlacesFromBackendByBrowser(distanceKm).catch((e) => {
      console.error(e);
      alert("거리 변경 후 요청에 실패했습니다.");
    });
  }, [distanceKm]);

  async function handleGoMyLocation() {
    if (isMyLocationMode) {
      setIsMyLocationMode(false);

      if (mapRef.current) {
        const c = mapRef.current.getCenter();
        centerRef.current = { lat: c.getLat(), lng: c.getLng() };
      }
      return;
    }

    try {
      const { lat, lng } = await getMyLocationFallback();
      myLocationRef.current = { lat, lng };
      centerRef.current = { lat, lng };
      setIsMyLocationMode(true);
    } catch {
      alert(
        "위치 정보를 가져올 수 없습니다. 브라우저 위치 권한을 확인해주세요."
      );
    }
  }

  function getMyLocationFallback() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GEO_NOT_SUPPORTED"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        reject,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  return (
    <div style={styles.page}>
      <main style={styles.main}>
        <div ref={mapContainerRef} style={styles.mapWrap} />

        <button
          type="button"
          aria-label="내 위치로 이동"
          style={{
            ...styles.myLocBtn,
            ...(isMyLocationMode ? styles.myLocBtnActive : null),
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={handleGoMyLocation}
        >
          <img
            src={gotomyloc}
            alt=""
            style={{
              width: 20,
              height: 20,
              ...(isMyLocationMode ? { opacity: 1 } : { opacity: 0.65 }),
            }}
          />
        </button>

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
        {selectedPlace ? (
          <PlaceDetailPanel
            place={selectedPlace}
            onBack={() => setSelectedPlace(null)}
            onCenterTo={() => handleCenterTo(selectedPlace)}
            onRoute={() => openKakaoRouteToPlace(selectedPlace)}
          />
        ) : (
          <RightPanel
            places={places}
            onRoute={(p) => openKakaoRouteToPlace(p)}
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

function RightPanel({ places, onOpenDetail, onRoute }) {
  return (
    <div style={styles.rightInner}>
      {places.length === 0 ? (
        <div style={styles.emptyBox}>내 위치를 키면 주변 카페가 표시돼요.</div>
      ) : (
        places.map((p) => (
          <div key={p.id} style={styles.card}>
            <div style={styles.cardRow}>
              <div style={styles.thumbnail} aria-hidden="true">
                카페사진
              </div>

              <div style={styles.cardBody}>
                <div style={styles.cardTitle}>{p.name}</div>
                <div style={styles.cardMeta}>
                  거리 {formatDistance(p.distM)}
                </div>
              </div>

              <div style={styles.cardActions}>
                <button
                  type="button"
                  style={styles.starBtn}
                  title="즐겨찾기(미구현)"
                >
                  ☆
                </button>

                <button
                  type="button"
                  style={styles.routeBtn}
                  onClick={() => onRoute(p)}
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

function PlaceDetailPanel({ place, onBack, onCenterTo, onRoute }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!place?.kakaoId) return;

      setLoading(true);
      setError("");
      setStatus(null);

      try {
        // 0) 먼저 logs에서 "이미 있는 값" 빠르게 가져오기
        const cached = await fetchOpenStatusByKakaoId(place.kakaoId).catch(
          () => null
        );
        if (cancelled) return;
        if (cached) {
          setStatus(cached);
          setLoading(false);
          return; // 이미 있으면 여기서 끝
        }

        // 1) 없으면: 상세 수집 + 상태 최신화
        await collectDetails({}).catch(() => {});
        if (cancelled) return;

        await refreshStatus({}).catch(() => {});
        if (cancelled) return;

        // 2) 최신화 끝난 후 logs를 다시 조회해서 매칭
        const fresh = await fetchOpenStatusByKakaoId(place.kakaoId).catch(
          () => null
        );
        if (cancelled) return;

        setStatus(fresh);
      } catch (e) {
        if (!cancelled)
          setError(e?.message || "상세 정보를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [place?.kakaoId]);

  const isOpenNow = status?.is_open_now;
  const note = status?.today_status_note ?? null;
  const openTime = status?.today_open_time ?? null;
  const closeTime = status?.today_close_time ?? null;
  const minutesToClose =
    typeof status?.minutes_to_close === "number"
      ? status.minutes_to_close
      : null;

  const remainText =
    isOpenNow === true && minutesToClose != null
      ? `${Math.floor(minutesToClose / 60)}시간 ${minutesToClose % 60}분 남음`
      : null;

  return (
    <div style={styles.detailPanel}>
      <div style={styles.detailTopBar}>
        <button
          type="button"
          onClick={onBack}
          style={styles.backBtn}
          aria-label="뒤로가기"
        >
          ←
        </button>

        <div style={styles.detailTopTitleRow}>
          <div style={styles.detailTitle}>{place.name}</div>
          <button
            type="button"
            style={styles.detailStar}
            title="즐겨찾기(미구현)"
          >
            ☆
          </button>
        </div>

        <button type="button" style={styles.routeBtn} onClick={onRoute}>
          길찾기
        </button>
      </div>

      <div style={styles.detailMetaRow2}>
        <div style={styles.detailMetaItem2}>
          거리 {formatDistance(place.distM)}
        </div>
        <div style={styles.detailMetaItem2}>
          {loading
            ? "영업 정보 불러오는 중..."
            : error
            ? "영업 정보 오류"
            : "영업 정보"}
        </div>
      </div>

      <div style={styles.detailPhotos2}>
        <div style={styles.detailPhotoBox2}>카페사진1</div>
        <div style={styles.detailPhotoBox2}>카페사진2</div>
      </div>

      <div style={styles.detailInfo2}>
        <div style={styles.detailInfoRow2}>
          주소: {place.address || "주소 정보 없음"}
        </div>

        <div style={styles.detailInfoRow2}>
          현재 상태:{" "}
          {loading
            ? "불러오는 중..."
            : error
            ? "불러오지 못함"
            : isOpenNow === true
            ? "영업 중"
            : isOpenNow === false
            ? "영업 종료"
            : "정보 없음"}
        </div>

        <div style={styles.detailInfoRow2}>
          영업시간:{" "}
          {loading
            ? "불러오는 중..."
            : error
            ? "-"
            : note
            ? note
            : openTime || closeTime
            ? `${openTime ?? "?"} ~ ${closeTime ?? "?"}`
            : "정보 없음"}
        </div>

        <div style={styles.detailInfoRow2}>
          종료까지{" "}
          {loading
            ? "불러오는 중..."
            : error
            ? "-"
            : remainText
            ? remainText
            : "-"}
        </div>

        {place.url ? (
          <a
            href={place.url}
            target="_blank"
            rel="noreferrer"
            style={styles.kakaoLink}
          >
            카카오 장소페이지 열기
          </a>
        ) : null}
      </div>

      <div style={styles.detailReviewList2}>
        {Array.from({ length: 8 }).map((_, i) => (
          <input
            key={i}
            style={styles.detailReviewInput2}
            placeholder="방문자 리뷰"
          />
        ))}
      </div>

      <button
        type="button"
        style={{ ...styles.detailBtn, width: "100%", marginTop: 10 }}
        onClick={onCenterTo}
      >
        지도에서 보기
      </button>
    </div>
  );
}

/* utils */
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

/* styles는 네 기존 그대로 유지 */

/* styles */
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

  detailCenterBtn: {
    width: "100%",
    border: "none",
    background: "rgba(132,222,238,0.25)",
    color: "#2A7B86",
    fontWeight: 900,
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
  },
};
