import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error occurred.";

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "An internal server error occurred." : message,
  });
};
