"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError, deleteProperty, getAgents, getProperties } from "@/lib/api";
import { AssignAgentDialog } from "@/components/assign-agent-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatDate, formatPrice, statusClass } from "@/lib/format";
import type {
  Agent,
  Property,
  PropertyFilters,
  PaginationResponse,
} from "@/lib/types";

export default function PropertiesPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<PaginationResponse<Property> | null>(
    null,
  );
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filters, setFilters] = useState<PropertyFilters>({
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [assignTarget, setAssignTarget] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = user?.role === "admin" || user?.role === "manager";
  const canDelete = user?.role === "admin";

  const load = useCallback(async () => {
    try {
      setResult(await getProperties(filters));
      setError("");
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Properties could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const created = window.sessionStorage.getItem("crm-property-created");
      const deleted = window.sessionStorage.getItem("crm-property-deleted");
      if (created) {
        setSuccess(`“${created}” was created successfully.`);
        window.sessionStorage.removeItem("crm-property-created");
      } else if (deleted) {
        setSuccess(`“${deleted}” was deleted successfully.`);
        window.sessionStorage.removeItem("crm-property-deleted");
      }
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!canManage) return;
    getAgents()
      .then(setAgents)
      .catch(() => setAgents([]));
  }, [canManage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => ({
        ...current,
        search: searchInput.trim() || undefined,
        page: 1,
      }));
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  function changeFilter(
    key: "city" | "status" | "property_type" | "listing_type" | "agent_id",
    value: string,
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value ? (key === "agent_id" ? Number(value) : value) : undefined,
      page: 1,
    }));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      await deleteProperty(deleteTarget.id);
      setSuccess(`“${deleteTarget.title}” was deleted.`);
      setDeleteTarget(null);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Property could not be deleted.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = result?.pages ?? 0;
  const visiblePages = Array.from(
    { length: Math.max(0, Math.min(totalPages, 5)) },
    (_, index) => {
      const start = Math.max(1, Math.min(filters.page ?? 1, totalPages - 4));
      return start + index;
    },
  );

  return (
    <div className="fade-up">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Portfolio</div>
          <h1 className="serif">
            {user?.role === "agent" ? "My Properties" : "Properties"}
          </h1>
          <p className="page-description">
            Search, review, and manage your property listings.
          </p>
        </div>
        {canManage && (
          <Link className="button" href="/dashboard/properties/new">
            ＋ Add property
          </Link>
        )}
      </div>
      {success && (
        <div className="notice success" role="status">
          {success}
        </div>
      )}
      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}
      <section className="panel">
        <div className="filters">
          <div className="search-field">
            <span className="search-symbol" aria-hidden="true">
              ⌕
            </span>
            <input
              className="filter-control"
              aria-label="Search properties"
              placeholder="Search title, address, city…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <input
            className="filter-control"
            aria-label="Filter by city"
            placeholder="City"
            value={filters.city ?? ""}
            onChange={(event) => changeFilter("city", event.target.value)}
          />
          <select
            className="filter-control"
            aria-label="Filter by property type"
            value={filters.property_type ?? ""}
            onChange={(event) =>
              changeFilter("property_type", event.target.value)
            }
          >
            <option value="">All types</option>
            {[
              "apartment",
              "villa",
              "townhouse",
              "penthouse",
              "land",
              "commercial",
            ].map((item) => (
              <option key={item} value={item}>
                {item[0].toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>
          <select
            className="filter-control"
            aria-label="Filter by listing type"
            value={filters.listing_type ?? ""}
            onChange={(event) =>
              changeFilter("listing_type", event.target.value)
            }
          >
            <option value="">Sale or rent</option>
            <option value="sale">For sale</option>
            <option value="rent">For rent</option>
          </select>
          <select
            className="filter-control"
            aria-label="Filter by status"
            value={filters.status ?? ""}
            onChange={(event) => changeFilter("status", event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
          </select>
          {canManage && (
            <select
              className="filter-control"
              aria-label="Filter by agent"
              value={filters.agent_id ?? ""}
              onChange={(event) => changeFilter("agent_id", event.target.value)}
            >
              <option value="">All agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          )}
        </div>
        {loading ? (
          <div className="loading-state">
            <span className="spinner" /> Loading properties
          </div>
        ) : !result?.items.length ? (
          <div className="empty-state">
            <span className="empty-mark">⌂</span>
            <div className="empty-title">
              {user?.role === "agent"
                ? "No properties have been assigned to you yet."
                : "No properties found."}
            </div>
            <span>Try adjusting your search or filters.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Listing</th>
                  <th>Price</th>
                  <th>City</th>
                  <th>Beds</th>
                  <th>Baths</th>
                  <th>Area</th>
                  <th>Status</th>
                  <th>Assigned agent</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((property) => (
                  <tr key={property.id}>
                    <td>
                      <Link
                        className="property-title"
                        href={`/dashboard/properties/${property.id}`}
                      >
                        {property.title}
                      </Link>
                    </td>
                    <td>{property.property_type}</td>
                    <td>{property.listing_type}</td>
                    <td className="money">{formatPrice(property.price)}</td>
                    <td>{property.city}</td>
                    <td>{property.bedrooms}</td>
                    <td>{property.bathrooms}</td>
                    <td>{Number(property.area).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${statusClass(property.status)}`}>
                        {property.status}
                      </span>
                    </td>
                    <td>
                      {property.assigned_agent?.name ?? (
                        <span className="muted">Unassigned</span>
                      )}
                    </td>
                    <td>{formatDate(property.created_at)}</td>
                    <td>
                      <div className="table-actions">
                        <Link
                          className="text-action"
                          href={`/dashboard/properties/${property.id}`}
                        >
                          View
                        </Link>
                        <Link
                          className="text-action"
                          href={`/dashboard/properties/${property.id}/edit`}
                        >
                          Edit
                        </Link>
                        {canDelete && (
                          <button
                            className="text-action danger"
                            type="button"
                            onClick={() => setDeleteTarget(property)}
                          >
                            Delete
                          </button>
                        )}
                        {canManage && (
                          <button
                            className="text-action"
                            type="button"
                            onClick={() => setAssignTarget(property)}
                          >
                            Assign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {result && (
          <div className="pagination">
            <span>
              Showing{" "}
              {result.total === 0 ? 0 : (result.page - 1) * result.limit + 1}–
              {Math.min(result.page * result.limit, result.total)} of{" "}
              {result.total.toLocaleString()}
            </span>
            <div className="pagination-controls">
              <button
                className="page-number"
                type="button"
                disabled={filters.page === 1 || loading}
                aria-label="Previous page"
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: (current.page ?? 1) - 1,
                  }))
                }
              >
                ‹
              </button>
              {visiblePages.map((page) => (
                <button
                  key={page}
                  className={`page-number${page === filters.page ? " current" : ""}`}
                  type="button"
                  disabled={loading}
                  aria-current={page === filters.page ? "page" : undefined}
                  onClick={() =>
                    setFilters((current) => ({ ...current, page }))
                  }
                >
                  {page}
                </button>
              ))}
              <button
                className="page-number"
                type="button"
                disabled={
                  !result.pages || filters.page === result.pages || loading
                }
                aria-label="Next page"
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: (current.page ?? 1) + 1,
                  }))
                }
              >
                ›
              </button>
            </div>
          </div>
        )}
      </section>
      {deleteTarget && (
        <ConfirmDialog
          title="Delete property?"
          message={`“${deleteTarget.title}” will be removed from the property portfolio. This action cannot be undone.`}
          busy={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
      {assignTarget && (
        <AssignAgentDialog
          propertyId={assignTarget.id}
          assignedAgentId={assignTarget.assigned_agent_id}
          onClose={() => setAssignTarget(null)}
          onAssigned={() => void load()}
        />
      )}
    </div>
  );
}
