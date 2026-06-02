import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  ShoppingBag, Search, Heart, User, Sun, Moon, 
  Menu, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ui/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useGetCart } from "@workspace/api-client-react";
import { getCartSessionId } from "@/lib/cart-session";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const sessionId = getCartSessionId();
  
  const { data: cart } = useGetCart({ sessionId }, { 
    query: { enabled: !!sessionId, queryKey: ["cart", sessionId] } 
  });

  const itemCount = cart?.itemCount || 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="text-lg font-medium">Home</Link>
                <Link href="/products" className="text-lg font-medium">Shop</Link>
                <Link href="/categories" className="text-lg font-medium">Categories</Link>
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="text-2xl font-bold tracking-tighter hover:opacity-80 transition-opacity">
            MIRA
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            {["Shop", "New Arrivals", "Sale"].map((label, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={label === "Shop" ? "/products" : label === "New Arrivals" ? "/products?category=new" : "/products?category=sale"}
                  className="hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              </motion.div>
            ))}
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
