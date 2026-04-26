"use client";

import Link from "next/link";
import { Loader2, CheckCircle2, Menu } from "lucide-react";
import type { PanelId } from "./Sidebar";

const PANEL_TITLES: Record<string, string> = {
  new: "New Experiment",
  progress: "Generating Plan",
  overview: "Overview",
  protocol: "Protocol",
  materials: "Materials & Supply Chain",
  budget: "Budget Breakdown",
  timeline: "Timeline",
  validation: "Validation Criteria",
  review: "Scientist Review",
};

const STAGE_LABELS: Record<string, string> = {
  parse: "Parsing Hypothesis",
  feedback_retrieval: "Checking Prior Feedback",
  retrieve: "Searching Literature",
  qc: "Analyzing Novelty",
  protocol: "Generating Protocol",
  verify_protocol: "Verifying Protocol",
  materials: "Generating Materials",
  verify_materials: "Verifying Catalog Numbers",
  timeline: "Creating Timeline",
  post_process: "Finalizing Plan",
  complete: "Complete",
};

export function TopBar({
  activePanel,
  isGenerating,
  currentStage,
  submitted,
  hasPlan,
  onToggleReview,
  onMenuClick,
}: {
  activePanel: PanelId;
  isGenerating: boolean;
  currentStage: string;
  submitted: boolean;
  hasPlan: boolean;
  onToggleReview: () => void;
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-14 flex items-center px-4 md:px-6 shrink-0">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="md:hidden mr-3 text-gray-600 hover:text-gray-900"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm min-w-0">
        <Link href="/" className="text-gray-400 font-medium hover:text-orange-500 transition-colors">Neucleus</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-semibold truncate">
          {PANEL_TITLES[activePanel] || ""}
        </span>
      </div>

      {/* Center: generation status */}
      {isGenerating && (
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin text-orange-500" />
            <span>{STAGE_LABELS[currentStage] || "Processing..."}...</span>
          </div>
        </div>
      )}
      {!isGenerating && <div className="flex-1" />}

      {/* Right: review toggle */}
      {hasPlan && !isGenerating && (
        <div className="shrink-0">
          {submitted ? (
            <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle2 size={16} />
              Review Submitted
            </div>
          ) : (
            <button
              onClick={onToggleReview}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                activePanel === "review"
                  ? "bg-orange-500 text-white"
                  : "border border-orange-500 text-orange-500 hover:bg-orange-50"
              }`}
            >
              {activePanel === "review" ? "Reviewing..." : "Start Review"}
            </button>
          )}
        </div>
      )}
    </header>
  );
}
