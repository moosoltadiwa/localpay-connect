import { Instagram, Youtube, Facebook, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const services = [
  {
    platform: "Instagram",
    icon: Instagram,
    color: "from-pink-500 to-purple-600",
    services: ["Followers", "Likes", "Views", "Comments", "Story Views"],
    startingPrice: "$0.50",
  },
  {
    platform: "TikTok",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
    color: "from-gray-900 to-gray-700",
    services: ["Followers", "Likes", "Views", "Shares", "Comments"],
    startingPrice: "$0.30",
  },
  {
    platform: "YouTube",
    icon: Youtube,
    color: "from-red-500 to-red-700",
    services: ["Subscribers", "Views", "Likes", "Watch Hours", "Comments"],
    startingPrice: "$1.00",
  },
  {
    platform: "Facebook",
    icon: Facebook,
    color: "from-blue-600 to-blue-800",
    services: ["Page Likes", "Post Likes", "Followers", "Views", "Shares"],
    startingPrice: "$0.40",
  },
  {
    platform: "Twitter / X",
    icon: Twitter,
    color: "from-gray-800 to-gray-900",
    services: ["Followers", "Likes", "Retweets", "Views", "Comments"],
    startingPrice: "$0.35",
  },
];

const Services = () => {
  return (
    <section id="services" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Our Services
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Boost All Your{" "}
            <span className="gradient-text">Social Platforms</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Choose from our wide range of services for all major social media platforms.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={service.platform}
              className="group relative bg-card rounded-2xl border border-border overflow-hidden card-hover"
            >
              {/* Header with gradient */}
              <div className={`h-24 bg-gradient-to-r ${service.color} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10" />
                <service.icon className="w-12 h-12 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  {service.platform}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Starting from{" "}
                  <span className="text-primary font-bold">{service.startingPrice}</span>
                </p>

                <ul className="space-y-2 mb-6">
                  {service.services.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link to="/auth?mode=signup">
                  <Button variant="outline" className="w-full">
                    Order Now
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/auth?mode=signup">
            <Button variant="hero" size="lg">
              View All Services
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Services;
