import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import PaymentMethods from "@/components/PaymentMethods";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>ZimBoost - Zimbabwe's #1 SMM Panel | Buy Followers, Likes & Views</title>
        <meta
          name="description"
          content="Boost your social media with ZimBoost. Buy Instagram, TikTok, YouTube, Facebook followers, likes & views. Pay with PayNow, EcoCash. Fast delivery in Zimbabwe!"
        />
        <meta
          name="keywords"
          content="SMM panel Zimbabwe, buy followers Zimbabwe, Instagram followers, TikTok views, YouTube subscribers, PayNow, EcoCash, social media marketing"
        />
        <link rel="canonical" href="https://zimboost.co.zw" />
      </Helmet>

      <div className="min-h-screen">
        <Navbar />
        <main>
          <Hero />
          <Features />
          <Services />
          <HowItWorks />
          <Testimonials />
          <PaymentMethods />
          <FAQ />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
