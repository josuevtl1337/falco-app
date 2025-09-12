import "./App.css";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./modules/commons/theme/theme-provider";
import AppRoutes from "./routes";

export default function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-center" richColors closeButton />
      <AppRoutes />
    </ThemeProvider>
  );
}
