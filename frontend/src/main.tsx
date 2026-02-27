import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { useAuthStore } from "./store/authStore";
import { clearTokens, loadTokens, getAccessToken } from "./lib/api";
import "./index.css";

// Hydrate auth from stored tokens on load
useAuthStore.getState().hydrate();

window.addEventListener("storage", (event) => {
  if (
    event.key !== "claimiq_access_token" &&
    event.key !== "claimiq_refresh_token"
  ) {
    return;
  }

  loadTokens();
  const token = getAccessToken();

  if (!token) {
    clearTokens();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      hydrated: true,
      loading: false,
      error: null,
    });
    return;
  }

  useAuthStore.getState().hydrate();
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
