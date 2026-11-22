import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { NoticeProvider } from "./context/NoticeContext.jsx";
import "./styles.css";
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
