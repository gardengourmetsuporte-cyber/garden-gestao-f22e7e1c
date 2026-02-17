import { useEffect, useRef, ReactNode } from "react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { ScreenshotsSection } from "@/components/landing/ScreenshotsSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { DifferentialsSection } from "@/components/landing/DifferentialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { CTASection } from "@/components/landing/CTASection";
import { FooterSection } from "@/components/landing/FooterSection";

function FadeInSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("opacity-100", "translate-y-0");
          el.classList.remove("opacity-0", "translate-y-8");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`opacity-0 translate-y-8 transition-all duration-700 ease-out ${className}`}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background scroll-smooth overflow-x-hidden">
      <LandingNavbar />
      <HeroSection />
      <FadeInSection><ProblemSection /></FadeInSection>
      <FadeInSection><SolutionSection /></FadeInSection>
      <FadeInSection><ScreenshotsSection /></FadeInSection>
      <FadeInSection><BenefitsSection /></FadeInSection>
      <FadeInSection><HowItWorksSection /></FadeInSection>
      <FadeInSection><TestimonialsSection /></FadeInSection>
      <FadeInSection><PricingSection /></FadeInSection>
      <FadeInSection><DifferentialsSection /></FadeInSection>
      <FadeInSection><FAQSection /></FadeInSection>
      <FadeInSection><TrustSection /></FadeInSection>
      <CTASection />
      <FooterSection />
    </div>
  );
}
