
  import { createRoot } from "react-dom/client";
  import { BrowserRouter } from "react-router";
  import AppShell from "./app/AppShell";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>,
  );
  
