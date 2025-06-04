import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host");
  const domain = host?.replace("www.", "").split(":")[0];
  const pathname = request.nextUrl.pathname;

  // Permitir acceso a páginas públicas sin validación de tenant ni sesión
  const publicPaths = ["/", "/login", "/signup", "/auth/callback"];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  if (!domain) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Solo manejar la lógica de tenant para rutas protegidas
    const tenantApiUrl = new URL("/api/tenant", request.url);
    tenantApiUrl.searchParams.set("domain", domain);

    const tenantResponse = await fetch(tenantApiUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!tenantResponse.ok) {
      console.error("Tenant API response not OK:", tenantResponse.status);
      // Si no se encuentra el tenant, redirigir al login en lugar de error
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const tenant = await tenantResponse.json();

    // Validar sesión de usuario con Supabase (cookie 'sb-access-token')
    const accessToken = request.cookies.get("sb-access-token");
    if (!accessToken) {
      // No hay sesión, redirigir a login
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const response = NextResponse.next();
    response.cookies.set("tenant_id", tenant.id, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Tenant lookup error in middleware:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (public login page)
     * - signup (public signup page)
     * - auth/callback (callback de autenticación)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login|signup|auth/callback).*)",
  ],
};
