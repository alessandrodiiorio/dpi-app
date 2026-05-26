"use client";

import { useEffect, useState } from "react";

interface Utente {
  id: number;
  username: string;
  ruolo: string;
}

export default function UtentiPage() {
  const [utenti, setUtenti] = useState<Utente[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // New user form
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRuolo, setNewRuolo] = useState("operatore");
  const [error, setError] = useState("");

  // Edit password
  const [editPassword, setEditPassword] = useState("");
  const [editRuolo, setEditRuolo] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/utenti");
    if (res.ok) setUtenti(await res.json());
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/utenti", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername, password: newPassword, ruolo: newRuolo }),
    });
    if (res.ok) {
      setShowNew(false);
      setNewUsername("");
      setNewPassword("");
      setNewRuolo("operatore");
      load();
    } else {
      const err = await res.json();
      setError(err.error);
    }
  }

  async function deleteUser(id: number) {
    if (!confirm("Eliminare questo utente?")) return;
    const res = await fetch(`/api/utenti/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else alert((await res.json()).error);
  }

  async function updateUser(id: number) {
    const body: Record<string, string> = {};
    if (editPassword) body.password = editPassword;
    if (editRuolo) body.ruolo = editRuolo;
    if (Object.keys(body).length === 0) return;

    const res = await fetch(`/api/utenti/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setEditId(null);
      setEditPassword("");
      setEditRuolo("");
      load();
    }
  }

  function openEdit(u: Utente) {
    setEditId(u.id);
    setEditPassword("");
    setEditRuolo(u.ruolo);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Gestione Utenti</h1>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700"
        >
          + Nuovo Utente
        </button>
      </div>

      {/* New user form */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Nuovo Utente</h3>
            <form onSubmit={createUser} className="space-y-3">
              <input
                type="text" placeholder="Username"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={newUsername} onChange={e => setNewUsername(e.target.value)} required
              />
              <input
                type="password" placeholder="Password"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} required
              />
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={newRuolo} onChange={e => setNewRuolo(e.target.value)}
              >
                <option value="operatore">Operatore</option>
                <option value="admin">Admin</option>
              </select>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => { setShowNew(false); setError(""); }}
                  className="px-4 py-2 rounded-lg text-sm border">Annulla</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-slate-800 text-white">Crea</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit password modal */}
      {editId != null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Modifica Utente</h3>
            <div className="space-y-3">
              <input
                type="password" placeholder="Nuova password (lascia vuoto per non cambiare)"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={editPassword} onChange={e => setEditPassword(e.target.value)}
              />
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={editRuolo} onChange={e => setEditRuolo(e.target.value)}
              >
                <option value="operatore">Operatore</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setEditId(null)}
                  className="px-4 py-2 rounded-lg text-sm border">Annulla</button>
                <button onClick={() => updateUser(editId)}
                  className="px-4 py-2 rounded-lg text-sm bg-slate-800 text-white">Salva</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Username</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Ruolo</th>
              <th className="px-4 py-3 text-right font-medium text-slate-500">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {utenti.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    u.ruolo === "admin" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {u.ruolo}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openEdit(u)}
                    className="text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200">
                    Modifica
                  </button>
                  <button onClick={() => deleteUser(u.id)}
                    className="text-xs px-3 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100">
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
