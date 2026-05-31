import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin-auth";

// Next 16 proxy (formerly middleware). Gates the /admin area behind the admin
// session cookie. The login page is always reachable; an authenticated admin
// hitting the login page is bounced to the dashboard. This is defence-in-depth
// alongside requireAdmin() in server components/actions and the write-key guard
// on Convex mutations.

export const config = { matcher: ["/admin/:path*"] };

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value);
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return authed ? NextResponse.redirect(new URL("/admin", req.url)) : NextResponse.next();
  }

  if (!authed) {
    const url = new URL("/admin/login", req.url);
    if (pathname !== "/admin") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
