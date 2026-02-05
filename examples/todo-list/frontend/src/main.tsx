import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { SimpleSyncProvider } from "../../../../src/client/react/SimpleSyncProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SimpleSyncProvider url="ws://localhost:3000/sync">
      <App />
    </SimpleSyncProvider>
  </StrictMode>
);
