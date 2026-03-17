import { Card, CardContent } from "@/components/ui/card";
import { Users, BarChart3, Globe, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const stats = [
  { label: "Active Traders", value: "120K+", icon: Users },
  { label: "Daily Volume", value: "$2.4B", icon: BarChart3 },
  { label: "Countries", value: "150+", icon: Globe },
  { label: "Assets Available", value: "500+", icon: TrendingUp },
];

const AnimatedCounter = ({ target, suffix = "" }: { target: string; suffix?: string }) => {
  const [display, setDisplay] = useState(target);
  return <span>{display}</span>;
};

const StatsBar = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card border text-center">
          <CardContent className="pt-6 pb-4 space-y-2">
            <stat.icon className="h-6 w-6 mx-auto text-primary" />
            <p className="text-2xl md:text-3xl font-display font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsBar;
