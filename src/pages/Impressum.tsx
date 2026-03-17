import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowLeft } from "lucide-react";

const Impressum = () => {
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
          <Button variant="ghost" size="sm" asChild className="text-hero-muted hover:text-hero-foreground">
            <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Home</Link>
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-10">Impressum</h1>

        <div className="space-y-8 text-foreground">
          <section>
            <h2 className="text-xl font-display font-semibold mb-3">Company Information</h2>
            <div className="space-y-1 text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground">PlanB Trading Ltd.</p>
              <p>Registration Number: HRB 123456</p>
              <p>Registered at: District Court of Frankfurt am Main</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold mb-3">Registered Address</h2>
            <div className="space-y-1 text-muted-foreground leading-relaxed">
              <p>Musterstraße 42</p>
              <p>60311 Frankfurt am Main</p>
              <p>Germany</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold mb-3">Contact</h2>
            <div className="space-y-1 text-muted-foreground leading-relaxed">
              <p>Email: info@planb-trading.com</p>
              <p>Phone: +49 (0) 69 123 456 78</p>
              <p>Fax: +49 (0) 69 123 456 79</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold mb-3">Managing Directors</h2>
            <div className="space-y-1 text-muted-foreground leading-relaxed">
              <p>Max Mustermann (CEO)</p>
              <p>Erika Musterfrau (CFO)</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold mb-3">Regulatory Information</h2>
            <div className="space-y-1 text-muted-foreground leading-relaxed">
              <p>Regulated by: Federal Financial Supervisory Authority (BaFin)</p>
              <p>BaFin Registration Number: 000000</p>
              <p>VAT ID: DE123456789</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold mb-3">Dispute Resolution</h2>
            <p className="text-muted-foreground leading-relaxed">
              The European Commission provides a platform for online dispute resolution (ODR):&nbsp;
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                https://ec.europa.eu/consumers/odr
              </a>.
              We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold mb-3">Liability Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              The contents of our pages have been created with the utmost care. However, we cannot guarantee the contents' accuracy, completeness, or topicality. Trading CFDs and leveraged products carries a high level of risk and may not be suitable for all investors. You should consider whether you understand how CFDs work and whether you can afford to take the high risk of losing your money.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-hero border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-hero-muted text-sm">
          © {new Date().getFullYear()} PlanB Trading. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Impressum;
