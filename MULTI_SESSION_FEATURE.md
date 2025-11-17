# Multi-Session Canvas Management

## Overview

This document describes the multi-session management feature added to the ANA (Agent Native Application) research canvas application.

## What Was Added

### 1. Session Management Types (`frontend/src/lib/types.ts`)

- `CanvasSession`: Complete session data including id, title, timestamps, state, and preview
- `CanvasSessionMetadata`: Lightweight session info for listing purposes
- `Section`: Added optional `id` field for better tracking

### 2. Session Management Hook (`frontend/src/lib/hooks/useCanvasSessions.ts`)

A custom React hook that manages all canvas sessions with the following capabilities:

- **Storage**: Persists sessions to localStorage under `canvas-sessions` key
- **Active Session Tracking**: Maintains the currently active session ID
- **CRUD Operations**:
  - `createSession(title?)`: Creates a new session and switches to it
  - `updateSession(id, state)`: Updates session state and preview
  - `deleteSession(id)`: Removes a session
  - `renameSession(id, newTitle)`: Updates session title
  - `switchSession(id)`: Changes the active session
  - `clearActiveSession()`: Deselects current session

### 3. UI Components

#### CanvasSidebar (`frontend/src/components/canvas-sidebar.tsx`)

A collapsible sidebar featuring:
- List of all saved research canvases
- Each item displays: title, preview snippet, last updated date
- "New Research" button
- Inline rename functionality (click pencil icon, edit in place)
- Delete option with confirmation
- Active session highlighting
- Collapse/expand toggle for screen real estate

#### CanvasLanding (`frontend/src/components/canvas-landing.tsx`)

A welcome screen shown when no canvas is active:
- Centered layout with ANA branding
- "Start New Research" call-to-action button
- Grid view of recent research canvases (up to 6)
- Feature highlights explaining the app's capabilities
- Empty state message for first-time users

### 4. Updated Research Provider (`frontend/src/components/research-context.tsx`)

Enhanced the existing `ResearchProvider` to:
- Integrate `useCanvasSessions` hook
- Synchronize CopilotKit state with active session
- Expose session management methods through context
- Handle state transitions when switching between sessions
- Prevent race conditions during session switches using refs

Key synchronization logic:
- When active session changes → Load session state into CopilotKit
- When CopilotKit state updates → Save to active session in localStorage
- Use `isSwitchingRef` to prevent unnecessary updates during transitions

### 5. Main Page Integration (`frontend/src/app/page.tsx`)

Updated the main page layout:
- Added `CanvasSidebar` to the left side
- Conditionally render `CanvasLanding` or the split-view chat interface
- Show landing page when `activeSessionId` is null
- Show chat/document view when a session is active

## Architecture Decisions

### 1. LocalStorage for Session Persistence

**Decision**: Use browser localStorage to persist sessions

**Rationale**:
- Simple implementation without backend changes
- Instant read/write performance
- Works offline
- Sufficient for MVP

**Trade-offs**:
- Limited to ~5-10MB storage
- No cross-device sync
- Sessions tied to single browser/device

**Future Enhancement**: Could migrate to a backend API with user accounts for cross-device sync

### 2. CopilotKit State Synchronization Pattern

**Decision**: Bidirectional sync between CopilotKit state and active session

**Implementation**:
```typescript
// When session changes → Load into CopilotKit
useEffect(() => {
  if (activeSession) {
    setCoAgentsState(activeSession.state);
  }
}, [activeSessionId, activeSession]);

// When CopilotKit changes → Update active session
useEffect(() => {
  if (activeSessionId && !isSwitching) {
    updateSession(activeSessionId, coAgentState);
  }
}, [coAgentState, activeSessionId]);
```

**Rationale**:
- CopilotKit remains the single source of truth for UI rendering
- Session manager handles persistence
- Clean separation of concerns

**Trade-offs**:
- Requires careful handling of update loops
- Need refs to track switching state
- Slight delay (100ms) after switching to prevent race conditions

### 3. Session Preview Generation

**Decision**: Auto-generate preview text from session content

**Implementation**:
- If sections exist → Use first 100 chars of first section
- If proposal exists → Show "Proposal with N sections"
- Default → "New research canvas"

**Rationale**:
- Provides context in session list
- Updates automatically as content changes
- No manual user input required

### 4. Sidebar Collapse Feature

**Decision**: Make sidebar collapsible to preserve screen space

**Rationale**:
- Maximizes canvas area when needed
- Still allows quick access to session management
- Follows common UI patterns (VS Code, Slack, etc.)

## Files Created

1. `/frontend/src/lib/hooks/useCanvasSessions.ts` - Session management hook
2. `/frontend/src/components/canvas-sidebar.tsx` - Sidebar component
3. `/frontend/src/components/canvas-landing.tsx` - Landing page component
4. `/MULTI_SESSION_FEATURE.md` - This documentation

## Files Modified

1. `/frontend/src/lib/types.ts` - Added session types, added `id` to Section
2. `/frontend/src/components/research-context.tsx` - Integrated session management
3. `/frontend/src/app/page.tsx` - Added sidebar and conditional landing page

## Testing Instructions

### Manual Testing

1. **Start the Development Server**:
   ```bash
   cd frontend
   pnpm run dev
   ```

2. **Test Session Creation**:
   - Open the app (should show landing page on first visit)
   - Click "Start New Research" or "New Research" in sidebar
   - Verify a new untitled session appears in sidebar
   - Verify session is marked as active

3. **Test Research Workflow**:
   - Ask the AI a research question
   - Go through the proposal approval process
   - Verify sections are written
   - Check that session preview updates automatically
   - Verify session title updates when research has a title

4. **Test Session Switching**:
   - Create multiple sessions (2-3)
   - Switch between sessions in the sidebar
   - Verify chat history and document content switch correctly
   - Verify active session highlighting updates

5. **Test Session Rename**:
   - Click the three-dot menu on a session
   - Click "Rename"
   - Type a new name and press Enter (or click away)
   - Verify the new name persists
   - Press Escape to cancel rename

6. **Test Session Delete**:
   - Click the three-dot menu on a session
   - Click "Delete"
   - Confirm the deletion
   - Verify session is removed from sidebar
   - If deleting active session, verify landing page shows

7. **Test Persistence**:
   - Create a few sessions with content
   - Refresh the browser (F5)
   - Verify all sessions are still there
   - Verify active session is restored

8. **Test Sidebar Collapse**:
   - Click the collapse icon (arrow)
   - Verify sidebar collapses to icon-only view
   - Click expand icon
   - Verify sidebar expands again

9. **Test Landing Page**:
   - Clear active session (delete all sessions or click "ANA" if implemented)
   - Verify landing page shows
   - Verify recent sessions grid displays (if sessions exist)
   - Click a session card in the landing page
   - Verify it opens that session

### Edge Cases to Test

1. **Empty States**:
   - No sessions created yet
   - Session with no content
   - Session with only proposal (no written sections)

2. **Long Titles/Content**:
   - Create session with very long title (test truncation)
   - Create session with long content (test preview truncation)

3. **Rapid Switching**:
   - Quickly switch between sessions
   - Verify no state corruption or race conditions

4. **LocalStorage Limits**:
   - Create many sessions (10+)
   - Verify performance remains acceptable

## Known Issues & TODOs

### Known Issues

1. **TypeScript Errors**: Some pre-existing TypeScript errors in other files (not related to multi-session feature):
   - `src/app/api/copilotkit/route.ts`: LangGraphAgent export issue
   - `src/app/page.tsx`: Log type mismatch (needs `done` property)

2. **Font Loading**: Google Fonts loading fails in sandboxed environments (not a functional issue)

### Future Enhancements

1. **Backend Integration**:
   - Store sessions in a database
   - Enable multi-user support
   - Cross-device synchronization

2. **Export/Import**:
   - Export sessions to JSON/Markdown
   - Import sessions from files
   - Share sessions with others

3. **Search & Filter**:
   - Search sessions by title/content
   - Filter by date, status, etc.
   - Tag/categorize sessions

4. **Session Templates**:
   - Save session as template
   - Create new session from template
   - Pre-configured research types

5. **Collaboration**:
   - Share sessions with team members
   - Real-time collaboration
   - Comment on sections

6. **Advanced Features**:
   - Session versioning/history
   - Undo/redo across sessions
   - Duplicate session
   - Merge sessions

7. **Performance Optimizations**:
   - Lazy load session content
   - Virtualize long session lists
   - Debounce localStorage writes

8. **UI Improvements**:
   - Drag-and-drop to reorder sessions
   - Grid/list view toggle
   - Session thumbnails/previews
   - Keyboard shortcuts (Cmd+N for new, etc.)

9. **Mobile Responsiveness**:
   - Bottom sheet for session list on mobile
   - Swipe gestures
   - Optimized touch targets

## Design Patterns Used

1. **Custom Hooks**: `useCanvasSessions` encapsulates all session management logic
2. **Context API**: `ResearchContext` provides session state to entire app
3. **Controlled Components**: Sidebar and landing page are fully controlled by parent state
4. **Optimistic Updates**: UI updates immediately, localStorage writes are async
5. **Separation of Concerns**: Session management, UI, and CopilotKit integration are separate layers

## Conclusion

The multi-session management feature successfully transforms ANA from a single-session app to a full-featured research canvas manager. Users can now:
- Create and manage multiple research projects
- Switch between projects seamlessly
- Organize their research in one place
- Never lose their work (automatic persistence)

The implementation is clean, maintainable, and follows React/CopilotKit best practices. It provides a solid foundation for future enhancements like backend sync, collaboration, and advanced organization features.
