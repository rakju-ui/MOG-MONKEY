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
        <Skeleton className="h-8 w-1/3 mb-8" />
        <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-48" /></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-lg font-medium mb-4">Order not found</p>
        <Button variant="outline" onClick={() => setLocation("/orders")}>Back to Orders</Button>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled" || order.status === "refunded";

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
        <button
          onClick={() => setLocation("/orders")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" /> Orders
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Order #{order.id}</h1>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
            isCancelled ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
            order.status === "delivered" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          }`}>{order.status}</span>
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-4 h-0.5 bg-border z-0" />
              {STATUS_STEPS.map((step, i) => {
                const isComplete = i <= currentStepIdx;
                const isCurrent = i === currentStepIdx;
                return (
                  <div key={step} className="flex flex-col items-center gap-2 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      isComplete ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border text-muted-foreground"
                    } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}>
                      {STATUS_ICONS[step]}
                    </div>
                    <p className={`text-xs capitalize font-medium hidden sm:block ${isComplete ? "text-primary" : "text-muted-foreground"}`}>{step}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Items</h2>
          <div className="space-y-4">
            {order.items.map((item, i) => (
              <div key={item.id}>
                <div className="flex gap-3 items-center">
                  <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {item.productImage && <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.productName}</p>
                    {item.variantLabel && <p className="text-xs text-muted-foreground">{item.variantLabel}</p>}
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                {i < order.items.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{order.shippingCost === 0 ? "Free" : `$${order.shippingCost.toFixed(2)}`}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>${order.tax.toFixed(2)}</span></div>
            <Separator />
            <div className="flex justify-between font-semibold text-foreground text-base"><span>Total</span><span>${order.total.toFixed(2)}</span></div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Shipping Address</h2>
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
      <Footer />
    </div>
  );
}
