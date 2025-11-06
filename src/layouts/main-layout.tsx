import { Outlet } from "react-router-dom";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function MainLayout() {
  return (
    <div className="h-screen grid grid-rows-[56px_1fr]">
      <SidebarProvider>
        <AppSidebar collapsible={"offcanvas"} />

        <SidebarInset>
          <main className="overflow-auto bg-background p-4">
            <SidebarTrigger />
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
