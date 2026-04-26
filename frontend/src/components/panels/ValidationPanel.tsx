"use client";

import { motion } from "framer-motion";
import type { Validation } from "@/types/plan";
import { Card } from "../ui/Card";
import { Target, Check, X } from "lucide-react";

export function ValidationPanel({ validation }: { validation: Validation | null }) {
  if (!validation) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-gray-400">
        No validation data available.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Primary Endpoint */}
      <Card>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Target size={16} className="text-blue-600" />
            <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
              Primary Endpoint
            </span>
          </div>
          <p className="text-sm text-blue-900 leading-relaxed">
            {validation.primary_endpoint}
          </p>
        </div>
      </Card>

      {/* Success / Failure Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card delay={0.1}>
          <h3 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-1.5">
            <Check size={16} />
            Success Criteria
          </h3>
          <ul className="space-y-2">
            {validation.success_criteria.map((c, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.04 }}
                className="text-sm text-gray-700 flex items-start gap-2"
              >
                <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                {c}
              </motion.li>
            ))}
          </ul>
        </Card>

        <Card delay={0.15}>
          <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-1.5">
            <X size={16} />
            Failure Indicators
          </h3>
          <ul className="space-y-2">
            {validation.failure_indicators.map((f, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                className="text-sm text-gray-700 flex items-start gap-2"
              >
                <X size={14} className="text-red-500 shrink-0 mt-0.5" />
                {f}
              </motion.li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Statistical Analysis */}
      <Card delay={0.2}>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Statistical Analysis
        </h3>
        <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
          {validation.statistical_analysis}
        </div>
      </Card>
    </div>
  );
}
