import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// Initialize main process backend handlers
import "../main/index";

console.log("⚡ [Renderer] PicoTS React frontend mounted & ready!");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
