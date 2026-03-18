import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ColumnDef } from "@/hooks/useColumnOrder";

interface Props {
  column: ColumnDef;
  isFirst: boolean;
  isLast: boolean;
  onMove: (key: string, dir: "left" | "right") => void;
}

const ReorderableHeader = ({ column, isFirst, isLast, onMove }: Props) => (
  <th className="text-left p-3 font-medium text-muted-foreground">
    <div className="flex items-center gap-0.5 group">
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        disabled={isFirst}
        onClick={(e) => { e.stopPropagation(); onMove(column.key, "left"); }}
      >
        <ChevronLeft className="h-3 w-3" />
      </Button>
      <span className="whitespace-nowrap text-xs">{column.label}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        disabled={isLast}
        onClick={(e) => { e.stopPropagation(); onMove(column.key, "right"); }}
      >
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  </th>
);

export default ReorderableHeader;
