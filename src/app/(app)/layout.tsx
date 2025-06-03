import type { PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { getCurrentTenant } from "@/lib/tenant";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export default async function AppLayout({ children }: PropsWithChildren) {
  // Verificar autenticación JWT
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    // Verificar y decodificar el token JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as any;

    if (!decoded.userId || !decoded.email) {
      redirect("/login");
    }
  } catch (error) {
    // Token inválido o expirado
    redirect("/login");
  }

  const tenant = await getCurrentTenant();

  if (!tenant) {
    // Esto debería ser manejado por el middleware, pero como fallback
    redirect("/404");
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-0 bg-background">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
