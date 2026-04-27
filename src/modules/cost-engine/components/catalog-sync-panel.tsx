import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IconCloudDownload,
  IconCloudUpload,
  IconFileCode,
  IconRefresh,
  IconChecklist,
} from "@tabler/icons-react";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001/api/cost-engine";

interface CatalogMeta {
  version: number;
  exported_at: string;
  source: string;
}

interface CatalogPayloadPreview {
  meta?: CatalogMeta;
  suppliers?: unknown[];
  raw_materials?: unknown[];
  recipes?: unknown[];
  recipe_ingredients?: unknown[];
  cost_products?: unknown[];
  fixed_costs?: unknown[];
}

interface ImportTableSummary {
  created: number;
  updated: number;
  skipped: number;
}

interface ImportSummary {
  imported_at: string;
  source_meta?: CatalogMeta;
  suppliers: ImportTableSummary;
  raw_materials: ImportTableSummary;
  recipes: ImportTableSummary;
  recipe_ingredients: ImportTableSummary;
  cost_products: ImportTableSummary;
  fixed_costs: ImportTableSummary;
}

function formatTimestampForFilename(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}${m}${d}-${hh}${mm}`;
}

function getArrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function CatalogSyncPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [importPayload, setImportPayload] = useState<CatalogPayloadPreview | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  const previewCounts = useMemo(() => {
    if (!importPayload) {
      return {
        suppliers: 0,
        rawMaterials: 0,
        recipes: 0,
        ingredients: 0,
        products: 0,
        fixedCosts: 0,
      };
    }

    return {
      suppliers: getArrayLength(importPayload.suppliers),
      rawMaterials: getArrayLength(importPayload.raw_materials),
      recipes: getArrayLength(importPayload.recipes),
      ingredients: getArrayLength(importPayload.recipe_ingredients),
      products: getArrayLength(importPayload.cost_products),
      fixedCosts: getArrayLength(importPayload.fixed_costs),
    };
  }, [importPayload]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${API_BASE}/catalog/export`);
      if (!response.ok) {
        throw new Error("Failed to export catalog");
      }

      const data = await response.json();
      const fileName = `falco-catalog-sync-${formatTimestampForFilename(new Date())}.json`;
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Catálogo exportado correctamente");
    } catch {
      toast.error("No se pudo exportar el catálogo");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as CatalogPayloadPreview;
      setImportPayload(parsed);
      setSelectedFileName(file.name);
      setImportSummary(null);
      toast.success("Archivo cargado. Revisa el resumen y confirma la importación.");
    } catch {
      setImportPayload(null);
      setSelectedFileName("");
      setImportSummary(null);
      toast.error("El archivo no es un JSON válido");
    } finally {
      event.target.value = "";
    }
  };

  const handleImport = async () => {
    if (!importPayload) {
      toast.error("Selecciona un archivo antes de importar");
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch(`${API_BASE}/catalog/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importPayload),
      });
      if (!response.ok) {
        throw new Error("Failed to import catalog");
      }

      const summary = (await response.json()) as ImportSummary;
      setImportSummary(summary);
      toast.success("Catálogo importado correctamente");
    } catch {
      toast.error("No se pudo importar el catálogo");
    } finally {
      setIsImporting(false);
    }
  };

  const resetImportState = () => {
    setSelectedFileName("");
    setImportPayload(null);
    setImportSummary(null);
  };

  return (
    <>
      <Card className="border-border/60 bg-gradient-to-r from-cyan-500/5 via-transparent to-emerald-500/5">
        <CardContent className="px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <IconRefresh size={16} className="text-cyan-400" />
              <p className="text-sm font-medium">Sincronización de Catálogo</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Exporta o importa Proveedores, Materias Primas, Recetas, Productos y Gastos Fijos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleExport}
              disabled={isExporting}
            >
              <IconCloudDownload size={15} className={isExporting ? "animate-pulse" : ""} />
              Exportar catálogo
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <IconCloudUpload size={15} />
              Importar catálogo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isImportDialogOpen}
        onOpenChange={(open) => {
          setIsImportDialogOpen(open);
          if (!open) resetImportState();
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Importar catálogo de Motor de Costos</DialogTitle>
            <DialogDescription>
              Carga un archivo JSON exportado desde otra instalación de Falco.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="rounded-lg border border-dashed border-border/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <IconFileCode size={18} className="text-cyan-400 shrink-0" />
                  <p className="text-sm truncate">
                    {selectedFileName || "Ningún archivo seleccionado"}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleFilePick}>
                  Seleccionar archivo
                </Button>
              </div>
            </div>

            {importPayload && (
              <Card className="border-border/60">
                <CardContent className="pt-4 pb-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <IconChecklist size={16} className="text-emerald-400" />
                    <p className="text-sm font-medium">Resumen del archivo</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <Badge variant="outline" className="justify-between px-2 py-1">
                      Proveedores
                      <span>{previewCounts.suppliers}</span>
                    </Badge>
                    <Badge variant="outline" className="justify-between px-2 py-1">
                      Materias primas
                      <span>{previewCounts.rawMaterials}</span>
                    </Badge>
                    <Badge variant="outline" className="justify-between px-2 py-1">
                      Recetas
                      <span>{previewCounts.recipes}</span>
                    </Badge>
                    <Badge variant="outline" className="justify-between px-2 py-1">
                      Ingredientes
                      <span>{previewCounts.ingredients}</span>
                    </Badge>
                    <Badge variant="outline" className="justify-between px-2 py-1">
                      Productos
                      <span>{previewCounts.products}</span>
                    </Badge>
                    <Badge variant="outline" className="justify-between px-2 py-1">
                      Gastos fijos
                      <span>{previewCounts.fixedCosts}</span>
                    </Badge>
                  </div>
                  {importPayload.meta?.exported_at && (
                    <p className="text-xs text-muted-foreground">
                      Exportado: {importPayload.meta.exported_at}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {importSummary && (
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="pt-4 pb-3 space-y-2">
                  <p className="text-sm font-medium text-emerald-300">Importación completada</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Proveedores: +{importSummary.suppliers.created} / ~{importSummary.suppliers.updated}</div>
                    <div>Materias primas: +{importSummary.raw_materials.created} / ~{importSummary.raw_materials.updated}</div>
                    <div>Recetas: +{importSummary.recipes.created} / ~{importSummary.recipes.updated}</div>
                    <div>Ingredientes: ~{importSummary.recipe_ingredients.updated}</div>
                    <div>Productos: +{importSummary.cost_products.created} / ~{importSummary.cost_products.updated}</div>
                    <div>Gastos fijos: +{importSummary.fixed_costs.created} / ~{importSummary.fixed_costs.updated}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsImportDialogOpen(false)}
              >
                Cerrar
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={!importPayload || isImporting}
                className="gap-1.5"
              >
                <IconCloudUpload size={15} className={isImporting ? "animate-pulse" : ""} />
                Importar ahora
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CatalogSyncPanel;
