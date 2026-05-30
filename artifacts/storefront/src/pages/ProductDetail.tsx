import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { ShoppingBag, Heart, Star, ChevronLeft, Minus, Plus, Check, Truck, RefreshCw, Shield, Package } from "lucide-react";
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

function StarRating({ rating, max = 5, size = "sm" }: { rating: number; max?: number; size?: "sm" | "md" }) {
  const px = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`${px} ${i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
      ))}
    </div>
  );
}

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
          setTimeout(() => setAddedToCart(false), 2200);
          toast.success("Added to cart");
          openCartDrawer();
        },
        onError: () => toast.error("Failed to add to cart"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <Skeleton className="h-4 w-28 mb-8 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="flex gap-2">
              {[0, 1, 2].map(i => <Skeleton key={i} className="h-16 w-16 rounded-lg" />)}
            </div>
          </div>
          <div className="space-y-4 pt-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-8 w-3/4 rounded" />
            <Skeleton className="h-5 w-1/3 rounded" />
            <Skeleton className="h-10 w-1/4 rounded" />
            <Skeleton className="h-20 w-full rounded" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
          <Package className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-base font-semibold text-foreground mb-1">Product not found</p>
        <p className="text-sm text-muted-foreground mb-6">This product may have been removed or doesn't exist.</p>
        <Button variant="outline" onClick={() => setLocation("/products")}>
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

  const ratingBreakdown = reviews?.length
    ? [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
        pct: Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100),
      }))
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-6xl flex-1">
        {/* Breadcrumb */}
        <button
          onClick={() => setLocation("/products")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          data-testid="button-back"
        >
          <ChevronLeft className="h-4 w-4" />
          All Products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Image gallery */}
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl bg-muted/40 aspect-square">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={product.images[selectedImage] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.22 }}
                />
              </AnimatePresence>
              {discount > 0 && (
                <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold">
                  -{discount}%
                </Badge>
              )}
              {!product.inStock && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary">Out of Stock</Badge>
                </div>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all duration-150 ${i === selectedImage ? "border-primary shadow-sm" : "border-transparent hover:border-border"}`}
                    data-testid={`thumb-${i}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col">
            {product.categoryName && (
              <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-2">{product.categoryName}</p>
            )}

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3" data-testid="product-name">
              {product.name}
            </h1>

            {reviews && reviews.length > 0 && (
              <div className="flex items-center gap-2.5 mb-4">
                <StarRating rating={avgRating} size="md" />
                <span className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{avgRating.toFixed(1)}</span>
                  {" "}({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                </span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-3xl font-bold tracking-tight text-foreground" data-testid="product-price">
                ${product.price.toFixed(2)}
              </span>
              {product.compareAtPrice && (
                <span className="text-xl text-muted-foreground line-through">${product.compareAtPrice.toFixed(2)}</span>
              )}
              {discount > 0 && (
                <span className="text-sm text-emerald-600 font-medium">Save {discount}%</span>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{product.description}</p>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-foreground mb-2.5">
                  {product.variants[0]?.name}
                  {selectedVariant && (
                    <span className="font-normal text-muted-foreground ml-2">
                      — {product.variants.find(v => v.id === selectedVariant)?.value}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(selectedVariant === v.id ? null : v.id)}
                      className={`px-3.5 py-1.5 text-sm rounded-lg border-2 transition-all duration-150 font-medium ${
                        selectedVariant === v.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-foreground hover:border-foreground/30"
                      }`}
                      data-testid={`variant-${v.id}`}
                    >
                      {v.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + CTA */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border-2 border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  data-testid="button-quantity-decrease"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="h-11 w-11 flex items-center justify-center text-sm font-semibold border-x-2 border-border" data-testid="product-quantity">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  data-testid="button-quantity-increase"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {product.stockCount != null && product.stockCount < 10 && product.inStock && (
                <p className="text-xs text-amber-600 font-medium">Only {product.stockCount} left</p>
              )}
            </div>

            <div className="flex gap-3 mb-6">
              <Button
                size="lg"
                className="flex-1 gap-2 h-12 text-sm font-semibold transition-all duration-200"
                onClick={handleAddToCart}
                disabled={!product.inStock || addToCart.isPending}
                data-testid="button-add-to-cart"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {addedToCart ? (
                    <motion.span key="added" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="flex items-center gap-2">
                      <Check className="h-4 w-4" /> Added to Cart
                    </motion.span>
                  ) : (
                    <motion.span key="add" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      {product.inStock ? "Add to Cart" : "Out of Stock"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
              <Button size="lg" variant="outline" className="h-12 w-12 px-0 flex-shrink-0" data-testid="button-wishlist">
                <Heart className="h-4 w-4" />
              </Button>
            </div>

            {/* Trust badges */}
            <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border overflow-hidden">
              <div className="flex items-center gap-3 p-3.5 text-sm">
                <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">Free shipping on orders over <span className="font-semibold">$50</span></span>
              </div>
              <div className="flex items-center gap-3 p-3.5 text-sm">
                <RefreshCw className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">Free 30-day returns</span>
              </div>
              <div className="flex items-center gap-3 p-3.5 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">Secure checkout with SSL encryption</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16 md:mt-20">
          <Tabs defaultValue="reviews">
            <TabsList className="h-auto p-0 bg-transparent border-b border-border rounded-none gap-6 mb-8">
              <TabsTrigger
                value="reviews"
                className="pb-3 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium text-muted-foreground data-[state=active]:text-foreground"
              >
                Reviews {reviews?.length ? `(${reviews.length})` : ""}
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="pb-3 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium text-muted-foreground data-[state=active]:text-foreground"
              >
                Details & Specs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reviews">
              {!reviews?.length ? (
                <div className="py-12 text-center">
                  <Star className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">No reviews yet</p>
                  <p className="text-xs text-muted-foreground">Be the first to review this product.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-[280px,1fr] gap-8 max-w-4xl">
                  {/* Rating summary */}
                  <div className="bg-card border border-border rounded-2xl p-6 h-fit">
                    <div className="text-center mb-5">
                      <p className="text-5xl font-bold tracking-tight text-foreground">{avgRating.toFixed(1)}</p>
                      <StarRating rating={avgRating} size="md" />
                      <p className="text-xs text-muted-foreground mt-2">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="space-y-2">
                      {ratingBreakdown.map(({ star, count, pct }) => (
                        <div key={star} className="flex items-center gap-2.5 text-xs">
                          <span className="text-muted-foreground w-3">{star}</span>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-muted-foreground w-5 text-right">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Review list */}
                  <div className="space-y-4">
                    {reviews.map(r => (
                      <div key={r.id} className="bg-card border border-border rounded-2xl p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{r.authorName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                            </p>
                          </div>
                          <StarRating rating={r.rating} />
                        </div>
                        {r.title && <p className="text-sm font-semibold text-foreground mb-1">{r.title}</p>}
                        {r.body && <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="details">
              <div className="max-w-2xl">
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  {product.description && (
                    <div className="p-5 border-b border-border">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Description</p>
                      <p className="text-sm text-foreground leading-relaxed">{product.description}</p>
                    </div>
                  )}
                  {product.stockCount != null && (
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <span className="text-sm text-muted-foreground">Stock</span>
                      <span className={`text-sm font-medium ${product.stockCount < 10 ? "text-amber-600" : "text-foreground"}`}>
                        {product.stockCount} units
                      </span>
                    </div>
                  )}
                  {product.tags.length > 0 && (
                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map(tag => (
                          <span key={tag} className="px-2.5 py-1 bg-muted text-muted-foreground text-xs rounded-lg">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related products */}
        {related && related.length > 0 && (
          <div className="mt-16 md:mt-20">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight text-foreground">You might also like</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
