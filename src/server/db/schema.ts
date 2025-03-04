import {
  pgTable,
  text,
  timestamp,
  index,
  uuid,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    rewriteUrl: text("rewriteUrl"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [index("Project_name_idx").on(table.name)]
);

export const requests = pgTable(
  "requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("projectId")
      .notNull()
      .references(() => projects.id),
    method: text("method").notNull(),
    query: jsonb("query"),
    headers: jsonb("headers"),
    body: jsonb("body"),
    ip: text("ip"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    forwarded: boolean("forwarded").default(false).notNull(),
  },
  (table) => [
    index("requests_projectId_idx").on(table.projectId),
    index("requests_timestamp_idx").on(table.timestamp),
  ]
);
