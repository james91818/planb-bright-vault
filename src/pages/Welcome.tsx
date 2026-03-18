import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Phone, MessageCircle, Clock, Shield, TrendingUp,
  CheckCircle2, ArrowRight, Headphones, Star,
} from "lucide-react";
import { motion } from "framer-motion";

const Welcome = () => {
  const [seconds, setSeconds] = useState(300); // 5 minutes
  const [showRetry, setShowRetry] = useState(false);
  const [retryForm, setRetryForm] = useState({ name: "", phone: "", email: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (seconds <= 0) {
      setShowRetry(true);
      return;
    }
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const handleRetrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setSeconds(300);
    setShowRetry(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--hero-bg))] text-[hsl(var(--hero-foreground))] overflow-hidden">
      {/* Nav */}
      <nav className="border-b border-white/10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <span className="text-lg font-display font-bold">PlanB </span>
              <span className="text-lg font-display font-light text-primary">Trading</span>
            </div>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 md:py-16">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto"
        >
          {/* Success checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="mx-auto w-20 h-20 rounded-full bg-[hsl(var(--success))]/20 flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="h-10 w-10 text-[hsl(var(--success))]" />
          </motion.div>

          <h1 className="text-3xl md:text-5xl font-display font-bold mb-4 leading-tight">
            Thank You for Joining!
          </h1>
          <p className="text-lg md:text-xl text-[hsl(var(--hero-muted))] mb-8 leading-relaxed">
            Your registration was successful. One of our dedicated account managers
            will call you shortly to help you get started.
          </p>
        </motion.div>

        {/* Countdown card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="max-w-md mx-auto mb-12"
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Phone className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                Incoming Call
              </span>
            </div>

            <p className="text-[hsl(var(--hero-muted))] mb-4 text-base">
              Your personal agent will reach you within:
            </p>

            {/* Timer */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="bg-white/10 rounded-xl px-5 py-3 min-w-[72px]">
                <span className="text-4xl font-display font-bold">{mins}</span>
                <p className="text-xs text-[hsl(var(--hero-muted))] mt-1">min</p>
              </div>
              <span className="text-3xl font-bold text-primary">:</span>
              <div className="bg-white/10 rounded-xl px-5 py-3 min-w-[72px]">
                <span className="text-4xl font-display font-bold">{secs.toString().padStart(2, "0")}</span>
                <p className="text-xs text-[hsl(var(--hero-muted))] mt-1">sec</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-[hsl(var(--hero-muted))]">
              <Clock className="h-4 w-4" />
              <span>Please keep your phone nearby</span>
            </div>
          </div>
        </motion.div>

        {/* What to expect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="max-w-3xl mx-auto mb-12"
        >
          <h2 className="text-center text-xl font-display font-semibold mb-8">
            What happens next?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Phone,
                step: "1",
                title: "You'll receive a call",
                desc: "A personal account manager will call you to introduce themselves and answer any questions.",
              },
              {
                icon: Shield,
                step: "2",
                title: "Quick account setup",
                desc: "Your manager will help you set up your account and guide you through the platform.",
              },
              {
                icon: TrendingUp,
                step: "3",
                title: "Start trading",
                desc: "Once your account is ready, you can start exploring markets and making your first trades.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-white/10 bg-white/5 p-6 text-center"
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  Step {item.step}
                </div>
                <h3 className="font-display font-semibold text-base mb-2">{item.title}</h3>
                <p className="text-sm text-[hsl(var(--hero-muted))] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Live chat CTA + Retry form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="max-w-lg mx-auto text-center space-y-6"
        >
          {/* Live chat button */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <Headphones className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-display font-semibold text-lg mb-2">Can't wait?</h3>
            <p className="text-sm text-[hsl(var(--hero-muted))] mb-4">
              Start a live chat with our support team right now — we're here to help.
            </p>
            <Button asChild size="lg" className="rounded-full px-8 gap-2">
              <Link to="/support">
                <MessageCircle className="h-5 w-5" />
                Open Live Chat
              </Link>
            </Button>
          </div>

          {/* Retry / Leave details form */}
          {showRetry && !submitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-left"
            >
              <h3 className="font-display font-semibold text-lg mb-2 text-center">
                Haven't received a call yet?
              </h3>
              <p className="text-sm text-[hsl(var(--hero-muted))] mb-4 text-center">
                No worries — leave your details below and we'll reach out to you as soon as possible.
              </p>
              <form onSubmit={handleRetrySubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[hsl(var(--hero-muted))] text-sm">Full Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={retryForm.name}
                    onChange={(e) => setRetryForm({ ...retryForm, name: e.target.value })}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[hsl(var(--hero-muted))] text-sm">Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="+1 234 567 890"
                    value={retryForm.phone}
                    onChange={(e) => setRetryForm({ ...retryForm, phone: e.target.value })}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[hsl(var(--hero-muted))] text-sm">Email</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={retryForm.email}
                    onChange={(e) => setRetryForm({ ...retryForm, email: e.target.value })}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                <Button type="submit" className="w-full rounded-full gap-2" size="lg">
                  <ArrowRight className="h-4 w-4" /> Request a Callback
                </Button>
              </form>
            </motion.div>
          )}

          {submitted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 p-6"
            >
              <CheckCircle2 className="h-8 w-8 text-[hsl(var(--success))] mx-auto mb-3" />
              <h3 className="font-display font-semibold text-lg mb-1">We got your details!</h3>
              <p className="text-sm text-[hsl(var(--hero-muted))]">
                Our team will contact you very shortly. Thank you for your patience.
              </p>
            </motion.div>
          )}

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 pb-8">
            {[
              { icon: Shield, text: "Secure & Regulated" },
              { icon: Star, text: "24/5 Support" },
              { icon: TrendingUp, text: "1000+ Instruments" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm text-[hsl(var(--hero-muted))]">
                <item.icon className="h-4 w-4 text-primary" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 py-6">
        <div className="container mx-auto px-4 text-center text-xs text-[hsl(var(--hero-muted))]/60">
          © {new Date().getFullYear()} PlanB Trading. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Welcome;
