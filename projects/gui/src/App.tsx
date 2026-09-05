import { createRoot } from "react-dom/client";

import { Layout } from "./components/Layout";
import { AppContextProvider } from "./state/AppContext";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}
const root = createRoot(container);

root.render(
  <>
    <AppContextProvider>
      <Layout />
    </AppContextProvider>
  </>
);
