import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ToastProvider } from "./context/ToastContext";
import "./styles.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find #root element");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);

