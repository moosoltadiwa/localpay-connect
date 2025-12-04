import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Tendai Moyo",
    role: "Instagram Influencer",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    content: "ZimBoost helped me grow my Instagram from 2K to 50K followers in just 3 months! The delivery is super fast and the support team on WhatsApp is amazing.",
    rating: 5,
  },
  {
    name: "Blessing Chikwamba",
    role: "Small Business Owner",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    content: "As a small business owner in Harare, I needed to boost my Facebook page. PayNow payment made it so easy! My page engagement increased by 300%.",
    rating: 5,
  },
  {
    name: "Rudo Mutasa",
    role: "TikTok Creator",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    content: "I was struggling to get views on TikTok. After using ZimBoost, my videos started going viral! The prices are affordable and results are real.",
    rating: 5,
  },
  {
    name: "Kudzai Ndoro",
    role: "YouTuber",
    image: "https://randomuser.me/api/portraits/men/75.jpg",
    content: "Finally, an SMM panel that accepts EcoCash! Growing my YouTube channel has never been easier. Highly recommend to all Zimbabwean content creators.",
    rating: 5,
  },
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Testimonials
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our Customers{" "}
            <span className="gradient-text">Say</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of satisfied customers who have grown their social media presence with ZimBoost.
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="bg-card rounded-2xl p-6 border border-border card-hover relative"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
              
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed">
                "{testimonial.content}"
              </p>
            </div>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden">
          <div className="bg-card rounded-2xl p-6 border border-border relative">
            <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
            
            <div className="flex items-center gap-3 mb-4">
              <img
                src={testimonials[currentIndex].image}
                alt={testimonials[currentIndex].name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h4 className="font-semibold text-foreground">{testimonials[currentIndex].name}</h4>
                <p className="text-sm text-muted-foreground">{testimonials[currentIndex].role}</p>
              </div>
            </div>

            <div className="flex gap-1 mb-3">
              {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-accent text-accent" />
              ))}
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              "{testimonials[currentIndex].content}"
            </p>

            <div className="flex items-center justify-between">
              <button
                onClick={prevTestimonial}
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? "bg-primary" : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={nextTestimonial}
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
