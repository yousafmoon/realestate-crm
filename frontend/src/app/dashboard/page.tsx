"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAgents, getUsers } from "@/lib/api";
import { getAllProperties } from "@/lib/data";
import { formatPrice, propertyLocation, statusClass } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import type { Agent, Property, User } from "@/lib/types";

interface DashboardData {
  properties: Property[];
  agents: Agent[];
  users: User[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const canViewTeam = user?.role === "admin" || user?.role === "manager";
        const [properties, agents, users] = await Promise.all([
          getAllProperties(),
          canViewTeam ? getAgents() : Promise.resolve([]),
          canViewTeam ? getUsers() : Promise.resolve([]),
        ]);
        if (active) setData({ properties, agents, users });
      } catch (cause) {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Dashboard data could not be loaded.",
          );
      }
    }
    if (user) void load();
    return () => {
      active = false;
    };
  }, [user]);

  if (error)
    return (
      <div className="notice" role="alert">
        {error}
      </div>
    );
  if (!data)
    return (
      <div className="loading-state">
        <span className="spinner" /> Loading your portfolio
      </div>
    );

  const properties = data.properties;
  const metrics = [
    {
      label: user?.role === "agent" ? "My Properties" : "Total Properties",
      value: properties.length,
      note: "In your current view",
    },
    {
      label: "Available",
      value: properties.filter(
        (item) => item.status.toLowerCase() === "available",
      ).length,
      note: "Ready to move",
    },
    {
      label: "Sold",
      value: properties.filter((item) => item.status.toLowerCase() === "sold")
        .length,
      note: "Completed transactions",
    },
    {
      label: "Rented",
      value: properties.filter((item) => item.status.toLowerCase() === "rented")
        .length,
      note: "Completed rentals",
    },
    ...(user?.role === "agent"
      ? []
      : [
          {
            label: "Total Agents",
            value: data.agents.length,
            note: "In the team",
          },
          {
            label: user?.role === "admin" ? "Total Users" : "Team Users",
            value: data.users.length,
            note:
              user?.role === "admin"
                ? "Workspace accounts"
                : "Visible team accounts",
          },
        ]),
  ];

  return (
    <div className="fade-up">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Portfolio overview</div>
          <h1 className="serif">
            {user?.role === "agent"
              ? "My Properties"
              : "Good to see you, " + (user?.name.split(" ")[0] ?? "") + "."}
          </h1>
          <p className="page-description">
            {user?.email} · {user?.role} · A live view of your property
            portfolio.
          </p>
        </div>
        {user?.role !== "agent" && (
          <Link className="button" href="/dashboard/properties/new">
            ＋ Add property
          </Link>
        )}
      </div>

      <section className="metric-grid" aria-label="Property statistics">
        {metrics.map((metric, index) => (
          <article
            className={`panel metric fade-up delay-${Math.min(index + 1, 3)}`}
            key={metric.label}
          >
            <span className="metric-accent" />
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">{metric.value.toLocaleString()}</div>
            <div className="metric-foot">{metric.note}</div>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Recent properties</h2>
              <p>Latest activity from the property desk</p>
            </div>
            <Link className="text-action" href="/dashboard/properties">
              View all →
            </Link>
          </div>
          {properties.length === 0 ? (
            <div className="empty-state">
              <span className="empty-mark">⌂</span>
              <div className="empty-title">
                {user?.role === "agent"
                  ? "No properties assigned yet."
                  : "No properties found."}
              </div>
              <span>New listings will appear here.</span>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Price</th>
                    <th>Type</th>
                    <th>Listing</th>
                    <th>Status</th>
                    <th>Assigned agent</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.slice(0, 6).map((property) => (
                    <tr key={property.id}>
                      <td>
                        <Link
                          className="property-title"
                          href={`/dashboard/properties/${property.id}`}
                        >
                          {property.title}
                        </Link>
                        <span className="muted">
                          {propertyLocation(property)}
                        </span>
                      </td>
                      <td className="money">{formatPrice(property.price)}</td>
                      <td>{property.property_type}</td>
                      <td>{property.listing_type}</td>
                      <td>
                        <span
                          className={`badge ${statusClass(property.status)}`}
                        >
                          {property.status}
                        </span>
                      </td>
                      <td>
                        {property.assigned_agent?.name ?? (
                          <span className="muted">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <aside className="panel">
          <div className="panel-head">
            <div>
              <h2>Quick actions</h2>
              <p>Move through your workspace</p>
            </div>
          </div>
          <div className="panel-body quick-list">
            <Link className="quick-item" href="/dashboard/properties">
              <div>
                <div className="quick-item-title">View properties</div>
                <div className="quick-item-meta">
                  Browse your live portfolio
                </div>
              </div>
              <span aria-hidden="true">→</span>
            </Link>
            {user?.role !== "agent" && (
              <Link className="quick-item" href="/dashboard/properties/new">
                <div>
                  <div className="quick-item-title">Add property</div>
                  <div className="quick-item-meta">Create a new listing</div>
                </div>
                <span aria-hidden="true">＋</span>
              </Link>
            )}
            {user?.role !== "agent" && (
              <Link className="quick-item" href="/dashboard/agents">
                <div>
                  <div className="quick-item-title">View agents</div>
                  <div className="quick-item-meta">Check the property team</div>
                </div>
                <span aria-hidden="true">→</span>
              </Link>
            )}
            {user?.role === "admin" && (
              <Link className="quick-item" href="/dashboard/users">
                <div>
                  <div className="quick-item-title">Manage users</div>
                  <div className="quick-item-meta">Review roles and access</div>
                </div>
                <span aria-hidden="true">→</span>
              </Link>
            )}
            {user?.role === "agent" && (
              <Link className="quick-item" href="/dashboard/profile">
                <div>
                  <div className="quick-item-title">View profile</div>
                  <div className="quick-item-meta">Review your account</div>
                </div>
                <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
