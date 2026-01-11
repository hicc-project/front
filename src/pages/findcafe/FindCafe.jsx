// src/pages/findcafe/FindCafe.jsx
import { useMediaQuery } from "../../hooks/useMediaQuery";

import FindCafePc from "./pc/FindCafePc";
import FindCafeMobile from "./mobile/FindCafeMobile";

export default function FindCafe() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? <FindCafeMobile /> : <FindCafePc />;
}