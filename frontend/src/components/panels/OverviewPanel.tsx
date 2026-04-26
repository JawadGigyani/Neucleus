"use client";

import { motion } from "framer-motion";
import type { CompletePlan } from "@/types/plan";
import { Card } from "../ui/Card";
import { ProgressRing } from "../ui/ProgressRing";
import { Badge } from "../ui/Badge";
import { Quote, ExternalLink } from "lucide-react";

function isValidUrl(url: string | null | undefined): boolean {
  return !!url && (url.startsWith("http://") || url.startsWith("https://"));
}

function noveltyVariant(signal: string) {
  if (signal === "NOT_FOUND") return { variant: "success" as const, label: "Novel - No prior work found" };
  if (signal === "SIMILAR_WORK_EXISTS") return { variant: "warning" as const, label: "Partially Novel - Similar work exists" };
  return { variant: "danger" as const, label: "Not Novel - Exact match found" };
}

export function OverviewPanel({ plan }: { plan: CompletePlan }) {
  const g = plan.metadata.grounding_summary;
  const n = plan.metadata.novelty;
  const nv = noveltyVariant(n.novelty_signal);
  const feedbackCount = plan.metadata.feedback_applied.filter(Boolean).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Learning Applied Banner */}
      {feedbackCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-2"
        >
          <span className="text-lg">&#9733;</span>
          <span className="font-medium text-sm">
            Learning Applied: This plan incorporates corrections from {feedbackCount} prior expert review(s)
          </span>
        </motion.div>
      )}

      {/* Two-column grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Grounding Score */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Grounding Score
          </h3>
          <div className="flex justify-center mb-6">
            <ProgressRing value={g.overall_grounding_pct} size={140} strokeWidth={12} />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Protocol", value: g.protocol_grounding_pct },
              { label: "Materials", value: g.materials_verified_pct },
              { label: "Budget", value: g.budget_verified_pct },
            ].map((item, i) => (
              <div key={i}>
                <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(item.value, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                    className={`h-full rounded-full ${
                      item.value > 70 ? "bg-emerald-500" : item.value > 40 ? "bg-amber-500" : "bg-red-500"
                    }`}
                  />
                </div>
                <div className="text-sm font-semibold text-gray-900 mt-1">
                  {item.value.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-400 text-center">
            Generated in {plan.metadata.generation_time_seconds.toFixed(0)}s
          </p>
        </Card>

        {/* Novelty Assessment */}
        <Card delay={0.1}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Novelty Assessment
          </h3>
          <div className="mb-4">
            <Badge variant={nv.variant} className="text-sm px-3 py-1">
              {nv.label}
            </Badge>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {n.references.map((ref, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  {isValidUrl(ref.url) ? (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-orange-600 hover:underline flex items-start gap-1"
                    >
                      {ref.title}
                      <ExternalLink size={12} className="shrink-0 mt-0.5" />
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-gray-900">{ref.title}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {ref.authors && `${ref.authors} `}
                  {ref.year && `(${ref.year}) `}
                  {ref.journal && `- ${ref.journal}`}
                </p>
                <p className="text-xs text-gray-600 mt-1.5">{ref.relevance}</p>
                <Badge variant="neutral" className="mt-2">{ref.source}</Badge>
              </div>
            ))}
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
              View reasoning chain
            </summary>
            <p className="mt-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              {n.reasoning}
            </p>
          </details>
        </Card>
      </div>

      {/* Hypothesis Quote */}
      <Card delay={0.2}>
        <div className="flex items-start gap-3">
          <Quote size={20} className="text-orange-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Hypothesis</span>
            <p className="text-sm text-gray-700 mt-1 leading-relaxed">
              {plan.metadata.hypothesis}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
