import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { User, MapPin, Package, Settings, ShieldCheck, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/layout/Footer";
import {
  useGetUser,
  useUpdateUser,
  useListUserAddresses,
  useListOrders,
  getGetUserQueryKey,
  getListUserAddressesQueryKey,
  getListOrdersQueryKey,
} from "@workspace/api-client-react";

const DEMO_USER_ID = 2;

const profileSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
});

type ProfileData = z.infer<typeof profileSchema>;

type Tab = "profile" | "orders" | "addresses" | "security";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: Settings },
  { id: "orders", label: "Orders", icon: Package },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "security", label: "Security", icon: ShieldCheck },
];

export default function Account() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const { data: user, isLoading } = useGetUser(DEMO_USER_ID, {
    query: { queryKey: getGetUserQueryKey(DEMO_USER_ID) },
  });
  const { data: addresses } = useListUserAddresses(DEMO_USER_ID, {
    query: { queryKey: getListUserAddressesQueryKey(DEMO_USER_ID) },
  });
  const { data: orders } = useListOrders(
    { limit: 10, page: 1 },
    { query: { queryKey: getListOrdersQueryKey({ limit: 10, page: 1 }) } }
  );
  const updateUser = useUpdateUser();

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    values: { firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" },
  });

  const onSubmit = (data: ProfileData) => {
    updateUser.mutate(
      { id: DEMO_USER_ID, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(DEMO_USER_ID) });
          toast.success("Profile updated");
        },
        onError: () => toast.error("Failed to update profile"),
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl flex-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-8">Account</h1>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-6 md:gap-8">
            {/* Sidebar */}
            <div className="space-y-2">
              {/* User card */}
              <div className="bg-card border border-border rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{user?.orderCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Orders</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">${(user?.totalSpent ?? 0).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Spent</p>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <nav className="space-y-0.5">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      activeTab === id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                    {id === "orders" && orders?.total != null && orders.total > 0 && (
                      <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded-md font-normal">{orders.total}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div>
              {/* Profile tab */}
              {activeTab === "profile" && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-base font-semibold text-foreground mb-5">Personal Information</h2>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="firstName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl><Input {...field} className="h-10" data-testid="input-first-name" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl><Input {...field} className="h-10" data-testid="input-last-name" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Email address</label>
                        <Input value={user?.email} disabled className="h-10 opacity-60 cursor-not-allowed" />
                        <p className="text-xs text-muted-foreground mt-1.5">Email cannot be changed in this demo.</p>
                      </div>
                      <div className="pt-2">
                        <Button type="submit" disabled={updateUser.isPending} data-testid="button-save-profile">
                          {updateUser.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}

              {/* Orders tab */}
              {activeTab === "orders" && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">Order History</h2>
                  </div>
                  {!orders?.items.length ? (
                    <div className="p-12 text-center">
                      <Package className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">No orders yet</p>
                      <p className="text-xs text-muted-foreground mb-4">Your order history will appear here.</p>
                      <Button size="sm" variant="outline" onClick={() => setLocation("/products")}>Start Shopping</Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {orders.items.map(order => (
                        <button
                          key={order.id}
                          onClick={() => setLocation(`/orders/${order.id}`)}
                          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors text-left"
                        >
                          <div>
                            <div className="flex items-center gap-2.5 mb-1">
                              <p className="text-sm font-medium text-foreground">Order #{order.id}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[order.status] ?? STATUS_STYLES.pending}`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                              {" · "}{order.items.length} item{order.items.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-foreground">${order.total.toFixed(2)}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Addresses tab */}
              {activeTab === "addresses" && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-border flex items-center justify-between">
                    <h2 className="text-base font-semibold text-foreground">Saved Addresses</h2>
                  </div>
                  {!addresses?.length ? (
                    <div className="p-12 text-center">
                      <MapPin className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">No addresses saved</p>
                      <p className="text-xs text-muted-foreground">Your shipping addresses will appear here after checkout.</p>
                    </div>
                  ) : (
                    <div className="p-5 space-y-3">
                      {addresses.map(addr => (
                        <div key={addr.id} className="flex items-start gap-3 p-4 bg-muted/40 rounded-xl border border-border">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 text-sm">
                            <p className="text-foreground font-medium">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                            <p className="text-muted-foreground">{addr.city}, {addr.state} {addr.postalCode}</p>
                            <p className="text-muted-foreground">{addr.country}</p>
                            {addr.isDefault && (
                              <Badge variant="secondary" className="mt-1.5 text-xs">Default</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Security tab */}
              {activeTab === "security" && (
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h2 className="text-base font-semibold text-foreground mb-5">Password</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Current password</label>
                        <Input type="password" placeholder="••••••••" className="h-10" disabled />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">New password</label>
                        <Input type="password" placeholder="••••••••" className="h-10" disabled />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Confirm new password</label>
                        <Input type="password" placeholder="••••••••" className="h-10" disabled />
                      </div>
                      <Button disabled variant="outline">Update Password</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">Password management is not available in this demo.</p>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h2 className="text-base font-semibold text-foreground mb-1">Two-Factor Authentication</h2>
                    <p className="text-sm text-muted-foreground mb-4">Add an extra layer of security to your account.</p>
                    <Button disabled variant="outline" size="sm">Enable 2FA</Button>
                    <p className="text-xs text-muted-foreground mt-3">Not available in this demo.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
