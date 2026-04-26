"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import type { Material } from "@/types/plan";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Search, ChevronUp, ChevronDown } from "lucide-react";
import { Tooltip } from "../ui/Tooltip";

const STATUS_TOOLTIPS: Record<string, string> = {
  VERIFIED: "Catalog number confirmed at the supplier website.",
  CORRECTED: "Catalog number was found and filled in via automated search.",
  PARTIALLY_VERIFIED: "Product was found at the supplier but the exact catalog number could not be confirmed.",
  UNVERIFIED: "Could not verify this item via supplier search.",
};

const STATUS_OPTIONS = ["ALL", "VERIFIED", "CORRECTED", "PARTIALLY_VERIFIED", "UNVERIFIED"] as const;

function statusVariant(status: string) {
  if (status === "VERIFIED" || status === "CORRECTED") return "success" as const;
  if (status === "PARTIALLY_VERIFIED") return "info" as const;
  return "warning" as const;
}

type SortKey = "category" | "name" | "total_cost" | "verification_status";
type SortDir = "asc" | "desc";

export function MaterialsPanel({ materials }: { materials: Material[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("category");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let items = materials;

    if (statusFilter !== "ALL") {
      items = items.filter((m) => m.verification_status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.supplier.toLowerCase().includes(q) ||
          m.catalog_number.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      );
    }

    const sorted = [...items].sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (sortKey === "total_cost") {
        const parseNum = (s: string) => parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
        return sortDir === "asc" ? parseNum(av) - parseNum(bv) : parseNum(bv) - parseNum(av);
      }
      av = String(av).toLowerCase();
      bv = String(bv).toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    return sorted;
  }, [materials, search, statusFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  if (materials.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-gray-400">
        No materials data available.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-bold text-gray-900">
            Materials & Supply Chain
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({materials.length} items)
            </span>
          </h2>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div className="flex gap-1.5">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  statusFilter === s
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "ALL" ? "All" : s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 pr-3 cursor-pointer hover:text-gray-700" onClick={() => toggleSort("category")}>
                  <div className="flex items-center gap-1">Category <SortIcon col="category" /></div>
                </th>
                <th className="pb-3 pr-3 cursor-pointer hover:text-gray-700" onClick={() => toggleSort("name")}>
                  <div className="flex items-center gap-1">Item <SortIcon col="name" /></div>
                </th>
                <th className="pb-3 pr-3">Supplier</th>
                <th className="pb-3 pr-3">Catalog #</th>
                <th className="pb-3 pr-3">Qty</th>
                <th className="pb-3 pr-3 cursor-pointer hover:text-gray-700" onClick={() => toggleSort("total_cost")}>
                  <div className="flex items-center gap-1">Cost <SortIcon col="total_cost" /></div>
                </th>
                <th className="pb-3 cursor-pointer hover:text-gray-700" onClick={() => toggleSort("verification_status")}>
                  <div className="flex items-center gap-1">Status <SortIcon col="verification_status" /></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((mat, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 pr-3 text-gray-900">{mat.category}</td>
                  <td className="py-3 pr-3 font-medium text-gray-900">{mat.name}</td>
                  <td className="py-3 pr-3 text-gray-600">{mat.supplier}</td>
                  <td className="py-3 pr-3 font-mono text-xs text-gray-600">{mat.catalog_number}</td>
                  <td className="py-3 pr-3 text-gray-600">{mat.quantity}</td>
                  <td className="py-3 pr-3 text-gray-900">{mat.total_cost}</td>
                  <td className="py-3">
                    <Tooltip text={STATUS_TOOLTIPS[mat.verification_status] || ""}>
                      <Badge variant={statusVariant(mat.verification_status)}>
                        {mat.verification_status}
                      </Badge>
                    </Tooltip>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">
            No materials match your filters.
          </p>
        )}

      </Card>
    </div>
  );
}
