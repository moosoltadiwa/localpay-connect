import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I pay with PayNow?",
    answer: "After placing your order, select PayNow as your payment method. You'll receive a prompt on your EcoCash, OneMoney, or banking app to complete the payment. Once confirmed, your order starts processing immediately.",
  },
  {
    question: "Is it safe to use ZimBoost?",
    answer: "Absolutely! We never ask for your social media passwords. All we need is your username or post link. Our methods are 100% safe and comply with platform guidelines.",
  },
  {
    question: "How fast will I see results?",
    answer: "Most orders start processing within 0-15 minutes after payment confirmation. Delivery speed depends on the service type, but most orders complete within 1-24 hours.",
  },
  {
    question: "What if my order doesn't deliver?",
    answer: "We have a 100% delivery guarantee. If for any reason your order doesn't complete, we'll either refill it or refund your balance. Contact our WhatsApp support for assistance.",
  },
  {
    question: "Can I get a refund?",
    answer: "Yes, we offer refunds for orders that fail to deliver. Refunds are credited back to your ZimBoost wallet within 24 hours. Note: Partially completed orders are non-refundable.",
  },
  {
    question: "Do you offer bulk discounts?",
    answer: "Yes! For large orders or resellers, we offer special bulk pricing. Contact our support team on WhatsApp to discuss custom rates for your needs.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            FAQ
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked{" "}
            <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Got questions? We've got answers. Check out our most commonly asked questions below.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-xl border border-border px-6 data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
