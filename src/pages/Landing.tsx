import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp, Shield, Zap, BarChart3, ArrowRight, Star,
  Layers, Clock, Smartphone, LineChart, Lock, Percent,
} from "lucide-react";
import PriceTicker from "@/components/landing/PriceTicker";
import MarketOverview from "@/components/landing/MarketOverview";
import StatsBar from "@/components/landing/StatsBar";

const features = [
  {
    icon: TrendingUp,
    title: "Real-Time Trading",
    description: "Trade crypto, forex, and stocks with live market data and instant execution.",
  },
  {
    icon: Zap,
    title: "Up to 100× Leverage",
    description: "Amplify your positions with flexible leverage across all asset classes.",
  },
  {
    icon: BarChart3,
    title: "Advanced Charts",
    description: "Professional candlestick and line charts with real-time price updates.",
  },
  {
    icon: Shield,
    title: "Secure & Regulated",
    description: "Bank-grade security with 2FA, KYC verification, and encrypted data.",
  },
  {
    icon: Layers,
    title: "Multi-Asset Portfolio",
    description: "Manage crypto, stocks, and forex all from one unified dashboard.",
  },
  {
    icon: Clock,
    title: "24/7 Markets",
    description: "Crypto markets never sleep. Trade Bitcoin and altcoins around the clock.",
  },
];

const whyChoose = [
  { icon: Smartphone, title: "Mobile Ready", desc: "Trade from any device with our responsive platform." },
  { icon: LineChart, title: "Copy Trading", desc: "Follow top traders and mirror their strategies." },
  { icon: Lock, title: "Cold Storage", desc: "Your assets are secured in enterprise-grade cold wallets." },
  { icon: Percent, title: "Staking Rewards", desc: "Earn passive income with competitive APY rates." },
];

const testimonials = [
  { author: "Sarah M.", role: "Crypto Trader", content: "PlanB Trading transformed my portfolio. The real-time data and leverage options are incredible.", rating: 5 },
  { author: "James K.", role: "Forex Investor", content: "Best trading platform I've used. Clean interface, fast execution, and great charts.", rating: 5 },
  { author: "Maria L.", role: "Day Trader", content: "Finally a platform that handles crypto, stocks, and forex in one place. Highly recommend.", rating: 5 },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">PlanB Trading</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#markets" className="text-muted-foreground hover:text-foreground transition-colors">Markets</a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#why" className="text-muted-foreground hover:text-foreground transition-colors">Why PlanB</a>
            <a href="#reviews" className="text-muted-foreground hover:text-foreground transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Live Price Ticker */}
      <PriceTicker />

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
              Live markets — 500+ assets
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
              Invest in{" "}
              <span className="text-primary">Crypto</span>,{" "}
              <span className="text-primary">Stocks</span> &{" "}
              <span className="text-primary">Forex</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              One platform for all your trading needs. Real-time prices, advanced charting,
              and up to 100× leverage — start with as little as $10.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link to="/signup">
                  Start Trading Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link to="#markets">View Markets</Link>
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-primary" />
                <span>Insured assets</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" />
                <span>Instant execution</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-primary" />
                <span>0% fees</span>
              </div>
            </div>
          </div>
          {/* Hero visual — trading card mockup */}
          <div className="hidden lg:block">
            <Card className="border shadow-lg overflow-hidden">
              <div className="bg-sidebar p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">₿</span>
                  <div>
                    <p className="font-semibold text-sidebar-primary-foreground text-sm">BTC/USD</p>
                    <p className="text-xs text-sidebar-foreground">Bitcoin</p>
                  </div>
                </div>
                <span className="text-emerald-400 font-semibold text-sm">+2.34%</span>
              </div>
              <CardContent className="p-0">
                <svg viewBox="0 0 400 180" className="w-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,140 Q20,130 40,135 T80,120 T120,100 T160,110 T200,80 T240,85 T280,60 T320,50 T360,35 T400,30"
                    fill="none"
                    stroke="hsl(160, 84%, 39%)"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M0,140 Q20,130 40,135 T80,120 T120,100 T160,110 T200,80 T240,85 T280,60 T320,50 T360,35 T400,30 L400,180 L0,180 Z"
                    fill="url(#chartGrad)"
                  />
                </svg>
              </CardContent>
              <div className="p-4 border-t flex items-center justify-between">
                <div>
                  <p className="text-2xl font-display font-bold">$67,432.18</p>
                  <p className="text-xs text-muted-foreground">24h Volume: $28.4B</p>
                </div>
                <Button size="sm">Trade Now</Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-8">
        <StatsBar />
      </section>

      {/* Market Overview */}
      <section id="markets" className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold">Explore Live Markets</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Real-time prices across crypto, stocks, and forex. Start trading with just a few clicks.
          </p>
        </div>
        <MarketOverview />
        <div className="text-center mt-8">
          <Button size="lg" asChild>
            <Link to="/signup">
              Trade All Markets
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-muted/40 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold">Everything you need to trade</h2>
            <p className="text-muted-foreground mt-2">Professional tools, simplified for everyone.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="border bg-card hover:shadow-md transition-shadow">
                <CardContent className="pt-6 space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why PlanB */}
      <section id="why" className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              Why traders choose <span className="text-primary">PlanB</span>
            </h2>
            <p className="text-muted-foreground max-w-lg">
              Built by traders, for traders. We combine institutional-grade tools with a
              user-friendly experience that makes professional trading accessible to everyone.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {whyChoose.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Asset type cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="bg-sidebar text-sidebar-primary-foreground border-sidebar-border">
              <CardContent className="pt-6 space-y-2">
                <span className="text-3xl">₿</span>
                <h3 className="font-display font-bold text-lg">Cryptocurrency</h3>
                <p className="text-sm text-sidebar-foreground">
                  Trade 200+ crypto pairs including Bitcoin, Ethereum, Solana, and more with 24/7 access.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-sidebar text-sidebar-primary-foreground border-sidebar-border">
              <CardContent className="pt-6 space-y-2">
                <span className="text-3xl">📈</span>
                <h3 className="font-display font-bold text-lg">Stocks</h3>
                <p className="text-sm text-sidebar-foreground">
                  Invest in top companies like Apple, Tesla, Google, and Amazon with fractional shares.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-sidebar text-sidebar-primary-foreground border-sidebar-border sm:col-span-2">
              <CardContent className="pt-6 space-y-2">
                <span className="text-3xl">💱</span>
                <h3 className="font-display font-bold text-lg">Forex</h3>
                <p className="text-sm text-sidebar-foreground">
                  Access major, minor, and exotic currency pairs with tight spreads and high leverage.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="bg-muted/40 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold">Trusted by traders worldwide</h2>
            <p className="text-muted-foreground mt-2">See what our community has to say.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <Card key={t.author} className="bg-card">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">"{t.content}"</p>
                  <div>
                    <p className="text-sm font-semibold">{t.author}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold">
            Ready to start your investment journey?
          </h2>
          <p className="text-muted-foreground text-lg">
            Join 120,000+ traders worldwide. Create your free account in under a minute.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/signup">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-display font-bold">PlanB Trading</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your trusted platform for crypto, stock, and forex trading.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Markets</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Cryptocurrency</li>
                <li>Stocks</li>
                <li>Forex</li>
                <li>Commodities</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Products</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Spot Trading</li>
                <li>Leverage Trading</li>
                <li>Staking</li>
                <li>Copy Trading</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About Us</li>
                <li>Careers</li>
                <li>Support</li>
                <li>Terms & Privacy</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PlanB Trading. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Trading involves risk. Past performance is not indicative of future results.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
