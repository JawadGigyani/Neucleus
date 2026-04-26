"use client";

export function StarRating({
  value,
  onChange,
  disabled,
  size = "text-xl",
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  size?: string;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className={`${size} transition-colors ${
            star <= value ? "text-amber-400" : "text-gray-300"
          } ${disabled ? "cursor-not-allowed" : "hover:text-amber-300 cursor-pointer"}`}
        >
          &#9733;
        </button>
      ))}
    </div>
  );
}
