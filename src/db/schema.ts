import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const entries = pgTable('entries', {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text('url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
