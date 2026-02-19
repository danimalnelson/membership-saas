"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "@wine-club/ui";
import { Pencil } from "geist-icons";
import { SectionCard } from "@/components/ui/section-card";

interface MemberNoteProps {
  consumerId: string;
  /** The most recent note content, or null if no note exists yet. */
  noteContent: string | null;
  /** The ID of the existing note record, if any. */
  noteId: string | null;
}

export function MemberNote({ consumerId, noteContent, noteId }: MemberNoteProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(noteContent || "");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(noteContent || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDirty = content !== lastSaved;

  // Auto-resize textarea to fit content
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.max(80, el.scrollHeight)}px`;
    }
  }, [content, editing]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editing]);

  const save = useCallback(async (value: string) => {
    if (value === lastSaved) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/members/${consumerId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value }),
      });
      if (response.ok) {
        setLastSaved(value);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setSaving(false);
    }
  }, [consumerId, lastSaved]);

  // Auto-save after 1s of inactivity
  const handleChange = (value: string) => {
    setContent(value);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => save(value), 1000);
  };

  // Save on blur and exit edit mode
  const handleBlur = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    save(content);
    setEditing(false);
  };

  const status = saving ? "Saving..." : isDirty ? "Unsaved" : "";

  return (
    <SectionCard
      title="Note"
      headerAction={
        !editing ? (
          <IconButton
            label="Edit note"
            size="small"
            variant="outline"
            onClick={() => setEditing(true)}
          >
            <Pencil size={14} />
          </IconButton>
        ) : status ? (
          <span className="text-12 text-gray-600">{status}</span>
        ) : null
      }
    >
      {editing ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="Add a note about this member..."
          className="w-full text-14 leading-relaxed resize-none border-0 bg-transparent p-0 focus:outline-none focus:ring-0 placeholder:text-gray-700"
          rows={3}
        />
      ) : (
        <p className="text-14 text-gray-900 dark:text-gray-800 whitespace-pre-wrap">
          {content || <span className="text-gray-600">No note yet</span>}
        </p>
      )}
    </SectionCard>
  );
}
