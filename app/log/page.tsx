/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { isSameDay, parseISO } from "date-fns";

interface Habit {
  id: string;
  title: string;
  color: string;
}

interface HabitLog {
  date: string;
  status: string;
}

export default function LogPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [months, setMonths] = useState<Date[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (user) fetchHabits();
  }, [user, loading]);

  const fetchHabits = async () => {
    const { data, error } = await supabase
      .from("habits")
      .select("id, title, color")
      .order("created_at");

    if (!error && data) {
      setHabits(data);
      setSelectedHabit(data[0] || null);
    }
  };

  useEffect(() => {
    if (selectedHabit) fetchLogs(selectedHabit.id);
  }, [selectedHabit]);

  const fetchLogs = async (habitId: string) => {
    const { data, error } = await supabase
      .from("habit_logs")
      .select("date, status")
      .eq("habit_id", habitId);

    if (!error && data) {
      setLogs(data);
      calculateMonths(data);
    }
  };

  const calculateMonths = (logs: HabitLog[]) => {
    if (!logs.length) return;
    const dates = logs.map((log) => new Date(log.date));
    const earliest = dates.reduce((min, d) => (d < min ? d : min), new Date());
    const current = new Date();

    const list: Date[] = [];
    const iter = new Date(current.getFullYear(), current.getMonth(), 1);
    const earliestMonth = new Date(
      earliest.getFullYear(),
      earliest.getMonth(),
      1
    );

    while (iter >= earliestMonth) {
      list.push(new Date(iter));
      iter.setMonth(iter.getMonth() - 1);
    }

    setMonths(list);
  };

  const isLogged = (date: Date) => {
    return logs.find((log) => isSameDay(parseISO(log.date), date));
  };

  const renderMonth = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

    const dates = [
      ...Array(firstDay).fill(null),
      ...Array(daysInMonth)
        .keys()
        .map((i) => i + 1),
    ];

    return (
      <div key={monthDate.toISOString()} className="mb-8">
        <h2 className="text-center font-semibold mb-2">
          {monthDate.toLocaleString("default", { month: "long" })} {year}
        </h2>
        <div className="grid grid-cols-7 text-center text-sm text-gray-500 mb-1">
          {dayLabels.map((d, idx) => (
            <div key={`${d}-${idx}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-2 text-center text-sm">
          {dates.map((day, i) => {
            const date = day ? new Date(year, month, day) : null;
            const log = date && isLogged(date);
            return day ? (
              <div
                key={i}
                className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full ${
                  log
                    ? log.status === "rest"
                      ? "text-[#AF3E3E] border"
                      : "text-white"
                    : "text-[#AF3E3E] border"
                }`}
                style={{
                  backgroundColor:
                    log?.status === "active" ? selectedHabit?.color : undefined,
                  borderColor:
                    log?.status === "rest" ? selectedHabit?.color : "transparent",
                  borderWidth: log ? "3px" : "1px",
                  borderStyle: "solid",
                }}
              >
                {day}
              </div>
            ) : (
              <div key={i}></div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-[#EAEBD0] p-4 text-[#AF3E3E]">
      <div className="flex gap-4  items-center mb-6">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-[#AF3E3E] underline mr-2"
        >
          <ChevronLeft size={30} className="mr-1" />
        </button>
        <h1 className="text-2xl font-bold">Habit Log 📅</h1>
      </div>

      {/* Habit Dropdown */}
      <div className="relative inline-block w-full max-w-sm mb-6">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full p-3 bg-white rounded-lg shadow flex justify-between items-center"
        >
          <span>{selectedHabit?.title || "Select Habit"}</span>
          <ChevronDown size={16} />
        </button>
        {dropdownOpen && (
          <ul className="absolute mt-2 w-full bg-white rounded shadow z-10">
            {habits.map((h) => (
              <li
                key={h.id}
                onClick={() => {
                  setSelectedHabit(h);
                  setDropdownOpen(false);
                }}
                className="px-4 py-2 hover:bg-[#f5cd99] cursor-pointer"
              >
                {h.title}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Calendar View */}
      <div>{months.map((month) => renderMonth(month))}</div>
    </div>
  );
}
