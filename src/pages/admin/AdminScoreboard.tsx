import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { format, startOfMonth, startOfDay } from "date-fns";

interface AgentScore {
  agent_id: string;
  agent_name: string;
  total_amount: number;
  deposit_count: number;
}

const rankIcons = [
  <Trophy className="h-5 w-5 text-yellow-500" />,
  <Medal className="h-5 w-5 text-gray-400" />,
  <Award className="h-5 w-5 text-amber-700" />,
];

const AdminScoreboard = () => {
  const [dailyScores, setDailyScores] = useState<AgentScore[]>([]);
  const [monthlyScores, setMonthlyScores] = useState<AgentScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    setLoading(true);

    // Fetch all approved deposits
    const { data: deposits } = await supabase
      .from("deposits")
      .select("amount, created_at, user_id, processed_by")
      .eq("status", "approved");

    // Fetch all profiles to map agents
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, assigned_agent");

    // Fetch staff profiles for agent names
    const { data: staffRoles } = await supabase
      .from("user_roles")
      .select("user_id, roles(name)");

    const staffIds = new Set(
      (staffRoles || [])
        .filter((r: any) => ["Admin", "Manager", "Agent"].includes(r.roles?.name))
        .map((r: any) => r.user_id)
    );

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    const todayStart = startOfDay(new Date()).toISOString();
    const monthStart = startOfMonth(new Date()).toISOString();

    // Group deposits by the agent who processed them OR the assigned agent of the user
    const aggregate = (filterFn: (d: any) => boolean) => {
      const map = new Map<string, AgentScore>();

      (deposits || []).filter(filterFn).forEach((dep) => {
        // Use processed_by first, then fall back to assigned_agent of the depositor
        const agentId = dep.processed_by || profileMap.get(dep.user_id)?.assigned_agent;
        if (!agentId || !staffIds.has(agentId)) return;

        const existing = map.get(agentId);
        const agentProfile = profileMap.get(agentId);
        const agentName = agentProfile?.full_name || agentProfile?.email || "Unknown Agent";

        if (existing) {
          existing.total_amount += Number(dep.amount);
          existing.deposit_count += 1;
        } else {
          map.set(agentId, {
            agent_id: agentId,
            agent_name: agentName,
            total_amount: Number(dep.amount),
            deposit_count: 1,
          });
        }
      });

      return Array.from(map.values()).sort((a, b) => b.total_amount - a.total_amount);
    };

    setDailyScores(aggregate((d) => d.created_at >= todayStart));
    setMonthlyScores(aggregate((d) => d.created_at >= monthStart));
    setLoading(false);
  };

  const ScoreTable = ({ scores }: { scores: AgentScore[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead className="text-right">Deposits</TableHead>
          <TableHead className="text-right">Total Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {scores.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
              No deposits recorded for this period
            </TableCell>
          </TableRow>
        ) : (
          scores.map((score, idx) => (
            <TableRow key={score.agent_id} className={idx === 0 ? "bg-primary/5" : ""}>
              <TableCell className="font-bold">
                <div className="flex items-center gap-2">
                  {idx < 3 ? rankIcons[idx] : <span className="text-muted-foreground pl-1">#{idx + 1}</span>}
                </div>
              </TableCell>
              <TableCell className="font-medium">{score.agent_name}</TableCell>
              <TableCell className="text-right">{score.deposit_count}</TableCell>
              <TableCell className="text-right font-semibold">
                €{score.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const topDaily = dailyScores[0];
  const topMonthly = monthlyScores[0];
  const totalToday = dailyScores.reduce((s, a) => s + a.total_amount, 0);
  const totalMonth = monthlyScores.reduce((s, a) => s + a.total_amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Score Board</h1>
        <p className="text-muted-foreground text-sm">Agent deposit performance rankings</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Top Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-lg font-bold">{topDaily?.agent_name || "—"}</span>
            </div>
            {topDaily && (
              <p className="text-sm text-muted-foreground mt-1">
                €{topDaily.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold">
                €{totalToday.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{dailyScores.reduce((s, a) => s + a.deposit_count, 0)} deposits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Top Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-lg font-bold">{topMonthly?.agent_name || "—"}</span>
            </div>
            {topMonthly && (
              <p className="text-sm text-muted-foreground mt-1">
                €{topMonthly.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{format(new Date(), "MMMM")} Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold">
                €{totalMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{monthlyScores.reduce((s, a) => s + a.deposit_count, 0)} deposits</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Today</TabsTrigger>
          <TabsTrigger value="monthly">This Month</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today — {format(new Date(), "dd MMM yyyy")}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground text-sm py-4">Loading…</p> : <ScoreTable scores={dailyScores} />}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{format(new Date(), "MMMM yyyy")}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground text-sm py-4">Loading…</p> : <ScoreTable scores={monthlyScores} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminScoreboard;
