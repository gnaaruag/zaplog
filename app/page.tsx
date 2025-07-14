"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabaseClient";
import HabitForm from "@/components/HabitForm";
import {
  Plus,
  Calendar,
  Share2,
  MoreVertical,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type Habit = {
  id: string;
  title: string;
  color: string;
  completedToday: boolean;
  statusToday?: string;
};

export default function HomePage() {
  const { user, loading } = useUser();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [lastTap, setLastTap] = useState<number | null>(null);

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (user) fetchHabits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const fetchHabits = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data: habitsData, error: habitsError } = await supabase
      .from("habits")
      .select("*")
      .eq("archived", false) // only show active
      .order("created_at", { ascending: true });

    const { data: logsData } = await supabase
      .from("habit_logs")
      .select("habit_id, status")
      .eq("date", today);

    if (habitsError) {
      console.error("Failed to fetch habits:", habitsError.message);
    } else if (habitsData) {
      const logMap = new Map(
        logsData?.map((log) => [log.habit_id, log.status])
      );
      const mapped = habitsData.map((habit) => ({
        ...habit,
        completedToday: logMap.get(habit.id) === "active",
        statusToday: logMap.get(habit.id) || null,
      }));
      setHabits(mapped);
    }
  };

  // const toggleComplete = (id: string) => {
  //   setHabits((prev) =>
  //     prev.map((h) =>
  //       h.id === id ? { ...h, completedToday: !h.completedToday } : h
  //     )
  //   );
  // };

  const handleTap = async (habitId: string) => {
    const now = Date.now();
    if (lastTap && now - lastTap < 300) {
      const today = new Date().toISOString().split("T")[0];

      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const alreadyCompleted = habit.completedToday;

      if (alreadyCompleted) {
        // DELETE log
        await supabase
          .from("habit_logs")
          .delete()
          .eq("habit_id", habitId)
          .eq("date", today);
      } else {
        // INSERT log
        await supabase.from("habit_logs").insert({
          habit_id: habitId,
          date: today,
          status: "active",
        });
      }

      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId ? { ...h, completedToday: !alreadyCompleted } : h
        )
      );
      setLastTap(null);
    } else {
      setLastTap(now);
    }
  };

  const handleEditStart = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setEditingTitle(habit.title);
    setMenuOpenId(null);
  };

  const handleEditSubmit = async (id: string) => {
    if (!editingTitle.trim()) return;

    const { error } = await supabase
      .from("habits")
      .update({ title: editingTitle })
      .eq("id", id);

    if (!error) {
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, title: editingTitle } : h))
      );
      setEditingHabitId(null);
      setEditingTitle("");
    }
  };

  const handleDeleteHabit = async (id: string) => {
    const { error } = await supabase.from("habits").delete().eq("id", id);
    if (!error) {
      setHabits((prev) => prev.filter((h) => h.id !== id));
      setMenuOpenId(null);
    }
  };

  const handleArchiveHabit = async (id: string) => {
    const { error } = await supabase
      .from("habits")
      .update({ archived: true })
      .eq("id", id);

    if (!error) {
      setHabits((prev) => prev.filter((h) => h.id !== id));
      setMenuOpenId(null);
    }
  };

  const sortedHabits = [
    ...habits.filter((h) => !h.completedToday),
    ...habits.filter((h) => h.completedToday),
  ];

  if (loading || !user) return null;

  return (
    <main className="min-h-screen px-4 py-6 bg-[#EAEBD0] text-[#AF3E3E]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 mx-6">

        <Image
          src="/zaplog.png"
          alt="Zaplog Logo"
          width={60}
          height={60}
        >

        </Image>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          }}
          className="text-sm text-[#AF3E3E] underline"
        >
          Logout
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center items-center gap-6 mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="w-12 h-12 rounded-full bg-[#DA6C6C] text-white flex items-center justify-center shadow"
        >
          <Plus size={20} />
        </button>
        <button
          onClick={() => router.push("/log")}
          className="w-12 h-12 rounded-full bg-[#CD5656] text-white flex items-center justify-center shadow"
        >
          <Calendar size={20} />
        </button>
        <button
          onClick={() => router.push("/share")}
          className="w-12 h-12 rounded-full bg-[#AF3E3E] text-white flex items-center justify-center shadow"
        >
          <Share2 size={20} />
        </button>
        <button
          onClick={() => router.push("/accountability")}
          className="w-12 h-12 rounded-full bg-[#AF3E3E] text-white flex items-center justify-center shadow"
        >
          <CheckCircle size={20} />
        </button>
      </div>

      {/* Habit List */}
      <AnimatePresence initial={false}>
        <motion.div layout className="space-y-3 pb-16">
          {sortedHabits.map((habit) => (
            <motion.div
              key={habit.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center justify-between p-3 rounded bg-white shadow-sm ${
                habit.completedToday ? "opacity-60" : ""
              }`}
            >
              <div
                className="flex items-center gap-3"
                onClick={() => handleTap(habit.id)}
              >
                {habit.statusToday === "rest" ? (
                  <span className="text-lg">🛏️</span>
                ) : (
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: habit.color }}
                  />
                )}

                {editingHabitId === habit.id ? (
                  <input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleEditSubmit(habit.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEditSubmit(habit.id);
                      if (e.key === "Escape") {
                        setEditingHabitId(null);
                        setEditingTitle("");
                      }
                    }}
                    autoFocus
                    className="bg-transparent border-b border-[#AF3E3E] focus:outline-none text-sm text-[#AF3E3E] font-medium"
                  />
                ) : (
                  <span
                    className={`text-[#AF3E3E] font-medium ${
                      habit.completedToday && habit.statusToday !== "rest"
                        ? "line-through"
                        : ""
                    }`}
                  >
                    {habit.title}
                  </span>
                )}
              </div>

              {/* Hamburger Menu */}
              <div className="relative">
                <button
                  onClick={() =>
                    setMenuOpenId(menuOpenId === habit.id ? null : habit.id)
                  }
                >
                  <MoreVertical size={18} className="text-[#AF3E3E]" />
                </button>

                {menuOpenId === habit.id && (
                  <div className="absolute right-0 top-6 z-10 bg-white shadow border rounded w-24 text-sm">
                    <button
                      onClick={() => handleEditStart(habit)}
                      className="w-full text-left px-3 py-2 hover:bg-[#EAEBD0]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleArchiveHabit(habit.id)}
                      className="w-full text-left px-3 py-2 text-yellow-700 hover:bg-yellow-50"
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                    <button
                      onClick={async () => {
                        const today = new Date().toISOString().split("T")[0];

                        // Check current log for this habit
                        const { data, error } = await supabase
                          .from("habit_logs")
                          .select("id, status")
                          .eq("habit_id", habit.id)
                          .eq("date", today)
                          .single();

                        if (error && error.code !== "PGRST116") {
                          console.error("Error fetching log:", error);
                          return;
                        }

                        if (data?.status === "rest") {
                          // Unset rest: delete log
                          await supabase
                            .from("habit_logs")
                            .delete()
                            .eq("id", data.id);
                          setHabits((prev) =>
                            prev.map((h) =>
                              h.id === habit.id
                                ? {
                                    ...h,
                                    completedToday: false,
                                    statusToday: undefined,
                                  }
                                : h
                            )
                          );
                        } else {
                          // Set rest
                          await supabase.from("habit_logs").upsert({
                            habit_id: habit.id,
                            date: today,
                            status: "rest",
                          });
                          setHabits((prev) =>
                            prev.map((h) =>
                              h.id === habit.id
                                ? {
                                    ...h,
                                    completedToday: false,
                                    statusToday: "rest",
                                  }
                                : h
                            )
                          );
                        }

                        setMenuOpenId(null);
                      }}
                      className="w-full text-left px-3 py-2 text-blue-700 hover:bg-blue-50"
                    >
                      {habit.statusToday === "rest"
                        ? "Remove Rest"
                        : "Log Rest"}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Create Habit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm text-[#AF3E3E]">
            <h2 className="text-lg font-bold mb-4">New Habit</h2>
            <HabitForm
              userId={user.id}
              onSuccess={() => {
                setShowModal(false);
                fetchHabits();
              }}
            />
            <div className="mt-4 text-right">
              <button
                onClick={() => setShowModal(false)}
                className="text-sm text-[#AF3E3E] underline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
