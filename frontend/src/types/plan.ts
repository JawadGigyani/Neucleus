export interface ParsedHypothesis {
  intervention: string | null;
  outcome: string | null;
  mechanism: string | null;
  model_system: string | null;
  control: string | null;
  threshold: string | null;
  key_terms: string[];
  domain: string;
}

export interface NoveltyReference {
  title: string;
  authors: string | null;
  year: number | null;
  journal: string | null;
  url: string;
  relevance: string;
  source: string;
}

export interface NoveltyClassification {
  novelty_signal: "NOT_FOUND" | "SIMILAR_WORK_EXISTS" | "EXACT_MATCH_FOUND";
  references: NoveltyReference[];
  reasoning: string;
}

export interface ProtocolStep {
  step_number: number;
  title: string;
  description: string;
  duration: string;
  critical_notes: string | string[] | null;
  safety_warnings: string | string[] | null;
  source: string;
}

export interface GroundingScore {
  step_number: number;
  grounding_score: "HIGH" | "MEDIUM" | "LOW";
  matched_source: string | null;
  unverified_claims: string[];
}

export interface Protocol {
  title: string;
  objective: string;
  overview: string;
  steps: ProtocolStep[];
  estimated_total_time: string;
  safety_considerations: string[];
  protocol_references: { title: string; url: string; note: string | null }[];
  uncertainties: string[];
}

export interface Material {
  category: string;
  name: string;
  catalog_number: string;
  supplier: string;
  quantity: string;
  unit_cost: string;
  total_cost: string;
  cost_confidence: "verified" | "estimated";
  source_url: string | null;
  alternatives: string[];
  notes: string | null;
  verification_status: "VERIFIED" | "PARTIALLY_VERIFIED" | "UNVERIFIED" | "CORRECTED";
  verification_url: string | null;
}

export interface Equipment {
  name: string;
  model: string | null;
  supplier: string | null;
  estimated_cost: string;
  notes: string | null;
}

export interface BudgetSummary {
  materials_and_reagents: string;
  equipment: string;
  consumables: string;
  personnel_2_researchers_3_months: string;
  overhead_15pct: string;
  contingency_10pct: string;
  total_estimate: string;
  verified_percentage: number;
}

export interface Budget {
  line_items: { category: string; items: string[]; subtotal: string }[];
  summary: BudgetSummary;
}

export interface Phase {
  phase: number;
  name: string;
  duration: string;
  start_week: number;
  end_week: number;
  tasks: string[];
  dependencies: number[];
  deliverables: string[];
  milestone: string;
  risks: string[];
}

export interface Timeline {
  total_duration: string;
  phases: Phase[];
}

export interface Validation {
  primary_endpoint: string;
  success_criteria: string[];
  failure_indicators: string[];
  statistical_analysis: string;
  replication_plan: string;
  data_analysis_plan: string;
  go_no_go_criteria: string;
}

export interface GroundingSummary {
  protocol_grounding_pct: number;
  materials_verified_pct: number;
  budget_verified_pct: number;
  overall_grounding_pct: number;
}

export interface PlanMetadata {
  hypothesis: string;
  parsed: ParsedHypothesis;
  novelty: NoveltyClassification;
  generated_at: string;
  generation_time_seconds: number;
  grounding_summary: GroundingSummary;
  models_used: Record<string, string>;
  feedback_applied: string[];
}

export interface CompletePlan {
  metadata: PlanMetadata;
  protocol: Protocol | null;
  protocol_grounding: GroundingScore[];
  materials: Material[];
  equipment: Equipment[];
  budget: Budget | null;
  timeline: Timeline | null;
  validation: Validation | null;
}

export interface ProgressEvent {
  stage: string;
  status: "pending" | "in_progress" | "completed" | "error";
  message: string;
  timestamp: number;
  stage_index?: number;
  total_stages?: number;
}

export interface SectionReview {
  section: "protocol" | "materials" | "budget" | "timeline" | "validation";
  rating: number;
  corrections: {
    field_path: string;
    original_value: string;
    corrected_value: string;
    reason: string;
  }[];
  annotations: string | null;
}

export interface FeedbackSubmission {
  plan_id: string;
  domain: string;
  experiment_type: string;
  key_terms: string[];
  overall_rating: number;
  section_reviews: SectionReview[];
}
