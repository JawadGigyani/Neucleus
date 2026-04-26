"use client";

import { motion } from "framer-motion";
import type { Timeline } from "@/types/plan";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Clock, Flag } from "lucide-react";

export function TimelinePanel({ timeline }: { timeline: Timeline | null }) {
  if (!timeline) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-gray-400">
        No timeline data available.
      </div>
    );
  }

  const maxWeek = Math.max(...timeline.phases.map((p) => p.end_week), 1);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Timeline</h2>
          <Badge variant="coral" className="text-sm px-3 py-1">
            <Clock size={14} className="mr-1" />
            {timeline.total_duration}
          </Badge>
        </div>

        {/* Gantt-style bars */}
        <div className="space-y-4">
          {timeline.phases.map((phase, i) => {
            const leftPct = ((phase.start_week - 1) / maxWeek) * 100;
            const widthPct = ((phase.end_week - phase.start_week + 1) / maxWeek) * 100;

            return (
              <motion.div
                key={`phase-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {phase.phase}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{phase.name}</h3>
                    <span className="text-xs text-gray-500">
                      {phase.duration} &middot; Weeks {phase.start_week}–{phase.end_week}
                    </span>
                  </div>
                </div>

                {/* Mini Gantt bar */}
                <div className="relative h-3 bg-gray-100 rounded-full mb-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="absolute h-full bg-orange-500 rounded-full"
                    style={{ left: `${leftPct}%` }}
                  />
                </div>

                {/* Tasks */}
                <ul className="space-y-1 mb-2">
                  {phase.tasks.map((task, j) => (
                    <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">&#8226;</span>
                      {task}
                    </li>
                  ))}
                </ul>

                {/* Milestone */}
                <div className="flex items-center gap-1.5 text-xs text-orange-600 font-medium mt-2">
                  <Flag size={12} />
                  Milestone: {phase.milestone}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
