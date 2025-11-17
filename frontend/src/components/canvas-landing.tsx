'use client'

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, FileText, Clock, Sparkles } from 'lucide-react';
import type { CanvasSession } from '@/lib/types';

interface CanvasLandingProps {
    recentSessions: CanvasSession[];
    onCreateSession: () => void;
    onSelectSession: (id: string) => void;
}

export function CanvasLanding({
    recentSessions,
    onCreateSession,
    onSelectSession,
}: CanvasLandingProps) {
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="h-full flex items-center justify-center bg-[#FAF9F6] p-8">
            <div className="max-w-4xl w-full">
                {/* Welcome Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                        <Sparkles className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold text-[#3D2B1F] mb-4">
                        Welcome to ANA
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Your AI-powered research assistant. Create comprehensive, well-sourced research reports through an interactive canvas experience.
                    </p>
                </div>

                {/* Action Button */}
                <div className="flex justify-center mb-16">
                    <Button
                        onClick={onCreateSession}
                        size="lg"
                        className="text-lg px-8 py-6 h-auto"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Start New Research
                    </Button>
                </div>

                {/* Recent Canvases */}
                {recentSessions.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <h2 className="text-xl font-semibold text-[#3D2B1F]">
                                Recent Research
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recentSessions.slice(0, 6).map((session) => (
                                <Card
                                    key={session.id}
                                    className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                                    onClick={() => onSelectSession(session.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-[#3D2B1F] truncate mb-1">
                                                {session.title || 'Untitled Research'}
                                            </h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                {session.preview || 'No content yet'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(session.updatedAt)}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State for No Recent Canvases */}
                {recentSessions.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground mb-2">No research canvases yet</p>
                        <p className="text-sm text-muted-foreground">
                            Click the button above to start your first research project
                        </p>
                    </div>
                )}

                {/* Features */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-[#3D2B1F] mb-2">AI-Powered Research</h3>
                        <p className="text-sm text-muted-foreground">
                            Intelligent web search and content extraction
                        </p>
                    </div>
                    <div>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-[#3D2B1F] mb-2">Interactive Canvas</h3>
                        <p className="text-sm text-muted-foreground">
                            Real-time collaboration with AI
                        </p>
                    </div>
                    <div>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <Clock className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-[#3D2B1F] mb-2">Multiple Sessions</h3>
                        <p className="text-sm text-muted-foreground">
                            Manage multiple research projects seamlessly
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
