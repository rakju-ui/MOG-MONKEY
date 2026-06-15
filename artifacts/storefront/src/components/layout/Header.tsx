import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { 
  ShoppingBag, Search, Heart, User, Sun, Moon, 
  Menu, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ui/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useGetCart, useListCategories } from "@workspace/api-client-react";
import { getCartSessionId } from "@/lib/cart-session";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const sessionId = getCartSessionId();

  const { data: cart } = useGetCart({ sessionId }, {
    query: { enabled: !!sessionId, queryKey: ["cart", sessionId] }
  });
  const { data: categories } = useListCategories();

  const itemCount = cart?.itemCount || 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "shadow-sm" : "shadow-none"
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <nav className="flex flex-col gap-1 mt-8">
                <Link href="/" onClick={() => setMobileOpen(false)} className="text-lg font-medium px-3 py-2.5 rounded-lg hover:bg-muted transition-colors">Home</Link>
                <Link href="/products" onClick={() => setMobileOpen(false)} className="text-lg font-medium px-3 py-2.5 rounded-lg hover:bg-muted transition-colors">Shop</Link>

                {/* Categories row: link + expand arrow */}
                <div className="flex items-center rounded-lg hover:bg-muted transition-colors overflow-hidden">
                  <Link
                    href="/categories"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-lg font-medium px-3 py-2.5"
                  >
                    Categories
                  </Link>
                  <button
                    onClick={() => setMobileCatOpen(v => !v)}
                    className="px-3 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Toggle categories"
                  >
                    <motion.span
                      animate={{ rotate: mobileCatOpen ? 180 : 0 }}
                      transition={{ duration: 0.22 }}
                      className="inline-block"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </button>
                </div>

                {/* Expandable category list */}
                <AnimatePresence initial={false}>
                  {mobileCatOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden pl-3"
                    >
                      <div className="border-l-2 border-border pl-3 py-1 flex flex-col gap-0.5">
                        {(categories ?? []).map(cat => (
                          <Link
                            key={cat.id}
                            href={`/products?category=${cat.slug}`}
                            onClick={() => setMobileOpen(false)}
                            className="text-sm font-medium py-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Link href="/products?category=sale" onClick={() => setMobileOpen(false)} className="text-lg font-medium px-3 py-2.5 rounded-lg hover:bg-muted transition-colors">Sale</Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img
              src="https://res.cloudinary.com/do4wj3d1w/image/upload/v1781549823/09c9d320-fbee-4f05-8eea-85c18775c46c_t8k26u.png"
              alt="MØG MONKEY logo"
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-bold tracking-tighter">𝕄Ø𝔾 𝕄𝕆ℕ𝕂𝔼𝕐</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link href="/products" className="hover:text-foreground transition-colors">
                Shop
              </Link>
            </motion.div>

            {/* Categories dropdown */}
            <motion.div
              ref={catRef}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.17, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
            >
              <button
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                onClick={() => { setLocation("/categories"); setCatOpen(false); }}
              >
                Categories
                <motion.span
                  animate={{ rotate: catOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.span>
              </button>

              <AnimatePresence>
                {catOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 bg-background border border-border rounded-xl shadow-xl overflow-hidden"
                  >
                    <motion.div
                      initial="hidden"
                      animate="show"
                      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                      className="py-1.5"
                    >
                      {(categories ?? []).map(cat => (
                        <motion.div
                          key={cat.id}
                          variants={{
                            hidden: { opacity: 0, x: -6 },
                            show: { opacity: 1, x: 0, transition: { duration: 0.2 } },
                          }}
                        >
                          <Link
                            href={`/products?category=${cat.slug}`}
                            onClick={() => setCatOpen(false)}
                            className="flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors group"
                          >
                            <span>{cat.name}</span>
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                              {cat.productCount}
                            </span>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link href="/products?category=sale" className="hover:text-foreground transition-colors">
                Sale
              </Link>
            </motion.div>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden lg:flex relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="w-full pl-9 bg-muted/50 border-none focus-visible:bg-background"
            />
          </div>

          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hover:scale-110 transition-transform duration-200">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.2 }}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.div>
            </AnimatePresence>
          </Button>

          <Button variant="ghost" size="icon" onClick={() => setLocation("/account")}
            className="hover:scale-110 transition-transform duration-200">
            <User className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={() => setLocation("/wishlist")}
            className="hover:scale-110 transition-transform duration-200">
            <Heart className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="relative hover:scale-110 transition-transform duration-200" onClick={() => setLocation("/cart")}>
            <ShoppingBag className="h-5 w-5" />
            <AnimatePresence>
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                >
                  {itemCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
