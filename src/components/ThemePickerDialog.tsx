import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface ThemePickerDialogProps {
  open: boolean;
  onClose: () => void;
}

const ThemePickerDialog = ({ open, onClose }: ThemePickerDialogProps) => {
  const { theme, setTheme } = useTheme();
  const [selected, setSelected] = useState<"light" | "dark">(theme);

  const handleSelect = (t: "light" | "dark") => {
    setSelected(t);
    setTheme(t);
  };

  const handleConfirm = () => {
    localStorage.setItem("planb-theme-chosen", "true");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display text-center">Choose Your Theme</DialogTitle>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Select your preferred appearance. You can change this anytime from the sidebar.
          </p>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Light */}
          <button
            onClick={() => setSelected("light")}
            className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
              selected === "light"
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className="h-14 w-14 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
              <Sun className="h-7 w-7 text-amber-500" />
            </div>
            <span className="font-display font-bold text-base">Light</span>
            <span className="text-xs text-muted-foreground">Clean & bright</span>
          </button>

          {/* Dark */}
          <button
            onClick={() => setSelected("dark")}
            className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
              selected === "dark"
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className="h-14 w-14 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center">
              <Moon className="h-7 w-7 text-blue-300" />
            </div>
            <span className="font-display font-bold text-base">Dark</span>
            <span className="text-xs text-muted-foreground">Easy on the eyes</span>
          </button>
        </div>

        <Button onClick={handleConfirm} className="w-full mt-4 h-11 text-base font-bold rounded-xl">
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ThemePickerDialog;
