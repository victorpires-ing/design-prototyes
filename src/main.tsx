import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { I18nProvider } from "react-aria-components";
import App from "./app/App.tsx";
import { CommentsLayer } from "./lib/comments";
import { TestRunnerLayer } from "./lib/usability";
import { RouteProvider } from "./providers/router-provider";
import { ThemeProvider } from "./providers/theme-provider";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <I18nProvider locale="pt-BR">
    <ThemeProvider>
      <BrowserRouter>
        <RouteProvider>
          <CommentsLayer>
            <App />
            <TestRunnerLayer />
          </CommentsLayer>
        </RouteProvider>
      </BrowserRouter>
    </ThemeProvider>
  </I18nProvider>
);
