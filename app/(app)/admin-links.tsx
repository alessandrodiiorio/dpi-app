"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function AdminLinks() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setIsAdmin(data.ruolo === "admin"))
      .catch(() => {});
  }, []);

  if (!isAdmin) return null;

  return (
    <div className="mt-4 pt-4 border-t border-slate-200 space-y-1">
      <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Admin
      </p>
      <Link
        href="/utenti"
        className="block px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-slate-200"
      >
        Utenti
      </Link>
    </div>
  );
}
