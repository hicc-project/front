// src/pages/favorites/Favorites.jsx
import { useMediaQuery } from "../../hooks/useMediaQuery";

import FavoritesPc from "./pc/FavoritesPc";
import FavoritesMobile from "./mobile/FavoritesMobile";

export default function Favorites() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? <FavoritesMobile /> : <FavoritesPc />;
}