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
  Target,
  LineChart,
  Rocket,
  Layers,
  CheckCircle2,
  Users,
  Globe,
  Lock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useState, useEffect } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

const fadeScale = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const features = [
  { icon: Brain, title: "Smart Discovery", desc: "AI analyzes your skills, experience level, and interests to surface career paths you never considered.", large: true, color: "#1E4FA3" },
  { icon: BarChart3, title: "Deep Analysis", desc: "Comprehensive breakdown of each career including salary, growth, and market demand.", large: false, color: "#3B82F6" },
  { icon: Map, title: "Personalized Roadmaps", desc: "Step-by-step action plans with milestones and timelines tailored to your goals.", large: true, color: "#2563EB" },
  { icon: Shield, title: "Backup Plans", desc: "Intelligent contingency paths that keep you prepared for market shifts.", large: false, color: "#60A5FA" },
  { icon: TrendingUp, title: "Market Intelligence", desc: "Real-time labor market data and emerging roles so you stay ahead.", large: false, color: "#1E4FA3" },
  { icon: Briefcase, title: "Portfolio Builder", desc: "Showcase projects, work experience, certifications, and achievements — for students and professionals alike.", large: false, color: "#3B82F6" },
];

const steps = [
  { num: "01", title: "Build Profile", desc: "Tell us about your skills, background, and what drives you — student or professional.", icon: Users },
  { num: "02", title: "AI Analysis", desc: "Our engine processes your data against thousands of career models.", icon: Brain },
  { num: "03", title: "Compare Careers", desc: "Explore ranked matches with detailed insights and projections.", icon: Target },
  { num: "04", title: "Get Roadmap", desc: "Receive your personalized action plan to reach your ideal career.", icon: Rocket },
];

const categories = [
  { icon: Code, title: "Technology", desc: "Software, AI, cybersecurity, and data science.", count: "120+", gradient: "from-blue-500/20 to-cyan-500/20" },
  { icon: Palette, title: "Design", desc: "UX, graphic, product, and creative direction.", count: "45+", gradient: "from-purple-500/20 to-pink-500/20" },
  { icon: Building2, title: "Business", desc: "Management, consulting, finance, and operations.", count: "80+", gradient: "from-amber-500/20 to-orange-500/20" },
  { icon: Heart, title: "Healthcare", desc: "Medical, biotech, health tech, and wellness.", count: "65+", gradient: "from-rose-500/20 to-red-500/20" },
  { icon: GraduationCap, title: "Education", desc: "Teaching, training, curriculum, and EdTech.", count: "40+", gradient: "from-emerald-500/20 to-teal-500/20" },
  { icon: Cog, title: "Engineering", desc: "Mechanical, civil, electrical, and systems.", count: "55+", gradient: "from-indigo-500/20 to-violet-500/20" },
];

const faqs = [
  { q: "How does the AI career matching work?", a: "Our AI engine analyzes your skills, work history, personality traits, values, and interests to generate career recommendations with confidence scores tailored to you." },
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

function DashboardMockup() {
  const [activeSlide, setActiveSlide] = useState(0);
  const totalSlides = 4;

  useEffect(() => {
    const timer = setInterval(() => setActiveSlide((p) => (p + 1) % totalSlides), 4000);
    return () => clearInterval(timer);
  }, []);

  const slides = [
    /* Slide 0: Career Dashboard */
    <div key="dash" className="p-6 md:p-8 h-full">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-accent/30 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        <div>
          <p className="text-xs text-text-muted">Welcome back</p>
          <p className="text-sm font-semibold font-[family-name:var(--font-display)]">Career Dashboard</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Match Score", value: "94%", color: "text-emerald-400" },
          { label: "Skills Analyzed", value: "28", color: "text-accent" },
          { label: "Careers Found", value: "12", color: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-surface/30 p-3">
            <p className={`text-lg font-bold font-[family-name:var(--font-display)] ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2.5">
        {[
          { title: "Product Manager", score: 94 },
          { title: "Data Analyst", score: 87 },
          { title: "UX Strategist", score: 82 },
        ].map((c) => (
          <div key={c.title} className="rounded-xl bg-surface/20 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">{c.title}</span>
              <span className="text-xs text-accent font-bold">{c.score}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface/60 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light" style={{ width: `${c.score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>,

    /* Slide 1: AI Recommendations */
    <div key="rec" className="p-6 md:p-8 h-full">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
          <Brain className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-xs text-text-muted">AI Analysis</p>
          <p className="text-sm font-semibold font-[family-name:var(--font-display)]">Top Recommendations</p>
        </div>
      </div>
      <div className="space-y-3">
        {[
          { title: "Full Stack Developer", match: 96, reason: "Strong coding + problem-solving fit" },
          { title: "DevOps Engineer", match: 89, reason: "Matches your system design skills" },
          { title: "Product Manager", match: 84, reason: "Great leadership & communication fit" },
        ].map((r) => (
          <div key={r.title} className="rounded-xl bg-surface/20 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium">{r.title}</span>
              <span className="text-xs font-bold text-emerald-400">{r.match}%</span>
            </div>
            <p className="text-[11px] text-text-muted">{r.reason}</p>
          </div>
        ))}
      </div>
    </div>,

    /* Slide 2: Skills Radar */
    <div key="skills" className="p-6 md:p-8 h-full">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/30 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-xs text-text-muted">Your Profile</p>
          <p className="text-sm font-semibold font-[family-name:var(--font-display)]">Skills Overview</p>
        </div>
      </div>
      <div className="space-y-3">
        {[
          { skill: "JavaScript", level: "Advanced", pct: 88 },
          { skill: "React", level: "Advanced", pct: 82 },
          { skill: "Node.js", level: "Intermediate", pct: 70 },
          { skill: "Python", level: "Intermediate", pct: 65 },
          { skill: "System Design", level: "Beginner", pct: 45 },
        ].map((s) => (
          <div key={s.skill} className="flex items-center gap-3">
            <span className="text-xs w-24 shrink-0 font-medium">{s.skill}</span>
            <div className="flex-1 h-1.5 rounded-full bg-surface/60 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400" style={{ width: `${s.pct}%` }} />
            </div>
            <span className="text-[10px] text-text-muted w-8 text-right">{s.level}</span>
          </div>
        ))}
      </div>
    </div>,

    /* Slide 3: Roadmap */
    <div key="road" className="p-6 md:p-8 h-full">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
          <Map className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <p className="text-xs text-text-muted">Your Path</p>
          <p className="text-sm font-semibold font-[family-name:var(--font-display)]">Career Roadmap</p>
        </div>
      </div>
      <div className="relative pl-5 space-y-4">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-accent/20" />
        {[
          { title: "Build portfolio projects", tag: "Done", tagColor: "bg-emerald-500/20 text-emerald-400" },
          { title: "Master system design basics", tag: "In Progress", tagColor: "bg-accent/20 text-accent" },
          { title: "Contribute to open source", tag: "Next", tagColor: "bg-purple-500/20 text-purple-400" },
          { title: "Apply to target roles", tag: "Upcoming", tagColor: "bg-surface/40 text-text-muted" },
        ].map((step, i) => (
          <div key={step.title} className="relative">
            <div className={`absolute -left-[15px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${i === 0 ? "bg-emerald-400 border-emerald-400" : i === 1 ? "bg-accent border-accent animate-pulse" : "bg-background border-border"}`} />
            <div className="rounded-xl bg-surface/20 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{step.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${step.tagColor}`}>{step.tag}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>,
  ];

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Glow behind */}
      <div className="absolute inset-0 bg-accent/15 blur-[60px] rounded-full" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl bg-background/80 backdrop-blur-xl overflow-hidden shadow-[0_0_80px_rgba(30,79,163,0.15)]"
        style={{ perspective: "1200px" }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border/50 bg-surface/20">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[10px] text-text-muted font-mono">tophexity.com/dashboard</span>
          </div>
        </div>

        {/* Slide container */}
        <div className="relative h-[340px] md:h-[360px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              {slides[activeSlide]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 pb-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeSlide ? "w-6 bg-accent" : "w-1.5 bg-surface-foreground/20 hover:bg-surface-foreground/40"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/80 backdrop-blur-2xl border-b border-border shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-[0_0_20px_rgba(30,79,163,0.4)] group-hover:shadow-[0_0_30px_rgba(30,79,163,0.6)] transition-shadow">
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
                className="px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-white hover:bg-surface/50 transition-all duration-200"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-light transition-all shadow-[0_0_20px_rgba(30,79,163,0.3)] hover:shadow-[0_0_30px_rgba(30,79,163,0.5)]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-light transition-all shadow-[0_0_20px_rgba(30,79,163,0.3)] hover:shadow-[0_0_30px_rgba(30,79,163,0.5)]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-white transition-colors"
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
                    className="text-sm text-text-secondary hover:text-white transition-colors py-2.5 px-3 rounded-lg hover:bg-surface/50"
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

      {/* ─── Hero ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 hero-grid" />

        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-accent/15 rounded-full blur-[140px] animate-blob" />
          <div className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] animate-blob-delay" />
          <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-[160px] animate-blob-delay-2" />
        </div>

        {/* Radial fade overlay */}
        <div className="absolute inset-0 bg-radial-[at_50%_40%] from-transparent via-transparent to-background/80 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center mb-12 md:mb-16">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface/40 backdrop-blur-sm mb-8 shadow-[0_0_20px_rgba(30,79,163,0.1)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-text-secondary font-medium tracking-wide uppercase">AI-Powered Career Intelligence</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-8xl font-bold font-[family-name:var(--font-display)] leading-[1.05] tracking-tight mb-6"
          >
            Discover Your
            <br />
            <span className="bg-gradient-to-r from-accent via-accent-light to-[#60A5FA] bg-clip-text text-transparent animate-gradient-text">
              Perfect Career
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-base md:text-lg text-text-secondary max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Leverage advanced AI to analyze your unique skills, experience, and goals.
            Whether you're a student exploring options or a professional planning your next move — get personalized career recommendations with actionable roadmaps.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="group flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-light transition-all shadow-[0_0_30px_rgba(30,79,163,0.4)] hover:shadow-[0_0_50px_rgba(30,79,163,0.6)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Your Journey
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-text-secondary text-sm font-medium hover:text-white hover:bg-surface/30 transition-all"
            >
              Learn More
            </a>
          </motion.div>
        </div>

        {/* Dashboard Mockup */}
        <div className="relative z-10 w-full px-4">
          <DashboardMockup />
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* ─── Features (Bento Grid) ─── */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
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

          {/* Bento Grid */}
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
                className={`glow-card group relative rounded-2xl bg-surface/20 hover:bg-surface/40 transition-all duration-500 overflow-hidden ${
                  f.large ? "md:col-span-1 lg:col-span-1 p-8" : "p-6"
                }`}
              >
                {/* Subtle gradient top-left corner */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-br-full" style={{ background: `radial-gradient(circle at top left, ${f.color}15, transparent 70%)` }} />

                <div className="relative z-10">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${f.color}15`, boxShadow: `0 0 0 1px ${f.color}20` }}
                  >
                    <f.icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] mb-2 tracking-tight">
                    {f.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-28 px-6 relative">
        {/* Section bg */}
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

          {/* Steps */}
          <div className="relative">
            {/* Connecting line - desktop */}
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
              {steps.map((step, i) => (
                <motion.div key={step.num} variants={fadeUp} className="relative text-center group">
                  {/* Step circle */}
                  <div className="relative inline-block mb-6">
                    <div className="w-14 h-14 rounded-full bg-background ring-2 ring-accent/50 flex items-center justify-center relative z-10 group-hover:ring-accent transition-all duration-300">
                      <step.icon className="w-5 h-5 text-accent group-hover:text-accent-light transition-colors" />
                    </div>
                    {/* Pulse ring on hover */}
                    <div className="absolute inset-0 rounded-full ring-2 ring-accent/30 opacity-0 group-hover:opacity-100 group-hover:animate-pulse-ring" />
                    {/* Step number */}
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

      {/* ─── Career Categories ─── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface/30 mb-6">
              <Globe className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">Explore</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-display)] tracking-tight mb-4">
              Explore <span className="text-accent">Career Categories</span>
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Dive deep into industry-specific insights and discover where your skills shine brightest.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {categories.map((cat) => (
              <motion.div
                key={cat.title}
                variants={fadeScale}
                className="glow-card group relative p-6 rounded-2xl bg-surface/15 hover:bg-surface/30 transition-all duration-500 cursor-pointer overflow-hidden"
              >
                {/* Gradient bg on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center group-hover:bg-accent/25 group-hover:scale-110 transition-all duration-300">
                      <cat.icon className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-xs font-mono text-accent bg-accent/10 px-2.5 py-1 rounded-md">
                      {cat.count}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold font-[family-name:var(--font-display)] mb-1.5">{cat.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{cat.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Vision ─── */}
      <section className="py-28 px-6 relative overflow-hidden">
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
                precision built for today
              </span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
              Tophexity combines deep career intelligence with cutting-edge AI to deliver insights
              that traditional career counseling simply cannot match. Your next chapter starts here.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 px-6">
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
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-xl transition-all duration-300 overflow-hidden ${
                  openFaq === i
                    ? "bg-surface/30 shadow-[0_0_30px_rgba(30,79,163,0.08)]"
                    : "bg-surface/15 hover:bg-surface/25"
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left gap-4"
                >
                  <span className="font-medium font-[family-name:var(--font-display)] text-sm md:text-base">
                    {faq.q}
                  </span>
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
                      <div className="px-5 pb-5">
                        <div className="h-px bg-border/50 mb-4" />
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

      {/* ─── CTA Banner ─── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* Background layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-surface via-accent/10 to-surface" />
            <div className="absolute inset-0 hero-grid opacity-50" />
            <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-accent/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-[200px] h-[200px] bg-accent/15 rounded-full blur-[80px]" />

            {/* Border */}
            <div className="absolute inset-0 rounded-3xl border border-border/50" />

            <div className="relative z-10 px-8 py-16 md:px-16 md:py-20 text-center">
              <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-display)] tracking-tight mb-4">
                Ready to Find Your
                <br />
              <span className="bg-gradient-to-r from-accent to-[#60A5FA] bg-clip-text text-transparent">
                  Perfect Career?
                </span>
              </h2>
              <p className="text-text-secondary max-w-lg mx-auto mb-10 leading-relaxed">
                Start building your career roadmap today with AI-powered intelligence.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="group flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-white text-background font-semibold text-sm hover:bg-gray-100 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 text-white/80 text-sm font-medium hover:text-white hover:border-white/40 hover:bg-white/5 transition-all"
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
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
              <h4 className="font-semibold font-[family-name:var(--font-display)] text-sm mb-4 text-white/90">Product</h4>
              <ul className="space-y-2.5">
                {footerProduct.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-text-secondary hover:text-white transition-colors duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold font-[family-name:var(--font-display)] text-sm mb-4 text-white/90">Company</h4>
              <ul className="space-y-2.5">
                {footerCompany.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-text-secondary hover:text-white transition-colors duration-200">
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
