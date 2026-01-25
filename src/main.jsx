// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import "./index.css";
import "./App.css";

import { CafeStatusProvider } from "./providers/CafeStatusProvider";
import { CafeFinderStateProvider } from "./providers/CafeFinderStateProvider";
import { Open24StateProvider } from "./providers/Open24StateProvider";




ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <CafeStatusProvider>
        <CafeFinderStateProvider>
          <Open24StateProvider>
            <App />
          </Open24StateProvider>
        </CafeFinderStateProvider>
      </CafeStatusProvider>
    </BrowserRouter>
  </React.StrictMode>
);
