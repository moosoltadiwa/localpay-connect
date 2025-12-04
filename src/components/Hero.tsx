import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Shield, Clock } from "lucide-react";
import LoginForm from "./LoginForm";

const Hero = () => {
  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-foreground/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>

      {/* Wave Divider */}
      <div className="wave-divider">
        <svg
          data-name="Layer 1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="shape-fill"
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 pt-32 pb-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-200px)]">
          {/* Left Content */}
          <div className="text-primary-foreground space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Zimbabwe's #1 SMM Panel</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance">
              Boost Your Social Media
              <span className="block mt-2">Presence Today!</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-lg">
              Get real followers, likes, views, and engagement for Instagram, TikTok, YouTube, Facebook & more. Pay easily with PayNow Zimbabwe.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/auth?mode=signup">
                <Button variant="glass" size="xl" className="group">
                  Start Growing Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#services">
                <Button
                  variant="outline"
                  size="xl"
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  View Services
                </Button>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-6 pt-8">
              <div className="flex items-center gap-2 text-primary-foreground/80">
                <Shield className="w-5 h-5" />
                <span className="text-sm">Secure Payments</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/80">
                <Clock className="w-5 h-5" />
                <span className="text-sm">Instant Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/80">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm">24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Right Content - Login Form */}
          <div className="flex justify-center lg:justify-end animate-slide-in-right" style={{ animationDelay: "0.2s" }}>
            <LoginForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
