"use client";

import { useState, type FormEvent, useEffect } from "react";
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

  useEffect(() => {
    // Determinar el dominio base según el entorno
    const isDevelopment =
      process.env.NODE_ENV === "development" ||
      window.location.hostname === "localhost";
    setBaseDomain(isDevelopment ? "localhost" : "skailan.com");
  }, []);

  const getFullDomain = (sub: string) => {
    if (!sub) return baseDomain;
    return `${sub}.${baseDomain}`;
  };

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (
      !tenantName.trim() ||
      !subdomain.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      setError("Todos los campos son requeridos");
      setLoading(false);
      toast({
        title: "Error de validación",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    // Validación básica del subdomain
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
              />
              <p className="text-xs text-muted-foreground">
                Tu URL será:{" "}
                <strong>{getFullDomain(subdomain || "tu-empresa")}</strong>
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
              disabled={loading}
            >
              {loading ? "Creando cuenta..." : "Crear Cuenta y Workspace"}
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
