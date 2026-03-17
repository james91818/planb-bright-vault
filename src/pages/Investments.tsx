import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, ArrowLeft, Bitcoin, DollarSign, BarChart3, Gem, Globe, Zap, Shield, LineChart } from "lucide-react";

const investmentCategories = [
  {
    icon: Bitcoin,
    title: "Cryptocurrencies",
    description: "Trade the most popular digital assets including Bitcoin, Ethereum, Solana, and 50+ altcoins. Benefit from 24/7 market access with leverage up to 1:100.",
    assets: ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD", "ADA/USD", "DOT/USD"],
    color: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-500",
  },
  {
    icon: DollarSign,
    title: "Forex",
    description: "Access the world's largest financial market with 60+ currency pairs. Trade major, minor, and exotic pairs with tight spreads starting from 0.2 pips.",
    assets: ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CHF", "NZD/USD"],
    color: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-500",
  },
  {
    icon: BarChart3,
    title: "Stocks & Indices",
    description: "Invest in global equities from the US, Europe, and Asia. Trade CFDs on top companies like Apple, Tesla, and Amazon, or indices like S&P 500 and NASDAQ.",
    assets: ["AAPL", "TSLA", "AMZN", "NAS100", "US30", "GER40"],
    color: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-500",
  },
  {
    icon: Gem,
    title: "Commodities",
    description: "Diversify with precious metals, energy, and agricultural commodities. Trade Gold, Silver, Oil, and more with competitive margins.",
    assets: ["XAU/USD", "XAG/USD", "WTI Oil", "Brent Oil", "Natural Gas", "Copper"],
    color: "from-yellow-500/20 to-amber-500/20",
    iconColor: "text-yellow-500",
  },
];

const features = [
  { icon: Zap, title: "Lightning Execution", desc: "Orders executed in under 30ms with no requotes." },
  { icon: Shield, title: "Regulated & Secure", desc: "Your funds are held in segregated accounts with top-tier banks." },
  { icon: LineChart, title: "Advanced Charting", desc: "Professional-grade tools with 100+ technical indicators." },
  { icon: Globe, title: "24/7 Support", desc: "Dedicated account managers available around the clock." },
];

const Investments = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="bg-hero border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="leading-tight">
                <span className="text-lg font-display font-bold text-hero-foreground">PlanB </span>
                <span className="text-lg font-display font-light text-primary">Trading</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="text-hero-muted hover:text-hero-foreground">
              <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Home</Link>
            </Button>
            <Button size="sm" asChild className="rounded-md px-5">
              <Link to="/signup">Open Account</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-hero py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-hero-foreground mb-6">
            Our Investment Products
          </h1>
          <p className="text-hero-muted text-lg md:text-xl leading-relaxed">
            Access a diverse range of global markets — from cryptocurrencies and forex
            to stocks, indices, and commodities — all from a single powerful platform.
          </p>
        </div>
      </section>

      {/* Investment Categories */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 space-y-12">
          {investmentCategories.map((cat, i) => (
            <Card key={cat.title} className="overflow-hidden border-border/50 bg-card">
              <CardContent className="p-0">
                <div className={`grid md:grid-cols-2 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                  {/* Info side */}
                  <div className={`p-8 md:p-12 flex flex-col justify-center ${i % 2 === 1 ? "md:order-2" : ""}`}>
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${cat.color} mb-6`}>
                      <cat.icon className={`h-7 w-7 ${cat.iconColor}`} />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
                      {cat.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {cat.description}
                    </p>
                    <Button asChild className="rounded-full w-fit px-6">
                      <Link to="/signup">Start Trading {cat.title}</Link>
                    </Button>
                  </div>
                  {/* Assets grid side */}
                  <div className={`bg-muted/30 p-8 md:p-12 flex items-center ${i % 2 === 1 ? "md:order-1" : ""}`}>
                    <div className="grid grid-cols-3 gap-3 w-full">
                      {cat.assets.map((asset) => (
                        <div
                          key={asset}
                          className="bg-card border border-border/50 rounded-lg p-4 text-center font-display font-semibold text-sm text-foreground hover:border-primary/50 transition-colors"
                        >
                          {asset}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Why Trade With Us */}
      <section className="bg-hero py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-hero-foreground text-center mb-12">
            Why Trade With PlanB
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-sidebar-accent/50 border border-sidebar-border rounded-xl p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-hero-foreground mb-2">{f.title}</h3>
                <p className="text-hero-muted text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl font-display font-bold text-foreground mb-4">
            Ready to Start Investing?
          </h2>
          <p className="text-muted-foreground mb-8">
            Open your account in minutes and get access to all our investment products with a minimum deposit of €250.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="rounded-full px-8">
              <Link to="/signup">Open Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-full px-8">
              <Link to="/account-types">View Account Types</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-hero border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-hero-muted text-sm">
          © {new Date().getFullYear()} PlanB Trading. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Investments;
