import { Outlet, useLocation } from "react-router-dom";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import CommandPalette from "@/components/command-palette";
import PageTransition from "@/components/page-transition";
import { AnimatePresence } from "framer-motion";

export default function MainLayout() {
  const location = useLocation();

  return (
    <div className="h-screen grid grid-rows-[1fr]">
      <SidebarProvider>
        <AppSidebar collapsible={"offcanvas"} />

        <SidebarInset>
          <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/80 backdrop-blur-md border-b border-border/40 px-4 h-12">
            <SidebarTrigger />
            <div className="flex-1" />
            <button
              onClick={() =>
                document.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
                )
              }
              className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 border border-border/50 rounded-lg px-3 py-1.5 hover:bg-muted transition-colors"
            >
              <span>Buscar</span>
              <kbd className="font-mono text-[10px] bg-background border border-border/50 rounded px-1">
                Ctrl+K
              </kbd>
            </button>
          </header>

          <main className="overflow-auto p-2">
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </main>
        </SidebarInset>
      </SidebarProvider>

      <CommandPalette />
    </div>
  );
}
