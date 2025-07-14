"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/useUser";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import * as htmlToImage from "html-to-image";
import confetti from "canvas-confetti";
import { ChevronLeft } from "lucide-react";

type Habit = {
  id: string;
  title: string;
  color: string;
  statusToday?: "active" | "rest" | "none";
};

export default function SharePage() {
  const { user, loading } = useUser();
  const router = useRouter();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (user) fetchTodayData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const handleDownloadImage = async () => {
    const card = document.getElementById("share-card");
    if (!card) return;

    try {
      const dataUrl = await htmlToImage.toPng(card);
      const link = document.createElement("a");
      link.download = `zaplog-${new Date().toISOString().split("T")[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to generate image.");
    }
  };

  const fetchTodayData = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data: habitsData } = await supabase
      .from("habits")
      .select("id, title, color")
      .eq("archived", false);

    const { data: logsData } = await supabase
      .from("habit_logs")
      .select("habit_id, status")
      .eq("date", today);

    const logsMap = new Map(logsData?.map((log) => [log.habit_id, log.status]));

    const enriched = (habitsData ?? []).map((h) => ({
      ...h,
      statusToday: logsMap.get(h.id) ?? "none",
    }));

    const completed = enriched.filter((h) => h.statusToday === "active").length;
    const total = enriched.length;
    const pct = total ? Math.round((completed / total) * 100) : 0;

    setHabits(enriched);
    setPercent(pct);
  };

  const handleCopyCard = async () => {
    const card = document.getElementById("share-card");
    if (!card) return;

    // Confetti overlay
    if (percent >= 80) {
      const canvas = document.createElement("canvas");
      canvas.width = card.offsetWidth;
      canvas.height = card.offsetHeight;
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.pointerEvents = "none";
      canvas.style.borderRadius = "12px";
      card.appendChild(canvas);

      const myConfetti = confetti.create(canvas, {
        resize: true,
        useWorker: true,
      });

      myConfetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });

      await new Promise((res) => setTimeout(res, 1000));
    }

    try {
      const blob = await htmlToImage.toBlob(card, {
        pixelRatio: 3,
      });
      if (!blob) throw new Error("Failed to generate image");

      const clipboardItem = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([clipboardItem]);
    } catch (err) {
      console.error("Copy failed", err);
      alert("Failed to copy image.");
    } finally {
      // Cleanup any confetti canvas
      const canvases = card.querySelectorAll("canvas");
      canvases.forEach((c) => c.remove());
    }
  };

  if (loading || !user) return null;

  return (
    <main className="min-h-screen bg-[#EAEBD0] text-[#AF3E3E] p-4">
      <div className="flex gap-4  items-center mb-6">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-[#AF3E3E] underline mr-2"
        >
          <ChevronLeft size={30} className="mr-1" />
        </button>
        <h1 className="text-2xl font-bold">Share Progress</h1>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        Everything you{"'"}ve done today, summarized.
      </div>

      {/* Shareable Summary Card */}
      <div
        id="share-card"
        className="relative bg-white rounded-xl shadow-md p-6 space-y-4 text-[#AF3E3E]"
        style={{ width: "100%", maxWidth: "500px", margin: "auto" }}
      >
        {/* Username top-right */}
        <div className="absolute top-2 right-3 text-md mb-4">
          {user?.user_metadata.full_name.split(" ")[0]}
        </div>

        {/* Date and Completion */}
        <div className="flex justify-between items-center text-sm font-medium mt-4">
          <span>{format(new Date(), "PPP")}</span>
          <span>✅ {percent}% done</span>
        </div>

        {/* Habits List */}
        <div className="space-y-2 text-sm">
          {habits.map((habit) => (
            <div key={habit.id} className="flex items-center gap-2">
              <span className="text-lg">
                {habit.statusToday === "active"
                  ? "✅"
                  : habit.statusToday === "rest"
                  ? "🛏️"
                  : "❌"}
              </span>
              <span className="truncate">{habit.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Copy Button */}
      <button
        onClick={handleCopyCard}
        className="mt-6 w-full bg-[#AF3E3E] text-white py-2 rounded shadow"
      >
        📋 Copy Image to Clipboard
      </button>

      <button
        onClick={handleDownloadImage}
        className="mt-6 w-full bg-[#AF3E3E] text-white py-2 rounded shadow"
      >
        📥 Download Image
      </button>
    </main>
  );
}
