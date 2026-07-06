import { useCallback, useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type SyncStatusResponse = {
  status?: string;
  pending?: number;
  enabled?: boolean;
  running?: boolean;
};

const API_URL =
  import.meta.env.VITE_LOCAL_API_URL ?? "http://localhost:3001/api";

export default function SyncStatus() {
  const [state, setState] = useState<SyncStatusResponse>({});

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/sync/status`);
      if (!response.ok)
        throw new Error(`Sync status returned ${response.status}`);
      setState(await response.json());
    } catch {
      setState({ status: "offline" });
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 30_000);
    return () => clearInterval(timer);
  }, [load]);

  const run = async () => {
    try {
      await fetch(`${API_URL}/sync/run`, { method: "POST" });
    } finally {
      await load();
    }
  };

  const online = ["synced", "syncing", "pending"].includes(state.status ?? "");
  const label =
    state.enabled === false
      ? "Sync desactivado"
      : state.status === "syncing"
        ? "Sincronizando"
        : "Sincronización";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => void run()}
          tooltip="Sincronizar ahora"
        >
          {online ? <Cloud /> : <CloudOff />}
          <span>{label}</span>
          {state.running ? (
            <RefreshCw className="animate-spin" />
          ) : (
            <Badge variant={online ? "secondary" : "outline"}>
              {state.pending ?? 0}
            </Badge>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
