import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold tracking-tighter text-foreground">MIRA</Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Premium essentials, thoughtfully made. Quality over quantity, always.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Shop</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground transition-colors">All Products</Link></li>
              <li><Link href="/products?sort=newest" className="hover:text-foreground transition-colors">New Arrivals</Link></li>
              <li><Link href="/products?sort=popular" className="hover:text-foreground transition-colors">Best Sellers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Account</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/orders" className="hover:text-foreground transition-colors">Orders</Link></li>
              <li><Link href="/wishlist" className="hover:text-foreground transition-colors">Wishlist</Link></li>
              <li><Link href="/account" className="hover:text-foreground transition-colors">Settings</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Help Center</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Returns</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Contact</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} MIRA. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-foreground cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
