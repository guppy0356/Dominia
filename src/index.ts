import { Hono } from "hono";
import { html } from "hono/html";
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

app.get("/manifest.json", (c) => {
  return c.json({
    name: "KeepLater",
    short_name: "KeepLater",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4a90e2",
    icons: [
      {
        src: "https://placehold.co/192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    share_target: {
      action: "/share",
      method: "GET",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
  });
});

app.get("/", (c) => {
  return c.html(
    html`<html>
      <head>
        <title>KeepLater</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <h1>KeepLater</h1>
        <p>ブラウザのメニューから「アプリをインストール」してください。</p>
      </body>
    </html>`,
  );
});

export default app;
