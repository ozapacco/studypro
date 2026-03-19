import { writable, get } from "svelte/store";
import { db } from "$lib/db.js";

function createNotesStore() {
  const store = writable({
    notes: [],
    loading: false,
    error: null,
  });

  return {
    subscribe: store.subscribe,

    async loadByTopic(topicId) {
      store.update((s) => ({ ...s, loading: true }));
      try {
        const notes = await db.notes.where("topicId").equals(topicId).toArray();
        store.update((s) => ({ ...s, notes, loading: false }));
      } catch (e) {
        store.update((s) => ({ ...s, error: e.message, loading: false }));
      }
    },

    async addNote(topicId, type, content, title = null, comment = null) {
      const note = {
        topicId,
        type,
        title,
        content,
        comment,
        createdAt: new Date().toISOString(),
      };
      const id = await db.notes.add(note);
      store.update((s) => ({
        ...s,
        notes: [...s.notes, { ...note, id }],
      }));
      return id;
    },

    async updateNote(id, updates) {
      await db.notes.update(id, updates);
      store.update((s) => ({
        ...s,
        notes: s.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      }));
    },

    async deleteNote(id) {
      await db.notes.delete(id);
      store.update((s) => ({
        ...s,
        notes: s.notes.filter((n) => n.id !== id),
      }));
    },

    getNotesByTopic(topicId) {
      const all = get(store).notes;
      return {
        bizus: all.filter((n) => n.type === "bizu"),
        errors: all.filter((n) => n.type === "error"),
        annotations: all.filter((n) => n.type === "annotation"),
      };
    },
  };
}

export const notesStore = createNotesStore();
