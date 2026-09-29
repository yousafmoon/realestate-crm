import type { Property } from "@/lib/types";

const currency = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number): string {
  return currency.format(value);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function propertyLocation(property: Property): string {
  return [property.city, property.address].filter(Boolean).join(", ");
}

export function statusClass(value: string): string {
  return value.toLowerCase().replaceAll(" ", "-");
}