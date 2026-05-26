import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestione DPI",
  description: "Gestione Dispositivi Protezione Individuale",
};

function Sidebar() {
  const linkClass =
    "block px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-slate-200";
  return (
    <aside className="w-60 min-h-screen bg-white border-r border-slate-200 p-4 flex flex-col gap-1">
      <h2 className="text-lg font-bold px-4 py-3 text-slate-800">Gestione DPI</h2>
      <nav className="flex flex-col gap-1">
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
        <Link
          href="/assegnazioni/nuova"
          className="block px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition-colors mt-4 text-center"
        >
          + Nuova Assegnazione
        </Link>
      </nav>
    </aside>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </body>
    </html>
  );
}
