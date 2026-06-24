import ReactDOM from "react-dom/client";
import { StrictMode } from "react";

import { Root } from "@/components/Root";
import { initTelegram } from "@/helpers/telegram";

import "@/index.css";

// Expand + go fullscreen and publish Telegram's safe-area insets before render.
initTelegram();

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <Root />
  </StrictMode>
);
