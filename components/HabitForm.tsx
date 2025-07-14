"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Pipette } from "lucide-react";

type Props = {
  userId: string;
  onSuccess: () => void;
};

const PRESET_COLORS = [
  "#DA6C6C",
  "#CD5656",
  "#AF3E3E",
  "#e9f116",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#22d3ee",
  "#14b8a6",
  "#7c3aed",
  "#f43f5e",
  "#6b7280",
];

export default function HabitForm({ userId, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const selectedColor = customColor || color;
    if (!title.trim()) return alert("Title is required");
    if (!selectedColor) return alert("Please pick a color");

    setLoading(true);
    const { error } = await supabase.from("habits").insert({
      title,
      color: selectedColor,
      user_id: userId,
    });

    setLoading(false);
    if (error) {
      alert("Error creating habit: " + error.message);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Meditate"
          className="w-full p-2 border rounded text-[#AF3E3E]"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Pick a color</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {PRESET_COLORS.map((preset) => {
            const isSelected = preset === color && !customColor;
            return (
              <div
                key={preset}
                onClick={() => {
                  setColor(preset);
                  setCustomColor("");
                }}
                className="relative w-8 h-8 flex items-center justify-center cursor-pointer"
              >
                {isSelected && (
                  <div className="absolute inset-0 rounded-full border-2 border-[#AF3E3E] scale-90 z-0" />
                )}
                <div
                  className="w-6 h-6 rounded-full border-2 border-white z-10"
                  style={{ backgroundColor: preset }}
                />
              </div>
            );
          })}

          {/* Custom color picker with Eyedropper icon */}
          <label className="relative w-8 h-8 flex items-center justify-center cursor-pointer">
            {customColor && (
              <div className="absolute inset-0 rounded-full border-2 border-[#AF3E3E] scale-125 z-0" />
            )}
            <div
              className="w-6 h-6 rounded-full border-2 border-white z-10"
              style={{ backgroundColor: customColor || "#ffffff" }}
            />
            <Pipette
              className="absolute z-20 text-black w-3 h-3"
              strokeWidth={2}
            />
            <input
              type="color"
              value={customColor || "#ffffff"}
              onChange={(e) => {
                setCustomColor(e.target.value);
                setColor("");
              }}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            />
          </label>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-4 py-2 rounded bg-[#AF3E3E] text-white font-semibold"
      >
        {loading ? "Saving..." : "Save Habit"}
      </button>
    </div>
  );
}
