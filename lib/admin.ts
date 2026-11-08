import { cookies } from "next/headers";
import { sha256 } from "./store";

export function adminPassword(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return process.env.NODE_ENV === "production" ? null : "admin";
}

export async function isAdmin() {
  const pw = adminPassword();
  if (!pw) return false;
  const c = (await cookies()).get("ts_admin")?.value;
  return c === sha256("ts-admin:" + pw);
}
