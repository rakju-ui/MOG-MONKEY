import { Link } from "wouter";
import { TrendingUp, TrendingDown, ShoppingBag, Users, Package, DollarSign, Clock, AlertTriangle, LayoutGrid, List, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useGetAnalyticsSummary, useGetRevenueChart, getGetAnalyticsSummaryQueryKey, getGetRevenueChartQueryKey } from "@workspace/api-client-react";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
];

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card">
        <div className="p-5 border-b border-border">
          <Link href="/" className="text-sm font-bold tracking-tighter text-foreground">MIRA</Link>
          <p className="text-xs text-muted-foreground mt-0.5">Admin</p>
        </div>
        <nav className="p-3 flex-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer hover:bg-accent hover:text-accent-foreground text-muted-foreground`}>
                <Icon className="h-4 w-4" /> {label}
              </div>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Link href="/">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              <Settings className="h-4 w-4" /> Back to Store
            </div>
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

export { AdminLayout };

function StatCard({ label, value, growth, icon: Icon, prefix = "", suffix = "" }: {
  label: string; value: number | string; growth?: number; icon: React.ElementType; prefix?: string; suffix?: string;
}) {
  const positive = (growth ?? 0) >= 0;
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground tracking-tight">{prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}</p>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Store performance overview</p>
          </div>
        </div>

        {/* Stats */}
        {summLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Revenue" value={(summary?.totalRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} growth={summary?.revenueGrowth} icon={DollarSign} prefix="$" />
            <StatCard label="Total Orders" value={summary?.totalOrders ?? 0} growth={summary?.ordersGrowth} icon={ShoppingBag} />
            <StatCard label="Customers" value={summary?.totalCustomers ?? 0} icon={Users} />
            <StatCard label="Products" value={summary?.totalProducts ?? 0} icon={Package} />
          </div>
        )}

        {/* Alert row */}
        {summary && (summary.pendingOrders > 0 || summary.lowStockProducts > 0) && (
          <div className="flex flex-wrap gap-3 mb-8">
            {summary.pendingOrders > 0 && (
              <div className="flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-amber-700 dark:text-amber-400">{summary.pendingOrders} pending orders</span>
                <Link href="/admin/orders"><span className="text-amber-600 underline cursor-pointer text-xs ml-1">View</span></Link>
              </div>
            )}
            {summary.lowStockProducts > 0 && (
              <div className="flex items-center gap-2 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-red-700 dark:text-red-400">{summary.lowStockProducts} products low on stock</span>
              </div>
            )}
          </div>
        )}

        {/* Revenue chart */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-foreground">Revenue</h2>
            <Select value={period} onValueChange={v => setPeriod(v as any)}>
              <SelectTrigger className="w-28 h-8 text-xs">
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
            <Skeleton className="h-56 w-full" />
          ) : !revenueData?.length ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
