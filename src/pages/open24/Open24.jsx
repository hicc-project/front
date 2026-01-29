// src/pages/Open24/Open24.jsx
import { useMediaQuery } from "../../hooks/useMediaQuery";

import Open24Pc from "./pc/Open24Pc";
import Open24Mobile from "./mobile/Open24Mobile";

export default function Open24() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? <Open24Mobile /> : <Open24Pc />;
}
