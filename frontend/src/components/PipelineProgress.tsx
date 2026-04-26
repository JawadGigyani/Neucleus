"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Timer } from "lucide-react";

function StepIcon({ status, index }: { status: "completed" | "active" | "pending"; index: number }) {
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
        status === "completed"
          ? "bg-emerald-500 text-white"
          : status === "active"
          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
          : "bg-gray-100 text-gray-400"
      }`}
    >
      <AnimatePresence mode="wait">
        {status === "completed" ? (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Check size={16} />
          </motion.div>
        ) : status === "active" ? (
          <motion.div
            key="spinner"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Loader2 size={16} className="animate-spin" />
          </motion.div>
        ) : (
          <motion.span
            key="number"
            className="text-xs font-bold"
          >
            {index + 1}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PipelineProgress({
  stages,
  stageLabels,
  getStageStatus,
  currentStage,
  isComplete,
}: {
  stages: string[];
  stageLabels: Record<string, string>;
  getStageStatus: (stage: string) => "completed" | "active" | "pending";
  currentStage: string;
  isComplete: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isComplete) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isComplete]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="flex items-center justify-center min-h-full p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Building your experiment plan
          </h2>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Timer size={15} className="text-orange-500" />
            <span className="font-mono tabular-nums">{mm}:{ss}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8">
          <div className="space-y-0">
            {stages.map((stage, i) => {
              const status = getStageStatus(stage);
              return (
                <div key={stage} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <StepIcon status={status} index={i} />
                    </motion.div>
                    {i < stages.length - 1 && (
                      <div
                        className={`w-0.5 h-8 transition-colors duration-500 ${
                          status === "completed" ? "bg-emerald-500" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>

                  <div className="pt-2 pb-4">
                    <span
                      className={`text-sm transition-colors duration-300 ${
                        status === "completed"
                          ? "text-gray-900 font-medium"
                          : status === "active"
                          ? "text-orange-600 font-semibold"
                          : "text-gray-400"
                      }`}
                    >
                      {stageLabels[stage] || stage}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {currentStage && currentStage !== "complete" && (
            <motion.p
              key={currentStage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-center text-sm text-gray-400 animate-pulse"
            >
              {stageLabels[currentStage] || currentStage}...
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
