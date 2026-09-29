"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PropertyForm } from "@/components/property-form";
import { useAuth } from "@/lib/auth-context";
import { ApiError, getProperty, updateProperty } from "@/lib/api";
import type { Property, PropertyInput } from "@/lib/types";

export default function EditPropertyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setProperty(await getProperty(id));
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

  async function submit(data: PropertyInput) {
    setBusy(true);
    try {
      const updated = await updateProperty(id, data);
      window.sessionStorage.setItem("crm-property-updated", updated.title);
      router.push(`/dashboard/properties/${id}`);
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Property could not be updated.";
      setError(message);
      throw new Error(message);
    } finally {
      setBusy(false);
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

  return (
    <div className="fade-up">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Property #{property.id}</div>
          <h1 className="serif">Edit property</h1>
          <p className="page-description">Update the listing details.</p>
        </div>
      </div>
      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}
      <PropertyForm
        key={property.id}
        initial={property}
        submitLabel="Save changes"
        busy={busy}
        onSubmit={submit}
        onCancel={() => router.push(`/dashboard/properties/${id}`)}
      />
    </div>
  );
}
