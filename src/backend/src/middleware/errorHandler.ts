import type { NextFunction, Request, Response } from "express";

/**
 * Catches anything unhandled from route handlers (including async errors,
 * via express-async-errors). Never leaks stack traces, raw database errors,
 * or other internals to the client — only a generic message.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (res.headersSent) {
    return;
  }

  // body-parser throws a SyntaxError with a `body` property for malformed
  // JSON payloads — that's a client mistake, not a server failure.
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON." },
    });
  }

  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
  });
}
