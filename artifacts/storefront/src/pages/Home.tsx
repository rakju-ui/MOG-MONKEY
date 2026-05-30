import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, ChevronRight, Star, Package, ShieldCheck, RefreshCw, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/product/ProductCard";
import { Footer } from "@/components/layout/Footer";
import {
  useListFeaturedProducts,
  useListBestSellers,
  useListCategories,
} from "@workspace/api-client-react";

const HERO_IMAGE = "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1600&q=80";

const PERKS = [
  { icon: Truck, label: "Free shipping", desc: "On orders over $50" },
  { icon: ShieldCheck, label: "Secure checkout", desc: "256-bit SSL encryption" },
  { icon: RefreshCw, label: "Easy returns", desc: "30-day return policy" },
  { icon: Package, label: "Quality guarantee", desc: "Premium materials only" },
];

const TESTIMONIALS = [
  { name: "Marcus T.", rating: 5, text: "Genuinely the best quality I've found online. Everything I've ordered has been exactly as described — or better." },
  { name: "Sophie K.", rating: 5, text: "The packaging alone tells you this brand cares. Products are exceptional, shipping was fast. Highly recommend." },
  { name: "Priya S.", rating: 5, text: "I'm very picky about what I buy. MIRA is one of the very few stores I keep coming back to. Worth every penny." },
  { name: "James R.", rating: 4, text: "Excellent selection. The merino sweater I got is easily the nicest piece I own. Will definitely order again." },
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [, setLocation] = useLocation();

  const { data: featured, isLoading: featuredLoading } = useListFeaturedProducts();
  const { data: bestSellers, isLoading: bestLoading } = useListBestSellers();
  const { data: categories, isLoading: catsLoading } = useListCategories();

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("You're in! Thanks for subscribing.");
    setEmail("");
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden bg-foreground">
        <img
          src={HERO_IMAGE}
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl"
          >
            <p className="text-xs tracking-widest uppercase text-white/60 mb-4 font-medium">New Season</p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight mb-6">
              Objects worth<br />keeping forever
            </h1>
            <p className="text-base text-white/70 mb-8 leading-relaxed max-w-sm">
              Premium essentials built to last. Designed with restraint. Made without compromise.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="gap-2 bg-white text-foreground hover:bg-white/90"
                onClick={() => setLocation("/products")}
                data-testid="button-shop-now"
              >
                Shop Now <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10 gap-2"
                onClick={() => setLocation("/products?sort=newest")}
              >
                New Arrivals
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Perks bar */}
      <section className="border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {PERKS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 py-5 px-4 md:px-6">
                <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-2">Curated</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Featured Products</h2>
            </div>
            <Link href="/products" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {featuredLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-xl w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {(featured ?? []).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-2">Browse</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Shop by Category</h2>
          </div>
          {catsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {(categories ?? []).slice(0, 6).map((cat) => (
                <motion.div
                  key={cat.id}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  data-testid={`category-${cat.slug}`}
                >
                  <Link href={`/products?category=${cat.slug}`}>
                    <div className="relative rounded-2xl overflow-hidden h-36 md:h-44 group cursor-pointer">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="absolute inset-0 bg-muted" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <p className="text-white font-semibold text-base">{cat.name}</p>
                        <p className="text-white/60 text-xs mt-0.5">{cat.productCount} products</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-2">Popular</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Best Sellers</h2>
            </div>
            <Link href="/products?sort=popular" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {bestLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {(bestSellers ?? []).slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-2">Reviews</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">What customers say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="bg-card border border-border rounded-2xl p-5"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`h-3.5 w-3.5 ${j < t.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4">"{t.text}"</p>
                <p className="text-xs font-semibold text-muted-foreground">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 md:py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs tracking-widest uppercase text-primary-foreground/60 font-medium mb-3">Stay in the loop</p>
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">Get early access</h2>
            <p className="text-primary-foreground/70 mb-8 text-sm max-w-md mx-auto">
              New arrivals, restocks, and exclusive offers — delivered to your inbox first.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 focus-visible:ring-primary-foreground"
                data-testid="input-newsletter"
              />
              <Button
                type="submit"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 whitespace-nowrap"
                data-testid="button-newsletter-submit"
              >
                Subscribe
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
