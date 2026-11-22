import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_COOKIE_NAME = "soft_sea_session";

/**
 * Simple cookie-based session management.
 * Stores the user ID in a plain cookie. For Phase 0, this is intentionally
 * minimal — no JWT, no encryption, no heavy auth library.
 *
 * Can be swapped for a managed auth provider later (per rules.md §1)
 * without touching business logic, since all session access goes through
 * these two functions.
 */

/**
 * Get the currently logged-in user from the session cookie.
 * Returns the full User object, or null if not logged in.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: sessionCookie.value },
    });
    return user;
  } catch {
    return null;
  }
}

/**
 * Create or find a user by email, then set the session cookie.
 * Returns the User object.
 */
export async function loginUser(email: string, name?: string) {
  // Upsert: find existing user by email or create a new one
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: name || undefined },
    create: {
      email,
      name: name || null,
    },
  });

  // Set the session cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // 30 days
    maxAge: 60 * 60 * 24 * 30,
  });

  return user;
}

/**
 * Clear the session cookie (logout).
 */
export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
