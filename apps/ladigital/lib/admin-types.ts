// Shared admin-login form state. Kept out of the "use server" actions file,
// which may only export async functions.

export type AdminLoginState = { status: "idle" } | { status: "error"; message: string };

export const INITIAL_ADMIN_LOGIN_STATE: AdminLoginState = { status: "idle" };
