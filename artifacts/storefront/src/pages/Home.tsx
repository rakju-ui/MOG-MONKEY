import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, ChevronRight, ChevronDown, Star, Package, ShieldCheck, RefreshCw, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard, cardVariant } from "@/components/product/ProductCard";
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

const MARQUEE_ITEMS = [
  "Free Shipping on $50+",
  "Premium Quality",
  "Easy 30-Day Returns",
  "Secure Checkout",
  "New Season Arrivals",
  "Curated Collections",
  "Worldwide Delivery",
  "Exclusive Member Perks",
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
};

const staggerGrid = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const staggerFast = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

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
        <motion.img
          src={HERO_IMAGE}
          alt="Hero"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs tracking-widest uppercase text-white/60 mb-4 font-medium"
          >
            New Season
          </motion.p>

          <div className="overflow-hidden mb-1">
            <motion.h1
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.75, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight"
            >
              Objects worth
            </motion.h1>
          </div>
          <div className="overflow-hidden mb-6">
            <motion.h1
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.75, delay: 0.47, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight"
            >
              keeping forever
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="text-base text-white/70 mb-8 leading-relaxed max-w-sm"
          >
            Premium essentials built to last. Designed with restraint. Made without compromise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap gap-3"
          >
            <Button
              size="lg"
              className="gap-2 bg-white text-foreground hover:bg-white/90 hover:scale-[1.03] active:scale-[0.98] transition-transform"
              onClick={() => setLocation("/products")}
              data-testid="button-shop-now"
            >
              Shop Now <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/10 gap-2 hover:scale-[1.03] active:scale-[0.98] transition-transform"
              onClick={() => setLocation("/products?sort=newest")}
            >
              New Arrivals
            </Button>
          </motion.div>
          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/40 pointer-events-none"
          >
            <span className="text-[9px] tracking-widest uppercase font-medium">Scroll</span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Marquee strip */}
      <div className="border-b border-border bg-foreground/[0.03] overflow-hidden py-2.5 select-none">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-3 mx-6 text-xs font-medium tracking-widest uppercase text-muted-foreground">
              {item}
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40 inline-block" />
            </span>
          ))}
        </div>
      </div>

      {/* Perks bar */}
      <section className="border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerFast}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border"
          >
            {PERKS.map(({ icon: Icon, label, desc }) => (
              <motion.div
                key={label}
                variants={fadeUp}
                className="flex items-center gap-3 py-5 px-4 md:px-6"
              >
                <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="flex items-end justify-between mb-10"
          >
            <div>
              <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-2">Curated</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Featured Products</h2>
            </div>
            <Link href="/products" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>

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
            <motion.div
              variants={staggerGrid}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
            >
              {(featured ?? []).map(p => <ProductCard key={p.id} product={p} />)}
            </motion.div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mb-10"
          >
            <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-2">Browse</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Shop by Category</h2>
          </motion.div>

          {catsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
            </div>
          ) : (
            <motion.div
              variants={staggerGrid}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
            >
              {(categories ?? []).slice(0, 6).map((cat) => (
                <motion.div
                  key={cat.id}
                  variants={{
                    hidden: { opacity: 0, scale: 0.96, y: 16 },
                    show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
                  }}
                  whileHover={{ scale: 1.025 }}
                  transition={{ duration: 0.25 }}
                  data-testid={`category-${cat.slug}`}
                >
                  <Link href={`/products?category=${cat.slug}`}>
                    <div className="relative rounded-2xl overflow-hidden h-36 md:h-44 group cursor-pointer">
                      {cat.imageUrl ? (
                        <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-muted" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/80" />
                      <div className="absolute bottom-4 left-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-white font-semibold text-base">{cat.name}</p>
                        <p className="text-white/60 text-xs mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {cat.productCount} products
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="flex items-end justify-between mb-10"
          >
            <div>
              <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-2">Popular</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Best Sellers</h2>
            </div>
            <Link href="/products?sort=popular" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>

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
            <motion.div
              variants={staggerGrid}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
            >
              {(bestSellers ?? []).slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </motion.div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="text-center mb-12"
          >
            <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-2">Reviews</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">What customers say</h2>
          </motion.div>

          <motion.div
            variants={staggerFast}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -4, boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
                transition={{ duration: 0.25 }}
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
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 md:py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
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
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 whitespace-nowrap hover:scale-[1.03] active:scale-[0.98] transition-transform"
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
