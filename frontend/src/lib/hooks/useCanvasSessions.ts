import { useState, useEffect, useCallback } from 'react';
import type { CanvasSession, CanvasSessionMetadata, ResearchState } from '@/lib/types';

const SESSIONS_INDEX_KEY = 'canvas-sessions-index';
const ACTIVE_SESSION_KEY = 'active-canvas-session-id';
const SESSION_KEY_PREFIX = 'canvas-session-';

interface UseCanvasSessionsReturn {
    sessions: CanvasSession[];
    activeSessionId: string | null;
    activeSession: CanvasSession | null;
    createSession: (title?: string) => CanvasSession;
    updateSession: (id: string, state: ResearchState) => void;
    deleteSession: (id: string) => void;
    renameSession: (id: string, newTitle: string) => void;
    switchSession: (id: string) => void;
    clearActiveSession: () => void;
}

function generateId(): string {
    return `canvas-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getInitialState(): ResearchState {
    return {
        title: '',
        proposal: null,
        outline: {},
        sections: [],
        footnotes: '',
        sources: {},
        tool: '',
        logs: [],
        messages: []
    };
}

function generatePreview(state: ResearchState): string {
    if (state.sections && state.sections.length > 0) {
        // Get first section content preview
        const firstSection = state.sections[0];
        const contentPreview = firstSection.content
            .replace(/\n/g, ' ')
            .substring(0, 100);
        return contentPreview + (firstSection.content.length > 100 ? '...' : '');
    }
    if (state.proposal && state.proposal.sections) {
        const sectionCount = Object.keys(state.proposal.sections).length;
        return `Proposal with ${sectionCount} section${sectionCount !== 1 ? 's' : ''}`;
    }
    return 'New research canvas';
}

// Helper functions for individual session storage
function getSessionKey(id: string): string {
    return `${SESSION_KEY_PREFIX}${id}`;
}

function saveSessionToStorage(session: CanvasSession): void {
    try {
        localStorage.setItem(getSessionKey(session.id), JSON.stringify(session));
    } catch (error) {
        console.error(`Error saving session ${session.id}:`, error);
        throw error;
    }
}

function loadSessionFromStorage(id: string): CanvasSession | null {
    try {
        const data = localStorage.getItem(getSessionKey(id));
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Error loading session ${id}:`, error);
        return null;
    }
}

function deleteSessionFromStorage(id: string): void {
    try {
        localStorage.removeItem(getSessionKey(id));
    } catch (error) {
        console.error(`Error deleting session ${id}:`, error);
    }
}

function saveSessionsIndex(index: CanvasSessionMetadata[]): void {
    try {
        localStorage.setItem(SESSIONS_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
        console.error('Error saving sessions index:', error);
        throw error;
    }
}

function loadSessionsIndex(): CanvasSessionMetadata[] {
    try {
        const data = localStorage.getItem(SESSIONS_INDEX_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading sessions index:', error);
        return [];
    }
}

export function useCanvasSessions(): UseCanvasSessionsReturn {
    const [sessionsMetadata, setSessionsMetadata] = useState<CanvasSessionMetadata[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [activeSession, setActiveSession] = useState<CanvasSession | null>(null);

    // Load sessions index and active session on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const index = loadSessionsIndex();
            setSessionsMetadata(index);

            const storedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);
            if (storedActiveId) {
                setActiveSessionId(storedActiveId);
                const session = loadSessionFromStorage(storedActiveId);
                if (session) {
                    setActiveSession(session);
                }
            }
        } catch (error) {
            console.error('Error loading canvas sessions:', error);
        }
    }, []);

    // Load active session when activeSessionId changes
    useEffect(() => {
        if (!activeSessionId) {
            setActiveSession(null);
            return;
        }

        const session = loadSessionFromStorage(activeSessionId);
        if (session) {
            setActiveSession(session);
        }
    }, [activeSessionId]);

    // Save active session ID to localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            if (activeSessionId) {
                localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
            } else {
                localStorage.removeItem(ACTIVE_SESSION_KEY);
            }
        } catch (error) {
            console.error('Error saving active session ID:', error);
        }
    }, [activeSessionId]);

    const createSession = useCallback((title?: string): CanvasSession => {
        const newSession: CanvasSession = {
            id: generateId(),
            title: title || 'Untitled Research',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            state: getInitialState(),
            preview: 'New research canvas'
        };

        // Save the session to its own storage key
        saveSessionToStorage(newSession);

        // Update the index
        const newMetadata: CanvasSessionMetadata = {
            id: newSession.id,
            title: newSession.title,
            createdAt: newSession.createdAt,
            updatedAt: newSession.updatedAt,
            preview: newSession.preview
        };
        const updatedIndex = [newMetadata, ...sessionsMetadata];
        setSessionsMetadata(updatedIndex);
        saveSessionsIndex(updatedIndex);

        // Set as active session
        setActiveSessionId(newSession.id);
        setActiveSession(newSession);

        return newSession;
    }, [sessionsMetadata]);

    const updateSession = useCallback((id: string, state: ResearchState) => {
        const session = loadSessionFromStorage(id);
        if (!session) return;

        const updatedSession: CanvasSession = {
            ...session,
            title: state.title || session.title,
            updatedAt: Date.now(),
            state,
            preview: generatePreview(state)
        };

        // Save the updated session
        saveSessionToStorage(updatedSession);

        // Update the index
        const updatedIndex = sessionsMetadata.map(meta => {
            if (meta.id === id) {
                return {
                    id: updatedSession.id,
                    title: updatedSession.title,
                    createdAt: updatedSession.createdAt,
                    updatedAt: updatedSession.updatedAt,
                    preview: updatedSession.preview
                };
            }
            return meta;
        });
        setSessionsMetadata(updatedIndex);
        saveSessionsIndex(updatedIndex);

        // Update active session if it's the one being updated
        if (activeSessionId === id) {
            setActiveSession(updatedSession);
        }
    }, [sessionsMetadata, activeSessionId]);

    const deleteSession = useCallback((id: string) => {
        // Delete the session from storage
        deleteSessionFromStorage(id);

        // Update the index
        const updatedIndex = sessionsMetadata.filter(meta => meta.id !== id);
        setSessionsMetadata(updatedIndex);
        saveSessionsIndex(updatedIndex);

        // If we're deleting the active session, clear it
        if (activeSessionId === id) {
            setActiveSessionId(null);
            setActiveSession(null);
        }
    }, [sessionsMetadata, activeSessionId]);

    const renameSession = useCallback((id: string, newTitle: string) => {
        const session = loadSessionFromStorage(id);
        if (!session) return;

        const updatedSession: CanvasSession = {
            ...session,
            title: newTitle,
            updatedAt: Date.now()
        };

        // Save the updated session
        saveSessionToStorage(updatedSession);

        // Update the index
        const updatedIndex = sessionsMetadata.map(meta => {
            if (meta.id === id) {
                return {
                    ...meta,
                    title: newTitle,
                    updatedAt: Date.now()
                };
            }
            return meta;
        });
        setSessionsMetadata(updatedIndex);
        saveSessionsIndex(updatedIndex);

        // Update active session if it's the one being renamed
        if (activeSessionId === id) {
            setActiveSession(updatedSession);
        }
    }, [sessionsMetadata, activeSessionId]);

    const switchSession = useCallback((id: string) => {
        setActiveSessionId(id);
    }, []);

    const clearActiveSession = useCallback(() => {
        setActiveSessionId(null);
        setActiveSession(null);
    }, []);

    // Convert metadata to full sessions list for compatibility
    const sessions: CanvasSession[] = sessionsMetadata.map(meta => {
        // If this is the active session, use the cached version
        if (activeSession && activeSession.id === meta.id) {
            return activeSession;
        }
        // Otherwise, load from storage (lazy loading)
        const session = loadSessionFromStorage(meta.id);
        return session || {
            ...meta,
            state: getInitialState()
        } as CanvasSession;
    });

    return {
        sessions,
        activeSessionId,
        activeSession,
        createSession,
        updateSession,
        deleteSession,
        renameSession,
        switchSession,
        clearActiveSession
    };
}
