import { useLocation } from "wouter";
import { Package, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Footer } from "@/components/layout/Footer";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export default function Orders() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useListOrders(
    { limit: 20, page: 1 },
    { query: { queryKey: getListOrdersQueryKey({ limit: 20, page: 1 }) } }
  );

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-8">Your Orders</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="h-16 w-16 text-muted-foreground/20 mb-5" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-sm text-muted-foreground mb-6">When you place your first order, it will appear here.</p>
            <Button onClick={() => setLocation("/products")}>Start Shopping</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {data.items.map(order => (
              <div
                key={order.id}
                className="bg-card border border-border rounded-xl p-5 hover:border-foreground/20 transition-colors cursor-pointer"
                onClick={() => setLocation(`/orders/${order.id}`)}
                data-testid={`order-row-${order.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-semibold text-foreground">Order #{order.id}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[order.status] ?? STATUS_STYLES.pending}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      {" · "}{order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex gap-1.5 mt-3 overflow-hidden">
                      {order.items.slice(0, 3).map(item => item.productImage && (
                        <img key={item.id} src={item.productImage} alt={item.productName} className="h-10 w-10 rounded-md object-cover bg-muted" />
                      ))}
                      {order.items.length > 3 && (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">${order.total.toFixed(2)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
