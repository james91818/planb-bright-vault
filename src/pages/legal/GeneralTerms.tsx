import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const GeneralTerms = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Home</Link>
      </Button>
      <h1 className="text-3xl font-display font-bold mb-2">General Terms</h1>
      <p className="text-muted-foreground text-sm mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold">1. Scope</h2>
          <p className="text-muted-foreground">These General Terms govern the use of PlanB Trading's platform, services, and tools. By registering an account, you confirm your agreement to these terms.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">2. Eligibility</h2>
          <p className="text-muted-foreground">You must be at least 18 years old and legally capable of entering into binding agreements. PlanB Trading reserves the right to refuse service to anyone at any time.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">3. Account Registration</h2>
          <p className="text-muted-foreground">Users are required to provide accurate and complete information when registering. Each person may hold only one account. PlanB Trading may request identity verification (KYC) at any time.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">4. Deposits & Withdrawals</h2>
          <p className="text-muted-foreground">All deposits and withdrawals are subject to approval by PlanB Trading. Processing times vary by method. PlanB Trading reserves the right to request additional documentation before processing transactions.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">5. Trading</h2>
          <p className="text-muted-foreground">Trading involves significant risk. Past performance is not indicative of future results. Leverage amplifies both gains and losses. PlanB Trading provides tools and data for informational purposes only.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">6. Fees</h2>
          <p className="text-muted-foreground">PlanB Trading may apply spreads, commissions, overnight fees, or other charges as outlined in the fee schedule. Fees are subject to change with prior notice.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">7. Intellectual Property</h2>
          <p className="text-muted-foreground">All content, branding, and software on the PlanB Trading platform are the property of PlanB Trading and may not be reproduced without written consent.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">8. Limitation of Liability</h2>
          <p className="text-muted-foreground">PlanB Trading is not liable for any losses arising from market movements, system downtime, or third-party actions. Users trade at their own risk.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">9. Governing Law</h2>
          <p className="text-muted-foreground">These terms are governed by the laws of the European Union. Any disputes shall be resolved through the competent courts.</p>
        </section>
      </div>
    </div>
  </div>
);

export default GeneralTerms;
