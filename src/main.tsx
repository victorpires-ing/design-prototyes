import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./app/App.tsx";
import { CommentsLayer } from "./lib/comments";
import { RouteProvider } from "./providers/router-provider";
import { ThemeProvider } from "./providers/theme-provider";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <BrowserRouter>
      <RouteProvider>
        <CommentsLayer>
          <App />
        </CommentsLayer>
      </RouteProvider>
    </BrowserRouter>
  </ThemeProvider>
);
