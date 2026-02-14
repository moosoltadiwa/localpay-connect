import { Zap, Shield, CreditCard, Headphones, TrendingUp, Clock } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast Delivery",
    description: "Orders start processing within minutes. Watch your engagement grow in real-time.",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    description: "We never ask for passwords. Your accounts stay protected with our secure methods.",
  },
  {
    icon: CreditCard,
    title: "PayNow Zimbabwe",
    description: "Pay easily with EcoCash, OneMoney, or bank transfer through PayNow integration.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our dedicated team is always ready to help you via WhatsApp or email support.",
  },
  {
    icon: TrendingUp,
    title: "Real Engagement",
    description: "Get genuine followers and interactions that help build your online presence.",
  },
  {
    icon: Clock,
    title: "Instant Activation",
    description: "Once payment is confirmed, your order begins processing automatically.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Why Choose Us
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Reasons to Pick{" "}
            <span className="gradient-text">scrVll</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            We provide the best SMM services in Zimbabwe with local payment options and instant delivery.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border card-hover"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
