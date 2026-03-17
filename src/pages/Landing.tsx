import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Shield, Zap, BarChart3, ArrowRight, Star } from "lucide-react";

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
];

const testimonials = [
  { author: "Sarah M.", content: "PlanB Trading transformed my portfolio. The real-time data is incredible.", rating: 5 },
  { author: "James K.", content: "Best leverage trading platform I've used. Clean interface, fast execution.", rating: 5 },
  { author: "Maria L.", content: "Finally a platform that feels professional and trustworthy. Highly recommend.", rating: 5 },
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

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-32 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
            Markets are live
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight">
            Trade smarter.{" "}
            <span className="text-primary">Grow faster.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Access global crypto, forex, and stock markets with real-time data,
            advanced order types, and up to 100× leverage — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to="/signup">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold">Everything you need to trade</h2>
          <p className="text-muted-foreground mt-2">Professional tools, simplified for everyone.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
      </section>

      {/* Testimonials */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold">Trusted by traders worldwide</h2>
            <p className="text-muted-foreground mt-2">See what our users have to say.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {testimonials.map((t) => (
              <Card key={t.author} className="bg-card">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">"{t.content}"</p>
                  <p className="text-sm font-semibold">{t.author}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="text-3xl font-display font-bold">Ready to start trading?</h2>
          <p className="text-muted-foreground">
            Create your free account in under a minute. No hidden fees.
          </p>
          <Button size="lg" asChild>
            <Link to="/signup">
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">PlanB Trading</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PlanB Trading. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
