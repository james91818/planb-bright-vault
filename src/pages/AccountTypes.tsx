import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, TrendingUp, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Starter Asset Plan",
    color: "bg-blue-500",
    minDeposit: "€10,000",
    monthlyReturn: "~€1,500",
    assetClasses: [
      "Broad ETFs (World Index)",
      "Blue-Chip Stocks",
      "Real Estate Funds (REITs)",
      "Money Market / Cash",
    ],
    revenueSources: [
      "Dividends",
      "Interest",
    ],
  },
  {
    name: "Strategic Growth Plan",
    color: "bg-primary",
    minDeposit: "€25,000",
    monthlyReturn: "~€3,500",
    popular: true,
    assetClasses: [
      "Broad ETFs (World Index)",
      "Blue-Chip Stocks",
      "Dividend-Oriented Stocks",
      "Real Estate Funds (REITs)",
      "Bonds / Bond Funds",
      "Commodities / Raw Materials",
      "Money Market / Cash",
    ],
    revenueSources: [
      "Dividends",
      "Interest",
      "Fund Distributions (REITs, Bonds)",
    ],
  },
  {
    name: "Capital Diversification Plan",
    color: "bg-amber-500",
    minDeposit: "€50,000",
    monthlyReturn: "~€7,200",
    assetClasses: [
      "Broad ETFs (World Index)",
      "Blue-Chip Stocks",
      "Dividend-Oriented Stocks",
      "Real Estate Funds (REITs)",
      "Bonds / Bond Funds",
      "Commodities / Raw Materials",
      "Alternative Project Funds",
      "Multi-Asset ETFs / Strategies",
      "Thematic ETFs (AI, Green Energy)",
      "Money Market / Cash",
    ],
    revenueSources: [
      "Dividends",
      "Interest",
      "Fund Distributions",
      "Project Cash Flows (partial)",
      "Rental Income (Funds)",
    ],
  },
  {
    name: "Advanced Wealth Plan",
    color: "bg-amber-600",
    minDeposit: "€100,000",
    monthlyReturn: "~€15,450",
    assetClasses: [
      "Broad ETFs (World Index)",
      "Blue-Chip Stocks",
      "Dividend-Oriented Stocks",
      "Real Estate Funds (REITs)",
      "Bonds / Bond Funds",
      "Commodities / Raw Materials",
      "Alternative Project Funds",
      "Multi-Asset ETFs / Strategies",
      "Thematic ETFs (AI, Green Energy)",
      "Private Markets / Private Equity",
      "Money Market / Cash",
    ],
    revenueSources: [
      "Dividends",
      "Interest",
      "Fund Distributions",
      "Project Cash Flows",
      "Rental Income (Funds)",
    ],
  },
  {
    name: "Multi-Asset Professional",
    color: "bg-red-500",
    minDeposit: "€250,000",
    monthlyReturn: "~€35,150",
    assetClasses: [
      "Broad ETFs (World Index)",
      "Blue-Chip Stocks",
      "Dividend-Oriented Stocks",
      "Real Estate Funds (REITs)",
      "Bonds / Bond Funds",
      "Commodities / Raw Materials",
      "Alternative Project Funds",
      "Multi-Asset ETFs / Strategies",
      "Thematic ETFs (AI, Green Energy)",
      "Private Markets / Private Equity",
      "Direct Real Estate Investments",
      "Money Market / Cash",
    ],
    revenueSources: [
      "Dividends",
      "Interest",
      "Fund Distributions",
      "Project Cash Flows",
      "Rental Income (Funds + Direct)",
      "Private Equity Returns",
    ],
  },
  {
    name: "Legacy Wealth Strategy",
    color: "bg-gradient-to-r from-primary to-amber-500",
    minDeposit: "€500,000+",
    monthlyReturn: "~€70,300",
    premium: true,
    assetClasses: [
      "Broad ETFs (World Index)",
      "Blue-Chip Stocks",
      "Dividend-Oriented Stocks",
      "Real Estate Funds (REITs)",
      "Bonds / Bond Funds",
      "Commodities / Raw Materials",
      "Alternative Project Funds",
      "Multi-Asset ETFs / Strategies",
      "Thematic ETFs (AI, Green Energy)",
      "Private Markets / Private Equity",
      "Direct Real Estate Investments",
      "Structured Products",
      "Exclusive Special Funds",
      "Money Market / Cash",
    ],
    revenueSources: [
      "Dividends",
      "Interest",
      "Fund Distributions",
      "Project Cash Flows",
      "Rental Income (Direct)",
      "Private Equity Returns",
      "Structured Products",
    ],
  },
];

const AccountTypes = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="bg-hero border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <span className="text-lg font-display font-bold text-hero-foreground">PlanB </span>
              <span className="text-lg font-display font-light text-primary">Trading</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Button size="sm" asChild className="rounded-md px-5">
              <Link to="/signup">Open Account</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="rounded-md border-primary text-primary hover:bg-primary/10 bg-transparent">
              <Link to="/login">Client Login</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-hero py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative z-10 text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-hero-foreground">
            Investment Plans
          </h1>
          <p className="text-hero-muted text-lg max-w-2xl mx-auto">
            Choose the plan that matches your goals. Each tier unlocks additional asset classes,
            higher expected returns, and diversified revenue streams.
          </p>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative overflow-hidden flex flex-col transition-shadow hover:shadow-xl ${
                plan.popular ? "ring-2 ring-primary" : ""
              } ${plan.premium ? "ring-2 ring-amber-500" : ""}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                  Most Popular
                </div>
              )}
              {plan.premium && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                  Premium
                </div>
              )}

              <CardContent className="p-6 flex flex-col flex-1">
                {/* Header */}
                <div className="mb-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={`h-3.5 w-3.5 rounded-sm ${plan.color}`} />
                    <h3 className="font-display font-bold text-lg">{plan.name}</h3>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Min. Deposit: <span className="font-semibold text-foreground">{plan.minDeposit}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expected Monthly Return: <span className="font-bold text-success">{plan.monthlyReturn}</span>
                    </p>
                  </div>
                </div>

                {/* Asset Classes */}
                <div className="mb-4 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Asset Classes
                  </p>
                  <ul className="space-y-1.5">
                    {plan.assetClasses.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Revenue Sources */}
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Revenue Sources
                  </p>
                  <ul className="space-y-1.5">
                    {plan.revenueSources.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <Button asChild className="w-full rounded-full mt-auto group">
                  <Link to="/signup">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-hero py-12 md:py-16">
        <div className="container mx-auto px-4 text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-hero-foreground">
            Not sure which plan is right for you?
          </h2>
          <p className="text-hero-muted max-w-lg mx-auto">
            Our advisors can help you find the perfect investment strategy based on your capital and financial goals.
          </p>
          <Button size="lg" asChild className="rounded-full px-8">
            <Link to="/signup">Talk to an Advisor</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-hero border-t border-white/10 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-hero-muted">
            © {new Date().getFullYear()} PlanB Trading. All rights reserved. Past performance is not indicative of future results.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AccountTypes;
