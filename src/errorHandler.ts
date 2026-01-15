import { HTTPException } from "hono/http-exception";

export function createErrorHandler() {
  return (error: Error) => {
    // HTTPException (from middleware like JWT) - return its response
    if (error instanceof HTTPException) {
      return error.getResponse();
    }

    // Return 500 for all other unhandled errors (RFC 9457 format)
    return new Response(
      JSON.stringify({
        type: "about:blank",
        title: "Internal Server Error",
        status: 500,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/problem+json" },
      },
    );
  };
}
