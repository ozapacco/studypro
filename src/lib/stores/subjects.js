import { writable } from "svelte/store";
import { db } from "../db.js";
import { SubjectSchema } from "../utils/validation.js";
import { toast } from "./ui.js";

function createSubjectsStore() {
  const { subscribe, set } = writable([]);

  return {
    subscribe,

    async load() {
      const subjects = await db.subjects.orderBy("order").toArray();
      const normalizedSubjects = subjects.map((s) => ({
        ...s,
        weight: Number(s.weight) || 0,
      }));
      set(normalizedSubjects);
      return normalizedSubjects;
    },

    async add(subject) {
      try {
        const validated = SubjectSchema.parse(subject);
        const order = (await db.subjects.count()) + 1;
        const id = await db.subjects.add({
          ...validated,
          order,
          proficiencyLevel: validated.proficiencyLevel || 0,
          stats: {
            totalCards: 0,
            matureCards: 0,
            learningCards: 0,
            newCards: 0,
            averageEase: 5,
            retention: 0,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await this.load();
        return id;
      } catch (e) {
        if (e.name === 'ZodError') {
          toast(e.errors[0].message, 'warning');
        } else {
          toast('Falha ao adicionar matéria.', 'error');
        }
        throw e;
      }
    },

    async getById(id) {
      return db.subjects.get(Number(id));
    },

    async update(id, changes) {
      try {
        const validated = SubjectSchema.partial().parse(changes);
        await db.subjects.update(id, {
          ...validated,
          updatedAt: new Date().toISOString(),
        });
        await this.load();
      } catch (e) {
        if (e.name === 'ZodError') {
          toast(e.errors[0].message, 'warning');
        } else {
          toast('Falha ao atualizar matéria.', 'error');
        }
        throw e;
      }
    },

    async remove(id) {
      const subjectId = Number(id);
      const topicIds = await db.topics
        .where("subjectId")
        .equals(subjectId)
        .primaryKeys();
      if (topicIds.length > 0) {
        await db.lessons.where("topicId").anyOf(topicIds).delete();
      }
      await db.cards.where("subjectId").equals(subjectId).delete();
      await db.topics.where("subjectId").equals(subjectId).delete();
      await db.subjects.delete(subjectId);
      await this.load();
    },

    async reorder(fromIndex, toIndex) {
      const subjects = await db.subjects.orderBy("order").toArray();
      const [moved] = subjects.splice(fromIndex, 1);
      subjects.splice(toIndex, 0, moved);

      await Promise.all(
        subjects.map((subject, index) =>
          db.subjects.update(subject.id, { order: index + 1 }),
        ),
      );
      await this.load();
    },
  };
}

export const subjectsStore = createSubjectsStore();
