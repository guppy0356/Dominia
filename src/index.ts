import { Hono } from "hono";
import { createErrorHandler } from "@/errorHandler";
import entries from "@/routes/entries";
import share from "@/routes/share";
import type { Bindings } from "@/types";

const app = new Hono<{ Bindings: Bindings }>();

// Global error handler for errors not handled by sub-apps
app.onError(createErrorHandler());

// Mount entries routes
app.route("/entries", entries);

// Mount share routes (PWA share_target)
app.route("/share", share);

export default app;
