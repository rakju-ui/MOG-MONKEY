import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { ShoppingBag, Heart, Star, ChevronLeft, Minus, Plus, Check, Truck, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/product/ProductCard";
import { Footer } from "@/components/layout/Footer";
import {
  useGetProduct,
  useListRelatedProducts,
  useListProductReviews,
  useAddToCart,
  getGetProductQueryKey,
  getListRelatedProductsQueryKey,
  getListProductReviewsQueryKey,
} from "@workspace/api-client-react";
import { getCartSessionId } from "@/lib/cart-session";
import { openCartDrawer } from "@/lib/cart-store";

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const [, setLocation] = useLocation();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const { data: product, isLoading } = useGetProduct(id, {
    query: { enabled: !!id, queryKey: getGetProductQueryKey(id) },
  });
  const { data: related } = useListRelatedProducts(id, {
    query: { enabled: !!id, queryKey: getListRelatedProductsQueryKey(id) },
  });
  const { data: reviews } = useListProductReviews(id, {
    query: { enabled: !!id, queryKey: getListProductReviewsQueryKey(id) },
  });

  const addToCart = useAddToCart();
  const sessionId = getCartSessionId();

  const handleAddToCart = () => {
    addToCart.mutate(
      { data: { sessionId, productId: id, quantity, variantId: selectedVariant ?? undefined } },
      {
        onSuccess: () => {
          setAddedToCart(true);
          setTimeout(() => setAddedToCart(false), 2000);
          toast.success("Added to cart");
          openCartDrawer();
        },
        onError: () => toast.error("Failed to add to cart"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="flex gap-2">
              {[0,1,2].map(i => <Skeleton key={i} className="h-16 w-16 rounded-lg" />)}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-lg font-medium">Product not found</p>
        <Button className="mt-4" variant="outline" onClick={() => setLocation("/products")}>
          Back to products
        </Button>
      </div>
    );
  }

  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  const avgRating = reviews?.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-10">
        <button
          onClick={() => setLocation("/products")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          data-testid="button-back"
        >
          <ChevronLeft className="h-4 w-4" /> All Products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Images */}
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl bg-muted/30 aspect-square">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={product.images[selectedImage] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                />
              </AnimatePresence>
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImage ? "border-primary" : "border-transparent"}`}
                    data-testid={`thumb-${i}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                {product.categoryName && (
                  <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-2">{product.categoryName}</p>
                )}
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="product-name">{product.name}</h1>
              </div>
              {!product.inStock && <Badge variant="secondary">Out of Stock</Badge>}
              {discount > 0 && <Badge className="bg-primary text-primary-foreground">-{discount}%</Badge>}
            </div>

            {reviews && reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">{avgRating.toFixed(1)} ({reviews.length} reviews)</span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-foreground" data-testid="product-price">${product.price.toFixed(2)}</span>
              {product.compareAtPrice && (
                <span className="text-lg text-muted-foreground line-through">${product.compareAtPrice.toFixed(2)}</span>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{product.description}</p>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-foreground mb-2.5">
                  {product.variants[0]?.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(selectedVariant === v.id ? null : v.id)}
                      className={`px-3.5 py-1.5 text-sm rounded-md border transition-all ${
                        selectedVariant === v.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:border-foreground/40"
                      }`}
                      data-testid={`variant-${v.id}`}
                    >
                      {v.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3 mb-6">
              <p className="text-sm font-medium text-foreground">Quantity</p>
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  data-testid="button-quantity-decrease"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="h-9 w-10 flex items-center justify-center text-sm font-medium border-x border-border" data-testid="product-quantity">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  data-testid="button-quantity-increase"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-3 mb-6">
              <Button
                size="lg"
                className="flex-1 gap-2 transition-all duration-200"
                onClick={handleAddToCart}
                disabled={!product.inStock || addToCart.isPending}
                data-testid="button-add-to-cart"
              >
                {addedToCart ? (
                  <><Check className="h-4 w-4" /> Added!</>
                ) : (
                  <><ShoppingBag className="h-4 w-4" /> Add to Cart</>
                )}
              </Button>
              <Button size="lg" variant="outline" className="gap-2" data-testid="button-wishlist">
                <Heart className="h-4 w-4" />
              </Button>
            </div>

            {/* Shipping info */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2.5 text-sm">
                <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">Free shipping on orders over <span className="font-medium">$50</span></span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <RefreshCw className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">Free 30-day returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Reviews / Details */}
        <div className="mt-16">
          <Tabs defaultValue="reviews">
            <TabsList className="mb-8">
              <TabsTrigger value="reviews">Reviews ({reviews?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            <TabsContent value="reviews">
              {!reviews?.length ? (
                <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
                  {reviews.map(r => (
                    <div key={r.id} className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-foreground">{r.authorName}</p>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
                          ))}
                        </div>
                      </div>
                      {r.title && <p className="text-sm font-medium text-foreground mb-1">{r.title}</p>}
                      {r.body && <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>}
                      <p className="text-xs text-muted-foreground mt-3">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="details">
              <div className="max-w-lg space-y-3 text-sm">
                {product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                  </div>
                )}
                {product.stockCount != null && (
                  <p className="text-muted-foreground">{product.stockCount} in stock</p>
                )}
                {product.description && <p className="text-muted-foreground leading-relaxed">{product.description}</p>}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related */}
        {related && related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold tracking-tight text-foreground mb-6">You might also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
