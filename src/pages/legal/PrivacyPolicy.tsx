import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Home</Link>
      </Button>
      <h1 className="text-3xl font-display font-bold mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground text-sm mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold">1. Data Controller</h2>
          <p className="text-muted-foreground">PlanB Trading ("we", "us") is responsible for the processing of your personal data in accordance with applicable data protection regulations, including the GDPR.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">2. Data We Collect</h2>
          <p className="text-muted-foreground">We collect the following categories of data: name, email address, phone number, country of residence, KYC documents (government ID, proof of address), transaction history, and usage data (IP address, browser type, device information).</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">3. Purpose of Processing</h2>
          <p className="text-muted-foreground">Your data is processed for account management, regulatory compliance (AML/KYC), service improvement, communication, and fraud prevention.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">4. Legal Basis</h2>
          <p className="text-muted-foreground">We process data based on contractual necessity, legal obligations, legitimate interests, and your consent where applicable.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">5. Data Retention</h2>
          <p className="text-muted-foreground">We retain personal data for the duration of the business relationship and for a minimum of 5 years after account closure, as required by anti-money laundering regulations.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">6. Your Rights</h2>
          <p className="text-muted-foreground">You have the right to access, rectify, delete, and port your data, as well as the right to object to processing and to withdraw consent. Contact our support team to exercise these rights.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">7. Cookies</h2>
          <p className="text-muted-foreground">We use essential cookies for platform functionality and analytics cookies to improve our services. You can manage cookie preferences through your browser settings.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">8. Third-Party Sharing</h2>
          <p className="text-muted-foreground">We do not sell personal data. Data may be shared with payment processors, identity verification providers, and regulatory authorities as required by law.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">9. Security</h2>
          <p className="text-muted-foreground">We employ industry-standard encryption, access controls, and monitoring to protect your data. However, no system is completely secure, and we encourage you to use strong passwords.</p>
        </section>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
