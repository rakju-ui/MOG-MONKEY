import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { SlidersHorizontal, Search, X, PackageSearch } from "lucide-react";
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

  const getParams = () => new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(() => getParams().get("search") ?? "");
  const [searchInput, setSearchInput] = useState(() => getParams().get("search") ?? "");
  const [sort, setSort] = useState(() => getParams().get("sort") ?? "newest");
  const [category, setCategory] = useState(() => getParams().get("category") ?? "");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    const p = getParams();
    const newCat = p.get("category") ?? "";
    const newSearch = p.get("search") ?? "";
    setCategory(newCat);
    setSearch(newSearch);
    setSearchInput(newSearch);
    setPage(1);
  }, [location]);

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

  const clearAll = () => {
    setCategory(""); setInStockOnly(false); setPriceRange([0, 1000]);
    setSearch(""); setSearchInput(""); setPage(1);
  };

  const activeFilters = [
    category && categories?.find(c => c.slug === category)?.name,
    inStockOnly && "In Stock",
    priceRange[1] < 1000 && `Under $${priceRange[1]}`,
    search && `"${search}"`,
  ].filter(Boolean) as string[];

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Category</p>
        <div className="space-y-0.5">
          <button
            onClick={() => { setCategory(""); setPage(1); }}
            className={`flex items-center justify-between w-full text-left text-sm py-1.5 px-2.5 rounded-lg transition-colors ${!category ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"}`}
          >
            All Products
            {data && !category && <span className="text-xs font-normal opacity-60">{data.total}</span>}
          </button>
          {(categories ?? []).map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCategory(cat.slug); setPage(1); }}
              className={`flex items-center justify-between w-full text-left text-sm py-1.5 px-2.5 rounded-lg transition-colors ${category === cat.slug ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"}`}
              data-testid={`filter-category-${cat.slug}`}
            >
              <span>{cat.name}</span>
              <span className="text-xs opacity-50">{cat.productCount}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Price Range</p>
        <Slider
          min={0} max={1000} step={10}
          value={priceRange}
          onValueChange={v => setPriceRange(v as [number, number])}
          className="mb-4"
        />
        <div className="flex items-center justify-between">
          <div className="h-8 px-3 rounded-md border border-border bg-muted/40 flex items-center text-xs text-foreground font-medium">
            ${priceRange[0]}
          </div>
          <div className="h-px w-4 bg-border" />
          <div className="h-8 px-3 rounded-md border border-border bg-muted/40 flex items-center text-xs text-foreground font-medium">
            {priceRange[1] >= 1000 ? "Any" : `$${priceRange[1]}`}
          </div>
        </div>
      </div>

      <Separator />

      <label className="flex items-center gap-3 cursor-pointer group">
        <Checkbox
          checked={inStockOnly}
          onCheckedChange={v => { setInStockOnly(!!v); setPage(1); }}
          data-testid="filter-in-stock"
        />
        <div>
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">In stock only</span>
          <p className="text-xs text-muted-foreground">Hide out-of-stock items</p>
        </div>
      </label>

      {activeFilters.length > 0 && (
        <>
          <Separator />
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={clearAll}>
            Clear all filters
          </Button>
        </>
      )}
    </div>
  );

  const categoryName = category ? (categories?.find(c => c.slug === category)?.name ?? "Products") : "All Products";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Page header */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {categoryName}
          </h1>
          {data && (
            <p className="text-sm text-muted-foreground mt-1">
              {data.total} {data.total === 1 ? "product" : "products"}
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 flex-1">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-0 max-w-sm">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search products..."
                className="pl-9 bg-muted/40 border-transparent focus-visible:border-border focus-visible:bg-background"
                data-testid="input-search"
              />
            </div>
            <Button type="submit" variant="outline" size="icon" className="flex-shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <div className="flex items-center gap-2 ml-auto">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFilters.length > 0 && (
                    <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                      {activeFilters.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6 overflow-y-auto pb-8"><FilterPanel /></div>
              </SheetContent>
            </Sheet>

            <Select value={sort} onValueChange={v => { setSort(v); setPage(1); }}>
              <SelectTrigger className="w-44 text-sm bg-muted/40 border-transparent" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="popular">Most popular</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Top rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-xs text-muted-foreground">Filters:</span>
            {activeFilters.map(f => (
              <Badge key={f} variant="secondary" className="gap-1.5 pr-1 text-xs font-normal">
                {f}
                <button
                  className="rounded-sm hover:bg-foreground/10 p-0.5"
                  onClick={() => {
                    if (f === "In Stock") setInStockOnly(false);
                    else if (f.startsWith("Under")) setPriceRange([0, 1000]);
                    else if (f.startsWith('"')) { setSearch(""); setSearchInput(""); }
                    else setCategory("");
                    setPage(1);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-52 flex-shrink-0 space-y-0">
            <FilterPanel />
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square rounded-xl" />
                    <Skeleton className="h-3.5 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                ))}
              </div>
            ) : !data?.items.length ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
                  <PackageSearch className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-base font-semibold text-foreground mb-1.5">No products found</p>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                  Try adjusting your filters or searching with different terms.
                </p>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Clear all filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {data.items.map(p => <ProductCard key={p.id} product={p} />)}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                          className={`h-8 w-8 rounded-lg text-sm transition-colors ${page === i + 1 ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    >
                      Next
                    </Button>
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
