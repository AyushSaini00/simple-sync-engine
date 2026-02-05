import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { SimpleSyncProvider } from "simple-sync-engine/client/react";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SimpleSyncProvider url="ws://localhost:3000/sync">
      <App />
    </SimpleSyncProvider>
  </StrictMode>,
);
