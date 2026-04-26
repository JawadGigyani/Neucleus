"use client";

import { StarRating } from "./StarRating";
import { Plus, Trash2 } from "lucide-react";

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

const SECTION_LABELS: Record<string, string> = {
  protocol: "Protocol",
  materials: "Materials & Supply Chain",
  budget: "Budget",
  timeline: "Timeline",
  validation: "Validation Criteria",
};

export function SectionReview({
  section,
  data,
  onUpdate,
  onAddCorrection,
  onUpdateCorrection,
  onRemoveCorrection,
  disabled,
}: {
  section: string;
  data: SectionState;
  onUpdate: (field: string, value: unknown) => void;
  onAddCorrection: () => void;
  onUpdateCorrection: (idx: number, field: string, value: string) => void;
  onRemoveCorrection: (idx: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-5">
      {/* Section Rating */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Rate: {SECTION_LABELS[section]}
        </label>
        <StarRating
          value={data.rating}
          onChange={(v) => onUpdate("rating", v)}
          disabled={disabled}
          size="text-xl"
        />
      </div>

      {/* Comments */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Comments
        </label>
        <textarea
          className="w-full p-3 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-y bg-white"
          rows={3}
          placeholder={`Any feedback on the ${SECTION_LABELS[section]?.toLowerCase()}?`}
          value={data.annotations}
          onChange={(e) => onUpdate("annotations", e.target.value)}
          disabled={disabled}
        />
      </div>

      {/* Corrections */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            Corrections
          </label>
          <button
            type="button"
            onClick={onAddCorrection}
            disabled={disabled}
            className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50"
          >
            <Plus size={14} />
            Add Correction
          </button>
        </div>

        {data.corrections.length === 0 && (
          <p className="text-xs text-gray-400 italic">
            No corrections yet. Click &quot;Add Correction&quot; to flag an error.
          </p>
        )}

        <div className="space-y-3">
          {data.corrections.map((corr, ci) => (
            <div
              key={ci}
              className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">
                  Correction #{ci + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveCorrection(ci)}
                  disabled={disabled}
                  className="text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <input
                className="w-full p-2 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 bg-white focus:ring-2 focus:ring-orange-500"
                placeholder="Field path (e.g. steps[3].description)"
                value={corr.field_path}
                onChange={(e) => onUpdateCorrection(ci, "field_path", e.target.value)}
                disabled={disabled}
              />
              <input
                className="w-full p-2 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 bg-white focus:ring-2 focus:ring-orange-500"
                placeholder="Original value"
                value={corr.original_value}
                onChange={(e) => onUpdateCorrection(ci, "original_value", e.target.value)}
                disabled={disabled}
              />
              <input
                className="w-full p-2 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 bg-white focus:ring-2 focus:ring-orange-500"
                placeholder="Corrected value"
                value={corr.corrected_value}
                onChange={(e) => onUpdateCorrection(ci, "corrected_value", e.target.value)}
                disabled={disabled}
              />
              <input
                className="w-full p-2 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 bg-white focus:ring-2 focus:ring-orange-500"
                placeholder="Reason for correction"
                value={corr.reason}
                onChange={(e) => onUpdateCorrection(ci, "reason", e.target.value)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
