import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Minus, Plus, X, ShoppingBag, ArrowRight, Tag, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Footer } from "@/components/layout/Footer";
import {
  useGetCart,
  useUpdateCartItem,
  useRemoveFromCart,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { getCartSessionId } from "@/lib/cart-session";

export default function CartPage() {
  const sessionId = getCartSessionId();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  const { data: cart, isLoading } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });

  const handleUpdate = (itemId: number, quantity: number) => {
    updateItem.mutate({ itemId, data: { quantity } }, { onSuccess: invalidate });
  };

  const handleRemove = (itemId: number) => {
    removeItem.mutate({ itemId }, {
      onSuccess: () => { invalidate(); toast.success("Item removed"); },
    });
  };

  const handleApplyCoupon = () => {
    if (!coupon.trim()) return;
    toast.info("Coupon codes coming soon");
  };

  const subtotal = cart?.subtotal ?? 0;
  const shippingCost = subtotal >= 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;
  const freeShippingProgress = Math.min((subtotal / 50) * 100, 100);
  const amountToFreeShipping = Math.max(0, 50 - subtotal);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 md:py-12 flex-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-2">Shopping Cart</h1>
        {cart && cart.itemCount > 0 && (
          <p className="text-sm text-muted-foreground mb-8">{cart.itemCount} item{cart.itemCount !== 1 ? "s" : ""}</p>
        )}

        {isLoading ? (
          <div className="space-y-4 max-w-2xl mt-8">
            {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : !cart?.items.length ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-sm text-muted-foreground mb-7 max-w-xs">
              Looks like you haven't added anything yet. Start browsing to find something you'll love.
            </p>
            <Button onClick={() => setLocation("/products")}>Browse Products</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Items */}
            <div className="lg:col-span-2 space-y-0">
              {/* Free shipping progress */}
              {amountToFreeShipping > 0 && (
                <div className="bg-card border border-border rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-foreground">
                      Add <span className="font-semibold">${amountToFreeShipping.toFixed(2)}</span> more for <span className="font-semibold text-primary">free shipping</span>
                    </p>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {amountToFreeShipping === 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      You qualify for free shipping!
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {cart.items.map((item, idx) => (
                  <div key={item.id}>
                    <div className="flex gap-4 p-5" data-testid={`cart-row-${item.id}`}>
                      <Link href={`/products/${item.productId}`}>
                        <div className="h-20 w-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                          {item.productImage && (
                            <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <Link href={`/products/${item.productId}`}>
                              <p className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer">{item.productName}</p>
                            </Link>
                            {item.variantLabel && (
                              <p className="text-xs text-muted-foreground mt-0.5">{item.variantLabel}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 p-1 -mr-1 rounded-md hover:bg-muted"
                            data-testid={`button-remove-${item.id}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden bg-background">
                            <button
                              onClick={() => handleUpdate(item.id, item.quantity - 1)}
                              className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              data-testid={`btn-dec-${item.id}`}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="h-8 w-8 flex items-center justify-center text-sm font-semibold border-x border-border">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdate(item.id, item.quantity + 1)}
                              className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              data-testid={`btn-inc-${item.id}`}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-foreground" data-testid={`price-${item.id}`}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {idx < cart.items.length - 1 && <Separator />}
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mt-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      value={coupon}
                      onChange={e => setCoupon(e.target.value)}
                      placeholder="Coupon code"
                      className="pl-9 bg-muted/40 border-transparent focus-visible:border-border focus-visible:bg-background"
                    />
                  </div>
                  <Button variant="outline" onClick={handleApplyCoupon}>Apply</Button>
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div>
              <div className="bg-card border border-border rounded-2xl p-6 sticky top-20">
                <h2 className="text-base font-semibold text-foreground mb-5">Order Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({cart.itemCount} item{cart.itemCount !== 1 ? "s" : ""})</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>
                      {shippingCost === 0
                        ? <span className="text-emerald-600 font-medium">Free</span>
                        : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-foreground text-base pt-0.5">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full mt-5 gap-2 h-11"
                  onClick={() => setLocation("/checkout")}
                  data-testid="button-checkout"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-muted-foreground"
                  onClick={() => setLocation("/products")}
                >
                  Continue Shopping
                </Button>

                <div className="mt-5 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Secure checkout · SSL encrypted · 30-day returns
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
