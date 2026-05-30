import { useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetCart,
  useUpdateCartItem,
  useRemoveFromCart,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { getCartSessionId } from "@/lib/cart-session";
import { useCartDrawer, closeCartDrawer } from "@/lib/cart-store";

export function CartDrawer() {
  const { open, setOpen } = useCartDrawer();
  const sessionId = getCartSessionId();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: cart, isLoading } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();

  const handleUpdate = (itemId: number, quantity: number) => {
    updateItem.mutate(
      { itemId, data: { quantity } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) }) }
    );
  };

  const handleRemove = (itemId: number) => {
    removeItem.mutate(
      { itemId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
          toast.success("Item removed");
        },
      }
    );
  };

  const handleCheckout = () => {
    closeCartDrawer();
    setLocation("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold">
            <ShoppingBag className="h-4 w-4" />
            Cart {cart?.itemCount ? `(${cart.itemCount})` : ""}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          ) : !cart?.items.length ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium text-foreground mb-1">Your cart is empty</p>
              <p className="text-xs text-muted-foreground mb-6">Add some products to get started</p>
              <Button variant="outline" size="sm" onClick={() => { closeCartDrawer(); setLocation("/products"); }}>
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map(item => (
                <div key={item.id} className="flex gap-3" data-testid={`cart-item-${item.id}`}>
                  <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {item.productImage && (
                      <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.productName}</p>
                    {item.variantLabel && <p className="text-xs text-muted-foreground">{item.variantLabel}</p>}
                    <p className="text-sm font-semibold mt-0.5">${(item.price * item.quantity).toFixed(2)}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <button
                        onClick={() => handleUpdate(item.id, item.quantity - 1)}
                        className="h-6 w-6 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                        data-testid={`button-decrease-${item.id}`}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm w-6 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdate(item.id, item.quantity + 1)}
                        className="h-6 w-6 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                        data-testid={`button-increase-${item.id}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors self-start mt-0.5"
                    data-testid={`button-remove-${item.id}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart && cart.items.length > 0 && (
          <div className="border-t border-border px-6 py-5 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{cart.subtotal >= 50 ? "Free" : "$9.99"}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-foreground pt-1">
                <span>Total</span>
                <span>${(cart.subtotal + (cart.subtotal >= 50 ? 0 : 9.99)).toFixed(2)}</span>
              </div>
            </div>
            <Button className="w-full gap-2" onClick={handleCheckout} data-testid="button-checkout">
              Checkout
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => { closeCartDrawer(); setLocation("/cart"); }}>
              View Cart
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
