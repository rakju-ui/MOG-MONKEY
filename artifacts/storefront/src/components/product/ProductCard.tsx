import { useState } from "react";
import { Link } from "wouter";
import { ShoppingBag, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

export const cardVariant = {
  hidden: { opacity: 0, scale: 0.88, y: 28 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 340, damping: 26 },
  },
};

const jiggle = {
  rotate: [0, -2.5, 2.5, -1.5, 1.5, -0.5, 0.5, 0],
  transition: { duration: 0.55, ease: "easeInOut" as const },
};

export function ProductCard({ product }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
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
          setJustAdded(true);
          setTimeout(() => setJustAdded(false), 700);
        },
        onError: () => toast.error("Failed to add to cart"),
      }
    );
  };

  return (
    <motion.div
      variants={cardVariant}
      whileHover={jiggle}
      className="group"
      data-testid={`card-product-${product.id}`}
    >
      <Link href={`/products/${product.id}`}>
        <motion.div
          animate={{ y: hovered ? -6 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <div
            className="relative overflow-hidden rounded-xl bg-muted/40 aspect-square mb-3 cursor-pointer"
            onMouseEnter={() => { setHovered(true); if (product.images.length > 1) setImgIdx(1); }}
            onMouseLeave={() => { setHovered(false); setImgIdx(0); }}
          >
            <motion.img
              src={product.images[imgIdx] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
              animate={{
                scale: hovered ? 1.09 : 1,
                rotate: hovered ? 1.2 : 0,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              loading="lazy"
            />

            {discount > 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.1 }}
              >
                <Badge className="absolute top-2.5 left-2.5 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 shadow-sm">
                  -{discount}%
                </Badge>
              </motion.div>
            )}

            {!product.inStock && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground bg-background/80 px-3 py-1.5 rounded-full border border-border">
                  Out of Stock
                </span>
              </div>
            )}

            <AnimatePresence>
              {hovered && product.inStock && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="absolute bottom-2.5 left-2.5 right-2.5"
                >
                  <motion.div
                    animate={justAdded ? {
                      scale: [1, 1.15, 0.95, 1.08, 1],
                      transition: { duration: 0.5, ease: "easeInOut" }
                    } : {}}
                  >
                    <Button
                      size="sm"
                      className="w-full gap-1.5 text-xs shadow-lg h-8 active:scale-95"
                      onClick={handleAddToCart}
                      disabled={!product.inStock || addToCart.isPending}
                      data-testid={`button-add-to-cart-${product.id}`}
                    >
                      <motion.span
                        animate={justAdded ? { rotate: [0, -15, 15, 0] } : {}}
                        transition={{ duration: 0.4 }}
                        className="flex items-center gap-1.5"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        {justAdded ? "Added!" : "Add to Cart"}
                      </motion.span>
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
              {product.name}
            </h3>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <motion.span
                  animate={hovered ? { scale: 1.05 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="text-sm font-semibold text-foreground inline-block"
                >
                  ${product.price.toFixed(2)}
                </motion.span>
                {product.compareAtPrice && (
                  <span className="text-xs text-muted-foreground line-through">${product.compareAtPrice.toFixed(2)}</span>
                )}
              </div>
              {product.averageRating != null && product.averageRating > 0 && (
                <div className="flex items-center gap-0.5 text-xs text-muted-foreground flex-shrink-0">
                  <motion.div
                    animate={hovered ? { rotate: [0, -20, 20, 0], scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </motion.div>
                  <span>{product.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
