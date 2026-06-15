import { Link, useLocation } from "wouter";
import { TrendingUp, TrendingDown, ShoppingBag, Users, Package, DollarSign, Clock, AlertTriangle, LayoutGrid, ArrowRight, Store } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useGetAnalyticsSummary, useGetRevenueChart, getGetAnalyticsSummaryQueryKey, getGetRevenueChartQueryKey } from "@workspace/api-client-react";
import { useState } from "react";

const NAV = [
  { href: "/mogger_monkey", label: "Dashboard", icon: LayoutGrid },
  { href: "/mogger_monkey/products", label: "Products", icon: Package },
  { href: "/mogger_monkey/orders", label: "Orders", icon: ShoppingBag },
  { href: "/mogger_monkey/customers", label: "Customers", icon: Users },
];

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card/50 sticky top-0 h-screen">
        <div className="p-5 border-b border-border">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="https://res.cloudinary.com/do4wj3d1w/image/upload/v1781549823/09c9d320-fbee-4f05-8eea-85c18775c46c_t8k26u.png" alt="MØG MONKEY logo" className="h-6 w-6 object-contain" />
            <span className="text-base font-bold tracking-tighter text-foreground">𝕄Ø𝔾 𝕄𝕆ℕ𝕂𝔼𝕐</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Admin Panel</p>
        </div>

        <nav className="p-2.5 flex-1 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive = location === href || (href !== "/mogger_monkey" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}>
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-2.5 border-t border-border">
          <Link href="/">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-all">
              <Store className="h-4 w-4" />
              View Store
            </div>
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}

export { AdminLayout };

function StatCard({ label, value, growth, icon: Icon, prefix = "", suffix = "" }: {
  label: string; value: number | string; growth?: number; icon: React.ElementType; prefix?: string; suffix?: string;
}) {
  const positive = (growth ?? 0) >= 0;
  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:border-foreground/15 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className="h-8 w-8 rounded-xl bg-primary/8 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground tracking-tight">
        {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
      </p>
      {growth !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${positive ? "text-emerald-600" : "text-red-500"}`}>
          {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {Math.abs(growth).toFixed(1)}% vs last month
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const { data: summary, isLoading: summLoading } = useGetAnalyticsSummary({
    query: { queryKey: getGetAnalyticsSummaryQueryKey() },
  });
  const { data: revenueData, isLoading: revLoading } = useGetRevenueChart(
    { period },
    { query: { queryKey: getGetRevenueChartQueryKey({ period }) } }
  );

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Store performance overview</p>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Stats */}
        {summLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Revenue"
              value={(summary?.totalRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              growth={summary?.revenueGrowth}
              icon={DollarSign}
              prefix="$"
            />
            <StatCard label="Orders" value={summary?.totalOrders ?? 0} growth={summary?.ordersGrowth} icon={ShoppingBag} />
            <StatCard label="Customers" value={summary?.totalCustomers ?? 0} icon={Users} />
            <StatCard label="Products" value={summary?.totalProducts ?? 0} icon={Package} />
          </div>
        )}

        {/* Alert banners */}
        {summary && (summary.pendingOrders > 0 || summary.lowStockProducts > 0) && (
          <div className="flex flex-wrap gap-3 mb-6">
            {summary.pendingOrders > 0 && (
              <div className="flex items-center gap-3 text-sm bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/60 rounded-xl px-4 py-2.5">
                <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span className="text-amber-700 dark:text-amber-400">{summary.pendingOrders} pending order{summary.pendingOrders !== 1 ? "s" : ""}</span>
                <Link href="/mogger_monkey/orders">
                  <span className="text-amber-600 hover:text-amber-700 font-medium text-xs flex items-center gap-0.5 cursor-pointer">
                    View <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            )}
            {summary.lowStockProducts > 0 && (
              <div className="flex items-center gap-3 text-sm bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/60 rounded-xl px-4 py-2.5">
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-red-700 dark:text-red-400">{summary.lowStockProducts} product{summary.lowStockProducts !== 1 ? "s" : ""} low on stock</span>
                <Link href="/mogger_monkey/products">
                  <span className="text-red-600 hover:text-red-700 font-medium text-xs flex items-center gap-0.5 cursor-pointer">
                    View <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Revenue chart */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Revenue</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Total revenue over time</p>
            </div>
            <Select value={period} onValueChange={v => setPeriod(v as any)}>
              <SelectTrigger className="w-28 h-8 text-xs bg-muted/50 border-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
                <SelectItem value="1y">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {revLoading ? (
            <Skeleton className="h-56 w-full rounded-xl" />
          ) : !revenueData?.length ? (
            <div className="h-56 flex flex-col items-center justify-center text-center">
              <DollarSign className="h-8 w-8 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No revenue data yet</p>
              <p className="text-xs text-muted-foreground mt-1">Revenue will appear here once orders are placed</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "10px",
                    fontSize: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                  labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
