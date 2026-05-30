import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { SlidersHorizontal, ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/product/ProductCard";
import { Footer } from "@/components/layout/Footer";
import { useListProducts, useListCategories, getListProductsQueryKey } from "@workspace/api-client-react";

export default function Products() {
  const [location] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [searchInput, setSearchInput] = useState(params.get("search") ?? "");
  const [sort, setSort] = useState(params.get("sort") ?? "newest");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [inStockOnly, setInStockOnly] = useState(false);

  const { data: categories } = useListCategories();
  const { data, isLoading } = useListProducts(
    { page, limit: 24, search: search || undefined, sort: sort as any, category: category || undefined, minPrice: priceRange[0] || undefined, maxPrice: priceRange[1] < 1000 ? priceRange[1] : undefined, inStock: inStockOnly || undefined },
    { query: { queryKey: getListProductsQueryKey({ page, limit: 24, search: search || undefined, sort: sort as any, category: category || undefined }) } }
  );

  const totalPages = data ? Math.ceil(data.total / 24) : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const activeFilters = [
    category && categories?.find(c => c.slug === category)?.name,
    inStockOnly && "In Stock",
    priceRange[1] < 1000 && `Under $${priceRange[1]}`,
  ].filter(Boolean) as string[];

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Category</h3>
        <div className="space-y-2">
          <button
            onClick={() => { setCategory(""); setPage(1); }}
            className={`block w-full text-left text-sm py-1 px-2 rounded-md transition-colors ${!category ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            All Products
          </button>
          {(categories ?? []).map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCategory(cat.slug); setPage(1); }}
              className={`flex items-center justify-between w-full text-left text-sm py-1 px-2 rounded-md transition-colors ${category === cat.slug ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              data-testid={`filter-category-${cat.slug}`}
            >
              <span>{cat.name}</span>
              <span className="text-xs opacity-60">{cat.productCount}</span>
            </button>
          ))}
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Price Range</h3>
        <Slider
          min={0} max={1000} step={10}
          value={priceRange}
          onValueChange={v => setPriceRange(v as [number, number])}
          className="mb-3"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>${priceRange[0]}</span>
          <span>{priceRange[1] >= 1000 ? "Any" : `$${priceRange[1]}`}</span>
        </div>
      </div>
      <Separator />
      <div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Checkbox
            checked={inStockOnly}
            onCheckedChange={v => { setInStockOnly(!!v); setPage(1); }}
            data-testid="filter-in-stock"
          />
          <span className="text-sm text-foreground">In stock only</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-muted/20 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">
            {category ? (categories?.find(c => c.slug === category)?.name ?? "Products") : "All Products"}
          </h1>
          {data && <p className="text-sm text-muted-foreground">{data.total} products</p>}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search + Sort bar */}
        <div className="flex flex-wrap gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search products..."
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
          </form>

          <div className="flex items-center gap-2 ml-auto">
            {/* Mobile filter trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden gap-2">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6"><FilterPanel /></div>
              </SheetContent>
            </Sheet>

            <Select value={sort} onValueChange={v => { setSort(v); setPage(1); }}>
              <SelectTrigger className="w-40 text-sm" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filter badges */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {activeFilters.map(f => (
              <Badge key={f} variant="secondary" className="gap-1.5 pr-1 text-xs">
                {f}
                <button onClick={() => {
                  if (f === "In Stock") setInStockOnly(false);
                  else if (f.startsWith("Under")) setPriceRange([0, 1000]);
                  else setCategory("");
                  setPage(1);
                }}><X className="h-3 w-3" /></button>
              </Badge>
            ))}
            <button onClick={() => { setCategory(""); setInStockOnly(false); setPriceRange([0, 1000]); setPage(1); }} className="text-xs text-muted-foreground hover:text-foreground">Clear all</button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-56 flex-shrink-0">
            <FilterPanel />
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square rounded-xl" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : !data?.items.length ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-lg font-medium text-foreground mb-2">No products found</p>
                <p className="text-sm text-muted-foreground mb-6">Try adjusting your search or filters</p>
                <Button variant="outline" onClick={() => { setCategory(""); setSearch(""); setSearchInput(""); setInStockOnly(false); setPriceRange([0, 1000]); }}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {data.items.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <span className="flex items-center text-sm text-muted-foreground px-3">{page} / {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
