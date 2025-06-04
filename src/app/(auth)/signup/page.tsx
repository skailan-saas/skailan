"use client";

import { useState, type FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/icons/logo";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { signupAction } from "./actions";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [baseDomain, setBaseDomain] = useState("localhost");
  const [subdomainAvailable, setSubdomainAvailable] = useState<null | boolean>(null);
  const [subdomainCheckMsg, setSubdomainCheckMsg] = useState<string>("");
  const subdomainTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Determinar el dominio base según el entorno
    const isDevelopment =
      process.env.NODE_ENV === "development" ||
      window.location.hostname === "localhost";
    setBaseDomain(isDevelopment ? "localhost" : "skailan.com");
  }, []);

  // Verificación automática de subdominio
  useEffect(() => {
    if (!subdomain) {
      setSubdomainAvailable(null);
      setSubdomainCheckMsg("");
      return;
    }
    if (subdomainTimeout.current) clearTimeout(subdomainTimeout.current);
    subdomainTimeout.current = setTimeout(async () => {
      setSubdomainCheckMsg("Verificando disponibilidad...");
      setSubdomainAvailable(null);
      try {
        const res = await fetch("/api/verify-tenant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subdomain }),
        });
        const data = await res.json();
        if (data.available) {
          setSubdomainAvailable(true);
          setSubdomainCheckMsg("Subdominio disponible ✔");
        } else {
          setSubdomainAvailable(false);
          setSubdomainCheckMsg(data.reason || "Subdominio no disponible");
        }
      } catch (err) {
        setSubdomainAvailable(false);
        setSubdomainCheckMsg("Error al verificar subdominio");
      }
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomain]);

  const getFullDomain = (sub: string) => {
    if (!sub) return baseDomain;
    return `${sub}.${baseDomain}`;
  };

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Validación de nombre de workspace
    if (!tenantName.trim()) {
      setError("El nombre del workspace es requerido");
      setLoading(false);
      toast({
        title: "Error de validación",
        description: "El nombre del workspace es requerido",
        variant: "destructive",
      });
      return;
    }

    // Validación de subdominio
    if (!subdomain.trim()) {
      setError("El subdominio es requerido");
      setLoading(false);
      toast({
        title: "Error de validación",
        description: "El subdominio es requerido",
        variant: "destructive",
      });
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subdomain)) {
      setError(
        "El subdominio solo puede contener letras minúsculas, números y guiones, y no puede empezar o terminar con guión."
      );
      setLoading(false);
      toast({
        title: "Subdominio inválido",
        description: "El formato del subdominio es inválido.",
        variant: "destructive",
      });
      return;
    }
    if (subdomain.length < 3 || subdomain.length > 32) {
      setError("El subdominio debe tener entre 3 y 32 caracteres");
      setLoading(false);
      toast({
        title: "Subdominio inválido",
        description: "El subdominio debe tener entre 3 y 32 caracteres.",
        variant: "destructive",
      });
      return;
    }

    // Validación de email
    if (!email.trim()) {
      setError("El email es requerido");
      setLoading(false);
      toast({
        title: "Error de validación",
        description: "El email es requerido",
        variant: "destructive",
      });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("El formato del email es inválido");
      setLoading(false);
      toast({
        title: "Email inválido",
        description: "El formato del email es inválido.",
        variant: "destructive",
      });
      return;
    }

    // Validación de contraseña
    if (!password.trim()) {
      setError("La contraseña es requerida");
      setLoading(false);
      toast({
        title: "Error de validación",
        description: "La contraseña es requerida",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      toast({
        title: "Contraseña inválida",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    // Validación de subdominio disponible
    if (subdomainAvailable === false) {
      setError("El subdominio no está disponible");
      setLoading(false);
      toast({
        title: "Subdominio ocupado",
        description: subdomainCheckMsg || "El subdominio no está disponible.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("[DEBUG] Iniciando registro con JWT...");

      // Crear FormData para el server action
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("tenantName", tenantName);
      formData.append("subdomain", subdomain);

      const result = await signupAction(formData);

      setLoading(false);
      console.log("[DEBUG] Resultado del registro:", result);

      if (result.error) {
        console.error("[ERROR] Error en registro:", result.error);
        setError(result.error);
        toast({
          title: "Error en el registro",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.success) {
        console.log("[DEBUG] Registro exitoso");
        setMessage(result.message || "Registro exitoso! Redirigiendo...");
        toast({
          title: "¡Registro exitoso!",
          description: `Bienvenido ${result.userName}! Tu workspace ${result.tenantName} está listo.`,
        });

        // Redirigir al dashboard
        setTimeout(() => {
          router.push(result.redirectTo || "/dashboard");
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error durante el registro:", error);
      setError("Error interno del servidor");
      setLoading(false);
      toast({
        title: "Error del servidor",
        description:
          "Ocurrió un error inesperado. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="items-center text-center">
          <Logo />
          <CardTitle className="mt-4 text-2xl">
            Crear Cuenta y Workspace
          </CardTitle>
          <CardDescription>
            Regístrate para comenzar a usar Conecta Hub con tu propio workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenantName">Nombre del Workspace</Label>
              <Input
                id="tenantName"
                type="text"
                placeholder="Nombre de tu empresa"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdominio</Label>
              <Input
                id="subdomain"
                type="text"
                placeholder="tu-empresa"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                required
                autoComplete="off"
              />
              <p className={`text-xs ${subdomainAvailable === false ? "text-destructive" : "text-muted-foreground"}`}>
                {subdomainCheckMsg || `Tu URL será: ${getFullDomain(subdomain || "tu-empresa")}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {baseDomain === "localhost"
                  ? "Entorno de desarrollo - usando localhost"
                  : "Entorno de producción - usando skailan.com"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Tu Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Crea una contraseña segura"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 6 caracteres
              </p>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            {message && (
              <p className="text-sm text-green-600 text-center">{message}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loading || subdomainAvailable === false}
            >
              {loading ? "Registrando..." : "Registrarse"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Iniciar Sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
