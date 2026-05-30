import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Footer } from "@/components/layout/Footer";
import {
  useGetCart,
  useUpdateCartItem,
  useRemoveFromCart,
  useClearCart,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { getCartSessionId } from "@/lib/cart-session";

export default function CartPage() {
  const sessionId = getCartSessionId();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: cart, isLoading } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();
  const clearCart = useClearCart();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });

  const handleUpdate = (itemId: number, quantity: number) => {
    updateItem.mutate({ itemId, data: { quantity } }, { onSuccess: invalidate });
  };

  const handleRemove = (itemId: number) => {
    removeItem.mutate({ itemId }, {
      onSuccess: () => { invalidate(); toast.success("Item removed"); },
    });
  };

  const shippingCost = (cart?.subtotal ?? 0) >= 50 ? 0 : 9.99;
  const tax = (cart?.subtotal ?? 0) * 0.08;
  const total = (cart?.subtotal ?? 0) + shippingCost + tax;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-8">Shopping Cart</h1>

        {isLoading ? (
          <div className="space-y-4 max-w-2xl">
            {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : !cart?.items.length ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/20 mb-5" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-sm text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
            <Button onClick={() => setLocation("/products")}>Browse Products</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <div className="space-y-1">
                {cart.items.map((item, idx) => (
                  <div key={item.id}>
                    <div className="flex gap-4 py-5" data-testid={`cart-row-${item.id}`}>
                      <Link href={`/products/${item.productId}`}>
                        <div className="h-20 w-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 cursor-pointer">
                          {item.productImage && (
                            <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/products/${item.productId}`}>
                              <p className="text-sm font-medium text-foreground hover:underline cursor-pointer">{item.productName}</p>
                            </Link>
                            {item.variantLabel && <p className="text-xs text-muted-foreground mt-0.5">{item.variantLabel}</p>}
                          </div>
                          <button onClick={() => handleRemove(item.id)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0" data-testid={`button-remove-${item.id}`}>
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
                            <button onClick={() => handleUpdate(item.id, item.quantity - 1)} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" data-testid={`btn-dec-${item.id}`}>
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="h-8 w-8 flex items-center justify-center text-sm font-medium border-x border-border">{item.quantity}</span>
                            <button onClick={() => handleUpdate(item.id, item.quantity + 1)} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" data-testid={`btn-inc-${item.id}`}>
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-foreground" data-testid={`price-${item.id}`}>${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    {idx < cart.items.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </div>

            {/* Order summary */}
            <div>
              <div className="bg-card border border-border rounded-2xl p-6 sticky top-20">
                <h2 className="text-base font-semibold text-foreground mb-5">Order Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({cart.itemCount} items)</span>
                    <span>${cart.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>{shippingCost === 0 ? <span className="text-emerald-600">Free</span> : `$${shippingCost.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-foreground text-base pt-1">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                {shippingCost > 0 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Add ${(50 - cart.subtotal).toFixed(2)} more to get free shipping
                  </p>
                )}
                <Button className="w-full mt-5 gap-2" onClick={() => setLocation("/checkout")} data-testid="button-checkout">
                  Proceed to Checkout <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setLocation("/products")}>
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
