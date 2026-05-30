import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "./Dashboard";
import {
  useListAdminOrders,
  useUpdateOrderStatus,
  getListAdminOrdersQueryKey,
} from "@workspace/api-client-react";

const STATUS_COLORS: Record<string, string> = {
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Orders</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} total</p>
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36 text-sm" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[80px,2fr,1fr,1fr,160px] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span>Order</span><span>Customer</span><span>Date</span><span>Total</span><span>Status</span>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14" />)}</div>
          ) : !data?.items.length ? (
            <div className="p-12 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No orders found</p>
            </div>
          ) : (
            data.items.map((order, i) => (
              <div key={order.id} className={`grid grid-cols-[1fr,160px] md:grid-cols-[80px,2fr,1fr,1fr,160px] gap-4 px-5 py-4 items-center ${i !== data.items.length - 1 ? "border-b border-border" : ""}`} data-testid={`order-row-${order.id}`}>
                <p className="text-sm font-semibold text-foreground hidden md:block">#{order.id}</p>
                <div>
                  <p className="text-sm font-medium text-foreground">{order.customerEmail}</p>
                  <p className="text-xs text-muted-foreground md:hidden">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="hidden md:block text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                <p className="text-sm font-semibold text-foreground hidden md:block">${order.total.toFixed(2)}</p>
                <Select
                  value={order.status}
                  onValueChange={v => handleStatusChange(order.id, v)}
                >
                  <SelectTrigger className={`h-7 text-xs border-0 rounded-full px-2.5 font-medium w-[140px] ${STATUS_COLORS[order.status] ?? ""}`} data-testid={`select-order-status-${order.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="flex items-center text-sm text-muted-foreground px-3">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
