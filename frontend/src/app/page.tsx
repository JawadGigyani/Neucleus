"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FlaskConical,
  PenLine,
  Cpu,
  RefreshCw,
  BookOpen,
  Beaker,
  Package,
  DollarSign,
  CalendarDays,
  Brain,
  ArrowRight,
  ArrowDown,
  RotateCcw,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const inView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.4 },
};

const FEATURES = [
  {
    icon: <BookOpen size={22} className="text-orange-500" />,
    title: "Literature Grounding",
    desc: "Every claim is verified against real papers from OpenAlex and CrossRef.",
  },
  {
    icon: <Beaker size={22} className="text-orange-500" />,
    title: "Detailed Protocol",
    desc: "Step-by-step lab procedure with grounding scores (HIGH/MEDIUM/LOW) per step.",
  },
  {
    icon: <Package size={22} className="text-orange-500" />,
    title: "Verified Materials",
    desc: "Materials list with catalog numbers verified against Sigma-Aldrich, Thermo Fisher, and more.",
  },
  {
    icon: <DollarSign size={22} className="text-orange-500" />,
    title: "Realistic Budget",
    desc: "Itemized budget breakdown with real supplier pricing.",
  },
  {
    icon: <CalendarDays size={22} className="text-orange-500" />,
    title: "Phased Timeline",
    desc: "Week-by-week Gantt-style timeline with milestones and dependencies.",
  },
  {
    icon: <Brain size={22} className="text-orange-500" />,
    title: "Learning Loop",
    desc: "Scientist feedback is stored and injected into future plan generations, closing the loop.",
  },
];

const TECH = [
  "Python",
  "LangGraph",
  "FastAPI",
  "Next.js 16",
  "React 19",
  "Tailwind CSS",
  "Featherless.ai",
  "OpenAlex",
  "CrossRef",
  "Tavily",
  "SQLite",
];

const LOOP_STEPS = [
  { label: "Scientist enters hypothesis", icon: <PenLine size={18} /> },
  { label: "AI generates experiment plan", icon: <Cpu size={18} /> },
  { label: "Scientist reviews & corrects", icon: <Beaker size={18} /> },
  { label: "Feedback stored by domain", icon: <Package size={18} /> },
  { label: "Next similar plan is improved", icon: <Brain size={18} /> },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical size={22} className="text-orange-500" />
            <span className="font-bold text-lg text-gray-900 tracking-tight">
              Neucleus
            </span>
          </div>
          <Link
            href="/app"
            className="px-4 py-1.5 text-sm font-semibold border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition-colors"
          >
            Try It
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <motion.div
          initial="initial"
          animate="animate"
          variants={stagger}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <span className="inline-block px-3 py-1 text-xs font-semibold text-orange-600 bg-orange-50 rounded-full mb-6">
              AI-Powered Experiment Design
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6"
          >
            From Hypothesis to Experiment
            <span className="text-orange-500"> — Intelligently.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-lg text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            Neucleus is an AI-powered experiment plan generator. Describe your
            scientific question and get a complete protocol, materials list,
            budget, timeline, and validation criteria — grounded in real
            literature.
          </motion.p>

          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-base transition-colors shadow-lg shadow-orange-500/20"
            >
              Generate Your First Plan
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </motion.div>

        {/* Dashboard preview placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-1 shadow-xl shadow-gray-200/50">
            <div className="rounded-xl bg-white border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-gray-400 font-mono">
                  neucleus / overview
                </span>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1 flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl">
                  <svg width="80" height="80" className="-rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <motion.circle
                      cx="40" cy="40" r="32" fill="none" stroke="#10b981" strokeWidth="8"
                      strokeLinecap="round" strokeDasharray="201"
                      initial={{ strokeDashoffset: 201 }}
                      whileInView={{ strokeDashoffset: 54 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                    />
                  </svg>
                  <motion.span
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.2 }}
                    className="text-sm font-bold text-gray-900 mt-2"
                  >
                    73% Grounded
                  </motion.span>
                </div>
                <div className="col-span-2 space-y-3">
                  {["Parse Hypothesis", "Search Literature", "Generate Protocol", "Verify Materials"].map(
                    (step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.6 + i * 0.2 }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                          <span className="text-white text-xs">&#10003;</span>
                        </div>
                        <span className="text-sm text-gray-700">{step}</span>
                      </motion.div>
                    )
                  )}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 1.5 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center animate-pulse">
                      <span className="text-white text-xs font-bold">5</span>
                    </div>
                    <span className="text-sm text-orange-600 font-medium">
                      Generating Timeline...
                    </span>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            {...inView}
            className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4"
          >
            How It Works
          </motion.h2>
          <motion.p
            {...inView}
            className="text-gray-500 text-center mb-12 max-w-xl mx-auto"
          >
            Three steps from question to experiment plan.
          </motion.p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                num: "01",
                icon: <PenLine size={28} className="text-orange-500" />,
                title: "Describe",
                desc: "Enter your scientific hypothesis in natural language.",
              },
              {
                num: "02",
                icon: <Cpu size={28} className="text-orange-500" />,
                title: "Generate",
                desc: "Neucleus runs a 10-stage AI pipeline: parsing, literature search, novelty check, protocol generation, materials verification, budgeting, and more.",
              },
              {
                num: "03",
                icon: <RefreshCw size={28} className="text-orange-500" />,
                title: "Review & Improve",
                desc: "A scientist reviews the plan, corrects errors, and the system learns from that feedback for next time.",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white rounded-xl border border-gray-200 p-6 text-center"
              >
                <span className="text-xs font-bold text-orange-500 mb-3 block">
                  {step.num}
                </span>
                <div className="flex justify-center mb-4">{step.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            {...inView}
            className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4"
          >
            What You Get
          </motion.h2>
          <motion.p
            {...inView}
            className="text-gray-500 text-center mb-12 max-w-xl mx-auto"
          >
            A complete, grounded experiment plan — not a vague outline.
          </motion.p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="mb-3">{feat.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                  {feat.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Learning Loop ── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            {...inView}
            className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4"
          >
            The Learning Loop
          </motion.h2>
          <motion.p
            {...inView}
            className="text-gray-500 text-center mb-12 max-w-2xl mx-auto"
          >
            Every correction a scientist makes becomes a training signal. The
            next plan for a similar experiment type visibly reflects those
            corrections — without being explicitly re-prompted.
          </motion.p>

          <div className="max-w-sm mx-auto">
            {LOOP_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.15 }}
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ scale: 0.5 }}
                    whileInView={{ scale: [0.5, 1.1, 1] }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.15 + 0.1 }}
                    className="w-10 h-10 rounded-full bg-white border-2 border-orange-500 flex items-center justify-center text-orange-500 shrink-0"
                  >
                    {step.icon}
                  </motion.div>
                  <span className="text-sm font-medium text-gray-900">
                    {step.label}
                  </span>
                </div>
                {i < LOOP_STEPS.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.2, delay: i * 0.15 + 0.25 }}
                    className="flex justify-center ml-5 py-1"
                  >
                    <ArrowDown size={16} className="text-gray-300" />
                  </motion.div>
                )}
              </motion.div>
            ))}

            {/* Loop-back arrow */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-3 mt-3 ml-2"
            >
              <RotateCcw size={18} className="text-orange-500" />
              <span className="text-xs text-orange-600 font-medium">
                Loops back — each cycle improves the next
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            {...inView}
            className="text-xl font-bold text-gray-900 text-center mb-8"
          >
            Built With
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {TECH.map((t) => (
              <span
                key={t}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-mono rounded-full"
              >
                {t}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.h2
            {...inView}
            className="text-2xl md:text-3xl font-bold text-white mb-4"
          >
            Ready to try it?
          </motion.h2>
          <motion.p
            {...inView}
            className="text-gray-400 mb-8 max-w-md mx-auto"
          >
            Generate a complete experiment plan from a single hypothesis.
          </motion.p>
          <motion.div {...inView}>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-base transition-colors"
            >
              Launch Neucleus
              <ArrowRight size={18} />
            </Link>
          </motion.div>
          <p className="mt-10 text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Neucleus
          </p>
        </div>
      </section>
    </div>
  );
}
