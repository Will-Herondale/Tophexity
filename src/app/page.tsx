"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  BarChart3,
  Map,
  Shield,
  TrendingUp,
  Briefcase,
  Code,
  Palette,
  Building2,
  Heart,
  GraduationCap,
  Cog,
  Menu,
  X,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const features = [
  { icon: Brain, title: "Smart Discovery", desc: "AI analyzes your skills, interests, and values to surface career paths you never considered but are perfectly suited for." },
  { icon: BarChart3, title: "Deep Analysis", desc: "Comprehensive breakdown of each career including salary ranges, growth potential, required skills, and market demand." },
  { icon: Map, title: "Personalized Roadmaps", desc: "Step-by-step action plans with milestones, resources, and timelines tailored to your current position and goals." },
  { icon: Shield, title: "Backup Plans", desc: "Intelligent contingency career paths that keep you prepared for market shifts and industry disruptions." },
  { icon: TrendingUp, title: "Market Intelligence", desc: "Real-time labor market data, hiring trends, and emerging roles so you stay ahead of the curve." },
  { icon: Briefcase, title: "Portfolio Builder", desc: "AI-assisted portfolio and resume optimization to present your best professional self to employers." },
];

const steps = [
  { num: "01", title: "Build Profile", desc: "Tell us about your skills, experience, and what drives you." },
  { num: "02", title: "AI Analysis", desc: "Our AI engine processes your data against thousands of career models." },
  { num: "03", title: "Compare Careers", desc: "Explore ranked career matches with detailed insights and projections." },
  { num: "04", title: "Get Roadmap", desc: "Receive your personalized action plan to reach your ideal career." },
];

const categories = [
  { icon: Code, title: "Technology", desc: "Software, AI, cybersecurity, and data science roles.", count: 120 },
  { icon: Palette, title: "Design", desc: "UX, graphic, product, and creative direction roles.", count: 45 },
  { icon: Building2, title: "Business", desc: "Management, consulting, finance, and operations roles.", count: 80 },
  { icon: Heart, title: "Healthcare", desc: "Medical, biotech, health tech, and wellness roles.", count: 65 },
  { icon: GraduationCap, title: "Education", desc: "Teaching, training, curriculum, and EdTech roles.", count: 40 },
  { icon: Cog, title: "Engineering", desc: "Mechanical, civil, electrical, and systems roles.", count: 55 },
];

const faqs = [
  { q: "How does the AI career matching work?", a: "Our AI engine analyzes your skills, work history, personality traits, values, and interests to generate career recommendations with confidence scores tailored to you." },
  { q: "Is Tophexity free to use?", a: "Yes! Tophexity offers career discovery and basic analysis at no cost. Additional features like personalized roadmaps and backup planning are available as the platform grows." },
  { q: "How accurate are the career predictions?", a: "Our recommendations are based on real career data and skill-demand analysis. As you build a detailed profile, the AI gets more accurate at matching you with the right paths." },
  { q: "Can I use Tophexity if I'm changing careers?", a: "Absolutely. Career changers are one of our core audiences. The platform identifies your transferable skills and creates transition roadmaps that maximize your existing experience." },
  { q: "What data do you collect?", a: "We only collect information you explicitly provide. Your data is encrypted, never shared with third parties, and you can delete your account and all associated data at any time." },
];

const footerProduct = [
  { label: "Career Discovery", href: "/careers" },
  { label: "Skill Analysis", href: "/profile" },
  { label: "Roadmaps", href: "/roadmaps" },
  { label: "Chat", href: "/chat" },
  { label: "Dashboard", href: "/dashboard" },
];

const footerCompany = [
  { label: "About Us", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
];

export default function HomePage() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0f0] overflow-x-hidden">
      {/* ─── Navbar ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[rgba(30,79,163,0.15)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#1E4FA3]" />
            <span className="text-xl font-bold font-[family-name:var(--font-display)] text-white">
              Tophexity
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
                {["Features", "How It Works", "FAQ"].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm text-[#8a8a9a] hover:text-white transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-[#1E4FA3] text-white text-sm font-medium hover:bg-[#1E4FA3]/80 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm text-[#8a8a9a] hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg bg-[#1E4FA3] text-white text-sm font-medium hover:bg-[#1E4FA3]/80 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-[#8a8a9a] hover:text-white transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-[rgba(30,79,163,0.15)] overflow-hidden"
            >
              <div className="px-6 py-4 flex flex-col gap-4">
            {["Features", "How It Works", "FAQ"].map((link) => (
                  <a
                    key={link}
                    href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm text-[#8a8a9a] hover:text-white transition-colors py-2"
                  >
                    {link}
                  </a>
                ))}
                <div className="flex flex-col gap-2 pt-2 border-t border-[rgba(30,79,163,0.15)]">
                  {user ? (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="px-4 py-2 rounded-lg bg-[#1E4FA3] text-white text-sm font-medium text-center"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="px-4 py-2 rounded-lg text-sm text-[#8a8a9a] text-center"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileOpen(false)}
                        className="px-4 py-2 rounded-lg bg-[#1E4FA3] text-white text-sm font-medium text-center"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#1E4FA3]/20 rounded-full blur-[128px] animate-blob" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#0d214f]/40 rounded-full blur-[128px] animate-blob-delay" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1E4FA3]/10 rounded-full blur-[160px] animate-blob-delay-2" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(30,79,163,0.3)] bg-[#0d214f]/50 backdrop-blur-sm mb-8"
          >
            <Zap className="w-4 h-4 text-[#1E4FA3]" />
            <span className="text-sm text-[#8a8a9a]">AI-Powered Career Intelligence</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold font-[family-name:var(--font-display)] leading-tight mb-6"
          >
            Discover Your <br />
            <span className="bg-gradient-to-r from-[#1E4FA3] to-[#3B82F6] bg-clip-text text-transparent">
              Perfect Career
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-[#8a8a9a] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Leverage advanced AI to analyze your unique skills, personality, and goals.
            Get personalized career recommendations with actionable roadmaps built for the modern workforce.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#1E4FA3] text-white font-medium hover:bg-[#1E4FA3]/80 transition-all hover:shadow-[0_0_30px_rgba(30,79,163,0.4)]"
            >
              Start Your Journey
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-[rgba(30,79,163,0.3)] text-[#8a8a9a] hover:text-white hover:border-[rgba(30,79,163,0.6)] transition-all"
            >
              Learn More
            </a>
          </motion.div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] mb-4">
              Everything You Need to <span className="text-[#1E4FA3]">Choose Wisely</span>
            </h2>
            <p className="text-[#8a8a9a] max-w-2xl mx-auto">
              A complete toolkit designed to transform career uncertainty into confident, data-driven decisions.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="group relative p-6 rounded-2xl bg-[#0d214f]/40 border border-[rgba(30,79,163,0.15)] hover:border-[rgba(30,79,163,0.4)] transition-all hover:shadow-[0_0_40px_rgba(30,79,163,0.15)]"
              >
                <div className="w-12 h-12 rounded-xl bg-[#1E4FA3]/20 flex items-center justify-center mb-4 group-hover:bg-[#1E4FA3]/30 transition-colors">
                  <f.icon className="w-6 h-6 text-[#1E4FA3]" />
                </div>
                <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] mb-2">{f.title}</h3>
                <p className="text-sm text-[#8a8a9a] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-24 px-6 bg-[#0d214f]/10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] mb-4">
              How <span className="text-[#1E4FA3]">Tophexity</span> Works
            </h2>
            <p className="text-[#8a8a9a] max-w-2xl mx-auto">
              Four simple steps from uncertainty to a clear, actionable career plan.
            </p>
          </motion.div>

          <div className="relative">
            <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-[#1E4FA3]/0 via-[#1E4FA3]/40 to-[#1E4FA3]/0" />

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {steps.map((step) => (
                <motion.div key={step.num} variants={fadeUp} className="relative text-center">
                  <div className="w-14 h-14 rounded-full bg-[#0d214f] border-2 border-[#1E4FA3] flex items-center justify-center mx-auto mb-6 relative z-10">
                    <span className="text-lg font-bold font-[family-name:var(--font-display)] text-[#1E4FA3]">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#8a8a9a] leading-relaxed max-w-[240px] mx-auto">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Career Categories ─── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] mb-4">
              Explore <span className="text-[#1E4FA3]">Career Categories</span>
            </h2>
            <p className="text-[#8a8a9a] max-w-2xl mx-auto">
              Dive deep into industry-specific insights and discover where your skills shine brightest.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {categories.map((cat) => (
              <motion.div
                key={cat.title}
                variants={fadeUp}
                className="group p-6 rounded-2xl bg-[#0d214f]/40 border border-[rgba(30,79,163,0.15)] hover:border-[rgba(30,79,163,0.4)] transition-all cursor-pointer hover:shadow-[0_0_40px_rgba(30,79,163,0.15)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1E4FA3]/20 flex items-center justify-center group-hover:bg-[#1E4FA3]/30 transition-colors">
                    <cat.icon className="w-6 h-6 text-[#1E4FA3]" />
                  </div>
                  <span className="text-sm text-[#8a8a9a] bg-[#0a0a0f] px-3 py-1 rounded-full">
                    {cat.count} careers
                  </span>
                </div>
                <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] mb-2">{cat.title}</h3>
                <p className="text-sm text-[#8a8a9a] leading-relaxed">{cat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Vision / Mission ─── */}
      <section className="py-24 px-6 bg-[#0d214f]/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="w-8 h-8 text-[#1E4FA3] mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-display)] leading-tight mb-6">
              We propel careers forward with{" "}
              <span className="bg-gradient-to-r from-[#1E4FA3] to-[#3B82F6] bg-clip-text text-transparent">
                precision built for today
              </span>
            </h2>
            <p className="text-[#8a8a9a] text-lg max-w-2xl mx-auto leading-relaxed">
              Tophexity combines deep career intelligence with cutting-edge AI to deliver insights
              that traditional career counseling simply cannot match. Your next chapter starts here.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 px-6 bg-[#0d214f]/10">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] mb-4">
              Frequently Asked <span className="text-[#1E4FA3]">Questions</span>
            </h2>
            <p className="text-[#8a8a9a] max-w-xl mx-auto">
              Everything you need to know about Tophexity.
            </p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-xl border border-[rgba(30,79,163,0.15)] bg-[#0d214f]/30 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium font-[family-name:var(--font-display)] text-sm md:text-base pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#8a8a9a] shrink-0 transition-transform duration-300 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm text-[#8a8a9a] leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden p-12 md:p-16 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0d214f] via-[#1E4FA3]/30 to-[#0d214f]" />
            <div className="absolute inset-0 bg-[rgba(30,79,163,0.05)] backdrop-blur-sm" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] mb-4">
                Ready to Find Your Perfect Career?
              </h2>
              <p className="text-[#8a8a9a] max-w-xl mx-auto mb-8">
                Join professionals who have discovered their ideal career path with AI-powered intelligence.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#1E4FA3] text-white font-medium hover:bg-[#1E4FA3]/80 transition-all hover:shadow-[0_0_30px_rgba(30,79,163,0.4)]"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-[rgba(30,79,163,0.3)] text-[#8a8a9a] hover:text-white hover:border-[rgba(30,79,163,0.6)] transition-all"
                >
                  View Demo
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[rgba(30,79,163,0.15)] bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-[#1E4FA3]" />
                <span className="text-xl font-bold font-[family-name:var(--font-display)] text-white">Tophexity</span>
              </div>
              <p className="text-sm text-[#8a8a9a] leading-relaxed mb-6">
                AI-powered career intelligence platform helping professionals discover, analyze, and navigate their ideal career paths.
              </p>
              <div className="flex gap-4">
                {["X", "In", "GH"].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="w-9 h-9 rounded-lg bg-[#0d214f]/50 border border-[rgba(30,79,163,0.15)] flex items-center justify-center text-xs text-[#8a8a9a] hover:text-white hover:border-[rgba(30,79,163,0.4)] transition-all"
                  >
                    {social}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold font-[family-name:var(--font-display)] text-sm mb-4">Product</h4>
              <ul className="space-y-3">
                {footerProduct.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-[#8a8a9a] hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold font-[family-name:var(--font-display)] text-sm mb-4">Company</h4>
              <ul className="space-y-3">
                {footerCompany.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-[#8a8a9a] hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[rgba(30,79,163,0.15)] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#8a8a9a]">
              &copy; {new Date().getFullYear()} Tophexity. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-xs text-[#8a8a9a] hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-xs text-[#8a8a9a] hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-xs text-[#8a8a9a] hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
