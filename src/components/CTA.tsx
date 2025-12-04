import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 gradient-hero relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
            <span className="text-sm font-medium text-primary-foreground">Start Growing Today</span>
          </div>

          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Boost Your Social Media Presence?
          </h2>

          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of Zimbabweans who are growing their social media following with ZimBoost. Get started in minutes with PayNow.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/auth?mode=signup">
              <Button variant="glass" size="xl" className="group">
                Create Free Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a
              href="https://wa.me/263771234567"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="xl"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                WhatsApp Support
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-primary-foreground/20">
            <div className="text-center">
              <p className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">10K+</p>
              <p className="text-primary-foreground/70 text-sm mt-1">Happy Customers</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">1M+</p>
              <p className="text-primary-foreground/70 text-sm mt-1">Orders Delivered</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">24/7</p>
              <p className="text-primary-foreground/70 text-sm mt-1">Support Available</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
