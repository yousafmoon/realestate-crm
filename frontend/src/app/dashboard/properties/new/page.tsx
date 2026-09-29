"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PropertyForm } from "@/components/property-form";
import { useAuth } from "@/lib/auth-context";
import { ApiError, createProperty } from "@/lib/api";
import type { PropertyInput } from "@/lib/types";

export default function NewPropertyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role === "agent") router.replace("/dashboard/properties");
  }, [router, user]);

  async function submit(data: PropertyInput) {
    setBusy(true);
    setError("");
    try {
      const property = await createProperty(data);
      window.sessionStorage.setItem("crm-property-created", property.title);
      router.push("/dashboard/properties");
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : "Property could not be created.";
      setError(message);
      throw new Error(message);
    } finally {
      setBusy(false);
    }
  }

  if (user?.role === "agent") return null;

  return (
    <div className="fade-up">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Property desk</div>
          <h1 className="serif">Add a property</h1>
          <p className="page-description">
            Create a listing for your portfolio.
          </p>
        </div>
      </div>
      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}
      <PropertyForm
        submitLabel="Create property"
        busy={busy}
        onSubmit={submit}
        onCancel={() => router.push("/dashboard/properties")}
      />
    </div>
  );
}
