"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserInfo {
  username: string;
  ruolo: string;
}

export function UserMenu() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setUser(data))
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (!user) return null;

  return (
    <div className="px-1 space-y-1">
      <p className="text-sm font-medium text-slate-700 truncate">{user.username}</p>
      <p className="text-xs text-slate-400 capitalize">{user.ruolo}</p>
      <button
        onClick={logout}
        className="text-xs text-red-500 hover:text-red-600 hover:underline mt-1"
      >
        Esci
      </button>
    </div>
  );
}
