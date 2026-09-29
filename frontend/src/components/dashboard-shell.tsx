"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  symbol: string;
  roles: UserRole[];
}

const navigation: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    symbol: "⌂",
    roles: ["admin", "manager", "agent"],
  },
  {
    label: "Properties",
    href: "/dashboard/properties",
    symbol: "▤",
    roles: ["admin", "manager"],
  },
  {
    label: "My Properties",
    href: "/dashboard/properties",
    symbol: "▤",
    roles: ["agent"],
  },
  {
    label: "Agents",
    href: "/dashboard/agents",
    symbol: "◉",
    roles: ["admin", "manager"],
  },
  { label: "Users", href: "/dashboard/users", symbol: "♙", roles: ["admin"] },
  {
    label: "Profile",
    href: "/dashboard/profile",
    symbol: "◎",
    roles: ["admin", "manager", "agent"],
  },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, router, user]);

  if (!ready || !user)
    return (
      <main className="loading-state">
        <span className="spinner" /> Loading workspace
      </main>
    );

  const items = navigation.filter((item) => item.roles.includes(user.role));
  const pageName =
    items.find((item) => item.href === pathname)?.label ?? "Property details";
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="app-frame">
      {menuOpen && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`sidebar${menuOpen ? " open" : ""}`}>
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">H</span>
          <span>
            <span className="brand-name">haven</span>
            <span className="brand-note">PROPERTY WORKSPACE</span>
          </span>
        </Link>
        <div className="nav-label">Workspace</div>
        <nav className="nav-list" aria-label="Main navigation">
          {items.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`nav-link${active ? " active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <span className="nav-symbol" aria-hidden="true">
                  {item.symbol}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-foot">
          Workspace access
          <br />
          Role-based tools for your team
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button menu-toggle"
              title="Open navigation"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </button>
            <div className="crumb">
              Workspace <span aria-hidden="true">/</span> {pageName}
            </div>
          </div>
          <div className="topbar-right">
            <div className="user-chip">
              <span className="avatar" aria-hidden="true">
                {initials}
              </span>
              <span>
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </span>
            </div>
            <button
              className="icon-button"
              title="Sign out"
              aria-label="Sign out"
              onClick={handleLogout}
            >
              ↪
            </button>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </section>
    </div>
  );
}
