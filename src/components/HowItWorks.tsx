import { UserPlus, Wallet, ShoppingCart, Rocket } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: "Sign Up & Log In",
    description: "Create your free ZimBoost account in seconds. No credit card required to get started.",
  },
  {
    number: 2,
    icon: Wallet,
    title: "Add Funds",
    description: "Top up your wallet using PayNow, EcoCash, OneMoney, or bank transfer. Instant credit!",
  },
  {
    number: 3,
    icon: ShoppingCart,
    title: "Place Your Order",
    description: "Browse our services, select what you need, enter your link, and submit your order.",
  },
  {
    number: 4,
    icon: Rocket,
    title: "Watch Growth",
    description: "Sit back and relax! Your order starts processing immediately and results appear fast.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Simple Process
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            How to Place Orders on{" "}
            <span className="gradient-text">ZimBoost</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Get started in just a few simple steps. It's quick, easy, and secure.
          </p>
        </div>

        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary transform -translate-y-1/2 z-0" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative flex flex-col items-center text-center"
              >
                {/* Step Number */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shadow-lg group-hover:shadow-glow transition-shadow">
                    <step.icon className="w-9 h-9 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center">
                    <span className="font-display font-bold text-primary text-sm">
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="bg-card rounded-2xl p-6 border border-border card-hover w-full">
                  <h3 className="font-display text-lg font-bold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
