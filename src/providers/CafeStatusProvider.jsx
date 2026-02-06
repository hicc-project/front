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

import { collectDetails, refreshStatus, fetchOpenStatusLogs } from "../utils/cafeApi";

/**
 * 앱 전역 open_status_logs 공유 + (가끔만) warmup(collect_details/refresh_status)
 *
 *  1) open_status_logs가 null/비배열/빈배열이면 기존 openStatusMap 유지 (절대 비우지 않기)
 *  2) open_status_logs가 부분 데이터로 와도 merge로 누락 방지
 *  3) warmup(collect_details -> refresh_status) 후 open_status_logs를 2~3번 재시도해서
 *     "최초 유효 logs" 확보 확률을 높임 (초기 '정보없음' 개선)
 */

const CafeStatusCtx = createContext(null);

const DEFAULT_LOGS_TTL_MS = 10_000; // logs 폴링 주기
const DEFAULT_WARMUP_COOLDOWN_MS = 240_000; // warmup 쿨다운(4분)
const RETRY_AFTER_WARMUP_ATTEMPTS = 3; // warmup 후 강제 logs 재시도 횟수
const RETRY_AFTER_WARMUP_DELAY_MS = 1200; // warmup 후 재시도 간격(ms)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function CafeStatusProvider({ children }) {
  const [openStatusMap, setOpenStatusMap] = useState({});
  const [version, setVersion] = useState(0);

  // ✅ logs 폴링은 "부트스트랩 완료" 이후에만 켜기 (API 호출 순서 보장)
  const [logsPollingEnabled, setLogsPollingEnabled] = useState(false);

  // 마지막으로 "정상 logs"를 반영한 시각
  const lastGoodLogsAtRef = useRef(0);

  // warmup 중복 방지
  const lastWarmupAtRef = useRef(0);
  const warmupInflightRef = useRef(false);

  // (선택) 디버그 로그 토글
  const DEBUG = false;

  const syncLogs = useCallback(async ({ force = false } = {}) => {
    const logs = await fetchOpenStatusLogs({
      ttlMs: force ? 0 : DEFAULT_LOGS_TTL_MS,
    }).catch(() => null);

    // 1) 실패/비정상 -> 기존 유지
    if (!Array.isArray(logs)) {
      if (DEBUG) console.log("[CafeStatus] logs not array -> keep prev", logs);
      return false;
    }

    // 2) 빈 배열 -> 기존 유지 (중요)
    if (logs.length === 0) {
      if (DEBUG) console.log("[CafeStatus] logs empty -> keep prev");
      return false;
    }

    // 3) ID 추출 방어적으로
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

    // ID가 하나도 못 뽑혔으면(필드명/형식 문제)도 기존 유지
    const keys = Object.keys(next);
    if (keys.length === 0) {
      if (DEBUG) console.log("[CafeStatus] parsed next empty -> keep prev", logs?.[0]);
      return false;
    }

    // 4) 부분 데이터/누락 방지: merge
    setOpenStatusMap((prev) => ({ ...prev, ...next }));
    setVersion((v) => v + 1);
    lastGoodLogsAtRef.current = Date.now();

    if (DEBUG) console.log("[CafeStatus] sync ok", keys.length);
    return true;
  }, []);

  // ✅ warmup 직후 open_status_logs가 빈 배열로 튀는 경우가 있어서 재시도
  const syncLogsWithRetry = useCallback(
    async ({ attempts = RETRY_AFTER_WARMUP_ATTEMPTS, delayMs = RETRY_AFTER_WARMUP_DELAY_MS } = {}) => {
      for (let i = 0; i < attempts; i++) {
        // force로 캐시 무시
        const ok = await syncLogs({ force: true }).catch(() => false);
        if (ok) return true; // 한번이라도 유효 데이터 확보하면 끝
        await sleep(delayMs);
      }
      return false;
    },
    [syncLogs]
  );

  const warmupIfNeeded = useCallback(() => {
    const now = Date.now();
    if (warmupInflightRef.current) return;
    if (now - lastWarmupAtRef.current < DEFAULT_WARMUP_COOLDOWN_MS) return;

    warmupInflightRef.current = true;
    lastWarmupAtRef.current = now;

    // ✅ UX 느려지지 않게 백그라운드로만 실행
    Promise.resolve()
      .then(() => collectDetails({}).catch(() => {}))
      .then(() => refreshStatus({}).catch(() => {}))
      // ✅ refresh 후 logs를 2~3번 재시도해서 "최초 유효 logs" 확보 확률↑
      .then(() => syncLogsWithRetry().catch(() => {}))
      .catch(() => {})
      .finally(() => {
        warmupInflightRef.current = false;
      });
  }, [syncLogsWithRetry]);

  // ✅ 부트스트랩 이후에만 logs 폴링 시작
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
  const warmupOrdered = useCallback(async () => {
    // collect_details -> refresh_status -> (force) logs
    await collectDetails({}).catch(() => {});
    await refreshStatus({}).catch(() => {});
    await syncLogsWithRetry().catch(() => {});
  }, [syncLogsWithRetry]);

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
    [openStatusMap, version, syncLogs, syncLogsWithRetry, warmupIfNeeded, warmupOrdered, logsPollingEnabled]
  );

  return <CafeStatusCtx.Provider value={value}>{children}</CafeStatusCtx.Provider>;
}

export function useCafeStatus() {
  const v = useContext(CafeStatusCtx);
  if (!v) throw new Error("useCafeStatus must be used within CafeStatusProvider");
  return v;
}
