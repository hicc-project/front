import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { fetch24hCafes, getBrowserLocation } from "../utils/cafeApi";

const Ctx = createContext(null);

// TTL: 2분
const OPEN24_TTL_MS = 120_000;

export function Open24StateProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [myLoc, setMyLoc] = useState(null);
  const [cafesRaw, setCafesRaw] = useState([]);

  // ✅ refs: 상태 안정화용
  const cafesRef = useRef([]);
  const lastFetchedAtRef = useRef(0);
  const inflightRef = useRef(null);
  const reqSeqRef = useRef(0);

  const setCafesSafe = (list) => {
    cafesRef.current = list;
    setCafesRaw(list);
  };

  const loadOpen24 = useCallback(async ({ force = false } = {}) => {
    const now = Date.now();
    const hasData = cafesRef.current.length > 0;
    const isFresh = hasData && now - lastFetchedAtRef.current < OPEN24_TTL_MS;

    // ✅ TTL 캐시
    if (!force && isFresh) return cafesRef.current;

    // ✅ 진행 중 요청 재사용(연타 방지)
    if (!force && inflightRef.current) return inflightRef.current;

    const mySeq = ++reqSeqRef.current;

    setLoading(true);
    setErrMsg("");

    const p = (async () => {
      try {
        const loc = await getBrowserLocation({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60_000,
        });

        // ✅ 오래된 요청 무시
        if (mySeq !== reqSeqRef.current) return cafesRef.current;

        setMyLoc(loc);

        const list = await fetch24hCafes({
          lat: loc.lat,
          lng: loc.lng,
          radius_m: 2000, // 서버가 받으면 적용됨(무시해도 무해)
        });

        const arr = Array.isArray(list) ? list : [];

        if (mySeq !== reqSeqRef.current) return cafesRef.current;

        // ✅ 핵심 방어: 빈 배열이면 기존 데이터 유지 (force여도 유지)
        if (arr.length === 0 && cafesRef.current.length > 0) {
          setErrMsg("서버가 일시적으로 빈 응답을 줬습니다. ");
          return cafesRef.current;
        }

        setCafesSafe(arr);
        lastFetchedAtRef.current = Date.now();
        return arr;
      } catch (e) {
        const msg = String(e?.message || "");
        if (msg.includes("GEO_NOT_SUPPORTED")) setErrMsg("이 브라우저는 위치 기능을 지원하지 않습니다.");
        else if (msg.includes("permission") || msg.includes("denied"))
          setErrMsg("위치 권한이 꺼져 있습니다. 허용 후 다시 시도해주세요.");
        else setErrMsg("24시간 카페를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        return cafesRef.current;
      } finally {
        if (mySeq === reqSeqRef.current) inflightRef.current = null;
        setLoading(false);
      }
    })();

    inflightRef.current = p;
    return p;
  }, []);

  const value = useMemo(
    () => ({ loading, errMsg, myLoc, cafesRaw, loadOpen24, ttlMs: OPEN24_TTL_MS }),
    [loading, errMsg, myLoc, cafesRaw, loadOpen24]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOpen24State() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOpen24State must be used within Open24StateProvider");
  return v;
}
