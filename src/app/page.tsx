import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Logo } from "@/components/icons/logo";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <Logo />
      <h1 className="mt-6 text-4xl font-bold text-center text-foreground font-display">
        Skailan
      </h1>
      <p className="mt-2 text-lg text-center text-muted-foreground max-w-2xl">
        Tu universo digital, perfectamente conectado.
      </p>
      <p className="mt-4 text-md text-center text-muted-foreground max-w-3xl">
        Domina tu ecosistema digital con Skailan. Unificamos tus canales de comunicación (WhatsApp, Instagram, Email, etc.) y marketing (Google Ads, Meta Ads, LinkedIn Ads) en un solo lugar. Programa, gestiona y optimiza tu presencia online como nunca antes.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/dashboard">Ir al Dashboard</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/signup">Registrarse</Link>
        </Button>
      </div>
       <p className="mt-12 text-sm text-center text-muted-foreground">
        (Autenticación vía Supabase. Multi-tenancy es una característica de backend.)
      </p>
    </div>
  );
}
