import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface MonthSelectorProps {
    month: number;
    year: number;
    onMonthChange: (month: number) => void;
    onYearChange: (year: number) => void;
}

export default function MonthSelector({
    month,
    year,
    onMonthChange,
    onYearChange,
}: MonthSelectorProps) {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const goToPrevMonth = () => {
        if (month === 1) {
            onMonthChange(12);
            onYearChange(year - 1);
        } else {
            onMonthChange(month - 1);
        }
    };

    const goToNextMonth = () => {
        if (month === 12) {
            onMonthChange(1);
            onYearChange(year + 1);
        } else {
            onMonthChange(month + 1);
        }
    };

    const isCurrentMonth =
        month === new Date().getMonth() + 1 && year === currentYear;

    return (
        <div className="flex items-center gap-3">
            <Button
                variant="outline"
                size="sm"
                onClick={goToPrevMonth}
                className="h-9 w-9 p-0 border-slate-700 hover:bg-slate-800"
            >
                <IconChevronLeft size={16} className="text-slate-300" />
            </Button>

            <div className="flex items-center gap-2">
                <Select
                    value={String(month)}
                    onValueChange={(v) => onMonthChange(parseInt(v))}
                >
                    <SelectTrigger className="w-[140px] border-slate-700 bg-slate-900/50 text-slate-200">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                        {MONTHS.map((name, idx) => (
                            <SelectItem
                                key={idx}
                                value={String(idx + 1)}
                                className="text-slate-200 focus:bg-slate-800 focus:text-slate-100"
                            >
                                {name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={String(year)}
                    onValueChange={(v) => onYearChange(parseInt(v))}
                >
                    <SelectTrigger className="w-[100px] border-slate-700 bg-slate-900/50 text-slate-200">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                        {years.map((y) => (
                            <SelectItem
                                key={y}
                                value={String(y)}
                                className="text-slate-200 focus:bg-slate-800 focus:text-slate-100"
                            >
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                disabled={isCurrentMonth}
                className="h-9 w-9 p-0 border-slate-700 hover:bg-slate-800"
            >
                <IconChevronRight size={16} className="text-slate-300" />
            </Button>
        </div>
    );
}
