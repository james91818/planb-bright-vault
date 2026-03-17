import { Link } from "react-router-dom";
import { ArrowLeft, Shield, TrendingUp, Users, Globe, Award, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const values = [
  { icon: Shield, title: "Security First", description: "Advanced encryption and multi-layered security protect every transaction and personal detail." },
  { icon: TrendingUp, title: "Market Excellence", description: "Access to global markets with competitive spreads, fast execution, and professional-grade tools." },
  { icon: Users, title: "Client Focused", description: "Every decision we make is guided by what's best for our trading community." },
  { icon: Globe, title: "Global Reach", description: "Serving traders across multiple countries with localized support and multi-currency accounts." },
  { icon: Award, title: "Transparency", description: "Clear pricing, honest communication, and no hidden fees — ever." },
  { icon: Headphones, title: "24/5 Support", description: "Our multilingual team is available around the clock to assist with any questions." },
];

const AboutUs = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Home</Link>
      </Button>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-display font-bold mb-4">About PlanB Trading</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          We are a modern investment platform built for traders who demand reliability, transparency, and powerful tools to navigate global financial markets.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="space-y-4">
          <h2 className="text-2xl font-display font-bold">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">PlanB Trading was founded with a clear mission: to provide retail and professional traders with institutional-grade trading infrastructure. We believe every investor deserves access to fast execution, transparent pricing, and world-class support.</p>
          <p className="text-muted-foreground leading-relaxed">Our platform supports trading in cryptocurrencies, forex, stocks, and commodities — all from a single, intuitive interface.</p>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-display font-bold">Our Vision</h2>
          <p className="text-muted-foreground leading-relaxed">We envision a financial world where access to markets is democratized and trading tools are available to everyone, regardless of experience level or portfolio size.</p>
          <p className="text-muted-foreground leading-relaxed">Through continuous innovation and a commitment to compliance, we aim to be the most trusted trading platform in Europe and beyond.</p>
        </div>
      </div>

      <h2 className="text-2xl font-display font-bold text-center mb-8">Our Values</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {values.map((v) => (
          <Card key={v.title}>
            <CardContent className="pt-6 space-y-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <v.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{v.title}</h3>
              <p className="text-sm text-muted-foreground">{v.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

export default AboutUs;
