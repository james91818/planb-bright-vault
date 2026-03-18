import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import oxBg from "@/assets/ox-bg.svg";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp, Shield, Zap, BarChart3, Star,
  Landmark, Headphones, Eye, Monitor,
  CheckCircle2, UserPlus, Wallet, LineChart,
  Bot, Brain, Clock, Target, Cpu, ChartCandlestick,
} from "lucide-react";
import PriceCards from "@/components/landing/PriceCards";
import StatsBar from "@/components/landing/StatsBar";

import visaLogo from "@/assets/payments/visa.png";
import mastercardLogo from "@/assets/payments/mastercard.png";
import cryptoLogo from "@/assets/payments/crypto.png";
import bankLogo from "@/assets/payments/bank.png";
import applepayLogo from "@/assets/payments/applepay.png";
import paypalLogo from "@/assets/payments/paypal.png";
import skrillLogo from "@/assets/payments/skrill.png";
import netellerLogo from "@/assets/payments/neteller.png";

import bnpLogo from "@/assets/banks/bnp.png";
import jpmorganLogo from "@/assets/banks/jpmorgan.png";
import deutschebankLogo from "@/assets/banks/deutschebank.png";
import commerzbankLogo from "@/assets/banks/commerzbank.png";
import barclaysLogo from "@/assets/banks/barclays.png";

const whyFeatures = [
  {
    icon: Shield,
    title: "Secure & Protected Funding",
    description: "Your funds and personal data are protected through advanced security systems and encrypted data centers.",
  },
  {
    icon: Zap,
    title: "Leverage Up to 1:100",
    description: "The higher the leverage, the less required capital — allowing you to trade larger positions with less initial margin.",
  },
  {
    icon: Headphones,
    title: "Dedicated Customer Support",
    description: "We provide multilingual support via live chat, email, and phone so you can focus on your trading experience.",
  },
  {
    icon: Eye,
    title: "Trust & Integrity",
    description: "Trustworthy and transparent service is at the core of everything we do. Your confidence is our priority.",
  },
  {
    icon: Landmark,
    title: "Segregated Client Funds",
    description: "Your deposits are kept separate from company funds and held with established global banks for security and integrity.",
  },
  {
    icon: Monitor,
    title: "Advanced Trading Platform",
    description: "Professional-grade trading tools, real-time charts, fast order execution, and advanced indicators for optimal decisions.",
  },
];

const differences = [
  "Personal account manager for every client",
  "24/5 multilingual customer support",
  "Services delivered by experienced industry professionals with years of expertise",
  "Accessible via email, phone, live chat, WhatsApp, Telegram & more",
  "Fast deposits and withdrawals with multiple payment methods",
  "Transparent pricing with zero hidden fees",
];

const steps = [
  {
    num: "1",
    title: "Register",
    description: "Fill out our quick and secure online form to register your trading account in minutes.",
    icon: UserPlus,
  },
  {
    num: "2",
    title: "Fund",
    description: "Top up your account using one of our fast and secure payment methods.",
    icon: Wallet,
  },
  {
    num: "3",
    title: "Trade",
    description: "Start trading on your live account and access global markets from any device.",
    icon: LineChart,
  },
];

const partners = [
  { name: "BNP Paribas", logo: bnpLogo },
  { name: "J.P. Morgan", logo: jpmorganLogo },
  { name: "Deutsche Bank", logo: deutschebankLogo },
  { name: "Commerzbank", logo: commerzbankLogo },
  { name: "Barclays", logo: barclaysLogo },
];

const paymentMethods = [
  { name: "Visa", logo: visaLogo },
  { name: "Mastercard", logo: mastercardLogo },
  { name: "Crypto", logo: cryptoLogo },
  { name: "Bank Wire", logo: bankLogo },
  { name: "PayPal", logo: paypalLogo },
  { name: "Apple Pay", logo: applepayLogo },
  { name: "Skrill", logo: skrillLogo },
  { name: "Neteller", logo: netellerLogo },
];

const indices = [
  { symbol: "SPXUSD", name: "S&P 500 Index", price: "6,726.6", change: "+0.47%", changeVal: "+31.20", positive: true },
  { symbol: "NSXUSD", name: "US 100 Cash CFD", price: "24,782.9", changeVal: "+129.90", change: "+0.57%", positive: true },
  { symbol: "DJI", name: "Dow Jones Industrial Average Index", price: "47,116.0", change: "+0.39%", changeVal: "+184.50", positive: true },
  { symbol: "NKY", name: "Japan 225", price: "53,700.39", change: "-0.0%", changeVal: "-55.75", positive: false },
  { symbol: "DEUAD", name: "DAX Index", price: "23,564.01", change: "+0.50%", changeVal: "+116.72", positive: true },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Top utility bar */}
      <div className="bg-hero text-hero-muted text-xs py-2 border-b border-white/5">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="hidden md:flex items-center gap-1">
            <span className="hover:text-hero-foreground cursor-pointer transition-colors">Trading</span>
            <span className="text-hero-muted/30 px-1">|</span>
            <span className="hover:text-hero-foreground cursor-pointer transition-colors">Open Account</span>
            <span className="text-hero-muted/30 px-1">|</span>
            <span className="hover:text-hero-foreground cursor-pointer transition-colors">Become a Partner</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-hero-foreground cursor-pointer transition-colors">Help & Support</span>
            <span className="hover:text-hero-foreground cursor-pointer transition-colors">Contact Us</span>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="bg-hero border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="leading-tight">
                <span className="text-lg font-display font-bold text-hero-foreground">PlanB </span>
                <span className="text-lg font-display font-light text-primary">Trading</span>
                <p className="text-[10px] text-hero-muted -mt-0.5 tracking-wider uppercase">Crypto & AI Trading</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-6 text-sm text-hero-muted">
              <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-hero-foreground transition-colors cursor-pointer">Home</a>
              <Link to="/account-types" className="hover:text-hero-foreground transition-colors">Account Types</Link>
              <Link to="/investments" className="hover:text-hero-foreground transition-colors">Investments</Link>
              <a href="#why" className="hover:text-hero-foreground transition-colors">About Us</a>
            </div>
          </div>
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

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden min-h-[520px] md:min-h-[600px]" style={{ background: "#f5efe6" }}>
        {/* Ox wireframe SVG */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[90%] md:w-[70%] h-[130%] pointer-events-none">
          <img src={oxBg} alt="" className="w-full h-full object-contain object-right opacity-80" />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="max-w-xl space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-display font-bold text-foreground leading-[1.15]">
              Integrity<br />
              Reliability<br />
              Transparency
            </h1>
            <p className="text-muted-foreground text-lg">
              Trade on global markets with PlanB Trading — your trusted partner for crypto, stocks, and forex investments.
            </p>
            <Button size="lg" asChild className="rounded-full px-8 text-base bg-primary hover:bg-primary/90">
              <Link to="/signup">
                <TrendingUp className="mr-2 h-5 w-5" />
                Start Trading Now
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== PRICE CARDS ROW ===== */}
      <PriceCards />

      {/* ===== STATS STRIP ===== */}
      <StatsBar />

      {/* ===== DIVERSIFY PORTFOLIO ===== */}
      <section id="instruments" className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5 max-w-lg">
              <h2 className="text-3xl md:text-4xl font-display font-bold">Diversify Your Portfolio</h2>
              <p className="text-muted-foreground leading-relaxed">
                Access leading financial markets and invest across a wide range of asset classes
                — including over 20 global exchanges — while managing all your holdings in one place.
              </p>
              <Button asChild className="rounded-full px-6">
                <Link to="/signup">Discover Top Markets</Link>
              </Button>
            </div>
            {/* Visual: phone/tablet mockup with stock icons */}
            <div className="relative hidden lg:flex justify-center">
              <div className="relative w-72 h-80 rounded-2xl bg-gradient-to-br from-hero to-hero/90 shadow-2xl flex items-center justify-center overflow-hidden border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
                <div className="relative z-10 text-center space-y-4 px-6">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { Icon: TrendingUp, label: "Stocks" },
                      { Icon: BarChart3, label: "Indices" },
                      { Icon: Landmark, label: "Forex" },
                      { Icon: Zap, label: "Crypto" },
                      { Icon: LineChart, label: "Futures" },
                      { Icon: Shield, label: "Bonds" },
                    ].map(({ Icon, label }, i) => (
                      <div key={i} className="h-12 w-12 mx-auto rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm" title={label}>
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    ))}
                  </div>
                  <p className="text-hero-foreground font-display font-semibold text-sm mt-4">500+ Assets Available</p>
                  <p className="text-hero-muted text-xs">Crypto · Stocks · Forex · Indices</p>
                </div>
                {/* Floating badges */}
                <div className="absolute top-2 right-2 bg-success text-success-foreground text-xs font-bold px-3 py-1 rounded-full shadow">7%</div>
                <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow">5%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHY PLANB TRADING ===== */}
      <section id="why" className="bg-hero py-16 md:py-24 relative overflow-hidden">
        {/* City skyline silhouette overlay */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-white/10 to-transparent" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary">Why PlanB Trading</h2>
            <p className="text-hero-muted mt-3 max-w-2xl mx-auto">
              An established broker with a global presence, operating with integrity, reliability, and transparency.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 max-w-5xl mx-auto">
            {whyFeatures.map((f) => (
              <Card key={f.title} className="bg-white/[0.06] border-white/10 hover:border-primary/30 transition-colors backdrop-blur-sm">
                <CardContent className="p-6 flex gap-5">
                  <div className="h-14 w-14 shrink-0 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-center">
                    <f.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-display font-semibold text-hero-foreground">{f.title}</h3>
                    <p className="text-sm text-hero-muted leading-relaxed">{f.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AI TRADING ROBOT ===== */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Info */}
          <div className="space-y-6 max-w-lg">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full">
              <Bot className="h-4 w-4" />
              AI-Powered Trading
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              Let Our AI Trading Robot Work for You
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our proprietary AI trading robot uses advanced machine learning algorithms to analyze
              market patterns, identify high-probability setups, and execute trades automatically —
              24 hours a day, 7 days a week. No emotions, no hesitation, just data-driven decisions.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Brain, title: "Smart Analysis", desc: "Deep learning models trained on millions of data points to detect trends before they happen." },
                { icon: Clock, title: "24/7 Trading", desc: "The robot never sleeps — it monitors and trades round the clock across all markets." },
                { icon: Target, title: "Precision Entries", desc: "AI-optimized entry and exit points for maximum profit potential and minimal risk." },
                { icon: ChartCandlestick, title: "Risk Management", desc: "Built-in stop-loss and take-profit logic to protect your capital automatically." },
              ].map((f) => (
                <div key={f.title} className="space-y-1.5">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <f.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <h4 className="font-display font-semibold text-sm">{f.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
            <Button size="lg" asChild className="rounded-full px-8">
              <Link to="/signup">
                <Cpu className="mr-2 h-5 w-5" />
                Activate AI Trading
              </Link>
            </Button>
          </div>

          {/* Right: Visual */}
          <div className="hidden lg:flex justify-center">
            <div className="relative w-80 rounded-2xl bg-gradient-to-br from-hero to-hero/90 shadow-2xl border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
              <div className="relative z-10 p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-hero-foreground text-sm">PlanB AI Bot</p>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                      <span className="text-xs text-success font-medium">Active — Trading</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Win Rate", value: "87.3%", color: "text-success" },
                    { label: "Avg Return", value: "+12.4%", color: "text-success" },
                    { label: "Trades Today", value: "34", color: "text-hero-foreground" },
                    { label: "Active Pairs", value: "18", color: "text-hero-foreground" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/[0.06] rounded-lg p-3 border border-white/5">
                      <p className="text-[10px] text-hero-muted uppercase tracking-wider">{s.label}</p>
                      <p className={`font-display font-bold text-lg ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Recent AI trades */}
                <div className="space-y-2">
                  <p className="text-xs text-hero-muted font-semibold uppercase tracking-wider">Recent AI Trades</p>
                  {[
                    { pair: "BTC/EUR", action: "BUY", pnl: "+€342.50", time: "2m ago" },
                    { pair: "ETH/EUR", action: "SELL", pnl: "+€128.90", time: "8m ago" },
                    { pair: "SOL/EUR", action: "BUY", pnl: "+€67.20", time: "15m ago" },
                  ].map((t) => (
                    <div key={t.pair} className="flex items-center justify-between bg-white/[0.04] rounded-lg px-3 py-2 border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.action === "BUY" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                          {t.action}
                        </span>
                        <span className="text-sm font-medium text-hero-foreground">{t.pair}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-success">{t.pnl}</p>
                        <p className="text-[10px] text-hero-muted">{t.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Glow effect */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute -top-5 -left-5 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-24">
        <Card className="max-w-5xl mx-auto overflow-hidden">
          <div className="grid md:grid-cols-2">
            <CardContent className="p-8 md:p-10 space-y-5">
              <h2 className="text-2xl md:text-3xl font-display font-bold">The PlanB Trading Difference</h2>
              <div className="space-y-3">
                {differences.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-muted-foreground text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
            <div className="bg-gradient-to-br from-hero to-hero/90 flex items-center justify-center p-10">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <p className="text-hero-foreground font-display font-bold text-xl">Professional Trading<br />Made Simple</p>
                <p className="text-hero-muted text-sm">Trusted by 150,000+ clients worldwide</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="bg-hero py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Card className="bg-white/[0.04] border-white/10 overflow-hidden">
            <CardContent className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4">
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-hero-foreground">
                    Start Trading Today with PlanB Trading
                  </h2>
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-hero-muted">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-success" /> Crypto CFDs
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Forex Pairs
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Index CFDs
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Stock CFDs
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Button size="lg" asChild className="rounded-full px-8">
                    <Link to="/signup">Open Live</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="rounded-full px-8 border-hero-muted/30 text-hero-foreground hover:bg-white/10 bg-transparent">
                    <Link to="/signup">Demo Account</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ===== LIQUIDITY PARTNERS ===== */}
      <section className="container mx-auto px-4 py-12 text-center">
        <h3 className="text-lg font-display font-semibold mb-10 text-muted-foreground">Available Liquidity</h3>
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
          {partners.map((p) => (
            <div key={p.name} className="grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <img src={p.logo} alt={p.name} className="h-16 md:h-20 w-auto object-contain" />
            </div>
          ))}
        </div>
      </section>

      {/* ===== MARKET INDICES CHART ===== */}
      <section id="markets" className="bg-muted/40 py-12 md:py-16">
        <div className="container mx-auto px-4">
          {/* Tabs */}
          <div className="flex gap-1 mb-1 border-b">
            {["Crypto", "Stocks"].map((tab, i) => (
              <button
                key={tab}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
                  i === 0
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <Card className="overflow-hidden">
            {/* Chart area */}
            <CardContent className="p-0">
              <div className="h-56 md:h-64 bg-card p-6">
                <svg viewBox="0 0 800 160" className="w-full h-full" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[30, 60, 90, 120].map((y) => (
                    <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="hsl(215, 20%, 92%)" strokeWidth="0.5" />
                  ))}
                  {/* Candlesticks */}
                  {[
                    { x: 30, o: 130, c: 120, h: 115, l: 135 },
                    { x: 60, o: 120, c: 125, h: 115, l: 130 },
                    { x: 90, o: 125, c: 110, h: 105, l: 130 },
                    { x: 120, o: 110, c: 115, h: 105, l: 120 },
                    { x: 150, o: 115, c: 100, h: 95, l: 120 },
                    { x: 180, o: 100, c: 105, h: 95, l: 110 },
                    { x: 210, o: 105, c: 90, h: 85, l: 110 },
                    { x: 240, o: 90, c: 95, h: 85, l: 100 },
                    { x: 270, o: 95, c: 80, h: 75, l: 100 },
                    { x: 300, o: 80, c: 85, h: 75, l: 90 },
                    { x: 330, o: 85, c: 70, h: 65, l: 90 },
                    { x: 360, o: 70, c: 75, h: 65, l: 80 },
                    { x: 390, o: 75, c: 65, h: 60, l: 80 },
                    { x: 420, o: 65, c: 55, h: 50, l: 70 },
                    { x: 450, o: 55, c: 60, h: 50, l: 65 },
                    { x: 480, o: 60, c: 48, h: 42, l: 65 },
                    { x: 510, o: 48, c: 52, h: 42, l: 55 },
                    { x: 540, o: 52, c: 40, h: 35, l: 56 },
                    { x: 570, o: 40, c: 45, h: 35, l: 48 },
                    { x: 600, o: 45, c: 35, h: 30, l: 50 },
                    { x: 630, o: 35, c: 38, h: 30, l: 42 },
                    { x: 660, o: 38, c: 28, h: 22, l: 42 },
                    { x: 690, o: 28, c: 32, h: 22, l: 35 },
                    { x: 720, o: 32, c: 22, h: 18, l: 36 },
                    { x: 750, o: 22, c: 18, h: 12, l: 26 },
                  ].map((candle) => {
                    const bullish = candle.c < candle.o;
                    const color = bullish ? "#10B981" : "#EF4444";
                    const top = Math.min(candle.o, candle.c);
                    const bottom = Math.max(candle.o, candle.c);
                    return (
                      <g key={candle.x}>
                        {/* Wick */}
                        <line x1={candle.x} y1={candle.h} x2={candle.x} y2={candle.l} stroke={color} strokeWidth="1.5" />
                        {/* Body */}
                        <rect x={candle.x - 8} y={top} width="16" height={Math.max(bottom - top, 2)} fill={color} rx="1" />
                      </g>
                    );
                  })}
                  {/* Uptrend arrow overlay */}
                  <path d="M20,135 Q200,110 400,75 T780,15" fill="none" stroke="hsl(28, 95%, 52%)" strokeWidth="2" strokeDasharray="6 3" opacity="0.5" />
                </svg>
                {/* Time labels */}
                <div className="flex gap-3 mt-2">
                  {["1D","1M","3M","1Y","5Y","All"].map((t, i) => (
                    <button key={t} className={`text-xs px-2 py-1 rounded ${i === 3 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {/* Index list */}
              <div className="border-t">
                {indices.map((idx) => (
                  <div key={idx.symbol} className="flex items-center justify-between px-6 py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-primary/10 text-primary font-display font-bold text-xs flex items-center justify-center">
                        {idx.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{idx.symbol}</p>
                        <p className="text-xs text-muted-foreground">{idx.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-semibold text-sm">{idx.price}</p>
                      <p className={`text-xs font-semibold ${idx.positive ? "text-success" : "text-destructive"}`}>
                        {idx.change} <span className="ml-1">{idx.changeVal}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ===== FUND YOUR ACCOUNT (Payment Methods) ===== */}
      <section className="container mx-auto px-4 py-12 md:py-16 text-center">
        <h3 className="text-lg font-display font-semibold mb-8">Fund Your Account Instantly</h3>
        <div className="flex flex-wrap items-center justify-center gap-5 md:gap-8">
          {paymentMethods.map((pm) => (
            <div key={pm.name} className="h-16 w-24 rounded-xl border bg-card flex flex-col items-center justify-center gap-1 hover:shadow-md transition-shadow">
              <img src={pm.logo} alt={pm.name} className="h-8 w-8 object-contain" />
              <span className="text-[10px] font-medium text-muted-foreground">{pm.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== GET STARTED IN 3 STEPS ===== */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold">Start Trading with PlanB Trading</h2>
          <p className="text-muted-foreground mt-2">Quick account opening in 3 simple steps</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          {steps.map((step) => (
            <Card key={step.num} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-16 px-6 space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground font-display font-bold text-lg flex items-center justify-center">
                    {step.num}
                  </div>
                  <h3 className="font-display font-bold text-xl">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                {/* Background icon */}
                <step.icon className="absolute bottom-4 right-4 h-16 w-16 text-muted/60 opacity-30" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-10">
          <Button size="lg" asChild className="rounded-full px-8 text-base">
            <Link to="/signup">
              <TrendingUp className="mr-2 h-5 w-5" />
              Start Trading Now
            </Link>
          </Button>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="bg-muted/40 py-16 md:py-24">
        <div className="container mx-auto px-4">
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
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-hero border-t border-white/10 pt-12 pb-6">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4 mb-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="leading-tight">
                  <span className="font-display font-bold text-hero-foreground">PlanB </span>
                  <span className="font-display font-light text-primary">Trading</span>
                </div>
              </div>
              <p className="text-sm text-hero-muted">
                Your trusted partner for global financial markets. Trade with confidence.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3 text-hero-foreground">Trading</h4>
              <ul className="space-y-2 text-sm text-hero-muted">
                <li><Link to="/login" className="hover:text-hero-foreground transition-colors">Trading</Link></li>
                <li><Link to="/trading-hours" className="hover:text-hero-foreground transition-colors">Trading Hours</Link></li>
                <li><Link to="/instruments" className="hover:text-hero-foreground transition-colors">Instruments</Link></li>
                <li><Link to="/account-types" className="hover:text-hero-foreground transition-colors">Accounts</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3 text-hero-foreground">Legal</h4>
              <ul className="space-y-2 text-sm text-hero-muted">
                <li><Link to="/general-terms" className="hover:text-hero-foreground transition-colors">General Terms</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-hero-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/risk-warning" className="hover:text-hero-foreground transition-colors">Risk Warning</Link></li>
                <li><Link to="/terms-conditions" className="hover:text-hero-foreground transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/impressum" className="hover:text-hero-foreground transition-colors">Impressum</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3 text-hero-foreground">Contact Us</h4>
              <ul className="space-y-2 text-sm text-hero-muted">
                <li><Link to="/about" className="hover:text-hero-foreground transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-hero-foreground transition-colors">Contact Us</Link></li>
                <li><Link to="/support-center" className="hover:text-hero-foreground transition-colors">Support Center</Link></li>
              </ul>
            </div>
          </div>

          {/* Payment footer strip */}
          <div className="border-t border-white/10 pt-6 mb-4">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <span className="text-hero-muted/40 text-sm">Our Partners:</span>
              {paymentMethods.map((pm) => (
                <img key={pm.name} src={pm.logo} alt={pm.name} className="h-6 w-auto object-contain opacity-40 hover:opacity-70 transition-opacity" />
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-hero-muted">
              © {new Date().getFullYear()} PlanB Trading. All rights reserved.
            </p>
            <p className="text-xs text-hero-muted/50 max-w-xl text-center md:text-right">
              Risk Warning: Trading CFDs and leveraged products carries a high level of risk and may not be suitable for all investors. Past performance is not indicative of future results.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
