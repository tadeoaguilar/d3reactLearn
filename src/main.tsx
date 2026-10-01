import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles.css";

// StrictMode runs effects twice in development (mount -> unmount -> mount)
// to expose missing cleanup functions. Module 04 explains why.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
