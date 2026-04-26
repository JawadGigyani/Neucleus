"use client";

import { motion } from "framer-motion";
import type { CompletePlan } from "@/types/plan";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { AlertTriangle, Info } from "lucide-react";
import { Tooltip } from "../ui/Tooltip";

const GROUNDING_TOOLTIPS: Record<string, string> = {
  HIGH: "This step is well-supported by published literature and verified sources.",
  MEDIUM: "This step has partial literature support. Some claims may need additional verification.",
  LOW: "This step has limited or no literature support. Claims are largely unverified and should be reviewed carefully.",
};

export function ProtocolPanel({ plan }: { plan: CompletePlan }) {
  if (!plan.protocol) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-gray-400">
        No protocol data available.
      </div>
    );
  }

  const { title, overview, steps } = plan.protocol;
  const groundingMap = new Map(
    plan.protocol_grounding.map((g) => [g.step_number, g])
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-6">{overview}</p>

        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200" />

          <div className="space-y-6">
            {steps.map((step, i) => {
              const grounding = groundingMap.get(step.step_number);
              const score = grounding?.grounding_score || "MEDIUM";
              const scoreVariant =
                score === "HIGH" ? "success" : score === "MEDIUM" ? "warning" : "danger";
              const circleColor =
                score === "HIGH"
                  ? "bg-emerald-500 text-white"
                  : score === "MEDIUM"
                  ? "bg-amber-500 text-white"
                  : "bg-red-100 text-red-600 border-2 border-red-300";

              return (
                <motion.div
                  key={step.step_number}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative flex items-start gap-4 pl-0"
                >
                  {/* Node */}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${circleColor}`}
                  >
                    {step.step_number}
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 border rounded-lg p-4 ${
                      score === "LOW" ? "border-red-200 bg-red-50/50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {step.title}
                      </h3>
                      <Badge variant="neutral">{step.duration}</Badge>
                      <Tooltip text={GROUNDING_TOOLTIPS[score] || ""}>
                        <Badge variant={scoreVariant}>{score}</Badge>
                      </Tooltip>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">
                      {step.description}
                    </p>

                    {step.critical_notes && (
                      <div className="mt-3 flex items-start gap-2 bg-blue-50 text-blue-700 p-3 rounded-lg text-xs">
                        <Info size={14} className="shrink-0 mt-0.5" />
                        <span>
                          {Array.isArray(step.critical_notes)
                            ? step.critical_notes.join("; ")
                            : step.critical_notes}
                        </span>
                      </div>
                    )}

                    {step.safety_warnings && (
                      <div className="mt-2 flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-xs">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <span>
                          {Array.isArray(step.safety_warnings)
                            ? step.safety_warnings.join("; ")
                            : step.safety_warnings}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
