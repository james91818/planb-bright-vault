import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const RiskWarning = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Home</Link>
      </Button>
      <h1 className="text-3xl font-display font-bold mb-2">Risk Warning</h1>
      <p className="text-muted-foreground text-sm mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <Card className="border-destructive/30 bg-destructive/5 mb-8">
        <CardContent className="pt-6 flex gap-4">
          <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm font-medium">Trading CFDs, forex, cryptocurrencies, and other financial instruments carries a high level of risk and may not be suitable for all investors. You should carefully consider your investment objectives, level of experience, and risk appetite before trading.</p>
        </CardContent>
      </Card>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold">Leverage Risk</h2>
          <p className="text-muted-foreground">Leveraged trading allows you to control larger positions with a smaller initial investment. While this can amplify profits, it equally amplifies losses. You may lose more than your initial deposit.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Market Volatility</h2>
          <p className="text-muted-foreground">Financial markets are subject to rapid and unpredictable price movements. Events such as economic reports, geopolitical developments, and market sentiment can cause significant price fluctuations.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">No Guaranteed Returns</h2>
          <p className="text-muted-foreground">Past performance is not indicative of future results. There is no guarantee that any trading strategy or investment will be profitable. You should never invest money you cannot afford to lose.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Cryptocurrency Risks</h2>
          <p className="text-muted-foreground">Cryptocurrency markets operate 24/7 and are highly volatile. Regulatory changes, technological vulnerabilities, and market manipulation can cause extreme price swings.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Counterparty Risk</h2>
          <p className="text-muted-foreground">When trading CFDs, you are entering into a contract with PlanB Trading as the counterparty. Your positions are not traded on a regulated exchange.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Seek Independent Advice</h2>
          <p className="text-muted-foreground">PlanB Trading does not provide investment advice. We strongly recommend seeking independent financial, legal, and tax advice before making any trading decisions.</p>
        </section>
      </div>
    </div>
  </div>
);

export default RiskWarning;
