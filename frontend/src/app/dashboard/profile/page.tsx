"use client";

import { useAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return <div className="loading-state">Loading profile</div>;

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="fade-up">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Account</div>
          <h1 className="serif">Your profile</h1>
          <p className="page-description">
            Your identity and access level in this workspace.
          </p>
        </div>
      </div>
      <section className="panel profile-card">
        <div className="profile-identity">
          <span className="avatar profile-avatar">{initials}</span>
          <div>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </div>
          <span className="badge active">Active</span>
        </div>
        <div className="facts-grid profile-facts">
          <div className="fact">
            <div className="fact-label">Name</div>
            <div className="fact-value">{user.name}</div>
          </div>
          <div className="fact">
            <div className="fact-label">Email</div>
            <div className="fact-value">{user.email}</div>
          </div>
          <div className="fact">
            <div className="fact-label">Role</div>
            <div className="fact-value">{user.role}</div>
          </div>
          <div className="fact">
            <div className="fact-label">Account status</div>
            <div className="fact-value">Active</div>
          </div>
        </div>
      </section>
    </div>
  );
}
