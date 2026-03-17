import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

const Instruments = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("assets").select("*").eq("enabled", true).order("symbol");
      setAssets(data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const types = [...new Set(assets.map(a => a.type))];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Home</Link>
        </Button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold mb-3">Instruments</h1>
          <p className="text-muted-foreground text-lg">Explore all tradable assets on PlanB Trading</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : (
          <Tabs defaultValue={types[0] || "crypto"}>
            <TabsList className="mb-4">
              {types.map(t => (
                <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>
              ))}
            </TabsList>
            {types.map(t => (
              <TabsContent key={t} value={t}>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      {t.charAt(0).toUpperCase() + t.slice(1)} Instruments
                      <Badge variant="secondary" className="ml-2">{assets.filter(a => a.type === t).length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-medium text-muted-foreground">Symbol</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Max Leverage</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Market Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assets.filter(a => a.type === t).map(a => (
                            <tr key={a.id} className="border-b last:border-0">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  {a.icon_url && <img src={a.icon_url} alt={a.symbol} className="h-5 w-5 rounded-full" />}
                                  <span className="font-semibold">{a.symbol}</span>
                                </div>
                              </td>
                              <td className="p-3 text-muted-foreground">{a.name}</td>
                              <td className="p-3"><Badge variant="outline">1:{a.leverage_max}</Badge></td>
                              <td className="p-3 text-muted-foreground text-xs">
                                {a.market_hours_start && a.market_hours_end
                                  ? `${a.market_hours_start.slice(0, 5)} – ${a.market_hours_end.slice(0, 5)}`
                                  : "24/7"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}

        <div className="text-center mt-12">
          <Button size="lg" asChild className="rounded-full px-8">
            <Link to="/signup">Start Trading Now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Instruments;
