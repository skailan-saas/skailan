
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, BarChart2, Users, MessageSquare, TrendingUp, Zap, Settings, ShieldCheck, HelpCircle } from "lucide-react";

const benefitItems = [
  {
    title: "Mejora Experiencia del Cliente",
    description: "Respuestas rápidas y consistentes gracias a la centralización de comunicaciones y la automatización de procesos.",
    icon: CheckCircle,
  },
  {
    title: "Aumento de Productividad",
    description: "Gestiona múltiples canales y tareas desde una sola plataforma, reduciendo el tiempo dedicado a cambiar entre herramientas.",
    icon: TrendingUp,
  },
  {
    title: "Escalabilidad",
    description: "Adaptable a empresas de cualquier tamaño, permitiendo agregar nuevos canales e integraciones según las necesidades.",
    icon: Zap,
  },
  {
    title: "Colaboración Multiagente",
    description: "Facilita la colaboración entre equipos con roles y permisos personalizados para una gestión segura y eficiente.",
    icon: Users,
  },
  {
    title: "Decisiones Basadas en Datos",
    description: "Reportes detallados y métricas en tiempo real para evaluar el rendimiento y ajustar estrategias con fundamento.",
    icon: BarChart2,
  },
  {
    title: "Flexibilidad y Personalización",
    description: "Adapta la plataforma a las necesidades específicas de tu negocio con configuraciones globales e integraciones.",
    icon: Settings,
  },
];

const modulePlaceholders = [
  { name: "Dashboard", description: "Tu centro de mando con métricas clave.", icon: BarChart2 },
  { name: "Conversaciones", description: "Bandeja de entrada unificada para todos tus canales.", icon: MessageSquare },
  { name: "CRM + Leads", description: "Gestiona contactos, empresas y oportunidades.", icon: Users },
  { name: "Marketing", description: "Diseña y analiza campañas inteligentes.", icon: TrendingUp },
  { name: "Administración", description: "Control total sobre usuarios y configuraciones.", icon: ShieldCheck },
];

const useCasePlaceholders = [
  { role: "Empresas", title: "Centralización de Comunicaciones", description: "Unifica todas las interacciones con clientes para mayor eficiencia." },
  { role: "Marketers", title: "Gestión de Campañas", description: "Crea, gestiona y analiza campañas publicitarias en múltiples plataformas." },
  { role: "Ventas", title: "Optimización de Leads", description: "Captura, sigue y convierte leads de manera más efectiva." },
  { role: "Soporte", title: "Atención al Cliente Eficaz", description: "Responde rápidamente y registra todas las interacciones para un mejor servicio." },
  { role: "Empresas", title: "Automatización de Marketing", description: "Ahorra tiempo automatizando tareas de marketing y comunicación." },
  { role: "Marketers", title: "Análisis de Resultados", description: "Toma decisiones basadas en datos con informes detallados." }
];


export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-sidebar-background text-sidebar-foreground">
      <header className="bg-background/80 backdrop-blur-sm shadow-md sticky top-0 z-50 border-b border-sidebar-border">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Logo />
          <div className="hidden md:flex space-x-6 items-center">
            <Link href="#benefits" className="text-foreground hover:text-primary transition-colors">
              Beneficios
            </Link>
            <Link href="#modules" className="text-foreground hover:text-primary transition-colors">
              Módulos
            </Link>
            <Link href="#use-cases" className="text-foreground hover:text-primary transition-colors">
              Casos de Uso
            </Link>
            <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/signup">Registrarse</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 text-center bg-gradient-to-b from-sidebar-background to-sidebar-accent/10">
          <div className="container mx-auto px-6">
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 font-display">
              Tu universo digital, <span className="text-primary">perfectamente conectado</span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-sidebar-foreground/80 mb-10">
              Domina tu ecosistema digital con Skailan. Unificamos tus canales de comunicación (WhatsApp, Instagram, Email, etc.) y marketing (Google Ads, Meta Ads, LinkedIn Ads) en un solo lugar. Programa, gestiona y optimiza tu presencia online como nunca antes.
            </p>
            <div className="space-x-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg">
                <Link href="/signup">Comienza Gratis</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-3 text-lg">
                <Link href="#modules">Explorar Módulos</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground font-display">Beneficios Principales de Skailan</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefitItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} className="bg-card text-card-foreground shadow-lg hover:shadow-xl transition-transform transform hover:-translate-y-1 flex flex-col">
                    <CardHeader className="pb-4">
                      <div className="flex items-center mb-3">
                        <div className="p-3 rounded-full bg-primary/10 text-primary mr-4">
                          <Icon className="h-7 w-7" />
                        </div>
                        <CardTitle className="text-xl text-primary font-semibold">{item.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section id="modules" className="py-16 md:py-24 bg-sidebar-background">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary-foreground font-display">Explora los Módulos de Skailan</h2>
            {/* Placeholder for Tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {modulePlaceholders.map(module => (
                <Button key={module.name} variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  {module.name}
                </Button>
              ))}
            </div>
            <Card className="bg-card/90 text-card-foreground shadow-xl p-6 md:p-8">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 id="module-title" className="text-2xl font-bold mb-4 text-primary">Dashboard: Tu Centro de Mando</h3>
                  <p id="module-description" className="mb-4 text-muted-foreground">
                    El Dashboard proporciona una vista general del rendimiento del sistema y el estado de los diferentes módulos. Permite a los usuarios obtener una comprensión rápida de las métricas clave y acceder fácilmente a las funciones más importantes.
                  </p>
                  <h4 className="font-semibold mb-2 text-foreground">Características Principales:</h4>
                  <ul id="module-features" className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Resumen general de métricas</li>
                    <li>Análisis por módulo</li>
                    <li>Acceso rápido a funciones</li>
                    <li>Personalización de widgets</li>
                    <li>Alertas y notificaciones</li>
                  </ul>
                </div>
                <div className="rounded-lg overflow-hidden shadow-lg">
                  <Image 
                    src="https://placehold.co/600x350.png/0B1633/E8E2F9?text=Gráfico+Módulo+Skailan" 
                    alt="Placeholder de gráfico del módulo" 
                    width={600} 
                    height={350}
                    className="w-full h-auto"
                    data-ai-hint="dashboard analytics"
                  />
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Use Cases Section */}
        <section id="use-cases" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground font-display">¿Cómo te ayuda Skailan?</h2>
            {/* Placeholder for Role Filters */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {["Todos", "Empresas", "Marketers", "Ventas", "Soporte"].map(role => (
                <Button key={role} variant={role === "Todos" ? "default" : "secondary"} className={role === "Todos" ? "bg-primary text-primary-foreground" : ""}>
                  {role}
                </Button>
              ))}
            </div>
            <div id="use-cases-grid" className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {useCasePlaceholders.map((uc, index) => (
                <Card key={index} className="bg-card text-card-foreground shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-primary">{uc.title}</CardTitle>
                    <CardDescription className="text-xs pt-1">Para: {uc.role}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{uc.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-sidebar-accent text-sidebar-foreground/80 border-t border-sidebar-border">
        <div className="container mx-auto px-6 py-8 text-center">
          <Logo collapsed/>
          <p className="mt-4">&copy; {new Date().getFullYear()} Skailan. Tu universo digital, perfectamente conectado.</p>
          <div className="mt-4 space-x-4">
            <Link href="/privacy" className="hover:text-primary">Política de Privacidad</Link>
            <Link href="/terms" className="hover:text-primary">Términos de Servicio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
