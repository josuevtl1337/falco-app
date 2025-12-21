import * as React from "react";
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFlask,
  IconFolder,
  IconListDetails,
  IconReport,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { MoonIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { RoutePaths } from "@/routes/paths";
import { useTheme } from "@/modules/commons/theme/theme-provider";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setTheme, theme } = useTheme();

  const data = {
    user: {
      name: "john doe",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
      {
        title: "Resumen",
        url: "#",
        icon: IconDashboard,
      },
      {
        title: "Salon",
        url: RoutePaths.createOrder,
        icon: IconListDetails,
      },
      {
        title: "Carta",
        url: RoutePaths.menu,
        icon: IconChartBar,
      },
      {
        title: "Inventario",
        url: RoutePaths.products,
        icon: IconFolder,
      },
    ],
    navSecondary: [
      {
        title: "Dark Mode",
        url: "#",
        onClick: () => {
          setTheme(theme === "dark" ? "light" : "dark");
        },
        icon: MoonIcon,
      },
    ],
    documents: [
      {
        name: "Calibracion",
        url: RoutePaths.calibration,
        icon: IconFlask,
      },
      {
        name: "Finanzas",
        url: RoutePaths.budget,
        icon: IconDatabase,
      },
      {
        name: "Reportes",
        url: RoutePaths.reports,
        icon: IconReport,
      },
    ],
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 text-[var(--primary)]"
            >
              <a href="#">
                {/* <Coffee className="!size-5" /> */}
                <span className="text-base font-semibold logo-font text-[var(--primary)]">
                  Falco
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        {/* Footer */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
