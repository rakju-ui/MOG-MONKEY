import { useParams, useLocation } from "wouter";
import { ChevronLeft, Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Footer } from "@/components/layout/Footer";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";

const STATUS_STEPS = ["confirmed", "processing", "shipped", "delivered"];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  confirmed: <CheckCircle className="h-4 w-4" />,
  processing: <Package className="h-4 w-4" />,
  shipped: <Truck className="h-4 w-4" />,
  delivered: <CheckCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
  refunded: <XCircle className="h-4 w-4" />,
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export default function OrderDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const [, setLocation] = useLocation();

  const { data: order, isLoading } = useGetOrder(id, {
    query: { enabled: !!id, queryKey: getGetOrderQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Skeleton className="h-4 w-20 mb-8 rounded" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-64 rounded" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-base font-semibold text-foreground mb-1">Order not found</p>
        <p className="text-sm text-muted-foreground mb-6">This order may not exist or has been removed.</p>
        <Button variant="outline" onClick={() => setLocation("/orders")}>Back to Orders</Button>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled" || order.status === "refunded";

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl flex-1">
        <button
          onClick={() => setLocation("/orders")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" /> Orders
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Order #{order.id}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${STATUS_BADGE[order.status] ?? STATUS_BADGE.pending}`}>
            {order.status}
          </span>
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">Tracking</h2>
            <div className="flex items-start relative">
              {/* Progress line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-border z-0" />
              <div
                className="absolute top-4 left-4 h-0.5 bg-primary z-0 transition-all duration-500"
                style={{
                  width: currentStepIdx >= 0
                    ? `${(currentStepIdx / (STATUS_STEPS.length - 1)) * (100 - 8)}%`
                    : "0%"
                }}
              />
              {STATUS_STEPS.map((step, i) => {
                const isComplete = i <= currentStepIdx;
                const isCurrent = i === currentStepIdx;
                return (
                  <div key={step} className="flex-1 flex flex-col items-center gap-2.5 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      isComplete
                        ? "bg-primary border-primary text-primary-foreground shadow-sm"
                        : "bg-background border-border text-muted-foreground"
                    } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}>
                      {STATUS_ICONS[step]}
                    </div>
                    <p className={`text-xs font-medium text-center hidden sm:block ${isComplete ? "text-foreground" : "text-muted-foreground"}`}>
                      {STATUS_LABELS[step]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-5">
          <div className="p-5 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Items ({order.items.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {order.items.map(item => (
              <div key={item.id} className="flex gap-4 p-4 items-center">
                <div className="h-14 w-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  {item.productImage && (
                    <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.productName}</p>
                  {item.variantLabel && <p className="text-xs text-muted-foreground">{item.variantLabel}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="p-5 bg-muted/20 border-t border-border">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{order.shippingCost === 0 ? <span className="text-emerald-600">Free</span> : `$${order.shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-foreground text-base pt-0.5">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Shipping Address</h2>
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p className="text-foreground font-medium">
              {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
            </p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
