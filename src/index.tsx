import ReactDOM from "react-dom/client";
import { StrictMode } from "react";

import { Root } from "@/components/Root";
import { initTelegram } from "@/helpers/telegram";
import { initTestMode } from "@/helpers/testMode";
import { initI18n } from "@/i18n";

import "@/index.css";

// Expand + go fullscreen and publish Telegram's safe-area insets before render.
initTelegram();
// Restore vConsole if test mode was left on from a previous session.
initTestMode();

async function bootstrap() {
  // Load the customer's language before the first render so nothing flashes
  // in the wrong language.
  await initI18n();

  const root = ReactDOM.createRoot(document.getElementById("root")!);

  root.render(
    <StrictMode>
      <Root />
    </StrictMode>
  );
}

void bootstrap();
