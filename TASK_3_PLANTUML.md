# Implementation Plan: Phase 3 — Mapas Mentais PlantUML (Overdelivery)

## Current Status
- [x] Database schema for `mindMapPuml` in `topics`.
- [x] Initial `PlantUMLRenderer` component.
- [x] Initial `TopicMindMapEditor` component.
- [x] Integration with `PreVoo.svelte` and `subjects/[id]`.

## Overdelivery Enhancements
### 1. Smart Template Engine 🧠
- [ ] Upgrade `TopicMindMapEditor` to fetch real `lessons` for the topic.
- [ ] Generate a `mindmap` syntax based on actual lesson titles instead of placeholders.
- [ ] Integrate this more deeply with the "Edital" weight.

### 2. UI/UX Excellence ✨
- [ ] Add smooth transitions (Svelte 5) to the mind map container.
- [ ] Implement a "Copy image URL" button in the renderer.
- [ ] Polish the editor UI with better spacing and visual feedback.

### 3. Verification & Deployment 🚀
- [ ] Create Vitest unit tests for the template generation logic.
- [ ] Commit and Push to `origin master`.
- [ ] Verify the deploy on Vercel: `https://studypro-six.vercel.app/`.

## Tasks

### T3.1: Enhance TopicMindMapEditor.svelte 🛠️
- [ ] Implement `fetchLessonsForTemplate`.
- [ ] Update `generateMindMapTemplate` to be smart.
- [ ] Refine the template selection UI.

### T3.2: Polish PlantUMLRenderer.svelte 🎨
- [ ] Add copy-to-clipboard functionality for the image URL.
- [ ] Improve error handling for offline mode with better visual cues.

### T3.3: Global Verification 🧪
- [ ] Verify integration in the Study flow.
- [ ] Deploy and verify on Vercel.
