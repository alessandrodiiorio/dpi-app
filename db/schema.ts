import { pgTable, serial, varchar, text, integer, date, pgEnum } from "drizzle-orm/pg-core";

export const statoEnum = pgEnum("stato", ["assegnato", "restituito"]);

export const dpi = pgTable("dpi", {
  id: serial("id").primaryKey(),
  codice_articolo: varchar("codice_articolo", { length: 100 }).unique(),
  descrizione_articolo: text("descrizione_articolo"),
  quantita_totale: integer("quantita_totale").default(0),
  quantita_disponibile: integer("quantita_disponibile").default(0),
});

export const personale = pgTable("personale", {
  id: serial("id").primaryKey(),
  cognome: varchar("cognome", { length: 100 }),
  nome: varchar("nome", { length: 100 }),
  id_utente: varchar("id_utente", { length: 50 }).unique(),
  matricola: varchar("matricola", { length: 50 }),
  sede: text("sede"),
  unita_organizzativa: text("unita_organizzativa"),
  competence_center: text("competence_center"),
});

export const assegnazioni = pgTable("assegnazioni", {
  id: serial("id").primaryKey(),
  dpi_id: integer("dpi_id").references(() => dpi.id),
  personale_id: integer("personale_id").references(() => personale.id),
  quantita: integer("quantita").default(1),
  data_assegnazione: date("data_assegnazione"),
  data_restituzione: date("data_restituzione"),
  note: text("note"),
  stato: statoEnum("stato").default("assegnato"),
});
