// src/providers/CafeStatusProvider.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  collectDetails,            // ✅ 다시 살림
  refreshStatus,
  fetchOpenStatusLogs,
  getBrowserLocation,        // ✅ 좌표 없을 때 보완용
} from "../utils/cafeApi";

/**
 * 앱 전역 open_status_logs 공유 + (가끔만) warmup(collect_details/refresh_status)
 *
 *  1) open_status_logs가 null/비배열/빈배열이면 기존 openStatusMap 유지 (절대 비우지 않기)
 *  2) open_status_logs가 부분 데이터로 와도 merge로 누락 방지
 *  3) warmup(collect_details -> refresh_status) 후 open_status_logs를 2~3번 재시도해서
 *     "최초 유효 logs" 확보 확률을 높임 (초기 '정보없음' 개선)
 *
 * ✅ 변경점(네 요구사항)
 *  - collect_details는 그대로 실행
 *  - refresh_status에만 (lat,lng,radius_m)를 넣어서 "내 주변만" 갱신되게 지원
 */

const CafeStatusCtx = createContext(null);

const DEFAULT_LOGS_TTL_MS = 10_000; // logs 폴링 주기
const DEFAULT_WARMUP_COOLDOWN_MS = 240_000; // warmup 쿨다운(4분)
const RETRY_AFTER_WARMUP_ATTEMPTS = 3; // warmup 후 강제 logs 재시도 횟수
const RETRY_AFTER_WARMUP_DELAY_MS = 1200; // warmup 후 재시도 간격(ms)

const DEFAULT_WARMUP_KM = 1.0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function CafeStatusProvider({ children }) {
  const [openStatusMap, setOpenStatusMap] = useState({});
  const [version, setVersion] = useState(0);

  // ✅ logs 폴링은 "부트스트랩 완료" 이후에만 켜기
  const [logsPollingEnabled, setLogsPollingEnabled] = useState(false);

  const lastGoodLogsAtRef = useRef(0);

  // warmup 중복 방지
  const lastWarmupAtRef = useRef(0);
  const warmupInflightRef = useRef(false);

  const DEBUG = false;

  const syncLogs = useCallback(async ({ force = false } = {}) => {
    const logs = await fetchOpenStatusLogs({
      ttlMs: force ? 0 : DEFAULT_LOGS_TTL_MS,
    }).catch(() => null);

    if (!Array.isArray(logs)) {
      if (DEBUG) console.log("[CafeStatus] logs not array -> keep prev", logs);
      return false;
    }

    if (logs.length === 0) {
      if (DEBUG) console.log("[CafeStatus] logs empty -> keep prev");
      return false;
    }

    const next = {};
    for (const x of logs) {
      const id = String(
        x?.kakao_id ??
          x?.kakaoId ??
          x?.place_id ??
          x?.placeId ??
          x?.id ??
          x?.kakao_place_id ??
          ""
      ).trim();
      if (!id) continue;
      next[id] = x;
    }

    const keys = Object.keys(next);
    if (keys.length === 0) {
      if (DEBUG)
        console.log("[CafeStatus] parsed next empty -> keep prev", logs?.[0]);
      return false;
    }

    setOpenStatusMap((prev) => ({ ...prev, ...next }));
    setVersion((v) => v + 1);
    lastGoodLogsAtRef.current = Date.now();

    if (DEBUG) console.log("[CafeStatus] sync ok", keys.length);
    return true;
  }, []);

  const syncLogsWithRetry = useCallback(
    async ({
      attempts = RETRY_AFTER_WARMUP_ATTEMPTS,
      delayMs = RETRY_AFTER_WARMUP_DELAY_MS,
    } = {}) => {
      for (let i = 0; i < attempts; i++) {
        const ok = await syncLogs({ force: true }).catch(() => false);
        if (ok) return true;
        await sleep(delayMs);
      }
      return false;
    },
    [syncLogs]
  );

  // ✅ refresh_status body 만들기 (lat/lng/radius_m 없으면 브라우저 위치로 보완)
  const resolveRefreshBody = useCallback(
    async ({ lat, lng, radius_m, km = DEFAULT_WARMUP_KM, geoOptions } = {}) => {
      if (
        typeof lat === "number" &&
        typeof lng === "number" &&
        typeof radius_m === "number"
      ) {
        return { lat, lng, radius_m };
      }

      try {
        const loc = await getBrowserLocation(geoOptions);
        const r = Math.round((km ?? DEFAULT_WARMUP_KM) * 1000);
        return { lat: loc.lat, lng: loc.lng, radius_m: r };
      } catch {
        // 위치 못 얻으면 refresh는 바디 없이(백엔드 허용 시) 시도
        return {};
      }
    },
    []
  );

  const warmupIfNeeded = useCallback(
    (args = {}) => {
      const now = Date.now();
      if (warmupInflightRef.current) return;
      if (now - lastWarmupAtRef.current < DEFAULT_WARMUP_COOLDOWN_MS) return;

      warmupInflightRef.current = true;
      lastWarmupAtRef.current = now;

      Promise.resolve()
        // ✅ 1) collect_details는 그대로 실행
        .then(() => collectDetails({}).catch(() => {}))
        // ✅ 2) refresh_status는 좌표/반경 포함
        .then(() => resolveRefreshBody(args))
        .then((body) => refreshStatus(body).catch(() => {}))
        // ✅ 3) logs 재시도
        .then(() => syncLogsWithRetry().catch(() => {}))
        .catch(() => {})
        .finally(() => {
          warmupInflightRef.current = false;
        });
    },
    [resolveRefreshBody, syncLogsWithRetry]
  );

  useEffect(() => {
    if (!logsPollingEnabled) return;

    let alive = true;
    const id = setInterval(() => {
      if (!alive) return;
      syncLogs({ force: false }).catch(() => {});
    }, DEFAULT_LOGS_TTL_MS);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [logsPollingEnabled, syncLogs]);

  // ✅ 순서 고정 warmup (Layout에서 collect/places 이후에 호출)
  const warmupOrdered = useCallback(
    async (args = {}) => {
      await collectDetails({}).catch(() => {});
      const body = await resolveRefreshBody(args);
      await refreshStatus(body).catch(() => {});
      await syncLogsWithRetry().catch(() => {});
    },
    [resolveRefreshBody, syncLogsWithRetry]
  );

  const value = useMemo(
    () => ({
      openStatusMap,
      version,
      syncLogs,
      syncLogsWithRetry,
      warmupIfNeeded,
      warmupOrdered,
      logsPollingEnabled,
      setLogsPollingEnabled,
      lastGoodLogsAt: lastGoodLogsAtRef.current,
    }),
    [
      openStatusMap,
      version,
      syncLogs,
      syncLogsWithRetry,
      warmupIfNeeded,
      warmupOrdered,
      logsPollingEnabled,
    ]
  );

  return <CafeStatusCtx.Provider value={value}>{children}</CafeStatusCtx.Provider>;
}

export function useCafeStatus() {
  const v = useContext(CafeStatusCtx);
  if (!v) throw new Error("useCafeStatus must be used within CafeStatusProvider");
  return v;
}
