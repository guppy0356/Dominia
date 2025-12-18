import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const entries = pgTable('entries', {
  id: serial("id").primaryKey(),
  url: text('url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
