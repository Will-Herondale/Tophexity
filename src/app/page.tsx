"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  BarChart3,
  Map,
  Shield,
  TrendingUp,
  Briefcase,
  Menu,
  X,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Target,
  Rocket,
  Layers,
  Users,
  LineChart,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useState, useEffect } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const features = [
  { icon: Brain, title: "AI Career Matching", desc: "Our engine analyzes your skills, experience, and interests to surface career paths you never considered — with confidence scores." },
  { icon: BarChart3, title: "Deep Analysis", desc: "Comprehensive breakdown of each career including salary data, growth outlook, and real-time market demand." },
  { icon: Map, title: "Personalized Roadmaps", desc: "Step-by-step action plans with milestones and timelines tailored to your background and goals." },
  { icon: Shield, title: "Backup Plans", desc: "Intelligent contingency paths that keep you prepared for market shifts and unexpected changes." },
  { icon: TrendingUp, title: "Market Intelligence", desc: "Real-time labor market data, emerging roles, and skill demand trends so you stay ahead." },
  { icon: Briefcase, title: "Portfolio Builder", desc: "Showcase projects, work experience, certifications, and achievements — built for students and professionals." },
];

const steps = [
  { num: "01", title: "Build Profile", desc: "Tell us about your skills, background, and what drives you — student or professional.", icon: Users },
  { num: "02", title: "AI Analysis", desc: "Our engine processes your data against thousands of career models and market signals.", icon: Brain },
  { num: "03", title: "Compare Careers", desc: "Explore ranked matches with detailed insights, salary data, and growth projections.", icon: Target },
  { num: "04", title: "Get Roadmap", desc: "Receive your personalized action plan to reach your ideal career path.", icon: Rocket },
];

const marqueeItems = [
  "Technology", "Design", "Business", "Healthcare", "Education", "Engineering",
  "Data Science", "Product Management", "Cybersecurity", "Finance",
];

const faqs = [
  { q: "How does the AI career matching work?", a: "Our AI engine analyzes your skills, work history, personality traits, values, and interests to generate career recommendations with confidence scores tailored to you. The more detailed your profile, the more accurate the matches." },
  { q: "Is Tophexity just for students?", a: "No! Tophexity is designed for everyone — high school and college students exploring options, as well as working professionals looking to pivot, advance, or discover new paths. Your experience level shapes the recommendations you receive." },
  { q: "Is Tophexity free to use?", a: "Yes! Tophexity offers career discovery and basic analysis at no cost. Additional features like personalized roadmaps and backup planning are available as the platform grows." },
  { q: "How accurate are the career predictions?", a: "Our recommendations are based on real career data and skill-demand analysis. As you build a detailed profile, the AI gets more accurate at matching you with the right paths." },
  { q: "Can I use Tophexity if I'm changing careers?", a: "Absolutely. Career changers are one of our core audiences. The platform identifies your transferable skills and creates transition roadmaps that maximize your existing experience." },
  { q: "What data do you collect?", a: "We only collect information you explicitly provide. Your data is encrypted, never shared with third parties, and you can delete your account and all associated data at any time." },
];

const footerProduct = [
  { label: "Career Discovery", href: "/careers" },
  { label: "Skill Analysis", href: "/profile" },
  { label: "Roadmaps", href: "/roadmaps" },
  { label: "Chat Assistant", href: "/chat" },
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
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── Navbar ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background ${
          scrolled ? "border-b border-border shadow-sm" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold font-[family-name:var(--font-display)] tracking-tight">
              Tophexity
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {["Features", "How It Works", "FAQ"].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                className="px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-foreground hover:bg-surface/50 transition-all duration-200"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-light transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-light transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-foreground transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-background/95 backdrop-blur-2xl border-b border-border overflow-hidden"
            >
              <div className="px-6 py-4 flex flex-col gap-1">
                {["Features", "How It Works", "FAQ"].map((link) => (
                  <a
                    key={link}
                    href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm text-text-secondary hover:text-foreground transition-colors py-2.5 px-3 rounded-lg hover:bg-surface/50"
                  >
                    {link}
                  </a>
                ))}
                <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-border">
                  {user ? (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium text-center"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="px-4 py-2.5 rounded-lg text-sm text-text-secondary text-center"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileOpen(false)}
                        className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium text-center"
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

      {/* ─── 1. Hero ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-8 overflow-hidden bg-background">
        {/* Background layers — start below navbar */}
        <div className="absolute inset-0 top-16 hero-grid" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[140px] animate-blob" />
          <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px] animate-blob-delay" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Small accent line above headline */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-12 h-0.5 bg-accent mx-auto mb-8 rounded-full"
          />

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-8xl font-bold font-[family-name:var(--font-display)] leading-[1.05] tracking-tight mb-6"
          >
            Discover Your
            <br />
            <span className="bg-gradient-to-r from-accent via-accent-light to-[#60A5FA] bg-clip-text text-transparent">
              Perfect Career
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-base md:text-lg text-text-secondary max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Tophexity analyzes your unique skills, experience, and goals to surface
            career paths you never considered — with actionable roadmaps to get there.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="group flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-light transition-all shadow-[0_0_30px_rgba(30,79,163,0.3)] hover:shadow-[0_0_50px_rgba(30,79,163,0.5)]"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border-light text-text-secondary text-sm font-medium hover:text-foreground hover:bg-surface/30 transition-all"
            >
              Learn More
            </a>
          </motion.div>

        </div>

        {/* Floating draggable badges — positioned relative to full hero */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          drag
          dragConstraints={{ top: -80, bottom: 80, left: -80, right: 80 }}
          dragElastic={0.1}
          whileDrag={{ scale: 1.05, cursor: "grabbing" }}
          className="hidden lg:flex absolute left-[5%] top-[22%] items-center gap-3 px-4 py-2.5 rounded-xl bg-surface/60 backdrop-blur-sm border border-border/50 shadow-lg cursor-grab select-none hover:bg-surface/80 transition-colors z-20"
        >
          <Link href={user ? "/chat" : "/register"} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
              <Brain className="w-4 h-4 text-accent" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground">AI Matching</p>
              <p className="text-[10px] text-text-muted">94% accuracy</p>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          drag
          dragConstraints={{ top: -80, bottom: 80, left: -80, right: 80 }}
          dragElastic={0.1}
          whileDrag={{ scale: 1.05, cursor: "grabbing" }}
          className="hidden lg:flex absolute right-[5%] top-[18%] items-center gap-3 px-4 py-2.5 rounded-xl bg-surface/60 backdrop-blur-sm border border-border/50 shadow-lg cursor-grab select-none hover:bg-surface/80 transition-colors z-20"
        >
          <Link href={user ? "/roadmaps" : "/register"} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Map className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground">Roadmaps</p>
              <p className="text-[10px] text-text-muted">Step-by-step</p>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          drag
          dragConstraints={{ top: -80, bottom: 80, left: -80, right: 80 }}
          dragElastic={0.1}
          whileDrag={{ scale: 1.05, cursor: "grabbing" }}
          className="hidden lg:flex absolute left-[8%] bottom-[18%] items-center gap-3 px-4 py-2.5 rounded-xl bg-surface/60 backdrop-blur-sm border border-border/50 shadow-lg cursor-grab select-none hover:bg-surface/80 transition-colors z-20"
        >
          <Link href={user ? "/backups" : "/register"} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground">Backup Plans</p>
              <p className="text-[10px] text-text-muted">Always prepared</p>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          drag
          dragConstraints={{ top: -80, bottom: 80, left: -80, right: 80 }}
          dragElastic={0.1}
          whileDrag={{ scale: 1.05, cursor: "grabbing" }}
          className="hidden lg:flex absolute right-[6%] bottom-[22%] items-center gap-3 px-4 py-2.5 rounded-xl bg-surface/60 backdrop-blur-sm border border-border/50 shadow-lg cursor-grab select-none hover:bg-surface/80 transition-colors z-20"
        >
          <Link href={user ? "/careers" : "/register"} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground">Market Data</p>
              <p className="text-[10px] text-text-muted">Real-time trends</p>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          drag
          dragConstraints={{ top: -80, bottom: 80, left: -80, right: 80 }}
          dragElastic={0.1}
          whileDrag={{ scale: 1.05, cursor: "grabbing" }}
          className="hidden lg:flex absolute left-[15%] bottom-[8%] items-center gap-3 px-4 py-2.5 rounded-xl bg-surface/60 backdrop-blur-sm border border-border/50 shadow-lg cursor-grab select-none hover:bg-surface/80 transition-colors z-20"
        >
          <Link href={user ? "/portfolio" : "/register"} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground">Portfolio</p>
              <p className="text-[10px] text-text-muted">Showcase work</p>
            </div>
          </Link>
        </motion.div>
      </section>

      {/* ─── 2. About + Stats ─── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              We combine deep career intelligence with cutting-edge AI to deliver
              personalized career recommendations — for <span className="text-foreground font-medium">students</span> and <span className="text-foreground font-medium">professionals</span> alike.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8"
          >
            {[
              { value: "6", label: "Career Domains" },
              { value: "AI", label: "Powered Analysis" },
              { value: "48+", label: "API Endpoints" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-display)] text-accent mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-text-secondary">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── 3. Career Categories Marquee ─── */}
      <section className="py-10 border-y border-border/50 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="mx-6 text-base md:text-lg font-medium text-text-muted/80 font-[family-name:var(--font-display)] flex items-center gap-6">
              {item}
              <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
            </span>
          ))}
        </div>
      </section>

      {/* ─── 4. Features ─── */}
      <section id="features" className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-surface/5 to-background" />
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface/30 mb-6">
              <Layers className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">Features</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-display)] tracking-tight mb-4">
              Everything You Need
              <br />
              <span className="text-accent">to Choose Wisely</span>
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto leading-relaxed">
              A complete toolkit designed to transform career uncertainty into confident, data-driven decisions.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="group relative p-6 rounded-2xl bg-surface/15 hover:bg-surface/30 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <f.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-base font-semibold font-[family-name:var(--font-display)] mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── 5. How It Works ─── */}
      <section id="how-it-works" className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-surface/5 to-background" />

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface/30 mb-6">
              <Rocket className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">Process</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-display)] tracking-tight mb-4">
              How <span className="text-accent">Tophexity</span> Works
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Four simple steps from uncertainty to a clear, actionable career plan.
            </p>
          </motion.div>

          <div className="relative">
            <div className="hidden lg:block absolute top-[52px] left-[calc(12.5%+28px)] right-[calc(12.5%+28px)] h-px">
              <svg className="w-full h-full" preserveAspectRatio="none">
                <line x1="0" y1="0" x2="100%" y2="0" stroke="rgba(30,79,163,0.3)" strokeWidth="1" className="animate-dash" />
              </svg>
            </div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6"
            >
              {steps.map((step) => (
                <motion.div key={step.num} variants={fadeUp} className="relative text-center group">
                  <div className="relative inline-block mb-6">
                    <div className="w-14 h-14 rounded-full bg-background ring-2 ring-accent/50 flex items-center justify-center relative z-10 group-hover:ring-accent transition-all duration-300">
                      <step.icon className="w-5 h-5 text-accent group-hover:text-accent-light transition-colors" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center z-20">
                      <span className="text-[10px] font-bold text-white">{step.num}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold font-[family-name:var(--font-display)] mb-2">{step.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed max-w-[220px] mx-auto">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── 6. Vision ─── */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/8 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-8">
              <LineChart className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-display)] leading-tight tracking-tight mb-6">
              We propel careers forward with{" "}
              <span className="bg-gradient-to-r from-[#1E4FA3] to-[#60A5FA] bg-clip-text text-transparent">
                precision built for today,
              </span>{" "}
              and possibility engineered for tomorrow.
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
              Tophexity combines deep career intelligence with cutting-edge AI to deliver insights
              that traditional career counseling simply cannot match. Your next chapter starts here.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── 7. CTA Banner ─── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-surface via-accent/10 to-surface" />
            <div className="absolute inset-0 hero-grid opacity-50" />
            <div className="absolute inset-0 rounded-3xl border border-border/50" />

            <div className="relative z-10 px-8 py-16 md:px-16 md:py-20 text-center">
              <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-display)] tracking-tight mb-4">
                Ready to Discover Your
                <br />
                <span className="bg-gradient-to-r from-accent to-[#60A5FA] bg-clip-text text-transparent">
                  Perfect Path?
                </span>
              </h2>
              <p className="text-text-secondary max-w-lg mx-auto mb-10 leading-relaxed">
                Start building your career roadmap today with AI-powered intelligence.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="group flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-light transition-all"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border-light text-text-secondary text-sm font-medium hover:text-foreground hover:bg-surface/30 transition-all"
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── 8. FAQ ─── */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface/30 mb-6">
              <HelpIcon />
              <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">FAQ</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-display)] tracking-tight mb-4">
              Frequently Asked <span className="text-accent">Questions</span>
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Quick answers to common queries about Tophexity.
            </p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-xl transition-all duration-300 overflow-hidden ${
                  openFaq === i
                    ? "bg-surface/30"
                    : "bg-surface/15 hover:bg-surface/25"
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left gap-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-1 rounded shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-medium font-[family-name:var(--font-display)] text-sm md:text-base">
                      {faq.q}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-text-secondary shrink-0 transition-transform duration-300 ${
                      openFaq === i ? "rotate-180 text-accent" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pl-16">
                        <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 9. Footer CTA ─── */}
      <section className="py-20 px-6 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] tracking-tight mb-4">
              Start Your Career Journey
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto mb-8 leading-relaxed">
              Reach out to explore what&apos;s possible for your career with AI-powered intelligence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="group flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-light transition-all"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border-light text-text-secondary text-sm font-medium hover:text-foreground hover:bg-surface/30 transition-all"
              >
                View Dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── 10. Footer ─── */}
      <footer className="border-t border-border/50 bg-background">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-lg font-bold font-[family-name:var(--font-display)]">Tophexity</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed mb-6 max-w-xs">
                AI-powered career intelligence platform helping students and professionals discover and navigate their ideal career paths.
              </p>
            </div>

            <div>
              <h4 className="font-semibold font-[family-name:var(--font-display)] text-sm mb-4 text-foreground">Product</h4>
              <ul className="space-y-2.5">
                {footerProduct.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-text-secondary hover:text-foreground transition-colors duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold font-[family-name:var(--font-display)] text-sm mb-4 text-foreground">Company</h4>
              <ul className="space-y-2.5">
                {footerCompany.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-text-secondary hover:text-foreground transition-colors duration-200">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-text-muted">
              &copy; {new Date().getFullYear()} Tophexity. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-xs text-text-muted hover:text-text-secondary transition-colors">Privacy</a>
              <a href="#" className="text-xs text-text-muted hover:text-text-secondary transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HelpIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
