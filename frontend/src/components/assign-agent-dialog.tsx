"use client";

import { useEffect, useState } from "react";
import { ApiError, assignAgent, getAgents } from "@/lib/api";
import type { Agent } from "@/lib/types";

interface AssignAgentDialogProps {
  propertyId: number;
  assignedAgentId: number | null;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignAgentDialog({
  propertyId,
  assignedAgentId,
  onClose,
  onAssigned,
}: AssignAgentDialogProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState(
    assignedAgentId ? String(assignedAgentId) : "",
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getAgents()
      .then((result) => {
        if (active) setAgents(result);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof ApiError
              ? cause.message
              : "Could not load agents.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    try {
      await assignAgent(propertyId, agentId ? Number(agentId) : null);
      onAssigned();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Assignment could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) =>
        event.target === event.currentTarget && !saving && onClose()
      }
    >
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-title"
      >
        <div className="eyebrow">Property #{propertyId}</div>
        <h2 id="assign-title">Assign an agent</h2>
        <p>
          Choose the agent responsible for this property, or clear the
          assignment.
        </p>
        {error && (
          <div className="notice" role="alert">
            {error}
          </div>
        )}
        <div className="field">
          <label htmlFor="assigned-agent">Agent</label>
          <select
            id="assigned-agent"
            className="filter-control"
            value={agentId}
            disabled={loading || saving}
            onChange={(event) => setAgentId(event.target.value)}
          >
            <option value="">Unassigned</option>
            {agents
              .filter((agent) => agent.is_active)
              .map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} · {agent.email}
                </option>
              ))}
          </select>
          {loading && <span className="muted">Loading agents…</span>}
        </div>
        <div className="dialog-actions">
          <button
            className="button secondary"
            type="button"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="button"
            type="button"
            disabled={loading || saving}
            onClick={save}
          >
            {saving ? (
              <>
                <span className="spinner" /> Saving
              </>
            ) : (
              "Save assignment"
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
