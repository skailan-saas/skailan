"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  MessageSquare,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Phone,
  Mail,
  Instagram,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Archive,
  UserPlus,
  Calendar,
  BarChart3,
  Activity,
  Target,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Datos de ejemplo para el dashboard
const conversationMetrics = {
  total: 1247,
  active: 89,
  closed: 156,
  archived: 1002,
  responseTime: "2.3 min",
  satisfaction: 4.2,
};

const channelData = [
  { name: "WhatsApp", value: 65, color: "#25D366", conversations: 812 },
  { name: "Messenger", value: 20, color: "#0084FF", conversations: 249 },
  { name: "Instagram", value: 10, color: "#E4405F", conversations: 125 },
  { name: "Web Chat", value: 5, color: "#6366F1", conversations: 61 },
];

const weeklyData = [
  { day: "Lun", conversations: 45, messages: 234, resolved: 38 },
  { day: "Mar", conversations: 52, messages: 287, resolved: 44 },
  { day: "Mié", conversations: 48, messages: 256, resolved: 41 },
  { day: "Jue", conversations: 61, messages: 312, resolved: 53 },
  { day: "Vie", conversations: 55, messages: 298, resolved: 48 },
  { day: "Sáb", conversations: 38, messages: 189, resolved: 32 },
  { day: "Dom", conversations: 29, messages: 145, resolved: 25 },
];

const hourlyData = [
  { hour: "00", messages: 12 },
  { hour: "01", messages: 8 },
  { hour: "02", messages: 5 },
  { hour: "03", messages: 3 },
  { hour: "04", messages: 4 },
  { hour: "05", messages: 7 },
  { hour: "06", messages: 15 },
  { hour: "07", messages: 28 },
  { hour: "08", messages: 45 },
  { hour: "09", messages: 67 },
  { hour: "10", messages: 89 },
  { hour: "11", messages: 92 },
  { hour: "12", messages: 78 },
  { hour: "13", messages: 85 },
  { hour: "14", messages: 91 },
  { hour: "15", messages: 88 },
  { hour: "16", messages: 76 },
  { hour: "17", messages: 69 },
  { hour: "18", messages: 54 },
  { hour: "19", messages: 42 },
  { hour: "20", messages: 35 },
  { hour: "21", messages: 28 },
  { hour: "22", messages: 22 },
  { hour: "23", messages: 18 },
];

const agentPerformance = [
  {
    name: "Ana García",
    conversations: 45,
    avgResponse: "1.8 min",
    satisfaction: 4.8,
    resolved: 42,
  },
  {
    name: "Carlos López",
    conversations: 38,
    avgResponse: "2.1 min",
    satisfaction: 4.6,
    resolved: 35,
  },
  {
    name: "María Rodríguez",
    conversations: 52,
    avgResponse: "1.5 min",
    satisfaction: 4.9,
    resolved: 49,
  },
  {
    name: "Juan Pérez",
    conversations: 41,
    avgResponse: "2.4 min",
    satisfaction: 4.4,
    resolved: 37,
  },
];

const chartConfig = {
  conversations: {
    label: "Conversaciones",
    color: "#8884d8",
  },
  messages: {
    label: "Mensajes",
    color: "#82ca9d",
  },
  resolved: {
    label: "Resueltas",
    color: "#ffc658",
  },
};

export default function AnalyticsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [isLoading, setIsLoading] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setCheckingSession(false);
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (checkingSession) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Métricas y estadísticas de rendimiento en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={selectedPeriod === "24h" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod("24h")}
          >
            24h
          </Button>
          <Button
            variant={selectedPeriod === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod("7d")}
          >
            7d
          </Button>
          <Button
            variant={selectedPeriod === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod("30d")}
          >
            30d
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Conversaciones
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversationMetrics.total.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12% desde el mes pasado
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversaciones Activas
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversationMetrics.active}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              -3% desde ayer
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tiempo de Respuesta
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversationMetrics.responseTime}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              -15% más rápido
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfacción</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversationMetrics.satisfaction}/5
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +0.2 puntos
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="channels">Canales</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Conversations Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Conversaciones por Día</CardTitle>
                <CardDescription>Últimos 7 días</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="conversations"
                      fill="var(--color-conversations)"
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Channel Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Canal</CardTitle>
                <CardDescription>Porcentaje de conversaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Hourly Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad por Hora</CardTitle>
              <CardDescription>
                Mensajes recibidos en las últimas 24 horas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="messages"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {channelData.map((channel) => (
              <Card key={channel.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {channel.name}
                  </CardTitle>
                  {channel.name === "WhatsApp" && (
                    <MessageCircle
                      className="h-4 w-4"
                      style={{ color: channel.color }}
                    />
                  )}
                  {channel.name === "Messenger" && (
                    <Mail
                      className="h-4 w-4"
                      style={{ color: channel.color }}
                    />
                  )}
                  {channel.name === "Instagram" && (
                    <Instagram
                      className="h-4 w-4"
                      style={{ color: channel.color }}
                    />
                  )}
                  {channel.name === "Web Chat" && (
                    <MessageSquare
                      className="h-4 w-4"
                      style={{ color: channel.color }}
                    />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {channel.conversations}
                  </div>
                  <Progress value={channel.value} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {channel.value}% del total
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Canal</CardTitle>
              <CardDescription>
                Comparación de métricas entre canales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="conversations" fill="#8884d8" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento de Agentes</CardTitle>
              <CardDescription>
                Métricas individuales del equipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentPerformance.map((agent, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {agent.conversations} conversaciones
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{agent.avgResponse}</p>
                        <p className="text-muted-foreground">Tiempo resp.</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{agent.satisfaction}/5</p>
                        <p className="text-muted-foreground">Satisfacción</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{agent.resolved}</p>
                        <p className="text-muted-foreground">Resueltas</p>
                      </div>
                      <Badge
                        variant={
                          agent.satisfaction >= 4.5 ? "default" : "secondary"
                        }
                      >
                        {agent.satisfaction >= 4.5 ? "Excelente" : "Bueno"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Conversaciones</CardTitle>
              <CardDescription>
                Evolución semanal de métricas clave
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="conversations"
                    stroke="var(--color-conversations)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="messages"
                    stroke="var(--color-messages)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke="var(--color-resolved)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Tasa de Resolución
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <Progress value={87} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  +5% vs mes anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Tiempo Promedio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2h</div>
                <Progress value={65} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  -12% vs mes anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Escalaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8%</div>
                <Progress value={8} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  -2% vs mes anterior
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
