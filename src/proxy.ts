import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login", "/register", "/"];
const authRoutes = ["/login", "/register"];

function getTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get("access_token")?.value || null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = getTokenFromCookie(request);

  if (authRoutes.includes(pathname) && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|v1|_next/static|_next/image|favicon.ico).*)"],
};
