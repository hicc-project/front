// src/pages/home/Home.jsx
import { useMediaQuery } from "../../hooks/useMediaQuery";

import HomePc from "./pc/HomePc";
import HomeMobile from "./mobile/HomeMobile";

export default function Home() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? <HomeMobile /> : <HomePc />;
}
