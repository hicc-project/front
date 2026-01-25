// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import "./index.css";
import "./App.css";

import { CafeStatusProvider } from "./providers/CafeStatusProvider";
import { CafeFinderStateProvider } from "./providers/CafeFinderStateProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <CafeStatusProvider>
        <CafeFinderStateProvider>
          <App />
        </CafeFinderStateProvider>
      </CafeStatusProvider>
    </BrowserRouter>
  </React.StrictMode>
);
