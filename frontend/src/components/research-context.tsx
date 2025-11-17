'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react'
import type { ResearchState, CanvasSession } from '@/lib/types'
import { useCoAgent } from "@copilotkit/react-core";
import { useCanvasSessions } from '@/lib/hooks/useCanvasSessions';

interface ResearchContextType {
    state: ResearchState;
    setResearchState: (newState: ResearchState | ((prevState: ResearchState) => ResearchState)) => void
    sourcesModalOpen: boolean
    setSourcesModalOpen: (open: boolean) => void
    runAgent: () => void
    // Session management
    sessions: CanvasSession[];
    activeSessionId: string | null;
    activeSession: CanvasSession | null;
    createSession: (title?: string) => void;
    deleteSession: (id: string) => void;
    renameSession: (id: string, newTitle: string) => void;
    switchSession: (id: string) => void;
    clearActiveSession: () => void;
}

const ResearchContext = createContext<ResearchContextType | undefined>(undefined)

export function ResearchProvider({ children }: { children: ReactNode }) {
    const [sourcesModalOpen, setSourcesModalOpen] = useState<boolean>(false)
    const { state: coAgentState, setState: setCoAgentsState, run } = useCoAgent<ResearchState>({
        name: 'agent',
        initialState: {},
    });

    const sessionManager = useCanvasSessions();
    const {
        sessions,
        activeSessionId,
        activeSession,
        createSession: createSessionBase,
        updateSession,
        deleteSession: deleteSessionBase,
        renameSession,
        switchSession: switchSessionBase,
        clearActiveSession,
    } = sessionManager;

    // Track if we're currently switching sessions to avoid unnecessary updates
    const isSwitchingRef = useRef(false);
    const lastSessionIdRef = useRef<string | null>(null);

    // When active session changes, load its state into CopilotKit
    useEffect(() => {
        if (activeSessionId !== lastSessionIdRef.current) {
            isSwitchingRef.current = true;
            lastSessionIdRef.current = activeSessionId;

            if (activeSession) {
                // Load session state into CopilotKit
                setCoAgentsState(activeSession.state);
            } else {
                // Clear state if no active session
                setCoAgentsState({
                    title: '',
                    proposal: null,
                    outline: {},
                    sections: [],
                    footnotes: '',
                    sources: {},
                    tool: '',
                    logs: [],
                    messages: []
                });
            }

            // Allow updates again after a short delay
            setTimeout(() => {
                isSwitchingRef.current = false;
            }, 100);
        }
    }, [activeSessionId, activeSession, setCoAgentsState]);

    // When CopilotKit state changes, update the active session
    useEffect(() => {
        // Don't update during session switches or if there's no active session
        if (isSwitchingRef.current || !activeSessionId) {
            return;
        }

        const coAgentsStateEmpty = Object.keys(coAgentState).length < 1;
        if (!coAgentsStateEmpty) {
            updateSession(activeSessionId, coAgentState);
        }
    }, [coAgentState, activeSessionId, updateSession]);

    // Wrapper for createSession that also switches to it
    const createSession = (title?: string) => {
        createSessionBase(title);
    };

    // Wrapper for switchSession
    const switchSession = (id: string) => {
        switchSessionBase(id);
    };

    // Wrapper for deleteSession
    const deleteSession = (id: string) => {
        deleteSessionBase(id);
    };

    return (
        <ResearchContext.Provider value={{
            state: coAgentState,
            setResearchState: setCoAgentsState as ResearchContextType['setResearchState'],
            setSourcesModalOpen,
            sourcesModalOpen,
            runAgent: run,
            sessions,
            activeSessionId,
            activeSession,
            createSession,
            deleteSession,
            renameSession,
            switchSession,
            clearActiveSession,
        }}>
            {children}
        </ResearchContext.Provider>
    )
}

export function useResearch() {
    const context = useContext(ResearchContext)
    if (context === undefined) {
        throw new Error('useResearch must be used within a ResearchProvider')
    }
    return context
}