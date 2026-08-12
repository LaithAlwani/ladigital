"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  checkPassword,
  createSession,
} from "@/lib/admin-auth";
import type { AdminLoginState } from "@/lib/admin-types";

export async function signInAdmin(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const password = String(formData.get("password") ?? "");

  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    return {
      status: "error",
      message: "Admin auth isn't configured on the server (ADMIN_PASSWORD / ADMIN_SESSION_SECRET).",
    };
  }
  if (!(await checkPassword(password))) {
    return { status: "error", message: "Incorrect password." };
  }

  const token = await createSession();
  if (!token) return { status: "error", message: "Could not create a session." };

  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  redirect("/admin");
}

export async function signOutAdmin(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
