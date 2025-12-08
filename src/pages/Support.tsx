import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Mail, Phone, HelpCircle, FileText, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Support = () => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    // Simulate sending support request
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Support request sent! We'll get back to you soon.");
    setSubject("");
    setMessage("");
    setLoading(false);
  };

  return (
    <DashboardLayout title="Support">
      <div className="p-4 md:p-6 space-y-6">
        {/* Quick Contact Options */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold">WhatsApp</h3>
              <p className="text-sm text-muted-foreground">Chat with us instantly</p>
              <a
                href="https://wa.me/263776885016"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  Open WhatsApp
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">Email</h3>
              <p className="text-sm text-muted-foreground">Send us a detailed message</p>
              <a href="mailto:support@scrvll.co.zw">
                <Button variant="outline" className="w-full">
                  Send Email
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold">Phone</h3>
              <p className="text-sm text-muted-foreground">Call us directly</p>
              <a href="tel:+263776885016">
                <Button variant="outline" className="w-full">
                  +263 77 688 5016
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Submit a Request
              </CardTitle>
              <CardDescription>
                Describe your issue and we'll get back to you within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Subject</label>
                  <Input
                    placeholder="e.g., Order not delivered"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Message</label>
                  <Textarea
                    placeholder="Please describe your issue in detail..."
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Submit Request"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <h4 className="font-medium mb-1">How long does delivery take?</h4>
                <p className="text-sm text-muted-foreground">
                  Most orders start within 5-30 minutes. Full delivery depends on order size but typically completes within 24-72 hours.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <h4 className="font-medium mb-1">What payment methods do you accept?</h4>
                <p className="text-sm text-muted-foreground">
                  We accept EcoCash, OneMoney, PayNow, and bank transfers. All payments are secure and instant.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <h4 className="font-medium mb-1">What if my order is not delivered?</h4>
                <p className="text-sm text-muted-foreground">
                  Contact our support team immediately. We offer refunds or re-delivery for failed orders.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <h4 className="font-medium mb-1">Is my account safe?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! We never ask for passwords. Only public links are required for our services.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Response Time Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Average Response Time</h3>
              <p className="text-sm text-muted-foreground">
                We typically respond within 2-4 hours during business hours (8 AM - 10 PM CAT)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Support;