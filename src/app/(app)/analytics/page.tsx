"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, MessagesSquare, Clock, UserCheck, Users, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, PieChart } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Line, LineChart, Pie, PieChart as RechartsPieChart, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";

const messageVolumeData = [
  { date: "2024-07-01", messages: 186, channel: "WhatsApp" }, { date: "2024-07-01", messages: 120, channel: "Web" },
  { date: "2024-07-02", messages: 305, channel: "WhatsApp" }, { date: "2024-07-02", messages: 150, channel: "Web" },
  { date: "2024-07-03", messages: 237, channel: "WhatsApp" }, { date: "2024-07-03", messages: 100, channel: "Web" },
  { date: "2024-07-04", messages: 73, channel: "WhatsApp" },  { date: "2024-07-04", messages: 90, channel: "Web" },
  { date: "2024-07-05", messages: 209, channel: "WhatsApp" },{ date: "2024-07-05", messages: 160, channel: "Web" },
  { date: "2024-07-06", messages: 214, channel: "WhatsApp" },{ date: "2024-07-06", messages: 130, channel: "Web" },
];

const resolutionTimeData = [
  { date: "Mon", "Avg Time (min)": 5.2 },
  { date: "Tue", "Avg Time (min)": 6.1 },
  { date: "Wed", "Avg Time (min)": 4.5 },
  { date: "Thu", "Avg Time (min)": 5.8 },
  { date: "Fri", "Avg Time (min)": 5.1 },
  { date: "Sat", "Avg Time (min)": 7.0 },
  { date: "Sun", "Avg Time (min)": 6.5 },
];

const satisfactionData = [
  { name: 'Satisfied', value: 400, fill: 'var(--color-satisfied)' },
  { name: 'Neutral', value: 300, fill: 'var(--color-neutral)' },
  { name: 'Dissatisfied', value: 100, fill: 'var(--color-dissatisfied)' },
];

const chartConfig: ChartConfig = {
  messages: { label: "Messages", color: "hsl(var(--chart-1))" },
  resolved: { label: "Resolved", color: "hsl(var(--chart-2))" },
  "Avg Time (min)": { label: "Avg Resolution Time (min)", color: "hsl(var(--chart-3))" },
  satisfied: { label: "Satisfied", color: "hsl(var(--chart-2))" },
  neutral: { label: "Neutral", color: "hsl(var(--chart-4))" },
  dissatisfied: { label: "Dissatisfied", color: "hsl(var(--chart-5))" },
};


export default function AnalyticsPage() {
  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Overview of your chatbot performance and customer interactions.</p>
        </div>
        <div className="flex items-center gap-2">
            <Select defaultValue="last_7_days">
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                    <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" className="h-10 w-10 p-0">
                <CalendarDays className="h-5 w-5"/>
                <span className="sr-only">Select Date Range</span>
            </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessagesSquare className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,345</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-4 w-4 mr-1 text-green-500" /> +5.2% from last week
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
            <Clock className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5m 32s</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-4 w-4 mr-1 text-red-500" /> -1.8% from last week
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <UserCheck className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-4 w-4 mr-1 text-green-500" /> +0.5% from last week
            </p>
          </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8 / 10</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Message Volume by Channel</CardTitle>
            <CardDescription>Daily messages received in the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={messageVolumeData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <RechartsTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="messages" stackId="a" fill="var(--color-messages)" radius={[4, 4, 0, 0]} />
                 {/* You would typically map unique channels to multiple bars or a stacked bar */}
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Average Resolution Time</CardTitle>
             <CardDescription>Trend over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={resolutionTimeData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={['dataMin - 1', 'dataMax + 1']}/>
                <RechartsTooltip content={<ChartTooltipContent indicator="line" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line type="monotone" dataKey="Avg Time (min)" stroke="var(--color-Avg Time (min))" strokeWidth={2} dot={true} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
       <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <Card className="shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle>Customer Satisfaction</CardTitle>
            <CardDescription>Overall satisfaction distribution.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <RechartsPieChart>
                <RechartsTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={satisfactionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {satisfactionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} className="mt-4" />
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="shadow-lg lg:col-span-2">
           <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
            <CardDescription>Key metrics per agent.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Resolved</TableHead>
                  <TableHead className="text-right">Avg. Handle Time</TableHead>
                  <TableHead className="text-right">CSAT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: 'John Doe', resolved: 120, handleTime: '4m 15s', csat: '95%' },
                  { name: 'Jane Smith', resolved: 98, handleTime: '5m 02s', csat: '90%' },
                  { name: 'Mike Ross', resolved: 150, handleTime: '3m 50s', csat: '98%' },
                  { name: 'Rachel Zane', resolved: 80, handleTime: '6m 10s', csat: '88%' },
                ].map(agent => (
                  <TableRow key={agent.name}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell className="text-right">{agent.resolved}</TableCell>
                    <TableCell className="text-right">{agent.handleTime}</TableCell>
                    <TableCell className="text-right">{agent.csat}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
    </ScrollArea>
  );
}

// Used to make ScrollArea take full height
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
