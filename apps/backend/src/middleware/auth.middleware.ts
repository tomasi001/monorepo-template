// @ts-expect-error - No types available for graphql-directive
import { MiddlewareFn } from "graphql-directive";
import jwt from "jsonwebtoken";
const { verify } = jwt;
// Use the correct import path and ensure AppError is exported from errors.js
import { AppError } from "../common/errors/errors.js";
import { ContextValue } from "../index.js";

interface AuthDirectiveArgs {
  role: string;
}

// Define the shape of the admin payload within the JWT
interface AdminJWTPayload {
  id: string;
  email: string;
  role: string;
  // Add other fields if they are included in the token payload
}

// Define a custom AuthenticationError extending AppError
class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401, "UNAUTHENTICATED"); // Use 401 Unauthorized status code
    this.name = "AuthenticationError";
  }
}

export const authMiddleware: MiddlewareFn<
  ContextValue,
  AuthDirectiveArgs
  // Add explicit types for context, args, next to resolve implicit any
> = async (
  { context, args }: { context: ContextValue; args: AuthDirectiveArgs },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  next: () => Promise<any>
) => {
  // Ensure context.request exists and has headers
  if (!context.request?.headers?.authorization) {
    throw new AuthenticationError("Authorization header missing");
  }

  const authHeader = context.request.headers.authorization;
  if (!authHeader.startsWith("Bearer ")) {
    throw new AuthenticationError(
      "Authorization header must start with Bearer"
    );
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    // Verify the token and cast the payload to our defined interface
    const payload = verify(
      token,
      process.env.JWT_SECRET || "super-secret-key-123" // Use env var with fallback
    ) as AdminJWTPayload;

    // Check if the role in the token matches the required role from the directive
    if (payload.role !== args.role) {
      throw new AuthenticationError(
        `Insufficient permissions. Requires ${args.role} role.`
      );
    }

    // Attach the validated admin payload to the context for use in resolvers
    context.admin = payload;

    // Proceed to the next middleware or resolver
    return next();
  } catch (error) {
    // Handle JWT verification errors (e.g., expired token, invalid signature)
    if (error instanceof Error && error.name === "JsonWebTokenError") {
      throw new AuthenticationError("Invalid token");
    }
    if (error instanceof Error && error.name === "TokenExpiredError") {
      throw new AuthenticationError("Token expired");
    }
    // Re-throw other unexpected errors or cast if necessary
    if (error instanceof AppError) {
      throw error;
    }
    throw new AuthenticationError("Authentication failed");
  }
};
