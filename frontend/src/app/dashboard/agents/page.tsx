"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAgents, getProperties } from "@/lib/api";
import type { Agent } from "@/lib/types";

interface AgentCardData {
  agent: Agent;
  assignedCount: number;
}

export default function AgentsPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<AgentCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const people = await getAgents();
        const counts = await Promise.all(
          people.map((agent) =>
            getProperties({ agent_id: agent.id, page: 1, limit: 1 }),
          ),
        );
        if (active)
          setAgents(
            people.map((agent, index) => ({
              agent,
              assignedCount: counts[index]?.total ?? 0,
            })),
          );
      } catch (cause) {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Agents could not be loaded.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    if (user?.role === "admin" || user?.role === "manager") void load();
    return () => {
      active = false;
    };
  }, [user]);

  if (user?.role === "agent")
    return (
      <div className="notice" role="alert">
        You do not have permission to view the agent directory.
      </div>
    );
  if (error)
    return (
      <div className="notice" role="alert">
        {error}
      </div>
    );

  return (
    <div className="fade-up">
      <div className="page-heading">
        <div>
          <div className="eyebrow">People</div>
          <h1 className="serif">Agents</h1>
          <p className="page-description">
            Your property team and their current assignments.
          </p>
        </div>
        <span className="badge">{agents.length} agents</span>
      </div>
      {loading ? (
        <div className="loading-state">
          <span className="spinner" /> Loading agents
        </div>
      ) : agents.length === 0 ? (
        <div className="panel empty-state">
          <span className="empty-mark">◉</span>
          <div className="empty-title">No agents found.</div>
          <span>Agent accounts will appear here.</span>
        </div>
      ) : (
        <div className="agent-grid">
          {agents.map(({ agent, assignedCount }, index) => (
            <article
              className={`panel agent-card fade-up delay-${Math.min(index + 1, 3)}`}
              key={agent.id}
            >
              <div className="agent-card-head">
                <span className="avatar">
                  {agent.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <div>
                  <div className="quick-item-title">{agent.name}</div>
                  <div className="quick-item-meta">{agent.email}</div>
                </div>
              </div>
              <div className="agent-count">
                <span>Assigned properties</span>
                <strong>{assignedCount}</strong>
              </div>
              <div style={{ marginTop: 13 }}>
                <span
                  className={`badge ${agent.is_active ? "active" : "inactive"}`}
                >
                  {agent.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
