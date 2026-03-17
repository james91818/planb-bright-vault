import { Card, CardContent } from "@/components/ui/card";
import { Users, BarChart3, Globe, TrendingUp, Percent } from "lucide-react";

const stats = [
  { label: "Leverage up to", value: "1:100", icon: TrendingUp },
  { label: "Spreads from", value: "0.2%", icon: Percent },
  { label: "Minimum Deposit", value: "€250", icon: BarChart3 },
  { label: "Crypto & Tokenized Assets", value: "500+", icon: Globe },
  { label: "Global Clients", value: "150,000+", icon: Users },
];

const StatsBar = () => {
  return (
    <div className="bg-card border-y">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center space-y-1">
              <p className="text-2xl md:text-3xl font-display font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
