import * as React from "react";
import {
  IconCalculatorFilled,
  IconChartBar,
  IconDashboard,
  IconFlask,
  IconListDetails,
  IconPackage,
  IconReportMoney,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { MoonIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { RoutePaths } from "@/routes/paths";
import { useTheme } from "@/modules/commons/theme/theme-provider";
import StockAlertBadge from "@/modules/stock/components/stock-alert-badge";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setTheme, theme } = useTheme();

  const data = {
    navMain: [
      {
        title: "Resumen",
        url: RoutePaths.resume,
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
        url: RoutePaths.finance,
        icon: IconReportMoney,
      },
      {
        name: "Motor de Costos",
        url: RoutePaths.costEngine,
        icon: IconCalculatorFilled,
      },
      {
        name: "Control de Stock",
        url: RoutePaths.stockControl,
        icon: IconPackage,
        badge: <StockAlertBadge />,
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
            ></SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        {/* Footer */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  );
}
