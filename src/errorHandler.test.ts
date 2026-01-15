import { HTTPException } from "hono/http-exception";
import { describe, expect, it } from "vitest";
import { createErrorHandler } from "./errorHandler";
import { internalServerErrorResponse } from "./schema";

describe("createErrorHandler", () => {
  it("should return HTTPException response for 401 Unauthorized", async () => {
    const errorHandler = createErrorHandler();
    const httpException = new HTTPException(401, {
      message: "Unauthorized",
    });

    const res = errorHandler(httpException);

    expect(res.status).toBe(401);
  });

  it("should return 500 for any unhandled Error instance", async () => {
    const errorHandler = createErrorHandler();
    const unknownError = new Error("Unknown error");

    const res = errorHandler(unknownError);
    const errorData = internalServerErrorResponse.parse(await res.json());

    expect(res.status).toBe(500);

    expect(errorData.type).toBe("about:blank");
    expect(errorData.title).toBe("Internal Server Error");
    expect(errorData.status).toBe(500);
  });
});
