'use client'

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    PanelLeftClose,
    PanelLeft,
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    FileText
} from 'lucide-react';
import type { CanvasSession } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CanvasSidebarProps {
    sessions: CanvasSession[];
    activeSessionId: string | null;
    onCreateSession: () => void;
    onSelectSession: (id: string) => void;
    onDeleteSession: (id: string) => void;
    onRenameSession: (id: string, newTitle: string) => void;
}

export function CanvasSidebar({
    sessions,
    activeSessionId,
    onCreateSession,
    onSelectSession,
    onDeleteSession,
    onRenameSession,
}: CanvasSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    const handleStartEdit = (session: CanvasSession) => {
        setEditingId(session.id);
        setEditTitle(session.title);
    };

    const handleSaveEdit = (id: string) => {
        if (editTitle.trim()) {
            onRenameSession(id, editTitle.trim());
        }
        setEditingId(null);
        setEditTitle('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditTitle('');
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return 'Today';
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    if (isCollapsed) {
        return (
            <div className="w-12 h-full border-r border-black/10 bg-white flex flex-col items-center py-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(false)}
                    className="mb-4"
                >
                    <PanelLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCreateSession}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="w-64 h-full border-r border-black/10 bg-white flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-black/10 flex items-center justify-between">
                <h2 className="font-semibold text-sm text-[#3D2B1F]">Research Canvases</h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(true)}
                    className="h-8 w-8"
                >
                    <PanelLeftClose className="h-4 w-4" />
                </Button>
            </div>

            {/* New Canvas Button */}
            <div className="p-3 border-b border-black/10">
                <Button
                    onClick={onCreateSession}
                    className="w-full justify-start gap-2"
                    variant="default"
                >
                    <Plus className="h-4 w-4" />
                    New Research
                </Button>
            </div>

            {/* Sessions List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {sessions.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p>No canvases yet</p>
                            <p className="text-xs mt-1">Create your first research canvas</p>
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <div
                                key={session.id}
                                className={cn(
                                    "group rounded-lg p-3 cursor-pointer transition-colors hover:bg-accent",
                                    activeSessionId === session.id && "bg-accent"
                                )}
                                onClick={() => {
                                    if (editingId !== session.id) {
                                        onSelectSession(session.id);
                                    }
                                }}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        {editingId === session.id ? (
                                            <Input
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                onBlur={() => handleSaveEdit(session.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSaveEdit(session.id);
                                                    } else if (e.key === 'Escape') {
                                                        handleCancelEdit();
                                                    }
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                                className="h-7 text-sm"
                                            />
                                        ) : (
                                            <>
                                                <h3 className="font-medium text-sm text-[#3D2B1F] truncate">
                                                    {session.title || 'Untitled Research'}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {session.preview || 'No content yet'}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDate(session.updatedAt)}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    {editingId !== session.id && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStartEdit(session);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Are you sure you want to delete this canvas?')) {
                                                            onDeleteSession(session.id);
                                                        }
                                                    }}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
