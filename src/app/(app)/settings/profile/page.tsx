"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ShieldAlert, KeyRound, User as UserIcon, Clock } from "lucide-react";

export default function ProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Estados del formulario
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Estados de información del usuario
  const [userIdDisplay, setUserIdDisplay] = useState("N/A");
  const [lastSignInDisplay, setLastSignInDisplay] = useState("N/A");

  useEffect(() => {
    // TODO: Implementar obtención de usuario con JWT
    // Por ahora, establecer datos de ejemplo para evitar errores
    setLoading(true);

    // Simular datos de usuario
    setEmail("usuario@ejemplo.com");
    setFullName("Usuario de Ejemplo");
    setUserIdDisplay("user-example-id");
    setLastSignInDisplay(new Date().toLocaleString());

    setLoading(false);
  }, []);

  const handleProfileUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Implementar actualización de perfil con JWT
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Perfil Actualizado",
        description:
          "Tu información de perfil ha sido actualizada exitosamente.",
      });
    }, 1000);
  };

  const handlePasswordChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error de Contraseña",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error de Contraseña",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);

    // TODO: Implementar cambio de contraseña con JWT
    setTimeout(() => {
      setPasswordLoading(false);
      toast({
        title: "Contraseña Actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 1000);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <UserIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Perfil de Usuario</h1>
        </div>
        <div className="text-center py-20 text-muted-foreground">
          Cargando información del perfil...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center space-x-2">
        <UserIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Perfil de Usuario</h1>
      </div>
      <p className="text-muted-foreground">
        Gestiona tu información personal y configuración de seguridad.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información del Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5" />
              <span>Información del Perfil</span>
            </CardTitle>
            <CardDescription>
              Actualiza tu información personal aquí.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  El email no se puede cambiar por motivos de seguridad.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Actualizando..." : "Actualizar Perfil"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Cambio de Contraseña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <KeyRound className="h-5 w-5" />
              <span>Cambiar Contraseña</span>
            </CardTitle>
            <CardDescription>
              Actualiza tu contraseña para mantener tu cuenta segura.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Tu contraseña actual"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tu nueva contraseña"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmar Nueva Contraseña
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma tu nueva contraseña"
                />
              </div>
              <Button
                type="submit"
                disabled={passwordLoading}
                className="w-full"
              >
                {passwordLoading ? "Cambiando..." : "Cambiar Contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Información de la Cuenta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5" />
            <span>Información de la Cuenta</span>
          </CardTitle>
          <CardDescription>
            Detalles de tu cuenta y actividad reciente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">ID de Usuario</Label>
              <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                {userIdDisplay}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Último Inicio de Sesión</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                {lastSignInDisplay}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
