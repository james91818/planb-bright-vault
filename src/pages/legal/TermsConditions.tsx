import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsConditions = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Home</Link>
      </Button>
      <h1 className="text-3xl font-display font-bold mb-2">Terms & Conditions</h1>
      <p className="text-muted-foreground text-sm mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold">1. Acceptance</h2>
          <p className="text-muted-foreground">By accessing or using PlanB Trading, you agree to be bound by these Terms & Conditions. If you do not agree, you must discontinue use immediately.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">2. Services</h2>
          <p className="text-muted-foreground">PlanB Trading provides an online platform for trading cryptocurrencies, forex, stocks, and other financial instruments. The platform includes charting tools, portfolio management, and staking services.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">3. User Obligations</h2>
          <p className="text-muted-foreground">You agree to: (a) provide accurate information, (b) maintain the confidentiality of your account credentials, (c) comply with all applicable laws, and (d) not engage in market manipulation, fraud, or abusive trading practices.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">4. Account Termination</h2>
          <p className="text-muted-foreground">PlanB Trading reserves the right to suspend or terminate accounts that violate these terms, are involved in suspicious activity, or fail to complete required verification.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">5. Order Execution</h2>
          <p className="text-muted-foreground">Orders are executed at the best available price. Slippage may occur during periods of high volatility. PlanB Trading does not guarantee execution at the requested price.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">6. Indemnification</h2>
          <p className="text-muted-foreground">You agree to indemnify and hold harmless PlanB Trading, its officers, directors, and employees from any claims, damages, or expenses arising from your use of the platform.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">7. Modifications</h2>
          <p className="text-muted-foreground">PlanB Trading may modify these Terms & Conditions at any time. Continued use of the platform after changes constitutes acceptance of the revised terms.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">8. Contact</h2>
          <p className="text-muted-foreground">For questions regarding these Terms & Conditions, please contact us through the Contact page or via email at support@planb-trading.com.</p>
        </section>
      </div>
    </div>
  </div>
);

export default TermsConditions;
