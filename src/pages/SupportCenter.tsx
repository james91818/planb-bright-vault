import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const faqCategories = [
  {
    title: "Getting Started",
    items: [
      { q: "How do I create an account?", a: "Click 'Get Started' on the homepage and fill in your details. You'll receive a verification email to activate your account." },
      { q: "What documents do I need for verification (KYC)?", a: "We require a government-issued photo ID (passport or national ID) and a proof of address (utility bill or bank statement, dated within the last 3 months)." },
      { q: "Is there a minimum deposit?", a: "There is no strict minimum deposit, but deposits of at least €1 are required to access full trading features and convert your account from Lead to Depositor status." },
    ],
  },
  {
    title: "Deposits & Withdrawals",
    items: [
      { q: "What deposit methods are available?", a: "We support cryptocurrency deposits and bank wire transfers. Select your preferred method from the Wallet page after logging in." },
      { q: "How long do deposits take?", a: "Crypto deposits are typically credited within 1 hour after confirmation. Bank wire transfers may take 1-3 business days." },
      { q: "How do I withdraw funds?", a: "Navigate to Wallet → Withdraw, select your currency and method, enter the destination details, and submit. Withdrawals require admin approval and KYC verification." },
      { q: "Are there withdrawal fees?", a: "PlanB Trading does not charge withdrawal fees. However, network fees (for crypto) or bank transfer fees may apply." },
    ],
  },
  {
    title: "Trading",
    items: [
      { q: "What assets can I trade?", a: "We offer trading in cryptocurrencies (BTC, ETH, SOL, etc.), stocks, indices, and commodities. Visit the Instruments page for a full list." },
      { q: "What is leverage and how does it work?", a: "Leverage allows you to open larger positions with less capital. For example, 1:100 leverage means €100 controls a €10,000 position. Note that leverage amplifies both gains and losses." },
      { q: "What are market hours?", a: "Crypto markets operate 24/7. Stock and index markets follow standard exchange hours. Check the Trading Hours page for specific schedules." },
      { q: "How is P&L calculated?", a: "Profit and Loss is calculated based on the difference between your entry price and current/exit price, multiplied by your position size and leverage." },
    ],
  },
  {
    title: "Staking",
    items: [
      { q: "What is staking?", a: "Staking lets you earn passive rewards by locking your crypto assets for a fixed period. Higher lock periods typically offer higher APY rates." },
      { q: "Can I unstake early?", a: "Staked assets are locked until the unlock date. Early withdrawal is not available. Please review the lock period before staking." },
      { q: "How are staking rewards calculated?", a: "Rewards are calculated based on the APY rate, your staked amount, and the lock period. Rewards are credited upon the unlock date." },
    ],
  },
  {
    title: "Account & Security",
    items: [
      { q: "How do I reset my password?", a: "Click 'Forgot password?' on the login page and enter your email. You'll receive a password reset link." },
      { q: "Is two-factor authentication (2FA) available?", a: "Yes, you can enable 2FA in your account settings for added security." },
      { q: "How is my data protected?", a: "We use industry-standard encryption, secure data centers, and strict access controls. Read our Privacy Policy for full details." },
    ],
  },
];

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left hover:text-primary transition-colors">
        <span className="font-medium text-sm pr-4">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && <p className="text-sm text-muted-foreground pb-4 pr-8">{a}</p>}
    </div>
  );
};

const SupportCenter = () => {
  const [search, setSearch] = useState("");

  const filtered = faqCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(i => !search || i.q.toLowerCase().includes(search.toLowerCase()) || i.a.toLowerCase().includes(search.toLowerCase())),
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Home</Link>
        </Button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold mb-3">Support Center</h1>
          <p className="text-muted-foreground text-lg mb-6">Find answers to common questions</p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for help..." className="pl-10" />
          </div>
        </div>

        <div className="space-y-6">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No results found. Try a different search term or <Link to="/contact" className="text-primary underline">contact us</Link> directly.</p>
          ) : filtered.map((cat) => (
            <Card key={cat.title}>
              <CardContent className="pt-6">
                <h2 className="text-lg font-display font-bold mb-2">{cat.title}</h2>
                {cat.items.map((item) => <FAQItem key={item.q} {...item} />)}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12 space-y-3">
          <p className="text-muted-foreground">Can't find what you're looking for?</p>
          <div className="flex gap-3 justify-center">
            <Button asChild><Link to="/contact">Contact Us</Link></Button>
            <Button variant="outline" asChild><Link to="/login">Log in for Support Tickets</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportCenter;
