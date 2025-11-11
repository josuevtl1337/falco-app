import "./App.css";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./modules/commons/theme/theme-provider";
import AppRoutes from "./routes";
import { createContext, useState } from "react";

export type ShiftType = "morning" | "afternoon";

export const ShiftContext = createContext({
  shift: "morning",
  setShift: (_s: "morning" | "afternoon") => {},
});

export default function App() {
  const getInitialShift = (): ShiftType => {
    const now = new Date();

    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const argentinaTime = new Date(utc - 3 * 60 * 60 * 1000);

    const hour = argentinaTime.getHours();

    return hour < 13 ? "morning" : "afternoon";
  };

  const [shift, setShift] = useState<ShiftType>(getInitialShift());
  return (
    <ThemeProvider>
      <ShiftContext.Provider value={{ shift, setShift }}>
        <Toaster position="top-center" richColors closeButton />
        <AppRoutes />
      </ShiftContext.Provider>
    </ThemeProvider>
  );
}
