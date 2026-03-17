import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

const PlaceholderPage = () => {
  const location = useLocation();
  const pageName = location.pathname
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/-/g, " ")
    ?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Page";

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Construction className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h1 className="text-xl font-display font-bold">{pageName}</h1>
        <p className="text-muted-foreground text-sm mt-1">This section is coming soon.</p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
