// src/pages/findcafe/mobile/FindCafeMobile.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import myLocationIcon from "../../../icon/my_location.png";
import cafeMarkerIcon from "../../../icon/cafeMarker.png";
import gotomyloc from "../../../icon/gotomylocation.png";

import {
  collectPlacesByBrowser,
  fetchPlaces,
  openKakaoRouteToPlace,
  fetchOpenStatusByKakaoId,
} from "../../../utils/cafeApi";

import { useCafeStatus } from "../../../providers/CafeStatusProvider";
import { useCafeFinderState } from "../../../providers/CafeFinderStateProvider";
import { useAuth } from "../../../providers/AuthProvider";
import { useBookmarks } from "../../../providers/BookmarksProvider";


export default function FindCafeMobile() {
  const { isAuthed } = useAuth();
  const { isBookmarked, toggle } = useBookmarks();

  const distanceOptions = useMemo(
    () => [
      { label: "300m", km: 0.3 },
      { label: "500m", km: 0.5 },
      { label: "1km", km: 1.0 },
      { label: "2km", km: 2.0 },
    ],
    []
  );

  const {
    distanceKm,
    setDistanceKm,
    places,
    setPlaces,
    selectedPlace,
    setSelectedPlace,
    isMyLocationMode,
    setIsMyLocationMode,
    center,
    setCenter,
    myLocation,
    setMyLocation,
  } = useCafeFinderState();

  const { openStatusMap, version: openStatusVersion } = useCafeStatus();

  //  페이지 처음 들어오면 바로 "내 위치" 모드로 시작
  const autoMyLocInitRef = useRef(false);
  useEffect(() => {
    if (autoMyLocInitRef.current) return;
    autoMyLocInitRef.current = true;

    // 이미 myLocation이 저장돼 있으면 그대로 ON
    if (myLocation?.lat && myLocation?.lng) {
      setIsMyLocationMode(true);
      return;
    }

    getMyLocationFallback()
      .then(({ lat, lng }) => {
        setMyLocation({ lat, lng });
        setCenter({ lat, lng });
        setIsMyLocationMode(true);
      })
      .catch(() => {
        // 권한 거부 등일 때는 기본 중심좌표 유지
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const [mapReadyVersion, setMapReadyVersion] = useState(0);

  const markersRef = useRef([]);
  const circleRef = useRef(null);
  const myMarkerRef = useRef(null);
  const ignoreNextIdleRef = useRef(false);

  const myLocationRef = useRef(myLocation);
  const centerRef = useRef(center);

  useEffect(() => {
    myLocationRef.current = myLocation;
  }, [myLocation]);

  useEffect(() => {
    centerRef.current = center;
  }, [center]);

  const selectedLabel =
    distanceOptions.find((o) => o.km === distanceKm)?.label ?? `${distanceKm}km`;

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

  function panToPlace(place) {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!kakao?.maps || !map) return;

    ignoreNextIdleRef.current = true;
    map.panTo(new kakao.maps.LatLng(place.lat, place.lng));
  }

  function drawCafeMarkers(list) {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!kakao?.maps || !map) return;

    clearMarkers();

    const imageSize = new kakao.maps.Size(18, 22);
    const imageOption = { offset: new kakao.maps.Point(11, 22) };
    const markerImage = new kakao.maps.MarkerImage(
      cafeMarkerIcon,
      imageSize,
      imageOption
    );

    list.forEach((p) => {
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(p.lat, p.lng),
        image: markerImage,
        zIndex: 100,
      });

      kakao.maps.event.addListener(marker, "click", () => {
        setSelectedPlace(p);
        panToPlace(p);
      });

      marker.setMap(map);
      markersRef.current.push(marker);
    });
  }

  /* ---------------- backend sync ---------------- */

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

    // 원본은 거리순 유지
    normalized.sort((a, b) => a.distM - b.distM);

    setPlaces(normalized);
    drawCafeMarkers(normalized);

    if (mapRef.current && window.kakao?.maps) {
      mapRef.current.panTo(new window.kakao.maps.LatLng(lat, lng));
      centerRef.current = { lat, lng };
      setCenter({ lat, lng });
      drawMyLocationMarker(lat, lng);
      drawCircle(km);
    }

    if (selectedPlace) {
      const stillExists = normalized.some((x) => x.id === selectedPlace.id);
      if (!stillExists) setSelectedPlace(null);
    }

    // ✅ 전역 영업정보는 Provider가 관리하므로 여기서 warmup 호출 금지
  }

  /* ---------------- dropdown 외부 클릭 닫기 ---------------- */
  useEffect(() => {
    const onClick = (e) => {
      if (!dropdownRef.current?.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  /* ---------------- 초기 지도 (1회) ---------------- */
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
        level: 3,
      });
      mapRef.current = map;
      setMapReadyVersion((v) => v + 1);

      // 기존 places는 Provider에 남겨두고, 지도에만 반영
      clearMarkers();
      clearCircle();
      clearMyLocationMarker();

      kakao.maps.event.addListener(map, "idle", () => {
        const c = map.getCenter();
        centerRef.current = { lat: c.getLat(), lng: c.getLng() };
        setCenter(centerRef.current);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // map이 다시 만들어져도(페이지 이동 후 복귀), Provider에 저장된 상태를 지도에 재반영
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;

    if (Array.isArray(places) && places.length > 0) {
      drawCafeMarkers(places);
    }

    if (isMyLocationMode && myLocation?.lat && myLocation?.lng) {
      drawMyLocationMarker(myLocation.lat, myLocation.lng);
      drawCircle(distanceKm);
    } else {
      clearMyLocationMarker();
      clearCircle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReadyVersion, places, isMyLocationMode, myLocation, distanceKm]);

  // 내 위치 모드 ON/OFF
  useEffect(() => {
    if (!isMyLocationMode) {
      clearMyLocationMarker();
      clearCircle();
      return;
    }

    // ✅ Layout 부트스트랩에서 이미 places/myLocation을 준비했으면 재요청 없이 바로 그려주기
    if (Array.isArray(places) && places.length > 0 && myLocation?.lat && myLocation?.lng) {
      drawCafeMarkers(places);
      if (mapRef.current && window.kakao?.maps) {
        mapRef.current.panTo(new window.kakao.maps.LatLng(myLocation.lat, myLocation.lng));
        centerRef.current = { lat: myLocation.lat, lng: myLocation.lng };
        drawMyLocationMarker(myLocation.lat, myLocation.lng);
        drawCircle(distanceKm);
      }
      return;
    }

    loadPlacesFromBackendByBrowser(distanceKm).catch((e) => {
      console.error(e);
      alert("위치 요청에 실패했습니다. 다시 시도해주세요.");
      setIsMyLocationMode(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyLocationMode]);



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
      setMyLocation({ lat, lng });
      centerRef.current = { lat, lng };
      setCenter({ lat, lng });
      setIsMyLocationMode(true);
    } catch {
      alert("위치 정보를 가져올 수 없습니다. 브라우저 위치 권한을 확인해주세요.");
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
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        reject,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }


  function minutesToCloseFor(place) {
    const s = openStatusMap[String(place.kakaoId)];
    const m = s?.minutes_to_close;
    if (typeof m === "number") return m;
    return Number.NEGATIVE_INFINITY;
  }

  const sortedPlaces = useMemo(() => {
    const arr = [...(places || [])];

    arr.sort((a, b) => {
      const ma = minutesToCloseFor(a);
      const mb = minutesToCloseFor(b);

      if (ma !== Number.NEGATIVE_INFINITY && mb !== Number.NEGATIVE_INFINITY) {
        return mb - ma; // 남은시간 많은 순
      }
      if (ma !== Number.NEGATIVE_INFINITY) return -1;
      if (mb !== Number.NEGATIVE_INFINITY) return 1;

      return a.distM - b.distM; // 둘 다 없으면 거리순
    });

    return arr;
  }, [places, openStatusVersion, openStatusMap]);

  return (
    <div style={styles.page}>
      <div style={styles.mapArea}>
        <div ref={mapContainerRef} style={styles.map} />

        <button
          type="button"
          style={{
            ...styles.myLocBtn,
            ...(isMyLocationMode ? styles.myLocActive : null),
          }}
          onClick={handleGoMyLocation}
        >
          <img src={gotomyloc} alt="" style={{ width: 16, height: 16 }} />
         
        </button>

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

      {!selectedPlace ? (
        <div style={styles.list}>
          {!isMyLocationMode ? (
            <div style={styles.hintBox}>내 위치를 키면 주변 카페가 표시돼요.</div>
          ) : places.length === 0 ? (
            <div style={styles.hintBox}>주변 카페를 불러오는 중이거나 결과가 없어요.</div>
          ) : (
            sortedPlaces.map((p) => (
              <div key={p.id} style={styles.card}>
                    <button
                      type="button"
                      style={styles.starBtn}
                      title={isAuthed ? "즐겨찾기" : "로그인 후 즐겨찾기 가능"}
                      onClick={async (e) => {
                        e.stopPropagation(); 
                        try {
                          await toggle(p.kakaoId, p.name);
                        } catch (err) {
                          if (err?.code === "LOGIN_REQUIRED") alert("즐겨찾기는 로그인 후 사용할 수 있어요.");
                          else alert(err?.message || "즐겨찾기 처리 실패");
                        }
                      }}
                    >
                      {isBookmarked(p.kakaoId) ? "★" : "☆"}
                    </button>
                <div style={styles.textBlock}>
                  <div style={styles.nameRow}>
      
                    <div style={styles.name} title={p.name}>{p.name}</div>
                  </div>

                  <div style={styles.meta}>거리 {formatDistance(p.distM)}</div>
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
                    상세정보
                  </button>

                  <button
                    type="button"
                    style={styles.routeBtn}
                    onClick={() => openKakaoRouteToPlace(p)}
                  >
                    길찾기
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <MobileDetailPanel
          place={selectedPlace}
          onBack={() => setSelectedPlace(null)}
          onRoute={() => openKakaoRouteToPlace(selectedPlace)}
        />
      )}
    </div>
  );
}

/* ---------------- Detail Panel (PC와 동일 원칙) ---------------- */

function MobileDetailPanel({ place, onBack, onRoute }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const { isAuthed } = useAuth();
  const { isBookmarked, toggle } = useBookmarks();


  const { openStatusMap, version, warmupIfNeeded } = useCafeStatus();

  // 1) 전역 logs에 있으면 즉시 반영
  useEffect(() => {
    if (!place?.kakaoId) return;
   const s = openStatusMap[String(place.kakaoId)];
    if (s) setStatus(s); // ✅ 있을 때만 갱신 (없으면 기존 status 유지)
  }, [place?.kakaoId, openStatusMap, version]);

  // 2) 없으면 단건 조회 + warmup 트리거(기다리지 않음)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!place?.kakaoId) return;

      setLoading(true);
      setError("");

      try {
        const cached = await fetchOpenStatusByKakaoId(place.kakaoId).catch(() => null);
        if (cancelled) return;

        if (cached) {
          setStatus(cached);
          return;
        }

        //  collect_details/refresh_status는 Provider가 처리
        warmupIfNeeded();
      } catch (e) {
        if (!cancelled) setError("영업 정보를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [place?.kakaoId, warmupIfNeeded]);

  const isOpenNow = status?.is_open_now;
  const note = status?.today_status_note ?? null;
  const openTime = status?.today_open_time ?? null;
  const closeTime = status?.today_close_time ?? null;
  const minutesToClose =
    typeof status?.minutes_to_close === "number" ? status.minutes_to_close : null;

  const remainText =
    isOpenNow === true && minutesToClose != null
      ? `${Math.floor(minutesToClose / 60)}시간 ${minutesToClose % 60}분 남음`
      : null;

  return (
    <div style={styles.detailWrap}>
      <div style={styles.detailHeader}>
        <button type="button" style={styles.backBtn} onClick={onBack} aria-label="뒤로">
          ←
        </button>

        <div style={styles.detailTitleRow}>
          <div style={styles.detailTitle}>{place.name}</div>
          <button
            type="button"
            style={styles.detailStar}
            title={isAuthed ? "즐겨찾기" : "로그인 후 즐겨찾기 가능"}
            onClick={async () => {
              try {
                await toggle(place.kakaoId, place.name);
              } catch (e) {
                if (e?.code === "LOGIN_REQUIRED") {
                  alert("즐겨찾기는 로그인 후 사용할 수 있어요.");
                } else {
                  alert(e?.message || "즐겨찾기 처리 실패");
                }
              }
            }}
          >
            {isBookmarked(place.kakaoId) ? "★" : "☆"}
          </button>
        </div>

        <button type="button" style={styles.routeBtn} onClick={onRoute}>
          길찾기
        </button>
      </div>

      <div style={styles.detailMetaRow}>
        <div style={styles.detailMetaPill}>거리 {formatDistance(place.distM)}</div>
        <div style={styles.detailMetaPill}>
          {loading ? "영업 정보 불러오는 중..." : error ? "영업 정보 오류" : "영업 정보"}
        </div>
      </div>



      <div style={styles.detailInfo}>
        <div style={styles.detailInfoRow}>주소: {place.address || "주소 정보 없음"}</div>

        <div style={styles.detailInfoRow}>
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

        <div style={styles.detailInfoRow}>
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

        <div style={styles.detailInfoRow}>
          종료까지{" "}
          {loading ? "불러오는 중..." : error ? "-" : remainText ? remainText : "정보 없음"}
        </div>

        {place.url ? (
          <a href={place.url} target="_blank" rel="noreferrer" style={styles.kakaoLink}>
            카카오 페이지 열기
          </a>
        ) : null}
      </div>


    </div>
  );
}

/* ---------------- utils ---------------- */

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
  const n = Math.round(Number(m || 0));

  if (n >= 1000) return `${Math.round(n / 1000)} km`;
  return `${n} m`;
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
    paddingBottom: 90,
  },

  hintBox: {
    margin: 12,
    padding: 14,
    borderRadius: 12,
    border: "1px solid #eee",
    color: "#666",
    fontSize: 13,
    fontWeight: 800,
    background: "#fff",
  },

  card: {
    padding: 12,
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center   ",
  },

  textBlock: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    textAlign: "left",
    flex: 1,
    marginLeft: 8,
  },

  nameRow: {
  textAlign: "left",
  display: "flex",
  alignItems: "center",
  gap: 6,
  minWidth: 0,
  },
  name: {
    fontWeight: 900, color: "#222",  minWidth: 0,
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap", 
  },
  
  starBtn: {
    color: PINK,
    border: "none",
    background: "transparent",
    padding: 0,
    fontSize: 24,     // 원하면 20~24로 조절
    lineHeight: "1",
    cursor: "pointer",
    flex: "0 0 auto",
  },
  meta: {

    fontSize: 12,
    color: "#777",
    marginTop: 2,
    alignSelf: "flex-start",
    textAlign: "left",
  },

  actions: {
    display: "flex",

    gap: 8,
    flexShrink: 0,
  },

  detailBtn: {
    border: "1px solid #D2D2D2",
    background: "#fff",
    color: "#9A9A9A",
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


  detailInfo: {
    textAlign: "left",
    marginTop: 12,
    padding: "0 6px",
    color: "#7A7A7A",
    fontWeight: 700,
    fontSize: 13,
  },

  detailInfoRow: { marginTop: 6, lineHeight: 2 },

  kakaoLink: {
    display: "inline-block",
    marginTop: 10,
    color: "#666",
    textDecoration: "none",
    fontSize: 12,
    fontWeight: 800,
  },

};
