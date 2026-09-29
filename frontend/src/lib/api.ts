import type {
  Agent,
  ApiErrorPayload,
  CurrentUser,
  LoginResponse,
  PaginationResponse,
  Property,
  PropertyFilters,
  PropertyInput,
  User,
  UserInput,
} from "@/lib/types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const API_BASE = "/api/backend";
export const TOKEN_KEY = "realestate-crm-token";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: ApiErrorPayload,
    public readonly request?: { method: string; url: string },
    public readonly responseBody?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  unauthenticated?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError("NEXT_PUBLIC_API_URL is not configured.", 0);
  }

  const { unauthenticated, headers, ...init } = options;
  const method = (init.method ?? "GET").toUpperCase();
  const requestUrl = `${API_URL}${path}`;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  if (init.body && !(init.body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (!unauthenticated && typeof window !== "undefined") {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: requestHeaders,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      `Could not reach the API. Check that the backend is running. Request: ${method} ${requestUrl}`,
      0,
      undefined,
      { method, url: requestUrl },
    );
  }

  if (response.status === 204) return undefined as T;

  const responseBody = await response.text().catch(() => "");
  let payload: ApiErrorPayload | T | undefined;
  try {
    payload = responseBody ? (JSON.parse(responseBody) as ApiErrorPayload | T) : undefined;
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("crm:unauthorized"));
    }
    const errorPayload = payload as ApiErrorPayload | undefined;
    const detail = errorPayload?.detail;
    const summary = response.status === 401
      ? "Your session has expired. Please log in again."
      : Array.isArray(detail)
        ? detail.map((issue) => issue.msg ?? "Invalid value").join(". ")
        : typeof detail === "string"
          ? detail
          : statusMessage(response.status);
    const bodySummary = responseBody.trim().slice(0, 500) || "<empty response body>";
    const message = `${summary}\nRequest: ${method} ${requestUrl} → HTTP ${response.status}\nResponse: ${bodySummary}`;
    throw new ApiError(
      message,
      response.status,
      errorPayload,
      { method, url: requestUrl },
      bodySummary,
    );
  }

  return payload as T;
}

function statusMessage(status: number): string {
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "The requested item could not be found.";
  if (status === 422) return "Please check the submitted fields.";
  if (status >= 500) return "The server encountered an error. Please try again.";
  return "The request could not be completed.";
}

function queryString(values: PropertyFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    unauthenticated: true,
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const user = await request<Omit<CurrentUser, "is_active">>("/users/me");
  return { ...user, is_active: true };
}

export function getProperties(
  filters: PropertyFilters = {},
): Promise<PaginationResponse<Property>> {
  return request(`/properties${queryString(filters)}`);
}

export function getProperty(id: number): Promise<Property> {
  return request(`/properties/${id}`);
}

export function createProperty(data: PropertyInput): Promise<Property> {
  return request("/properties", { method: "POST", body: JSON.stringify(data) });
}

export function updateProperty(id: number, data: Partial<PropertyInput>): Promise<Property> {
  return request(`/properties/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteProperty(id: number): Promise<void> {
  return request(`/properties/${id}`, { method: "DELETE" });
}

export function getAgents(): Promise<Agent[]> {
  return request("/users/agents");
}

export function assignAgent(propertyId: number, agentId: number | null): Promise<Property> {
  return request(`/properties/${propertyId}/assign-agent`, {
    method: "PATCH",
    body: JSON.stringify({ agent_id: agentId }),
  });
}

export function getUsers(): Promise<User[]> {
  return request("/users");
}

export function createUser(data: UserInput & { password: string }): Promise<User> {
  return request("/users", { method: "POST", body: JSON.stringify(data) });
}

export function updateUser(id: number, data: Partial<UserInput>): Promise<User> {
  return request(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteUser(id: number): Promise<void> {
  return request(`/users/${id}`, { method: "DELETE" });
}
