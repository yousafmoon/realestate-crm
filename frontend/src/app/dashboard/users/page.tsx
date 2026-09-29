"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAuth } from "@/lib/auth-context";
import { createUser, deleteUser, getUsers, updateUser } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { User, UserRole } from "@/lib/types";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const load = useCallback(async () => {
    try {
      setUsers(await getUsers());
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Users could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role !== "admin") return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [currentUser, load]);

  async function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await createUser({
        name: String(form.get("name")).trim(),
        email: String(form.get("email")).trim(),
        password: String(form.get("password")),
        role: String(form.get("role")) as UserRole,
      });
      formElement.reset();
      setSuccess("User account created.");
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "User could not be created.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeUser(
    target: User,
    changes: { role?: UserRole; is_active?: boolean },
  ) {
    setError("");
    setSuccess("");
    try {
      await updateUser(target.id, changes);
      setSuccess(`${target.name}'s account was updated.`);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "User could not be updated.",
      );
    }
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateUser(editingUser.id, {
        name: String(form.get("name")).trim(),
        email: String(form.get("email")).trim(),
        role: String(form.get("role")) as UserRole,
        is_active: form.get("is_active") === "on",
      });
      setSuccess(`${editingUser.name}'s account was updated.`);
      setEditingUser(null);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "User could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeUser() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setSuccess(`${deleteTarget.name}'s account was deleted.`);
      setDeleteTarget(null);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "User could not be deleted.",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (currentUser?.role !== "admin")
    return (
      <div className="notice" role="alert">
        Only administrators can manage users.
      </div>
    );

  return (
    <div className="fade-up">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Administration</div>
          <h1 className="serif">Users</h1>
          <p className="page-description">
            Manage workspace access and account roles.
          </p>
        </div>
        <span className="badge">{users.length} accounts</span>
      </div>
      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="notice success" role="status">
          {success}
        </div>
      )}
      <section className="panel" style={{ marginBottom: 17 }}>
        <div className="panel-head">
          <div>
            <h2>Add a user</h2>
            <p>Public registration remains limited to agent accounts.</p>
          </div>
        </div>
        <form className="panel-body" onSubmit={addUser}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="new-user-name">Full name</label>
              <input id="new-user-name" name="name" required maxLength={100} />
            </div>
            <div className="field">
              <label htmlFor="new-user-email">Email</label>
              <input id="new-user-email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="new-user-password">Temporary password</label>
              <input
                id="new-user-password"
                name="password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="new-user-role">Role</label>
              <select id="new-user-role" name="role" defaultValue="agent">
                <option value="agent">Agent</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="button" type="submit" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner" /> Creating
                </>
              ) : (
                "Create user"
              )}
            </button>
          </div>
        </form>
      </section>
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Workspace users</h2>
            <p>Role and account status are controlled here.</p>
          </div>
        </div>
        {loading ? (
          <div className="loading-state">
            <span className="spinner" /> Loading users
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-title">No users found.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="property-title">{item.name}</span>
                    </td>
                    <td>{item.email}</td>
                    <td>
                      <span className="badge">{item.role}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${item.is_active ? "active" : "inactive"}`}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{formatDate(item.created_at)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="text-action"
                          type="button"
                          onClick={() => setEditingUser(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-action"
                          type="button"
                          onClick={() =>
                            void changeUser(item, {
                              is_active: !item.is_active,
                            })
                          }
                        >
                          {item.is_active ? "Deactivate" : "Activate"}
                        </button>
                        {item.id !== currentUser.id && (
                          <button
                            className="text-action danger"
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                          >
                            Delete
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
      </section>
      {deleteTarget && (
        <ConfirmDialog
          title="Delete user account?"
          message={`${deleteTarget.name} will lose access to the workspace. Assigned properties will become unassigned.`}
          busy={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={removeUser}
        />
      )}
      {editingUser && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget &&
            !saving &&
            setEditingUser(null)
          }
        >
          <form
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-title"
            onSubmit={saveUser}
          >
            <div className="eyebrow">User #{editingUser.id}</div>
            <h2 id="edit-user-title">Edit user</h2>
            {error && (
              <div className="notice" role="alert">
                {error}
              </div>
            )}
            <div className="field" style={{ marginBottom: 14 }}>
              <label htmlFor="edit-user-name">Name</label>
              <input
                id="edit-user-name"
                name="name"
                maxLength={100}
                required
                defaultValue={editingUser.name}
              />
            </div>
            <div className="field" style={{ marginBottom: 14 }}>
              <label htmlFor="edit-user-email">Email</label>
              <input
                id="edit-user-email"
                name="email"
                type="email"
                required
                defaultValue={editingUser.email}
              />
            </div>
            <div className="field" style={{ marginBottom: 14 }}>
              <label htmlFor="edit-user-role">Role</label>
              <select
                id="edit-user-role"
                name="role"
                defaultValue={editingUser.role}
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="agent">Agent</option>
              </select>
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={editingUser.is_active}
              />
              Account active
            </label>
            <div className="dialog-actions">
              <button
                className="button secondary"
                type="button"
                disabled={saving}
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </button>
              <button className="button" type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner" /> Saving
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
