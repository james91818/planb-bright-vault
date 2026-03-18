import { useState, useCallback } from "react";

export interface ColumnDef {
  key: string;
  label: string;
}

export function useColumnOrder(storageKey: string, defaultColumns: ColumnDef[]) {
  const [columns, setColumns] = useState<ColumnDef[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        const colMap = new Map(defaultColumns.map(c => [c.key, c]));
        const ordered = parsed.map(k => colMap.get(k)).filter(Boolean) as ColumnDef[];
        // Add any new columns not in saved order
        const savedSet = new Set(parsed);
        defaultColumns.forEach(c => { if (!savedSet.has(c.key)) ordered.push(c); });
        return ordered;
      }
    } catch {}
    return defaultColumns;
  });

  const moveColumn = useCallback((key: string, direction: "left" | "right") => {
    setColumns(prev => {
      const idx = prev.findIndex(c => c.key === key);
      if (idx < 0) return prev;
      const swapIdx = direction === "left" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      localStorage.setItem(storageKey, JSON.stringify(next.map(c => c.key)));
      return next;
    });
  }, [storageKey]);

  return { columns, moveColumn };
}
