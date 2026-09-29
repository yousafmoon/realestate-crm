"use client";

import { useState, type FormEvent } from "react";
import type { Property, PropertyInput } from "@/lib/types";

interface PropertyFormProps {
  initial?: Property;
  busy?: boolean;
  submitLabel: string;
  onSubmit: (data: PropertyInput) => Promise<void>;
  onCancel: () => void;
}

const propertyTypes = [
  "apartment",
  "villa",
  "townhouse",
  "penthouse",
  "land",
  "commercial",
];

export function PropertyForm({
  initial,
  busy = false,
  submitLabel,
  onSubmit,
  onCancel,
}: PropertyFormProps) {
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const values = new FormData(event.currentTarget);
    const data: PropertyInput = {
      title: String(values.get("title")).trim(),
      description: String(values.get("description") || "").trim() || null,
      property_type: String(values.get("property_type")),
      listing_type: String(values.get("listing_type")),
      price: Number(values.get("price")),
      bedrooms: Number(values.get("bedrooms")),
      bathrooms: Number(values.get("bathrooms")),
      area: Number(values.get("area")),
      city: String(values.get("city")).trim(),
      address: String(values.get("address") || "").trim() || null,
      status: String(values.get("status")),
    };
    try {
      await onSubmit(data);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The property could not be saved.",
      );
    }
  }

  return (
    <form className="panel panel-body" onSubmit={handleSubmit}>
      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="title">Property title</label>
          <input
            id="title"
            name="title"
            required
            maxLength={255}
            defaultValue={initial?.title ?? ""}
            placeholder="e.g. Marina residence with sea view"
          />
        </div>
        <div className="field">
          <label htmlFor="property_type">Property type</label>
          <select
            id="property_type"
            name="property_type"
            required
            defaultValue={initial?.property_type ?? "apartment"}
          >
            {propertyTypes.map((type) => (
              <option key={type} value={type}>
                {type[0].toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="listing_type">Listing type</label>
          <select
            id="listing_type"
            name="listing_type"
            required
            defaultValue={initial?.listing_type ?? "sale"}
          >
            <option value="sale">For sale</option>
            <option value="rent">For rent</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="price">Price (AED)</label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={initial?.price ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            required
            defaultValue={initial?.status ?? "available"}
          >
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="bedrooms">Bedrooms</label>
          <input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={initial?.bedrooms ?? 0}
          />
        </div>
        <div className="field">
          <label htmlFor="bathrooms">Bathrooms</label>
          <input
            id="bathrooms"
            name="bathrooms"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={initial?.bathrooms ?? 0}
          />
        </div>
        <div className="field">
          <label htmlFor="area">Area</label>
          <input
            id="area"
            name="area"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={initial?.area ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="city">City</label>
          <input
            id="city"
            name="city"
            required
            maxLength={100}
            defaultValue={initial?.city ?? ""}
            placeholder="Dubai"
          />
        </div>
        <div className="field">
          <label htmlFor="address">Address</label>
          <input
            id="address"
            name="address"
            maxLength={255}
            defaultValue={initial?.address ?? ""}
            placeholder="District, street, building"
          />
        </div>
        <div className="field full">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            defaultValue={initial?.description ?? ""}
            placeholder="Property details and notable features"
          />
        </div>
      </div>
      <div className="form-actions">
        <button className="button secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="button" type="submit" disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" /> Saving
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
