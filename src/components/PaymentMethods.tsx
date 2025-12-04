import { Shield, CheckCircle } from "lucide-react";

const PaymentMethods = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
            Local Payment Methods
          </h2>
          <p className="text-muted-foreground">
            Pay conveniently with Zimbabwe's trusted payment platforms
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 mb-12">
          {/* PayNow */}
          <div className="flex flex-col items-center gap-2 p-6 bg-card rounded-2xl border border-border card-hover">
            <div className="w-32 h-16 flex items-center justify-center">
              <div className="text-center">
                <span className="font-display font-bold text-2xl text-primary">PayNow</span>
                <span className="block text-xs text-muted-foreground">Zimbabwe</span>
              </div>
            </div>
          </div>

          {/* EcoCash */}
          <div className="flex flex-col items-center gap-2 p-6 bg-card rounded-2xl border border-border card-hover">
            <div className="w-32 h-16 flex items-center justify-center">
              <div className="text-center">
                <span className="font-display font-bold text-2xl">
                  <span className="text-blue-600">Eco</span>
                  <span className="text-red-500">Cash</span>
                </span>
              </div>
            </div>
          </div>

          {/* OneMoney */}
          <div className="flex flex-col items-center gap-2 p-6 bg-card rounded-2xl border border-border card-hover">
            <div className="w-32 h-16 flex items-center justify-center">
              <div className="text-center">
                <span className="font-display font-bold text-2xl text-orange-500">OneMoney</span>
              </div>
            </div>
          </div>

          {/* Bank Transfer */}
          <div className="flex flex-col items-center gap-2 p-6 bg-card rounded-2xl border border-border card-hover">
            <div className="w-32 h-16 flex items-center justify-center">
              <div className="text-center">
                <span className="font-display font-bold text-lg text-foreground">Bank Transfer</span>
                <span className="block text-xs text-muted-foreground">RTGS / USD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm">256-bit SSL Encryption</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="w-5 h-5 text-accent" />
            <span className="text-sm">Verified Merchant</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm">Secure Checkout</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PaymentMethods;
