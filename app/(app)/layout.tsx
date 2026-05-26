import Link from "next/link";
import { UserMenu } from "./user-menu";
import { AdminLinks } from "./admin-links";

const linkClass =
  "block px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-slate-200";

function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-white border-r border-slate-200 p-4 flex flex-col gap-1">
      <h2 className="text-lg font-bold px-4 py-3 text-slate-800">Gestione DPI</h2>
      <nav className="flex flex-col gap-1 flex-1">
        <Link href="/" className={linkClass}>
          Dashboard
        </Link>
        <Link href="/dpi" className={linkClass}>
          Catalogo DPI
        </Link>
        <Link href="/personale" className={linkClass}>
          Personale
        </Link>
        <Link href="/assegnazioni" className={linkClass}>
          Assegnazioni
        </Link>
        <Link href="/report" className={linkClass}>
          Report
        </Link>
        <Link
          href="/assegnazioni/nuova"
          className="block px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition-colors mt-4 text-center"
        >
          + Nuova Assegnazione
        </Link>
        <Link
          href="/restituzione"
          className="block px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors text-center"
        >
          ↺ Nuova Restituzione
        </Link>
        <AdminLinks />
      </nav>
      <div className="border-t border-slate-200 pt-3">
        <UserMenu />
      </div>
    </aside>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
