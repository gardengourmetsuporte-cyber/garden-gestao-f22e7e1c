import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AppIcon } from "@/components/ui/app-icon";

interface DatePickerProps {
  date: Date | undefined;
  onSelect: (date: Date) => void;
  disabled?: (date: Date) => boolean;
  placeholder?: string;
  className?: string;
  /** Format string for date-fns */
  formatStr?: string;
}

export function DatePicker({
  date,
  onSelect,
  disabled,
  placeholder = "Selecionar data",
  className,
  formatStr = "EEEE, dd 'de' MMMM",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-medium h-12 rounded-xl bg-card border gap-2",
            !date && "text-muted-foreground",
            className
          )}
        >
          <AppIcon name="Calendar" size={18} fill={0} className="text-muted-foreground shrink-0" />
          {date ? format(date, formatStr, { locale: ptBR }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" avoidCollisions={false}>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) {
              onSelect(d);
              setOpen(false);
            }
          }}
          disabled={disabled}
          initialFocus
          className="p-3 pointer-events-auto"
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}
