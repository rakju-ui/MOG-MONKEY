import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "./Dashboard";
import {
  useListProducts,
  useCreateProduct,
  useDeleteProduct,
  useListCategories,
  getListProductsQueryKey,
} from "@workspace/api-client-react";

const productSchema = z.object({
  name: z.string().min(1, "Required"),
  price: z.coerce.number().positive("Must be positive"),
  categoryId: z.coerce.number().min(1, "Required"),
  description: z.string().optional(),
  images: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useListProducts(
    { limit: 50, page: 1, search: searchQ || undefined },
    { query: { queryKey: getListProductsQueryKey({ limit: 50, page: 1, search: searchQ || undefined }) } }
  );
  const { data: categories } = useListCategories();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();

  const form = useForm<ProductFormData>({ resolver: zodResolver(productSchema) });

  const onSubmit = (data: ProductFormData) => {
    const images = data.images ? data.images.split("\n").map(s => s.trim()).filter(Boolean) : [];
    createProduct.mutate(
      { data: { name: data.name, price: data.price, categoryId: data.categoryId, description: data.description, images } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey({}) });
          toast.success("Product created");
          setOpen(false);
          form.reset();
        },
        onError: () => toast.error("Failed to create product"),
      }
    );
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey({}) });
        toast.success("Product deleted");
      },
      onError: () => toast.error("Failed to delete product"),
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Products</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {data?.total ?? 0} product{(data?.total ?? 0) !== 1 ? "s" : ""} total
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" data-testid="button-add-product">
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>New Product</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-1">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product name</FormLabel>
                      <FormControl><Input {...field} className="h-10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl><Input {...field} type="number" step="0.01" className="h-10" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="categoryId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="">Select category...</option>
                            {(categories ?? []).map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                      <FormControl><Textarea {...field} rows={3} className="resize-none" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="images" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URLs <span className="font-normal text-muted-foreground">(one per line)</span></FormLabel>
                      <FormControl><Textarea {...field} rows={2} placeholder="https://..." className="resize-none font-mono text-xs" /></FormControl>
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full h-10" disabled={createProduct.isPending}>
                    {createProduct.isPending ? "Creating..." : "Create Product"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setSearchQ(search)}
              placeholder="Search products..."
              className="pl-9 bg-muted/40 border-transparent focus-visible:border-border focus-visible:bg-background"
            />
          </div>
          <Button variant="outline" onClick={() => setSearchQ(search)}>Search</Button>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr,1fr,1fr,1fr,88px] gap-4 px-5 py-3 border-b border-border bg-muted/30">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stock</span>
            <span />
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            </div>
          ) : !data?.items.length ? (
            <div className="p-16 text-center">
              <Package className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No products found</p>
              <p className="text-xs text-muted-foreground">Try a different search term.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.items.map(product => (
                <div
                  key={product.id}
                  className="grid grid-cols-[1fr,88px] md:grid-cols-[2fr,1fr,1fr,1fr,88px] gap-4 px-5 py-4 items-center hover:bg-muted/20 transition-colors"
                  data-testid={`product-row-${product.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-10 w-10 rounded-xl object-cover flex-shrink-0 bg-muted border border-border"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground truncate hidden md:block">{product.slug}</p>
                    </div>
                  </div>
                  <span className="hidden md:block text-sm text-muted-foreground truncate">{product.categoryName}</span>
                  <span className="hidden md:block text-sm font-semibold text-foreground">${product.price.toFixed(2)}</span>
                  <div className="hidden md:flex items-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      product.inStock
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {product.inStock
                        ? (product.stockCount != null ? `${product.stockCount} in stock` : "In stock")
                        : "Out of stock"}
                    </span>
                  </div>
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                      data-testid={`button-edit-${product.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(product.id, product.name)}
                      data-testid={`button-delete-${product.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
