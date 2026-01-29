import React, { createContext, useContext, useMemo, useState } from "react";

/**
 * CafeFinderStateProvider
 * - /find 페이지의 상태를 라우트 이동 후에도 유지
 * - PC/Mobile 컴포넌트가 바뀌어도 동일 상태 공유
 */

const Ctx = createContext(null);

export function CafeFinderStateProvider({ children }) {
  const [distanceKm, setDistanceKm] = useState(1.0);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isMyLocationMode, setIsMyLocationMode] = useState(false);
  const [center, setCenter] = useState({ lat: 37.5506, lng: 126.9258 });
  const [myLocation, setMyLocation] = useState(null);

  const value = useMemo(
    () => ({
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
    }),
    [distanceKm, places, selectedPlace, isMyLocationMode, center, myLocation]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCafeFinderState() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCafeFinderState must be used within CafeFinderStateProvider");
  return v;
}
