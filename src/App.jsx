// src/App.jsx
// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./layout/Layout";

import Home from "./pages/home/Home";
import FindCafe from "./pages/findcafe/FindCafe";
import Open24 from "./pages/open24/Open24";
import Favorites from "./pages/favorites/Favorites";
import Settings from "./pages/settings/Settings";

// ✅ policy pages (사용자 생성 경로)
import Terms from "./pages/settings/policy/terms";
import Privacy from "./pages/settings/policy/privacy";
import Location from "./pages/settings/policy/location";
import Disclaimer from "./pages/settings/policy/disclaimer";
import Copyright from "./pages/settings/policy/copyright";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/find" element={<FindCafe />} />
        <Route path="/open24" element={<Open24 />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/settings" element={<Settings />} />

        {/* ✅ policy routes */}
        <Route path="/policy/terms" element={<Terms />} />
        <Route path="/policy/privacy" element={<Privacy />} />
        <Route path="/policy/location" element={<Location />} />
        <Route path="/policy/disclaimer" element={<Disclaimer />} />
        <Route path="/policy/copyright" element={<Copyright />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
