"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AssignAgentDialog } from "@/components/assign-agent-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAuth } from "@/lib/auth-context";
import { ApiError, deleteProperty, getProperty } from "@/lib/api";
import {
  formatDate,
  formatPrice,
  propertyLocation,
  statusClass,
} from "@/lib/format";
import type { Property } from "@/lib/types";

export default function PropertyDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      const loadedProperty = await getProperty(id);
      setProperty(loadedProperty);
      const updated = window.sessionStorage.getItem("crm-property-updated");
      if (updated) {
        setSuccess(`“${updated}” was updated successfully.`);
        window.sessionStorage.removeItem("crm-property-updated");
      }
      setError("");
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Property could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (Number.isInteger(id) && id > 0) {
      const timer = window.setTimeout(() => void load(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [id, load]);

  async function remove() {
    if (!property) return;
    setDeleting(true);
    try {
      await deleteProperty(property.id);
      window.sessionStorage.setItem("crm-property-deleted", property.title);
      router.replace("/dashboard/properties");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Property could not be deleted.",
      );
      setShowDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  if (!Number.isInteger(id) || id <= 0)
    return (
      <div className="notice" role="alert">
        Property not found.
      </div>
    );
  if (loading)
    return (
      <div className="loading-state">
        <span className="spinner" /> Loading property
      </div>
    );
  if (!property)
    return (
      <div className="notice" role="alert">
        {error || "Property not found."}
      </div>
    );
  if (user?.role === "agent" && property.assigned_agent_id !== user.id)
    return (
      <div className="notice" role="alert">
        This property is not assigned to you.
      </div>
    );

  const canManage = user?.role === "admin" || user?.role === "manager";
  const facts = [
    ["Property type", property.property_type],
    ["Listing type", property.listing_type],
    ["Bedrooms", String(property.bedrooms)],
    ["Bathrooms", String(property.bathrooms)],
    ["Area", `${Number(property.area).toLocaleString()} sq ft`],
    ["Status", property.status],
    ["City", property.city],
    ["Address", property.address || "Not provided"],
    ["Created", formatDate(property.created_at)],
    ["Updated", formatDate(property.updated_at)],
  ];

  return (
    <div className="fade-up">
      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="notice success" role="status">
          {success}
        </div>
      )}
      <section className="detail-hero">
        <div>
          <div className="eyebrow">
            {propertyLocation(property) || "Property details"}
          </div>
          <h1 className="serif">{property.title}</h1>
          <span className={`badge ${statusClass(property.status)}`}>
            {property.status}
          </span>
        </div>
        <div>
          <div className="detail-price">{formatPrice(property.price)}</div>
          <div className="muted" style={{ color: "#c3d0c5", marginTop: 7 }}>
            {property.listing_type} listing
          </div>
        </div>
        <div className="detail-actions">
          <Link
            className="button secondary"
            href={`/dashboard/properties/${id}/edit`}
          >
            Edit
          </Link>
          {canManage && (
            <button
              className="button secondary"
              type="button"
              onClick={() => setShowAssign(true)}
            >
              Assign agent
            </button>
          )}
          {user?.role === "admin" && (
            <button
              className="button danger"
              type="button"
              onClick={() => setShowDelete(true)}
            >
              Delete
            </button>
          )}
        </div>
      </section>
      <div className="detail-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Property information</h2>
              <p>Listing facts and details</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="facts-grid">
              {facts.map(([label, value]) => (
                <div className="fact" key={label}>
                  <div className="fact-label">{label}</div>
                  <div className="fact-value">{value}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "18px 13px 4px" }}>
              <div className="fact-label">Description</div>
              <p style={{ margin: "8px 0 0", lineHeight: 1.7 }}>
                {property.description || (
                  <span className="muted">No description provided.</span>
                )}
              </p>
            </div>
          </div>
        </section>
        <aside className="panel">
          <div className="panel-head">
            <div>
              <h2>Assignment</h2>
              <p>Property owner</p>
            </div>
          </div>
          <div className="panel-body">
            {property.assigned_agent ? (
              <div className="agent-card-head">
                <span className="avatar">
                  {property.assigned_agent.name
                    .split(/\s+/)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <div>
                  <div className="quick-item-title">
                    {property.assigned_agent.name}
                  </div>
                  <div className="quick-item-meta">
                    {property.assigned_agent.email}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="empty-state"
                style={{ minHeight: 110, padding: 0 }}
              >
                <div className="empty-title">Unassigned</div>
                <span>No agent selected yet.</span>
              </div>
            )}
          </div>
        </aside>
      </div>
      <div style={{ marginTop: 17 }}>
        <Link className="text-action" href="/dashboard/properties">
          ← Back to properties
        </Link>
      </div>
      {showDelete && (
        <ConfirmDialog
          title="Delete property?"
          message={`“${property.title}” will be removed from the property portfolio. This action cannot be undone.`}
          busy={deleting}
          onCancel={() => setShowDelete(false)}
          onConfirm={remove}
        />
      )}
      {showAssign && (
        <AssignAgentDialog
          propertyId={property.id}
          assignedAgentId={property.assigned_agent_id}
          onClose={() => setShowAssign(false)}
          onAssigned={() => {
            setSuccess("Agent assignment updated.");
            void load();
          }}
        />
      )}
    </div>
  );
}
