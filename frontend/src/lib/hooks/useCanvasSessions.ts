import { useState, useEffect, useCallback } from 'react';
import type { CanvasSession, ResearchState } from '@/lib/types';

const SESSIONS_STORAGE_KEY = 'canvas-sessions';
const ACTIVE_SESSION_KEY = 'active-canvas-session-id';

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

export function useCanvasSessions(): UseCanvasSessionsReturn {
    const [sessions, setSessions] = useState<CanvasSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    // Load sessions from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const storedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
            const storedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);

            if (storedSessions) {
                const parsed = JSON.parse(storedSessions);
                setSessions(parsed);
            }

            if (storedActiveId) {
                setActiveSessionId(storedActiveId);
            }
        } catch (error) {
            console.error('Error loading canvas sessions:', error);
        }
    }, []);

    // Save sessions to localStorage whenever they change
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
        } catch (error) {
            console.error('Error saving canvas sessions:', error);
        }
    }, [sessions]);

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

        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);

        return newSession;
    }, []);

    const updateSession = useCallback((id: string, state: ResearchState) => {
        setSessions(prev => prev.map(session => {
            if (session.id === id) {
                return {
                    ...session,
                    title: state.title || session.title,
                    updatedAt: Date.now(),
                    state,
                    preview: generatePreview(state)
                };
            }
            return session;
        }));
    }, []);

    const deleteSession = useCallback((id: string) => {
        setSessions(prev => prev.filter(session => session.id !== id));

        // If we're deleting the active session, clear it
        if (activeSessionId === id) {
            setActiveSessionId(null);
        }
    }, [activeSessionId]);

    const renameSession = useCallback((id: string, newTitle: string) => {
        setSessions(prev => prev.map(session => {
            if (session.id === id) {
                return {
                    ...session,
                    title: newTitle,
                    updatedAt: Date.now()
                };
            }
            return session;
        }));
    }, []);

    const switchSession = useCallback((id: string) => {
        setActiveSessionId(id);
    }, []);

    const clearActiveSession = useCallback(() => {
        setActiveSessionId(null);
    }, []);

    const activeSession = sessions.find(s => s.id === activeSessionId) || null;

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
