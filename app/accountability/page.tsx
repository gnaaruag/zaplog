'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/useUser';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { useRouter } from "next/navigation";
import { ChevronLeft } from 'lucide-react';

type Note = {
  id: string;
  date: string;
  content: string;
};

export default function AccountablePage() {
  const { user, loading } = useUser();
  const [notes, setNotes] = useState<Note[]>([]);
  const [savingToday, setSavingToday] = useState(false);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) fetchNotes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('daily_notes')
      .select('id, date, content')
      .eq('user_id', user?.id)
      .order('date', { ascending: false });

    if (!error && data) {
      setNotes(data);
    }
  };

  const todayNote = notes.find(n => n.date === todayStr);

  const handleCreateTodayNote = async () => {
    if (!user) return;
    setSavingToday(true);

    const { error } = await supabase
      .from('daily_notes')
      .insert({
        user_id: user.id,
        date: todayStr,
        content: '',
      });

    setSavingToday(false);
    if (!error) fetchNotes();
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen p-4 bg-[#EAEBD0] text-[#AF3E3E]">
      <div className="flex gap-4  items-center mb-6">
		<button
		  onClick={() => router.push("/")}
		  className="flex items-center text-[#AF3E3E] underline mr-2"
		>
		  <ChevronLeft size={30} className="mr-1" />
		</button>
        <h1 className="text-2xl font-bold">Accountability Log</h1>
      </div>

      {/* Today's Note */}
      <h2 className="text-lg font-semibold mb-3">Today</h2>
      {todayNote ? (
        <NoteCard note={todayNote} onUpdate={fetchNotes} />
      ) : (
        <div
          className="cursor-pointer text-center bg-white border border-dashed border-[#AF3E3E] text-[#AF3E3E] p-4 rounded shadow"
          onClick={handleCreateTodayNote}
        >
          {savingToday ? 'Creating...' : 'Log what you did for today'}
        </div>
      )}

      {/* Past Notes */}
      <h2 className="text-lg font-semibold mt-6 mb-3">Past Notes</h2>
      <div className="space-y-4">
        {notes
          .filter(n => n.date !== todayStr)
          .map(note => (
            <NoteCard key={note.id} note={note} onUpdate={fetchNotes} />
          ))}
      </div>
    </div>
  );
}

function NoteCard({
  note,
  onUpdate,
}: {
  note: Note;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('daily_notes')
      .update({ content: text })
      .eq('id', note.id);
    setSaving(false);
    if (!error) {
      setEditing(false);
      onUpdate();
    }
  };

  const handleDelete = async () => {
    const confirmed = confirm('Are you sure you want to delete this note?');
    if (!confirmed) return;
    const { error } = await supabase
      .from('daily_notes')
      .delete()
      .eq('id', note.id);
    if (!error) {
      onUpdate();
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex justify-between items-start mb-1">
        <div className="text-sm font-semibold">
          {format(new Date(note.date), 'PPP')}
        </div>
        <div className="flex gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-blue-600 underline"
            >
              Edit
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-xs text-red-600 underline"
          >
            Delete
          </button>
        </div>
      </div>
      {editing ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full p-2 mt-1 border border-[#AF3E3E] rounded text-sm"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 text-sm rounded bg-[#AF3E3E] text-white"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setText(note.content);
              }}
              className="px-3 py-1 text-sm rounded border text-[#AF3E3E]"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="text-sm whitespace-pre-wrap">{note.content || <span className="italic text-gray-400">No content</span>}</div>
      )}
    </div>
  );
}
