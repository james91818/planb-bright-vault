import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

const ContactUs = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(e => { fieldErrors[e.path[0] as string] = e.message; });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSending(true);

    // Check if user is logged in — if so, create a support ticket
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("support_tickets").insert({
        user_id: user.id,
        subject: `[Contact Form] ${form.subject}`,
        priority: "medium",
      });
    }

    // Simulate sending (in production, this would go to an email service)
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setForm({ name: "", email: "", subject: "", message: "" });
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Home</Link>
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold mb-3">Contact Us</h1>
          <p className="text-muted-foreground text-lg">Have a question? We're here to help.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Mail, title: "Email", detail: "support@planb-trading.com", sub: "We reply within 24 hours" },
            { icon: Phone, title: "Phone", detail: "+49 30 1234 5678", sub: "Mon–Fri, 9:00–18:00 CET" },
            { icon: MapPin, title: "Office", detail: "Berlin, Germany", sub: "By appointment only" },
          ].map((c) => (
            <Card key={c.title}>
              <CardContent className="pt-6 text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <c.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-sm font-medium">{c.detail}</p>
                <p className="text-xs text-muted-foreground">{c.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="font-display">Send us a message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Subject</Label>
              <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="How can we help?" />
              {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
            </div>
            <div className="space-y-1">
              <Label>Message</Label>
              <Textarea rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us more..." />
              {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
            </div>
            <Button onClick={handleSubmit} disabled={sending} className="w-full">
              <Send className="h-4 w-4 mr-2" /> {sending ? "Sending..." : "Send Message"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactUs;
