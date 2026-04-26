"use client";

import Link from "next/link";
import {
  FlaskConical,
  LayoutDashboard,
  Beaker,
  Package,
  DollarSign,
  CalendarDays,
  ShieldCheck,
  ClipboardPen,
  Plus,
  Loader2,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export type PanelId =
  | "new"
  | "progress"
  | "overview"
  | "protocol"
  | "materials"
  | "budget"
  | "timeline"
  | "validation"
  | "review";

const NAV_ITEMS: { id: PanelId; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={18} /> },
  { id: "protocol", label: "Protocol", icon: <Beaker size={18} /> },
  { id: "materials", label: "Materials", icon: <Package size={18} /> },
  { id: "budget", label: "Budget", icon: <DollarSign size={18} /> },
  { id: "timeline", label: "Timeline", icon: <CalendarDays size={18} /> },
  { id: "validation", label: "Validation", icon: <ShieldCheck size={18} /> },
];

const REVIEW_ITEM = {
  id: "review" as PanelId,
  label: "Scientist Review",
  icon: <ClipboardPen size={18} />,
};

const PIPELINE_STAGES = [
  "parse", "feedback_retrieval", "retrieve", "qc", "protocol",
  "verify_protocol", "materials", "verify_materials", "timeline", "post_process",
];

export function Sidebar({
  activePanel,
  onNavigate,
  hasPlan,
  isGenerating,
  currentStage,
  submitted,
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapse,
}: {
  activePanel: PanelId;
  onNavigate: (panel: PanelId) => void;
  hasPlan: boolean;
  isGenerating: boolean;
  currentStage: string;
  submitted: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const stageIdx = PIPELINE_STAGES.indexOf(currentStage);
  const progressPct = isGenerating && stageIdx >= 0
    ? Math.round(((stageIdx + 1) / PIPELINE_STAGES.length) * 100)
    : 0;

  const handleNav = (panel: PanelId) => {
    onNavigate(panel);
    onCloseMobile();
  };

  const w = collapsed ? "w-16" : "w-64";

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 ${w} bg-gray-900 flex flex-col z-50 transition-all duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center justify-between ${collapsed ? "px-3 py-5" : "px-5 py-5"}`}>
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity overflow-hidden">
            <FlaskConical size={24} className="text-orange-500 shrink-0" />
            {!collapsed && (
              <span className="text-white font-bold text-xl tracking-tight whitespace-nowrap">
                Neucleus
              </span>
            )}
          </Link>
          <button
            onClick={onCloseMobile}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* New Experiment Button */}
        <div className={collapsed ? "px-2 mb-4" : "px-4 mb-4"}>
          <button
            onClick={() => handleNav("new")}
            className={`w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm transition-colors ${
              collapsed ? "py-2.5 px-0" : "py-2.5"
            }`}
            title="New Experiment"
          >
            <Plus size={16} />
            {!collapsed && "New Experiment"}
          </button>
        </div>

        {/* Nav Items */}
        <nav className={`flex-1 ${collapsed ? "px-2" : "px-3"} space-y-0.5 overflow-y-auto`}>
          {hasPlan && (
            <>
              {NAV_ITEMS.map((item) => {
                const isActive = activePanel === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 ${collapsed ? "justify-center px-0" : "px-3"} py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                    style={isActive ? { borderLeft: "3px solid #f97316" } : {}}
                  >
                    {item.icon}
                    {!collapsed && item.label}
                  </button>
                );
              })}

              <div className="my-3 border-t border-gray-700" />

              <button
                onClick={() => handleNav(REVIEW_ITEM.id)}
                title={collapsed ? (submitted ? "Review Submitted" : REVIEW_ITEM.label) : undefined}
                className={`w-full flex items-center gap-3 ${collapsed ? "justify-center px-0" : "px-3"} py-2 rounded-lg text-sm transition-all ${
                  activePanel === "review"
                    ? "bg-gray-800 text-white"
                    : submitted
                    ? "text-emerald-400 hover:bg-gray-800"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
                style={activePanel === "review" ? { borderLeft: "3px solid #f97316" } : {}}
              >
                {REVIEW_ITEM.icon}
                {!collapsed && (submitted ? "Review Submitted" : REVIEW_ITEM.label)}
              </button>
            </>
          )}
        </nav>

        {/* Pipeline mini-progress */}
        {isGenerating && (
          <div className={collapsed ? "px-2 pb-4" : "px-4 pb-4"}>
            {!collapsed && (
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <Loader2 size={14} className="animate-spin text-orange-500" />
                Generating...
              </div>
            )}
            <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Collapse toggle (desktop only) */}
        <div className="hidden md:block border-t border-gray-700">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center py-3 text-gray-500 hover:text-white transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
}
