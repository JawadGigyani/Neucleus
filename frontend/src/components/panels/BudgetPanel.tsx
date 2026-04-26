"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Budget } from "@/types/plan";
import { Card } from "../ui/Card";
import { ChevronDown, DollarSign, Beaker, Monitor, Package, Users, Percent, ShieldAlert } from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  materials_and_reagents: <Beaker size={18} className="text-orange-500" />,
  equipment: <Monitor size={18} className="text-blue-500" />,
  consumables: <Package size={18} className="text-emerald-500" />,
  personnel_2_researchers_3_months: <Users size={18} className="text-violet-500" />,
  overhead_15pct: <Percent size={18} className="text-amber-500" />,
  contingency_10pct: <ShieldAlert size={18} className="text-red-500" />,
};

export function BudgetPanel({ budget }: { budget: Budget | null }) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  if (!budget) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-gray-400">
        No budget data available.
      </div>
    );
  }

  const toggle = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const summaryEntries = Object.entries(budget.summary).filter(
    ([k]) => k !== "verified_percentage" && k !== "total_estimate"
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Total */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Budget Breakdown</h2>
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-orange-500" />
            <span className="text-2xl font-bold text-gray-900">
              {budget.summary.total_estimate}
            </span>
          </div>
        </div>
      </Card>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {summaryEntries.map(([key, value], i) => {
          const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          return (
            <Card key={key} delay={i * 0.05} className="flex items-start gap-3">
              <div className="mt-0.5">
                {CATEGORY_ICONS[key] || <DollarSign size={18} className="text-gray-400" />}
              </div>
              <div>
                <span className="text-xs text-gray-500">{label}</span>
                <p className="font-semibold text-gray-900">{String(value)}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Itemized Breakdown */}
      {budget.line_items && budget.line_items.length > 0 && (
        <Card delay={0.2}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Itemized Breakdown
          </h3>
          <div className="space-y-2">
            {budget.line_items.map((li) => {
              const isOpen = openCategories.has(li.category);
              return (
                <div key={li.category} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggle(li.category)}
                    className="w-full px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 flex items-center justify-between transition-colors"
                  >
                    <span>{li.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 font-semibold">{li.subtotal}</span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={16} className="text-gray-400" />
                      </motion.div>
                    </div>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <ul className="px-4 pb-3 pt-1 space-y-1.5 border-t bg-gray-50">
                          {li.items.map((item, j) => (
                            <li key={j} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-gray-400 mt-0.5">&#8226;</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
