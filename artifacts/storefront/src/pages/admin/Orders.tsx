import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "./Dashboard";
import {
  useListAdminOrders,
  useUpdateOrderStatus,
  getListAdminOrdersQueryKey,
} from "@workspace/api-client-react";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useListAdminOrders(
    { page, limit: 20, status: statusFilter !== "all" ? statusFilter : undefined },
    { query: { queryKey: getListAdminOrdersQueryKey({ page, limit: 20, status: statusFilter !== "all" ? statusFilter : undefined }) } }
  );
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = (orderId: number, status: string) => {
    updateStatus.mutate(
      { id: orderId, data: { status: status as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminOrdersQueryKey({}) });
          toast.success("Order status updated");
        },
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Orders</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {data?.total ?? 0} order{(data?.total ?? 0) !== 1 ? "s" : ""} total
            </p>
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40 text-sm bg-muted/40 border-transparent" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map(s => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[80px,2fr,1fr,1fr,160px] gap-4 px-5 py-3 border-b border-border bg-muted/30">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : !data?.items.length ? (
            <div className="p-16 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No orders found</p>
              <p className="text-xs text-muted-foreground">Orders will appear here once customers start purchasing.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.items.map(order => (
                <div
                  key={order.id}
                  className="grid grid-cols-[1fr,160px] md:grid-cols-[80px,2fr,1fr,1fr,160px] gap-4 px-5 py-4 items-center hover:bg-muted/20 transition-colors"
                  data-testid={`order-row-${order.id}`}
                >
                  <p className="text-sm font-semibold text-foreground hidden md:block">#{order.id}</p>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{order.customerEmail}</p>
                    <p className="text-xs text-muted-foreground md:hidden">
                      {new Date(order.createdAt).toLocaleDateString()} · ${order.total.toFixed(2)}
                    </p>
                  </div>
                  <p className="hidden md:block text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-sm font-semibold text-foreground hidden md:block">${order.total.toFixed(2)}</p>
                  <div>
                    <Select
                      value={order.status}
                      onValueChange={v => handleStatusChange(order.id, v)}
                    >
                      <SelectTrigger
                        className={`h-7 text-xs border-0 rounded-full px-3 font-semibold w-[148px] ${STATUS_STYLES[order.status] ?? ""}`}
                        data-testid={`select-order-status-${order.id}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => (
                          <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground px-3">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
