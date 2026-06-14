import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { I18nProvider } from "react-aria-components";
import App from "./app/App.tsx";
import { CommentsLayer } from "./lib/comments";
import { CaptureBridge, EM_CAPTURA, TestRunnerLayer } from "./lib/usability";
import { FigmaExportLayer } from "./lib/figma-export/FigmaExportLayer";
import { RouteProvider } from "./providers/router-provider";
import { ThemeProvider } from "./providers/theme-provider";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <I18nProvider locale="pt-BR">
    <ThemeProvider>
      <BrowserRouter>
        <RouteProvider>
          {EM_CAPTURA ? (
            // Modo captura (iframe do editor): app puro + ponte, sem comentários nem runner.
            <>
              <App />
              <CaptureBridge />
            </>
          ) : (
            <CommentsLayer>
              <App />
              <TestRunnerLayer />
              <FigmaExportLayer />
            </CommentsLayer>
          )}
        </RouteProvider>
      </BrowserRouter>
    </ThemeProvider>
  </I18nProvider>
);
