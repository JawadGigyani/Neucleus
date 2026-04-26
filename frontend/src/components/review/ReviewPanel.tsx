"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CompletePlan } from "@/types/plan";
import { Card } from "../ui/Card";
import { StarRating } from "./StarRating";
import { SectionReview } from "./SectionReview";
import {
  CheckCircle2,
  Beaker,
  Package,
  DollarSign,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";

type CorrectionEntry = {
  field_path: string;
  original_value: string;
  corrected_value: string;
  reason: string;
};
type SectionState = {
  rating: number;
  annotations: string;
  corrections: CorrectionEntry[];
};
type ReviewData = Record<string, SectionState>;

const SECTIONS = [
  { id: "protocol", label: "Protocol", icon: <Beaker size={16} /> },
  { id: "materials", label: "Materials", icon: <Package size={16} /> },
  { id: "budget", label: "Budget", icon: <DollarSign size={16} /> },
  { id: "timeline", label: "Timeline", icon: <CalendarDays size={16} /> },
  { id: "validation", label: "Validation", icon: <ShieldCheck size={16} /> },
];

export function ReviewPanel({
  plan,
  reviewData,
  overallRating,
  setOverallRating,
  updateSection,
  addCorrection,
  updateCorrection,
  removeCorrection,
  onSubmit,
  submitting,
  submitted,
  feedbackError,
}: {
  plan: CompletePlan;
  reviewData: ReviewData;
  overallRating: number;
  setOverallRating: (v: number) => void;
  updateSection: (section: string, field: string, value: unknown) => void;
  addCorrection: (section: string) => void;
  updateCorrection: (section: string, idx: number, field: string, value: string) => void;
  removeCorrection: (section: string, idx: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitted: boolean;
  feedbackError: string;
}) {
  const [activeSection, setActiveSection] = useState("protocol");

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 size={40} />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Feedback Submitted
          </h2>
          <p className="text-gray-500">
            Your corrections have been stored. The next plan for a similar
            experiment will incorporate your feedback.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card>
        {/* Overall Rating */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Scientist Review
            </h2>
            <p className="text-sm text-gray-500">
              Rate and correct this experiment plan. Your feedback improves future generations.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500 block mb-1">Overall Rating</span>
            <StarRating
              value={overallRating}
              onChange={setOverallRating}
              disabled={submitting}
              size="text-2xl"
            />
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeSection === s.id
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {s.icon}
              {s.label}
              {reviewData[s.id]?.rating > 0 && (
                <span className="ml-1 text-amber-400 text-xs">
                  {"★".repeat(reviewData[s.id].rating)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Active Section Review */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            <SectionReview
              section={activeSection}
              data={reviewData[activeSection]}
              onUpdate={(f, v) => updateSection(activeSection, f, v)}
              onAddCorrection={() => addCorrection(activeSection)}
              onUpdateCorrection={(i, f, v) => updateCorrection(activeSection, i, f, v)}
              onRemoveCorrection={(i) => removeCorrection(activeSection, i)}
              disabled={submitting}
            />
          </motion.div>
        </AnimatePresence>

        {/* Submit */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
          {feedbackError && (
            <p className="text-sm text-red-600">{feedbackError}</p>
          )}
          <div className="flex-1" />
          <button
            onClick={onSubmit}
            disabled={submitting || overallRating === 0}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </Card>
    </div>
  );
}
