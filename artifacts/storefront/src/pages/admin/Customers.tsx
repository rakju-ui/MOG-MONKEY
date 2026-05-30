import { useState } from "react";
import { Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "./Dashboard";
import { useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListUsers(
    { page, limit: 20, search: searchQ || undefined },
    { query: { queryKey: getListUsersQueryKey({ page, limit: 20, search: searchQ || undefined }) } }
  );

  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Customers</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} total</p>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && setSearchQ(search)} placeholder="Search by email..." className="pl-9" />
          </div>
          <Button variant="outline" onClick={() => setSearchQ(search)}>Search</Button>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr,1fr,1fr,1fr] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span>Customer</span><span>Role</span><span>Orders</span><span>Total Spent</span>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}</div>
          ) : !data?.items.length ? (
            <div className="p-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No customers found</p>
            </div>
          ) : (
            data.items.map((user, i) => (
              <div key={user.id} className={`grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,1fr] gap-4 px-5 py-4 items-center ${i !== data.items.length - 1 ? "border-b border-border" : ""}`} data-testid={`customer-row-${user.id}`}>
                <div>
                  <p className="text-sm font-medium text-foreground">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit capitalize hidden md:block ${user.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {user.role}
                </span>
                <p className="hidden md:block text-sm text-foreground">{user.orderCount}</p>
                <p className="hidden md:block text-sm font-medium text-foreground">${user.totalSpent.toFixed(2)}</p>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="flex items-center text-sm text-muted-foreground px-3">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
