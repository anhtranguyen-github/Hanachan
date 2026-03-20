'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, ChevronRight, Brain, Server, CheckCircle2, Loader2, Wrench } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface TraceEvent {
    type: string;
    content: string;
}

interface MessageTracesProps {
    traces: TraceEvent[];
    isStreaming?: boolean;
}

export function MessageTraces({ traces, isStreaming = false }: MessageTracesProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!traces || traces.length === 0) return null;

    // Helper to get an icon and styling based on the trace content
    const getTraceStyle = (content: string) => {
        const lower = content.toLowerCase();
        if (lower.includes('orchestrator') || lower.includes('reasoning') || lower.includes('memory_worker')) {
            return { icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' };
        }
        if (lower.includes('sql') || lower.includes('database')) {
            return { icon: Server, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' };
        }
        if (lower.includes('tool') || lower.includes('executing')) {
            return { icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' };
        }
        return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' };
    };

    // If streaming, just show the last active trace as a live indicator
    if (isStreaming) {
        const lastTrace = traces[traces.length - 1];
        const style = getTraceStyle(lastTrace.content);
        const Icon = style.icon;

        return (
            <div className="flex flex-col items-start mb-2 max-w-[85%] lg:max-w-[70%]">
                <div className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm text-[10px] font-bold tracking-wide", style.bg, style.border, style.color)}>
                    <Loader2 size={12} className="animate-spin" />
                    <span className="truncate">{lastTrace.content}</span>
                </div>
            </div>
        );
    }

    // If done streaming, show an accordion to view the thought process
    return (
        <div className="flex flex-col items-start mt-2 mb-1 max-w-[85%] lg:max-w-[70%]">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#A0AEC0] hover:text-[#3E4A61] hover:bg-[#F7FAFC] rounded-lg transition-colors"
            >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Agent Reasoning ({traces.length} steps)
            </button>
            
            {isExpanded && (
                <div className="mt-2 w-full space-y-2 pl-2 border-l-2 border-border/50">
                    {traces.map((trace, idx) => {
                        const style = getTraceStyle(trace.content);
                        const Icon = style.icon;
                        return (
                            <div key={idx} className="flex gap-2.5 items-start">
                                <div className={clsx("w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border", style.bg, style.border, style.color)}>
                                    <Icon size={10} />
                                </div>
                                <div className="text-[11px] font-medium leading-relaxed text-foreground/70 bg-[#F8FAFC] px-3 py-2 rounded-xl border border-border/40 w-full overflow-hidden prose prose-sm prose-p:my-1 prose-pre:my-1 prose-pre:p-2 prose-pre:bg-white prose-pre:border max-w-none break-words">
                                     <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {trace.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
