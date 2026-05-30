import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { User, MapPin, Package, Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Footer } from "@/components/layout/Footer";
import {
  useGetUser,
  useUpdateUser,
  useListUserAddresses,
  getGetUserQueryKey,
  getListUserAddressesQueryKey,
} from "@workspace/api-client-react";

const DEMO_USER_ID = 2;

const profileSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
});

type ProfileData = z.infer<typeof profileSchema>;

export default function Account() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetUser(DEMO_USER_ID, {
    query: { queryKey: getGetUserQueryKey(DEMO_USER_ID) },
  });
  const { data: addresses } = useListUserAddresses(DEMO_USER_ID, {
    query: { queryKey: getListUserAddressesQueryKey(DEMO_USER_ID) },
  });
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
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-8">Account</h1>

        {isLoading ? (
          <div className="space-y-4"><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>
        ) : (
          <>
            {/* User summary */}
            <div className="bg-card border border-border rounded-2xl p-5 mb-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <div className="ml-auto text-right hidden sm:block">
                <p className="text-sm font-semibold text-foreground">{user?.orderCount} orders</p>
                <p className="text-xs text-muted-foreground">${user?.totalSpent.toFixed(2)} spent</p>
              </div>
            </div>

            <Tabs defaultValue="profile">
              <TabsList className="mb-6">
                <TabsTrigger value="profile" className="gap-2"><Settings className="h-3.5 w-3.5" />Profile</TabsTrigger>
                <TabsTrigger value="addresses" className="gap-2"><MapPin className="h-3.5 w-3.5" />Addresses</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-sm font-semibold text-foreground mb-5">Personal Information</h2>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="firstName" render={({ field }) => (
                          <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} data-testid="input-first-name" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => (
                          <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} data-testid="input-last-name" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Email</label>
                        <Input value={user?.email} disabled className="mt-1.5 opacity-60" />
                      </div>
                      <Button type="submit" disabled={updateUser.isPending} data-testid="button-save-profile">
                        {updateUser.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </Form>
                </div>
              </TabsContent>

              <TabsContent value="addresses">
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h2 className="text-sm font-semibold text-foreground mb-5">Saved Addresses</h2>
                  {!addresses?.length ? (
                    <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map(addr => (
                        <div key={addr.id} className="flex items-start gap-3 p-4 bg-muted/40 rounded-xl">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="text-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                            <p className="text-muted-foreground">{addr.city}, {addr.state} {addr.postalCode}</p>
                            <p className="text-muted-foreground">{addr.country}</p>
                            {addr.isDefault && <p className="text-primary text-xs font-medium mt-1">Default</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
