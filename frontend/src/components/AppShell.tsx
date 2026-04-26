"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type {
  CompletePlan,
  ProgressEvent,
  FeedbackSubmission,
  SectionReview as SectionReviewType,
} from "@/types/plan";
import {
  generatePlan,
  streamProgress,
  getResult,
  submitFeedback,
  SAMPLE_HYPOTHESES,
} from "@/lib/api";
import { Sidebar, type PanelId } from "./Sidebar";
import { TopBar } from "./TopBar";
import { NewExperiment } from "./NewExperiment";
import { PipelineProgress } from "./PipelineProgress";
import { OverviewPanel } from "./panels/OverviewPanel";
import { ProtocolPanel } from "./panels/ProtocolPanel";
import { MaterialsPanel } from "./panels/MaterialsPanel";
import { BudgetPanel } from "./panels/BudgetPanel";
import { TimelinePanel } from "./panels/TimelinePanel";
import { ValidationPanel } from "./panels/ValidationPanel";
import { ReviewPanel } from "./review/ReviewPanel";

const STAGES = [
  "parse", "feedback_retrieval", "retrieve", "qc", "protocol",
  "verify_protocol", "materials", "verify_materials", "timeline", "post_process",
];

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

const REVIEW_SECTIONS = ["protocol", "materials", "budget", "timeline", "validation"] as const;
type CorrectionEntry = { field_path: string; original_value: string; corrected_value: string; reason: string };
type SectionState = { rating: number; annotations: string; corrections: CorrectionEntry[] };
type ReviewData = Record<string, SectionState>;

const emptyReview = (): ReviewData =>
  Object.fromEntries(REVIEW_SECTIONS.map((s) => [s, { rating: 0, annotations: "", corrections: [] }]));

export function AppShell() {
  const [activePanel, setActivePanel] = useState<PanelId>("new");
  const [hypothesis, setHypothesis] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent[]>([]);
  const [currentStage, setCurrentStage] = useState("");
  const [plan, setPlan] = useState<CompletePlan | null>(null);
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState("");

  const [overallRating, setOverallRating] = useState(0);
  const [reviewData, setReviewData] = useState<ReviewData>(emptyReview());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const updateSectionReview = (section: string, field: string, value: unknown) => {
    setReviewData((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const addCorrectionTo = (section: string) => {
    setReviewData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        corrections: [
          ...prev[section].corrections,
          { field_path: "", original_value: "", corrected_value: "", reason: "" },
        ],
      },
    }));
  };

  const updateCorrectionIn = (section: string, idx: number, field: string, value: string) => {
    setReviewData((prev) => {
      const corrs = [...prev[section].corrections];
      corrs[idx] = { ...corrs[idx], [field]: value };
      return { ...prev, [section]: { ...prev[section], corrections: corrs } };
    });
  };

  const removeCorrectionFrom = (section: string, idx: number) => {
    setReviewData((prev) => {
      const corrs = prev[section].corrections.filter((_, i) => i !== idx);
      return { ...prev, [section]: { ...prev[section], corrections: corrs } };
    });
  };

  const handleSubmitReview = async () => {
    if (!plan || overallRating === 0) {
      setFeedbackError("Please provide an overall rating.");
      return;
    }
    setSubmitting(true);
    setFeedbackError("");

    const sectionReviews: SectionReviewType[] = REVIEW_SECTIONS
      .filter((s) => reviewData[s].rating > 0 || reviewData[s].annotations || reviewData[s].corrections.length > 0)
      .map((s) => ({
        section: s,
        rating: reviewData[s].rating || 3,
        corrections: reviewData[s].corrections.filter((c) => c.field_path && c.corrected_value),
        annotations: reviewData[s].annotations || null,
      }));

    const payload: FeedbackSubmission = {
      plan_id: jobId,
      domain: plan.metadata.parsed.domain,
      experiment_type: plan.metadata.parsed.intervention || plan.metadata.parsed.domain,
      key_terms: plan.metadata.parsed.key_terms,
      overall_rating: overallRating,
      section_reviews: sectionReviews,
    };

    try {
      await submitFeedback(payload);
      setSubmitted(true);
    } catch (e) {
      setFeedbackError(e instanceof Error ? e.message : "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!hypothesis.trim()) return;

    setIsGenerating(true);
    setProgress([]);
    setCurrentStage(STAGES[0]);
    setPlan(null);
    setError("");
    setJobId("");
    setSubmitted(false);
    setOverallRating(0);
    setReviewData(emptyReview());
    setActivePanel("progress");

    try {
      const id = await generatePlan(hypothesis);
      setJobId(id);

      streamProgress(
        id,
        (event) => {
          setProgress((prev) => [...prev, event]);
          setCurrentStage(event.stage);
        },
        async () => {
          try {
            const result = await getResult(id);
            setPlan(result);
            setActivePanel("overview");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load result");
          }
          setIsGenerating(false);
        },
        (errMsg) => {
          setError(errMsg);
          setIsGenerating(false);
          setActivePanel("new");
        }
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start generation");
      setIsGenerating(false);
      setActivePanel("new");
    }
  }, [hypothesis]);

  const getStageStatus = (stage: string) => {
    const idx = STAGES.indexOf(stage);
    const currentIdx = STAGES.indexOf(currentStage);
    if (currentStage === "complete") return "completed" as const;
    if (idx < currentIdx) return "completed" as const;
    if (idx === currentIdx) return "active" as const;
    return "pending" as const;
  };

  const handleNavigate = (panel: PanelId) => {
    if (panel === "new") {
      if (isGenerating) return;
    }
    setActivePanel(panel);
  };

  const renderPanel = () => {
    switch (activePanel) {
      case "new":
        return (
          <NewExperiment
            hypothesis={hypothesis}
            setHypothesis={setHypothesis}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            error={error}
            samples={SAMPLE_HYPOTHESES}
          />
        );
      case "progress":
        return (
          <PipelineProgress
            stages={STAGES}
            stageLabels={STAGE_LABELS}
            getStageStatus={getStageStatus}
            currentStage={currentStage}
            isComplete={!isGenerating && plan !== null}
          />
        );
      case "overview":
        return plan ? <OverviewPanel plan={plan} /> : null;
      case "protocol":
        return plan ? <ProtocolPanel plan={plan} /> : null;
      case "materials":
        return plan ? <MaterialsPanel materials={plan.materials} /> : null;
      case "budget":
        return plan ? <BudgetPanel budget={plan.budget} /> : null;
      case "timeline":
        return plan ? <TimelinePanel timeline={plan.timeline} /> : null;
      case "validation":
        return plan ? <ValidationPanel validation={plan.validation} /> : null;
      case "review":
        return plan ? (
          <ReviewPanel
            plan={plan}
            reviewData={reviewData}
            overallRating={overallRating}
            setOverallRating={setOverallRating}
            updateSection={updateSectionReview}
            addCorrection={addCorrectionTo}
            updateCorrection={updateCorrectionIn}
            removeCorrection={removeCorrectionFrom}
            onSubmit={handleSubmitReview}
            submitting={submitting}
            submitted={submitted}
            feedbackError={feedbackError}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      <Sidebar
        activePanel={activePanel}
        onNavigate={handleNavigate}
        hasPlan={!!plan}
        isGenerating={isGenerating}
        currentStage={currentStage}
        submitted={submitted}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <div
        className="flex-1 flex flex-col h-full min-h-screen transition-all duration-200"
        style={{ marginLeft: `var(--sidebar-w)` }}
      >
        <style>{`
          :root { --sidebar-w: 0px; }
          @media (min-width: 768px) { :root { --sidebar-w: ${sidebarCollapsed ? "64px" : "256px"}; } }
        `}</style>
        <TopBar
          activePanel={activePanel}
          isGenerating={isGenerating}
          currentStage={currentStage}
          submitted={submitted}
          hasPlan={!!plan}
          onToggleReview={() => handleNavigate(activePanel === "review" ? "overview" : "review")}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              {renderPanel()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
