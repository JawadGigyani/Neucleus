import type { CompletePlan, ProgressEvent, FeedbackSubmission } from "@/types/plan";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function generatePlan(hypothesis: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hypothesis }),
  });

  if (!res.ok) {
    throw new Error(`Generate failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data.job_id;
}

export function streamProgress(
  jobId: string,
  onEvent: (event: ProgressEvent) => void,
  onComplete: () => void,
  onError: (error: string) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/api/stream/${jobId}`);

  eventSource.addEventListener("progress", (e) => {
    try {
      const data = JSON.parse(e.data.replace(/'/g, '"'));
      onEvent(data);

      if (data.status === "completed" || data.status === "error") {
        eventSource.close();
        if (data.status === "completed") {
          onComplete();
        } else {
          onError(data.message);
        }
      }
    } catch {
      // Ignore parse errors on individual events
    }
  });

  eventSource.onerror = () => {
    eventSource.close();
    onError("Connection to server lost");
  };

  return () => eventSource.close();
}

export async function getResult(jobId: string): Promise<CompletePlan> {
  const res = await fetch(`${API_BASE}/api/result/${jobId}`);

  if (res.status === 202) {
    throw new Error("Plan still generating");
  }

  if (!res.ok) {
    throw new Error(`Failed to get result: ${res.statusText}`);
  }

  return res.json();
}

export async function submitFeedback(feedback: FeedbackSubmission): Promise<string> {
  const res = await fetch(`${API_BASE}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feedback),
  });

  if (!res.ok) {
    throw new Error(`Feedback submission failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data.feedback_id;
}

export const SAMPLE_HYPOTHESES = [
  {
    label: "Diagnostics - CRP Biosensor",
    text: "A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing.",
  },
  {
    label: "Gut Health - Probiotic Mice",
    text: "Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls, measured by FITC-dextran assay, due to upregulation of tight junction proteins claudin-1 and occludin.",
  },
  {
    label: "Cell Biology - Cryoprotectant",
    text: "Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol, due to trehalose's superior membrane stabilization at low temperatures.",
  },
  {
    label: "Climate - CO2 Fixation",
    text: "Introducing Sporomusa ovata into a bioelectrochemical system at a cathode potential of -400mV vs SHE will fix CO2 into acetate at a rate of at least 150 mmol/L/day, outperforming current biocatalytic carbon capture benchmarks by at least 20%.",
  },
];
