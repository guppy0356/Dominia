import { Hono } from "hono";
import entries from "@/routes/entries";
import type { Bindings } from "@/types";

const app = new Hono<{ Bindings: Bindings }>();

// Mount entries routes
app.route("/entries", entries);

export default app;
