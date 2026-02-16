import React from "react";

const COLORS = [
  { hex: "linear-gradient(43deg, rgb(65, 88, 208) 0%, rgb(200, 80, 192) 46%, rgb(255, 204, 112) 100%)", name: "Magic Theme" },
  { hex: "#4f46e5", name: "Classic Indigo" },
  { hex: "#0ea5e9", name: "Sky Blue" },
  { hex: "#10b981", name: "Emerald Green" },
  { hex: "#f59e0b", name: "Warm Amber" },
  { hex: "#ef4444", name: "Professional Red" },
  { hex: "#8b5cf6", name: "Violet" },
  { hex: "#0f172a", name: "Deep Slate" },
];

const ColorPicker = ({ selectedColor, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Pick Your Color
        </h4>
        <span className="text-[10px] font-bold text-slate-300">
          Brand Identity
        </span>
      </div>

      <div className="flex flex-wrap gap-4 px-2">
        {COLORS.map((color) => (
          <button
            key={color.hex}
            onClick={() => onChange(color.hex)}
            className={`relative w-10 h-10 rounded-2xl transition-all duration-300 group ${
              selectedColor === color.hex
                ? "scale-110 shadow-lg ring-2 ring-offset-4 ring-offset-white dark:ring-offset-slate-900"
                : "hover:scale-110"
            }`}
            style={{
              background: color.hex,
              boxShadow:
                selectedColor === color.hex
                  ? `0 10px 20px -5px rgba(0,0,0,0.2)`
                  : "none",
            }}
            title={color.name}
          >
            {selectedColor === color.hex && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}

            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[8px] font-black uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
              {color.name}
            </div>
          </button>
        ))}

        {/* Custom Color Input */}
        <div className="relative group">
          <input
            type="color"
            value={selectedColor.includes("gradient") ? "#ffffff" : selectedColor}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-2xl cursor-pointer opacity-0 absolute inset-0 z-10"
          />

          <div
            className="w-10 h-10 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 transition-all group-hover:scale-110"
            style={{
              borderColor:
                !COLORS.some((c) => c.hex === selectedColor) &&
                !selectedColor.includes("gradient")
                  ? selectedColor
                  : undefined,
              boxShadow:
                !COLORS.some((c) => c.hex === selectedColor) &&
                !selectedColor.includes("gradient")
                  ? `0 10px 20px -5px ${selectedColor}66`
                  : "none",
            }}
          >
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
