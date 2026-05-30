import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  ShoppingBag, Search, Heart, User, Sun, Moon, 
  Menu, X
} from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useGetCart } from "@workspace/api-client-react";
import { getCartSessionId } from "@/lib/cart-session";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  const sessionId = getCartSessionId();
  
  const { data: cart } = useGetCart({ sessionId }, { 
    query: { enabled: !!sessionId, queryKey: ["cart", sessionId] } 
  });

  const itemCount = cart?.itemCount || 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
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

          <Link href="/" className="text-2xl font-bold tracking-tighter">
            MIRA
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/products" className="hover:text-foreground transition-colors">Shop</Link>
            <Link href="/products?category=new" className="hover:text-foreground transition-colors">New Arrivals</Link>
            <Link href="/products?category=sale" className="hover:text-foreground transition-colors">Sale</Link>
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

          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button variant="ghost" size="icon" onClick={() => setLocation("/account")}>
            <User className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={() => setLocation("/wishlist")}>
            <Heart className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="relative" onClick={() => setLocation("/cart")}>
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {itemCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
