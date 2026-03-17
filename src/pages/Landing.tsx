import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp, Shield, Zap, BarChart3, ArrowRight, Star,
  Lock, Landmark, Headphones, Eye, Server, Monitor,
  CheckCircle2, Smartphone, MessageCircle, Mail,
} from "lucide-react";
import PriceTicker from "@/components/landing/PriceTicker";
import MarketOverview from "@/components/landing/MarketOverview";
import StatsBar from "@/components/landing/StatsBar";

const whyFeatures = [
  {
    icon: Shield,
    title: "Secure & Protected Funding",
    description: "Your funds are protected through institutional-grade encryption and segregated accounts with top-tier banks.",
  },
  {
    icon: Zap,
    title: "Leverage Up to 1:100",
    description: "The higher the leverage, the less capital you need. Trade larger positions with a smaller initial margin.",
  },
  {
    icon: Headphones,
    title: "Dedicated Customer Support",
    description: "Our multilingual support team is available via live chat, email, and phone to assist you around the clock.",
  },
  {
    icon: Eye,
    title: "Trust & Transparency",
    description: "Independent audits and transparent fee structures ensure complete visibility into all your trading activity.",
  },
  {
    icon: Landmark,
    title: "Segregated Client Funds",
    description: "Your deposits are held separately from company funds in regulated banking institutions for maximum safety.",
  },
  {
    icon: Monitor,
    title: "Advanced Trading Platform",
    description: "Professional-grade trading tools, real-time charts, advanced order types, and technical indicators for optimal decisions.",
  },
];

const differences = [
  "Personal account manager for every client",
  "24/7 multilingual customer support",
  "Expert market analysis from seasoned industry professionals",
  "Accessible via email, live chat, WhatsApp, Telegram & phone",
  "Fast deposits and withdrawals with multiple payment methods",
  "Transparent pricing with zero hidden fees",
];

const partners = ["Goldman Sachs", "J.P. Morgan", "Deutsche Bank", "UBS", "Barclays", "Credit Suisse", "BNP Paribas", "HSBC"];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="bg-hero text-hero-muted text-xs py-2 border-b border-white/5">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="hidden md:flex items-center gap-4">
            <span>Trading</span>
            <span>Open Account</span>
            <span>Partnership</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Help & Support</span>
            <span>contact@planb-trading.com</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="bg-hero border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-display font-bold text-hero-foreground">PlanB</span>
              <span className="text-lg font-display font-light text-primary">Trading</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-hero-muted">
            <a href="#markets" className="hover:text-hero-foreground transition-colors">Markets</a>
            <a href="#instruments" className="hover:text-hero-foreground transition-colors">Instruments</a>
            <a href="#why" className="hover:text-hero-foreground transition-colors">About Us</a>
            <a href="#reviews" className="hover:text-hero-foreground transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild className="border-hero-muted/30 text-hero-foreground hover:bg-white/10 bg-transparent">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">Open Account</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Dark with geometric background */}
      <section className="relative bg-hero overflow-hidden">
        {/* Geometric abstract background */}
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute right-0 top-0 w-[60%] h-full opacity-10" viewBox="0 0 600 500" fill="none">
            <polygon points="300,50 550,150 500,350 250,400 150,250" stroke="hsl(28, 95%, 52%)" strokeWidth="0.5" fill="none" />
            <polygon points="350,30 580,120 540,320 300,380 180,220" stroke="hsl(28, 95%, 52%)" strokeWidth="0.3" fill="none" />
            <polygon points="280,80 520,170 480,360 230,410 130,260" stroke="white" strokeWidth="0.3" fill="none" />
            <line x1="300" y1="50" x2="550" y2="150" stroke="white" strokeWidth="0.2" />
            <line x1="550" y1="150" x2="500" y2="350" stroke="white" strokeWidth="0.2" />
            <line x1="300" y1="50" x2="250" y2="400" stroke="white" strokeWidth="0.2" />
            <line x1="150" y1="250" x2="500" y2="350" stroke="white" strokeWidth="0.2" />
            <line x1="350" y1="30" x2="180" y2="220" stroke="hsl(28, 95%, 52%)" strokeWidth="0.2" />
            <circle cx="300" cy="50" r="3" fill="hsl(28, 95%, 52%)" opacity="0.6" />
            <circle cx="550" cy="150" r="3" fill="hsl(28, 95%, 52%)" opacity="0.6" />
            <circle cx="500" cy="350" r="3" fill="white" opacity="0.4" />
            <circle cx="250" cy="400" r="2" fill="white" opacity="0.4" />
            <circle cx="150" cy="250" r="3" fill="hsl(28, 95%, 52%)" opacity="0.6" />
            <circle cx="350" cy="30" r="2" fill="white" opacity="0.3" />
            <circle cx="580" cy="120" r="2" fill="white" opacity="0.3" />
            <circle cx="180" cy="220" r="2" fill="hsl(28, 95%, 52%)" opacity="0.4" />
            {/* More network lines */}
            <line x1="300" y1="50" x2="580" y2="120" stroke="white" strokeWidth="0.15" opacity="0.5" />
            <line x1="250" y1="400" x2="540" y2="320" stroke="white" strokeWidth="0.15" opacity="0.5" />
            <line x1="150" y1="250" x2="350" y2="30" stroke="hsl(28, 95%, 52%)" strokeWidth="0.15" opacity="0.3" />
          </svg>
          {/* Additional dots */}
          <div className="absolute top-20 right-[20%] w-1.5 h-1.5 rounded-full bg-primary/40" />
          <div className="absolute top-40 right-[35%] w-1 h-1 rounded-full bg-white/20" />
          <div className="absolute bottom-32 right-[25%] w-2 h-2 rounded-full bg-primary/30" />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-hero-foreground leading-tight">
              Integrity<br />
              Reliability<br />
              Transparency
            </h1>
            <p className="text-hero-muted text-lg max-w-lg">
              Trade on global markets with PlanB Trading — your trusted partner for crypto, stocks, and forex investments.
            </p>
            <Button size="lg" asChild className="rounded-full px-8">
              <Link to="/signup">
                <TrendingUp className="mr-2 h-5 w-5" />
                Start Trading Now
              </Link>
            </Button>
          </div>
        </div>

        {/* Price ticker at bottom of hero */}
        <PriceTicker />
      </section>

      {/* Stats Strip */}
      <StatsBar />

      {/* Diversify Your Portfolio */}
      <section id="instruments" className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold">Diversify Your Portfolio</h2>
          <p className="text-muted-foreground">
            Access a diverse selection of financial instruments and invest across a wide range of asset classes
            — including over 30 global exchanges. Grow your wealth on a single, powerful platform.
          </p>
          <Button asChild className="rounded-full px-6">
            <Link to="/signup">Discover Top Markets</Link>
          </Button>
        </div>
        <MarketOverview />
      </section>

      {/* Why PlanB Trading */}
      <section id="why" className="bg-hero py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary">Why PlanB Trading</h2>
            <p className="text-hero-muted mt-2 max-w-2xl mx-auto">
              An established broker with a global presence, operating with integrity, reliability, and transparency since day one.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-10 max-w-5xl mx-auto">
            {whyFeatures.map((f) => (
              <Card key={f.title} className="bg-white/5 border-white/10 hover:border-primary/40 transition-colors">
                <CardContent className="pt-6 space-y-3">
                  <div className="h-12 w-12 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-center">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-hero-foreground">{f.title}</h3>
                  <p className="text-sm text-hero-muted leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* The PlanB Difference */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-display font-bold">The PlanB Trading Difference</h2>
            <div className="space-y-3">
              {differences.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-muted-foreground text-sm">{item}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Visual placeholder — professional image effect */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-hero to-hero/80 flex items-center justify-center overflow-hidden">
              <div className="text-center space-y-4 p-8">
                <div className="h-16 w-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <p className="text-hero-foreground font-display font-bold text-xl">Professional Trading<br />Made Simple</p>
                <p className="text-hero-muted text-sm">Trusted by 150,000+ clients worldwide</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-hero py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-hero-foreground">
                Start Trading Today with PlanB Trading
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-hero-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Crypto CFDs
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Forex Pairs
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  Index CFDs
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  Stock CFDs
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button size="lg" asChild className="rounded-full px-8">
                <Link to="/signup">Open Live Account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full px-8 border-hero-muted/30 text-hero-foreground hover:bg-white/10 bg-transparent">
                <Link to="/signup">Demo Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Liquidity Partners */}
      <section className="container mx-auto px-4 py-12 md:py-16 text-center">
        <h3 className="text-lg font-display font-semibold mb-8 text-muted-foreground">Available Liquidity Providers</h3>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {partners.map((p) => (
            <span key={p} className="text-muted-foreground/60 font-display font-bold text-lg md:text-xl tracking-wide">
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* Live Market Chart Section */}
      <section id="markets" className="bg-muted/40 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 mb-6">
            {["Indices", "Futures", "Bonds", "Forex"].map((tab, i) => (
              <button
                key={tab}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Chart placeholder */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="h-64 md:h-80 bg-card flex items-center justify-center">
                <svg viewBox="0 0 800 200" className="w-full h-full p-6" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(28, 95%, 52%)" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="hsl(28, 95%, 52%)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[40, 80, 120, 160].map((y) => (
                    <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="hsl(215, 20%, 90%)" strokeWidth="0.5" />
                  ))}
                  {/* Price line */}
                  <path
                    d="M0,150 Q50,140 100,145 T200,130 T300,100 T400,110 T500,80 T600,70 T700,55 T800,40"
                    fill="none"
                    stroke="hsl(28, 95%, 52%)"
                    strokeWidth="2"
                  />
                  <path
                    d="M0,150 Q50,140 100,145 T200,130 T300,100 T400,110 T500,80 T600,70 T700,55 T800,40 L800,200 L0,200 Z"
                    fill="url(#areaGrad)"
                  />
                </svg>
              </div>
              <div className="border-t px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold">S&P 500</span>
                  <span className="text-muted-foreground text-sm">SPX Index</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-display font-bold text-lg">4,727.8</span>
                  <span className="text-destructive text-sm font-semibold">-0.46%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold">What Our Traders Say</h2>
          <p className="text-muted-foreground mt-2">Trusted by a global community of investors.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {[
            { author: "Michael R.", role: "Crypto Investor", content: "PlanB Trading offers the best combination of security and performance. The leverage options and real-time data are outstanding." },
            { author: "Anna S.", role: "Forex Trader", content: "Professional support team, excellent execution speed, and a platform that feels both powerful and intuitive." },
            { author: "David L.", role: "Portfolio Manager", content: "Managing multiple asset classes from one platform has transformed how I handle my clients' portfolios." },
          ].map((t) => (
            <Card key={t.author} className="bg-card">
              <CardContent className="pt-6 space-y-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
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
      </section>

      {/* Footer */}
      <footer className="bg-hero border-t border-white/10 py-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <span className="font-display font-bold text-hero-foreground">PlanB</span>
                  <span className="font-display font-light text-primary"> Trading</span>
                </div>
              </div>
              <p className="text-sm text-hero-muted">
                Your trusted partner for global financial markets. Trade with confidence.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3 text-hero-foreground">Markets</h4>
              <ul className="space-y-2 text-sm text-hero-muted">
                <li>Cryptocurrency</li>
                <li>Stocks & Indices</li>
                <li>Forex</li>
                <li>Commodities</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3 text-hero-foreground">Trading</h4>
              <ul className="space-y-2 text-sm text-hero-muted">
                <li>Spot Trading</li>
                <li>Leverage Trading</li>
                <li>Staking</li>
                <li>Copy Trading</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3 text-hero-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-hero-muted">
                <li>About Us</li>
                <li>Careers</li>
                <li>Support Center</li>
                <li>Terms & Privacy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-hero-muted">
              © {new Date().getFullYear()} PlanB Trading. All rights reserved.
            </p>
            <p className="text-xs text-hero-muted/60">
              Risk Warning: Trading CFDs and leveraged products carries a high level of risk. Past performance is not indicative of future results.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
