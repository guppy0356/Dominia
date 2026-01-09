import { Hono } from "hono";
import { renderer } from "@/middleware/renderer";
import entries from "@/routes/entries";
import type { Bindings } from "@/types";

const app = new Hono<{ Bindings: Bindings }>();

// Global middleware - applies to all routes
app.use(renderer);

// Mount entries routes
app.route("/entries", entries);

export default app;
