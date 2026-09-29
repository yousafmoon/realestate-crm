export type UserRole = "admin" | "manager" | "agent";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CurrentUser = Pick<User, "id" | "name" | "email" | "role"> & {
  is_active: boolean;
};

export type Agent = User;

export interface Property {
  id: number;
  title: string;
  description: string | null;
  property_type: string;
  listing_type: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  city: string;
  address: string | null;
  status: string;
  assigned_agent_id: number | null;
  assigned_agent: Pick<User, "id" | "name" | "email"> | null;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
}

export interface PaginationResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PropertyFilters {
  city?: string;
  status?: string;
  property_type?: string;
  listing_type?: string;
  agent_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PropertyInput {
  title: string;
  description: string | null;
  property_type: string;
  listing_type: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  city: string;
  address: string | null;
  status: string;
}

export interface UserInput {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface ApiErrorPayload {
  detail?: string | Array<{ msg?: string; loc?: Array<string | number> }>;
}