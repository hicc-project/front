// src/pages/settings/Settings.jsx
import { useMediaQuery } from "../../hooks/useMediaQuery";

import SettingsPc from "./pc/SettingsPc";
import SettingsMobile from "./mobile/SettingsMobile";

export default function Settings() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? <SettingsMobile /> : <SettingsPc />;
}
