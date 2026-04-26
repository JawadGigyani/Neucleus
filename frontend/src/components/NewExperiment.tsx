"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function NewExperiment({
  hypothesis,
  setHypothesis,
  onGenerate,
  isGenerating,
  error,
  samples,
}: {
  hypothesis: string;
  setHypothesis: (v: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  error: string;
  samples: { label: string; text: string }[];
}) {
  return (
    <div className="flex items-center justify-center min-h-full p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-gray-900 mb-3"
          >
            What&apos;s your hypothesis?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500"
          >
            Describe your scientific question and Neucleus will generate a
            complete experiment plan.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <textarea
            className="w-full min-h-[160px] p-4 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-y text-sm leading-relaxed transition-shadow"
            placeholder="e.g. Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30%..."
            value={hypothesis}
            onChange={(e) => setHypothesis(e.target.value)}
            disabled={isGenerating}
          />

          <div className="flex flex-wrap gap-2 mt-4">
            {samples.map((sample, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                onClick={() => setHypothesis(sample.text)}
                disabled={isGenerating}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-600 rounded-full transition-colors disabled:opacity-50"
              >
                {sample.label}
              </motion.button>
            ))}
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onGenerate}
            disabled={isGenerating || !hypothesis.trim()}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={18} />
            {isGenerating ? "Generating..." : "Generate Experiment Plan"}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
