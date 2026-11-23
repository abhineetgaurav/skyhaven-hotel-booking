import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { NoticeProvider } from "./context/NoticeContext.jsx";
import "./styles.css";

// If any remote photo fails to load, swap in a soft placeholder instead of a broken-image icon.
const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8f0ff"/><stop offset="1" stop-color="#9fd4f2"/></linearGradient></defs><rect width="600" height="400" fill="url(#g)"/><g fill="none" stroke="#168bd2" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity=".55"><path d="M210 250v-60a20 20 0 0 1 20-20h140a20 20 0 0 1 20 20v60M190 250h220v28M190 250v28"/><path d="M230 170v-20a15 15 0 0 1 15-15h110a15 15 0 0 1 15 15v20"/></g></svg>`
);
document.addEventListener("error", e => {
  const el = e.target;
  if (el instanceof HTMLImageElement && el.src !== PLACEHOLDER) el.src = PLACEHOLDER;
}, true);
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NoticeProvider>
          <App />
        </NoticeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
