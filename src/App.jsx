// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./layout/Layout";

import Home from "./pages/home/Home";
import FindCafe from "./pages/findcafe/FindCafe";
import Open24 from "./pages/open24/Open24";
import Favorites from "./pages/favorites/Favorites";
import Settings from "./pages/settings/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/find" element={<FindCafe />} />
        <Route path="/open24" element={<Open24 />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
