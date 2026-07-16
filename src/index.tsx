import ReactDOM from "react-dom/client";
import { StrictMode } from "react";

import { Root } from "@/components/Root";
import { initTelegram } from "@/helpers/telegram";
import { initTestMode } from "@/helpers/testMode";

import "@/index.css";

// Expand + go fullscreen and publish Telegram's safe-area insets before render.
initTelegram();
// Restore vConsole if test mode was left on from a previous session.
initTestMode();

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <Root />
  </StrictMode>
);
