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
  Area,
  AreaChart,
} from "recharts";
import {
  MessageSquare,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  Activity,
  Target,
  Download,
  Filter,
  DollarSign,
  ShoppingCart,
  UserCheck,
} from "lucide-react";
import { useState, useEffect } from "react";

// Datos avanzados para analytics
const advancedMetrics = {
  totalRevenue: 45680,
  conversionRate: 12.4,
  avgOrderValue: 89.5,
  customerLifetimeValue: 234.8,
  churnRate: 3.2,
  nps: 8.7,
};

const salesFunnelData = [
  { stage: "Visitantes", count: 10000, percentage: 100 },
  { stage: "Leads", count: 2500, percentage: 25 },
  { stage: "Calificados", count: 1200, percentage: 12 },
  { stage: "Oportunidades", count: 600, percentage: 6 },
  { stage: "Ventas", count: 150, percentage: 1.5 },
];

const revenueData = [
  { month: "Ene", revenue: 12400, leads: 245, conversions: 28 },
  { month: "Feb", revenue: 15600, leads: 312, conversions: 35 },
  { month: "Mar", revenue: 18900, leads: 378, conversions: 42 },
  { month: "Abr", revenue: 22100, leads: 441, conversions: 49 },
  { month: "May", revenue: 25800, leads: 516, conversions: 58 },
  { month: "Jun", revenue: 28400, leads: 568, conversions: 64 },
];

const customerSegments = [
  { name: "Nuevos", value: 35, color: "#8884d8", count: 1250 },
  { name: "Recurrentes", value: 45, color: "#82ca9d", count: 1620 },
  { name: "VIP", value: 15, color: "#ffc658", count: 540 },
  { name: "Inactivos", value: 5, color: "#ff7300", count: 180 },
];

const productPerformance = [
  { product: "Producto A", sales: 450, revenue: 22500, growth: 12 },
  { product: "Producto B", sales: 380, revenue: 19000, growth: 8 },
  { product: "Producto C", sales: 320, revenue: 16000, growth: -3 },
  { product: "Producto D", sales: 280, revenue: 14000, growth: 15 },
  { product: "Producto E", sales: 220, revenue: 11000, growth: 5 },
];

const chartConfig = {
  revenue: {
    label: "Ingresos",
    color: "#8884d8",
  },
  leads: {
    label: "Leads",
    color: "#82ca9d",
  },
  conversions: {
    label: "Conversiones",
    color: "#ffc658",
  },
};

export default function AdvancedAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Cargando analytics avanzados...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Avanzados</h1>
          <p className="text-muted-foreground">
            Análisis profundo de ventas, conversiones y rendimiento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <div className="flex items-center gap-1">
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
            <Button
              variant={selectedPeriod === "90d" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("90d")}
            >
              90d
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${advancedMetrics.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +18% desde el mes pasado
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa de Conversión
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {advancedMetrics.conversionRate}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +2.1% vs mes anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Promedio
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${advancedMetrics.avgOrderValue}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +$5.20 vs mes anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LTV Cliente</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${advancedMetrics.customerLifetimeValue}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12% vs mes anterior
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          <TabsTrigger value="funnel">Embudo de Ventas</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Tendencia de Ingresos</CardTitle>
                <CardDescription>
                  Evolución mensual de ingresos, leads y conversiones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="leads"
                      stroke="var(--color-leads)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="conversions"
                      stroke="var(--color-conversions)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Monthly Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Crecimiento Mensual</CardTitle>
                <CardDescription>Comparación mes a mes</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Revenue Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Ingresos</CardTitle>
                <CardDescription>Por canal de ventas</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      fill="var(--color-revenue)"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Embudo de Conversión</CardTitle>
              <CardDescription>Análisis del proceso de ventas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesFunnelData.map((stage, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{stage.stage}</p>
                        <p className="text-sm text-muted-foreground">
                          {stage.count.toLocaleString()} usuarios
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Progress value={stage.percentage} className="w-32" />
                      <Badge variant="outline">{stage.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Tasa de Conversión Global
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.5%</div>
                <Progress value={1.5} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  150 ventas de 10,000 visitantes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Mejor Etapa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Lead → Calificado</div>
                <Progress value={48} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  48% de conversión
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Oportunidad de Mejora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Oportunidad → Venta</div>
                <Progress value={25} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  25% de conversión
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Segments */}
            <Card>
              <CardHeader>
                <CardTitle>Segmentación de Clientes</CardTitle>
                <CardDescription>
                  Distribución por tipo de cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <PieChart>
                    <Pie
                      data={customerSegments}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {customerSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Customer Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Cliente</CardTitle>
                <CardDescription>
                  Indicadores clave de retención
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Tasa de Retención</span>
                  <span className="text-2xl font-bold">94.8%</span>
                </div>
                <Progress value={94.8} />

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Churn Rate</span>
                  <span className="text-2xl font-bold">
                    {advancedMetrics.churnRate}%
                  </span>
                </div>
                <Progress value={advancedMetrics.churnRate} />

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Net Promoter Score
                  </span>
                  <span className="text-2xl font-bold">
                    {advancedMetrics.nps}/10
                  </span>
                </div>
                <Progress value={advancedMetrics.nps * 10} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {customerSegments.map((segment, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {segment.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {segment.count.toLocaleString()}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <div
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: segment.color }}
                    ></div>
                    {segment.value}% del total
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento de Productos</CardTitle>
              <CardDescription>
                Análisis de ventas y crecimiento por producto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productPerformance.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{product.product}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.sales} ventas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium">
                          ${product.revenue.toLocaleString()}
                        </p>
                        <p className="text-muted-foreground">Ingresos</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{product.sales}</p>
                        <p className="text-muted-foreground">Unidades</p>
                      </div>
                      <Badge
                        variant={
                          product.growth >= 0 ? "default" : "destructive"
                        }
                        className="flex items-center gap-1"
                      >
                        {product.growth >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(product.growth)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
