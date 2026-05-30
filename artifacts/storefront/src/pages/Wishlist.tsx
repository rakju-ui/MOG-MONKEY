import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/product/ProductCard";
import { Footer } from "@/components/layout/Footer";
import { useGetWishlist, useRemoveFromWishlist, getGetWishlistQueryKey } from "@workspace/api-client-react";

const DEMO_USER_ID = 2; // Sarah Kim from seed data

export default function Wishlist() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useGetWishlist(DEMO_USER_ID, {
    query: { queryKey: getGetWishlistQueryKey(DEMO_USER_ID) },
  });
  const removeItem = useRemoveFromWishlist();

  const handleRemove = (productId: number) => {
    removeItem.mutate(
      { id: DEMO_USER_ID, productId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey(DEMO_USER_ID) });
          toast.success("Removed from wishlist");
        },
      }
    );
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Wishlist</h1>
          {items && items.length > 0 && (
            <p className="text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : !items?.length ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Heart className="h-16 w-16 text-muted-foreground/20 mb-5" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-muted-foreground mb-6">Save items you love to find them easily later.</p>
            <Button onClick={() => setLocation("/products")}>Browse Products</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map(item => (
              <ProductCard key={item.id} product={item.product} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
