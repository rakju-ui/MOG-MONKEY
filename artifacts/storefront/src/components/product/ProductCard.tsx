import { useState } from "react";
import { Link } from "wouter";
import { ShoppingBag, Star } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAddToCart } from "@workspace/api-client-react";
import { getCartSessionId } from "@/lib/cart-session";
import { openCartDrawer } from "@/lib/cart-store";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  inStock: boolean;
  averageRating: number | null;
  reviewCount: number;
  isFeatured: boolean;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const addToCart = useAddToCart();
  const sessionId = getCartSessionId();

  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart.mutate(
      { data: { sessionId, productId: product.id, quantity: 1 } },
      {
        onSuccess: () => {
          toast.success("Added to cart");
          openCartDrawer();
        },
        onError: () => toast.error("Failed to add to cart"),
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group"
      data-testid={`card-product-${product.id}`}
    >
      <Link href={`/products/${product.id}`}>
        <div
          className="relative overflow-hidden rounded-xl bg-muted/40 aspect-square mb-3 cursor-pointer"
          onMouseEnter={() => { setHovered(true); if (product.images.length > 1) setImgIdx(1); }}
          onMouseLeave={() => { setHovered(false); setImgIdx(0); }}
        >
          <img
            src={product.images[imgIdx] || product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {discount > 0 && (
            <Badge className="absolute top-2.5 left-2.5 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 shadow-sm">
              -{discount}%
            </Badge>
          )}

          {!product.inStock && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground bg-background/80 px-3 py-1.5 rounded-full border border-border">
                Out of Stock
              </span>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: hovered && product.inStock ? 1 : 0, y: hovered && product.inStock ? 0 : 6 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-2.5 left-2.5 right-2.5"
          >
            <Button
              size="sm"
              className="w-full gap-1.5 text-xs shadow-lg h-8"
              onClick={handleAddToCart}
              disabled={!product.inStock || addToCart.isPending}
              data-testid={`button-add-to-cart-${product.id}`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Add to Cart
            </Button>
          </motion.div>
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2">{product.name}</h3>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold text-foreground">${product.price.toFixed(2)}</span>
              {product.compareAtPrice && (
                <span className="text-xs text-muted-foreground line-through">${product.compareAtPrice.toFixed(2)}</span>
              )}
            </div>
            {product.averageRating != null && product.averageRating > 0 && (
              <div className="flex items-center gap-0.5 text-xs text-muted-foreground flex-shrink-0">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{product.averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
