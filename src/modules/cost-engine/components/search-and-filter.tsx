import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchAndFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: Array<{ value: string; label: string }>;
  filterPlaceholder?: string;
  searchPlaceholder?: string;
  showFilter?: boolean;
}

export function SearchAndFilter({
  searchValue,
  onSearchChange,
  filterValue,
  onFilterChange,
  filterOptions = [],
  filterPlaceholder = "Filtrar por proveedor",
  searchPlaceholder = "Buscar por nombre...",
  showFilter = true,
}: SearchAndFilterProps) {
  const handleClearSearch = () => {
    onSearchChange("");
  };

  const handleClearFilter = () => {
    if (onFilterChange) {
      onFilterChange("all");
    }
  };

  return (
    <div className="flex gap-4 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {showFilter && filterOptions.length > 0 && (
        <div className="flex gap-2 items-center">
          <Select
            value={filterValue || "all"}
            onValueChange={(value) => {
              if (onFilterChange) {
                onFilterChange(value);
              }
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={filterPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proveedores</SelectItem>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterValue && filterValue !== "all" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilter}
              className="h-10"
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
