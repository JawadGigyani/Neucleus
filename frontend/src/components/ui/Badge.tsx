const VARIANTS: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  neutral: "bg-gray-100 text-gray-600",
  coral: "bg-orange-100 text-orange-700",
};

export function Badge({
  children,
  variant = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${VARIANTS[variant] || VARIANTS.neutral} ${className}`}>
      {children}
    </span>
  );
}
