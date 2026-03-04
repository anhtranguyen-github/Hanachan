"use client";

import { useState } from "react";
import { getUserAgentTraces, getUserEpisodicMemory, getUserSemanticMemory } from "@/features/admin/service";
import { Cpu, Search, Brain, Network, Terminal } from "lucide-react";

interface Trace {
  id: string;
  agent_name: string;
  trace_type: string;
  step_number: number;
  input_data: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  latency_ms: number | null;
  model: string | null;
  tokens_used: number | null;
  error_message: string | null;
  created_at: string;
}

export default function AIDebugPage() {
  const [userId, setUserId] = useState("");
  const [activeTab, setActiveTab] = useState<"traces" | "episodic" | "semantic">("traces");
  const [traces, setTraces] = useState<Trace[]>([]);
  const [episodicMemories, setEpisodicMemories] = useState<{ id: string; content: string; importance: number; created_at: string }[]>([]);
  const [semanticGraph, setSemanticGraph] = useState<{ nodes: unknown[]; relationships: unknown[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      if (activeTab === "traces") {
        const result = await getUserAgentTraces(userId);
        setTraces(result.traces);
      } else if (activeTab === "episodic") {
        const result = await getUserEpisodicMemory(userId);
        setEpisodicMemories(result.memories);
      } else if (activeTab === "semantic") {
        const result = await getUserSemanticMemory(userId);
        setSemanticGraph(result.graph);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Debugging</h1>
        <p className="text-slate-400">Inspect AI behavior and memory</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!userId || loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Loading..." : "Inspect"}
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-800">
        {[
          { id: "traces", label: "Agent Traces", icon: Terminal },
          { id: "episodic", label: "Episodic Memory", icon: Brain },
          { id: "semantic", label: "Semantic Memory", icon: Network },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {activeTab === "traces" && (
        <div className="space-y-4">
          {traces.length === 0 ? (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
              <Cpu className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">Enter a user ID to view agent traces</p>
            </div>
          ) : (
            traces.map((trace) => (
              <div key={trace.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-xs font-medium">
                      {trace.agent_name}
                    </span>
                    <span className="text-slate-500 text-sm">Step {trace.step_number}</span>
                  </div>
                  <span className="text-slate-500 text-xs">{new Date(trace.created_at).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-slate-500">Type:</span>
                    <span className="text-slate-300 ml-2">{trace.trace_type}</span>
                  </div>
                  {trace.model && (
                    <div>
                      <span className="text-slate-500">Model:</span>
                      <span className="text-slate-300 ml-2">{trace.model}</span>
                    </div>
                  )}
                  {trace.latency_ms && (
                    <div>
                      <span className="text-slate-500">Latency:</span>
                      <span className="text-slate-300 ml-2">{trace.latency_ms}ms</span>
                    </div>
                  )}
                </div>
                {trace.input_data && (
                  <div className="mb-2">
                    <span className="text-slate-500 text-xs uppercase">Input</span>
                    <pre className="mt-1 p-2 bg-slate-800 rounded text-xs text-slate-300 overflow-x-auto">
                      {JSON.stringify(trace.input_data, null, 2)}
                    </pre>
                  </div>
                )}
                {trace.output_data && (
                  <div>
                    <span className="text-slate-500 text-xs uppercase">Output</span>
                    <pre className="mt-1 p-2 bg-slate-800 rounded text-xs text-slate-300 overflow-x-auto">
                      {JSON.stringify(trace.output_data, null, 2)}
                    </pre>
                  </div>
                )}
                {trace.error_message && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                    {trace.error_message}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "episodic" && (
        <div className="space-y-4">
          {episodicMemories.length === 0 ? (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
              <Brain className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">Enter a user ID to view episodic memories</p>
            </div>
          ) : (
            episodicMemories.map((memory) => (
              <div key={memory.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <p className="text-slate-300">{memory.content}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                  <span>Importance: {memory.importance}</span>
                  <span>{new Date(memory.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "semantic" && (
        <div className="space-y-4">
          {!semanticGraph ? (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
              <Network className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">Enter a user ID to view semantic memory graph</p>
            </div>
          ) : (
            <>
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Nodes ({semanticGraph.nodes.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {semanticGraph.nodes.map((node: { id: string; type: string }, index) => (
                    <div key={index} className="p-2 bg-slate-800 rounded text-sm">
                      <span className="text-indigo-400">{node.type}</span>
                      <span className="text-slate-300 ml-2">{node.id}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Relationships ({semanticGraph.relationships.length})</h3>
                <div className="space-y-2">
                  {semanticGraph.relationships.map((rel: { source: string; target: string; type: string }, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="text-slate-300">{rel.source}</span>
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-xs">{rel.type}</span>
                      <span className="text-slate-300">{rel.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
