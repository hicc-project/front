// src/hooks/useMediaQuery.js
import { useEffect, useState } from "react";

export function useMediaQuery(query) {
  const getMatches = () => {
    // SSR(서버 렌더링) 대비
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQueryList = window.matchMedia(query);

    const onChange = (event) => {
      setMatches(event.matches);
    };

    // 최신 브라우저
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", onChange);
      return () => mediaQueryList.removeEventListener("change", onChange);
    }

    // 구형 Safari 대응
    mediaQueryList.addListener(onChange);
    return () => mediaQueryList.removeListener(onChange);
  }, [query]);

  return matches;
}
