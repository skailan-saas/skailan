"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Verificando confirmación...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!searchParams) {
        setStatus("No se encontraron parámetros de búsqueda en la URL.");
        return;
      }
      const access_token = searchParams.get("access_token");
      const refresh_token = searchParams.get("refresh_token");
      if (!access_token || !refresh_token) {
        setStatus("Tokens de confirmación no encontrados. Intenta iniciar sesión nuevamente.");
        return;
      }
      const supabase = createClient();
      // Establecer la sesión manualmente
      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (error) {
        setStatus("Error al establecer la sesión: " + error.message);
        return;
      }
      // Obtener el usuario y su tenant
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus("No se pudo obtener el usuario tras la confirmación.");
        return;
      }
      // Llamar a un endpoint para obtener el tenant del usuario
      const res = await fetch("/api/tenant?user_id=" + user.id);
      setStatus("Respuesta cruda del endpoint: " + res.status);
      if (!res.ok) {
        setStatus("No se pudo obtener el tenant del usuario. Código: " + res.status);
        return;
      }
      const tenant = await res.json();
      setStatus("Tenant encontrado: " + JSON.stringify(tenant));
      if (!tenant || !tenant.subdomain) {
        setStatus("No se encontró el subdominio del tenant. Respuesta: " + JSON.stringify(tenant));
        return;
      }
      // Redirigir al dashboard del subdominio
      const protocol = window.location.protocol;
      const port = window.location.port ? ":" + window.location.port : "";
      const domain = tenant.subdomain + "." + window.location.hostname.replace(/^([^.]+\.)?/, "");
      setStatus("Redirigiendo a: " + `${protocol}//${domain}${port}/dashboard`);
      window.location.href = `${protocol}//${domain}${port}/dashboard`;
    };
    handleAuthCallback();
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Confirmando tu cuenta...</h1>
      <p>{status}</p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-screen"><p>Cargando...</p></div>}>
      <CallbackContent />
    </Suspense>
  );
} 