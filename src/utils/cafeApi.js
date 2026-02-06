// src/utils/cafeApi.js
const BASE_URL = "https://back-r4e1.onrender.com";

/* -----------------------------
  0) inflight + TTL cache
-------------------------------- */
const inflight = new Map();
const cache = new Map();

function inflightKey(method, url, body) {
  return `${method}:${url}:${body ? body : ""}`;
}

function getCache(key) {
  const v = cache.get(key);
  if (!v) return null;
  if (Date.now() > v.expireAt) {
    cache.delete(key);
    return null;
  }
  return v.data;
}

function setCache(key, data, ttlMs) {
  cache.set(key, { data, expireAt: Date.now() + ttlMs });
}

/* -----------------------------
  1) 브라우저 위치
-------------------------------- */
export function getBrowserLocation(options = {}) {
  const { enableHighAccuracy = true, timeout = 10000, maximumAge = 0 } = options;

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GEO_NOT_SUPPORTED"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy, timeout, maximumAge }
    );
  });
}

/* -----------------------------
  2) 공통 request (중복요청 합치기)
-------------------------------- */
async function request(path, options = {}) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? options.body : "";

  const key = inflightKey(method, url, body);
  if (inflight.has(key)) return inflight.get(key);

  const p = (async () => {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : await res.text();

    if (!res.ok) {
      const message =
        typeof data === "string" ? data : JSON.stringify(data || {}, null, 2);
      throw new Error(`[${res.status}] ${url}\n${message}`);
    }
    return data;
  })();

  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

/* -----------------------------
  3) collect
-------------------------------- */
export async function collectPlacesByLocation({ lat, lng, radius_m }) {
  return request("/api/collect/", {
    method: "POST",
    body: JSON.stringify({ lat, lng, radius_m }),
  });
}

export async function collectPlacesByBrowser({ km, geoOptions } = {}) {
  const { lat, lng } = await getBrowserLocation(geoOptions);
  const radius_m = Math.round((km ?? 1.0) * 1000);
  const result = await collectPlacesByLocation({ lat, lng, radius_m });
  return { lat, lng, radius_m, result };
}

/* -----------------------------
  4) places
-------------------------------- */
export async function fetchPlaces({ lat, lng, radius_m } = {}) {
  const qs = new URLSearchParams();
  if (typeof lat === "number") qs.set("lat", String(lat));
  if (typeof lng === "number") qs.set("lng", String(lng));
  if (typeof radius_m === "number") qs.set("radius", String(radius_m));

  const query = qs.toString();
  const path = query ? `/api/places/?${query}` : "/api/places/";
  return request(path, { method: "GET" });
}

/* -----------------------------
  5) collect_details
-------------------------------- */
export async function collectDetails(body = {}) {
  return request("/collect_details/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/* -----------------------------
  6) refresh_status
-------------------------------- */
export async function refreshStatus(body = {}) {
  return request("/refresh_status/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/* -----------------------------
  7) open status logs (30초 TTL 캐시)
-------------------------------- */
export async function fetchOpenStatusLogs({ ttlMs = 30000 } = {}) {
  const key = "open_status_logs";
  const cached = getCache(key);
  if (cached) return cached;

  const data = await request("/api/open_status_logs/", { method: "GET" });
  setCache(key, data, ttlMs);
  return data;
}

export async function fetchOpenStatusByKakaoId(kakaoId, opts = {}) {
  const logs = await fetchOpenStatusLogs(opts);
  const list = Array.isArray(logs) ? logs : [];
  return list.find((x) => String(x.kakao_id) === String(kakaoId)) || null;
}

/* -----------------------------
  8) 상세용: logs 먼저 반환 + (쿨다운 걸고) 백그라운드 최신화
  - 상세 들어갈 때마다 details/refresh를 매번 때리지 않게!
-------------------------------- */
let lastWarmupAt = 0;

// 이 함수는 "빠르게 표시용"으로 logs를 먼저 주고,
// 필요하면 최신화(collect_details/refresh_status)를 가끔만 트리거함.
export async function getCafeLiveStatus({
  kakaoId,
  logsTtlMs = 30000,
  warmupCooldownMs = 240000, // 4분에 1번만 최신화 트리거
} = {}) {
  if (!kakaoId) return null;

  // 1) (가장 빠른) logs에서 먼저 찾아서 바로 리턴
  const first = await fetchOpenStatusByKakaoId(kakaoId, { ttlMs: logsTtlMs });

  // 2) 최신화 트리거는 "가끔만"
  const now = Date.now();
  const canWarmup = now - lastWarmupAt >= warmupCooldownMs;

  if (!canWarmup) {
    return first; // 캐시/쿨다운이면 여기서 끝
  }

  lastWarmupAt = now;

  // 3) 백그라운드 최신화 (실패해도 UI는 유지)
  //   - 여기서 await로 묶으면 느려지니까, "동작만 시키고" 끝내는 방식이 더 빠름
  //   - 다만, 완료 후 최신 로그를 다시 읽어오고 싶으면 await 체인으로 가져오면 됨.
  Promise.resolve()
    .then(() => collectDetails({}).catch(() => {}))
    .then(() => refreshStatus({}).catch(() => {}))
    .then(() => fetchOpenStatusLogs({ ttlMs: 0 }).catch(() => {})) // TTL 0으로 강제 갱신 시도
    .catch(() => {});

  return first;
}

/* -----------------------------
  9) 길찾기: 내 위치 -> 카페
-------------------------------- */
export function openKakaoRouteToPlace(place) {
  if (!place?.name || typeof place.lat !== "number" || typeof place.lng !== "number") {
    alert("목적지 좌표/이름이 없습니다.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat1 = position.coords.latitude;
      const lng1 = position.coords.longitude;

      const url = `https://map.kakao.com/link/from/내위치,${lat1},${lng1}/to/${encodeURIComponent(
        place.name
      )},${place.lat},${place.lng}`;

      // ✅ 기존 페이지 유지 + 새 탭으로 열기
      const win = window.open(url, "_blank", "noopener,noreferrer");

    },
    () => alert("위치 정보를 가져올 수 없습니다.")
  );
}


//  10) 24H cafes 
export async function fetch24hCafes({ lat, lng, radius_m } = {}) {
  const qs = new URLSearchParams();
  if (typeof lat === "number") qs.set("lat", String(lat));
  if (typeof lng === "number") qs.set("lng", String(lng));
  if (typeof radius_m === "number") qs.set("radius", String(radius_m));

  const query = qs.toString();
  const path = query ? `/api/cafes_24h/?${query}` : "/api/cafes_24h/";

  const data = await request(path, { method: "GET" });

  if (Array.isArray(data)) return data;


  const candidate =
    data?.results ??
    data?.cafes ??
    data?.cafe_list ??
    data?.data ??
    data?.items ??
    data?.rows ??
    data?.cafes_24h;

  return Array.isArray(candidate) ? candidate : [];
}
