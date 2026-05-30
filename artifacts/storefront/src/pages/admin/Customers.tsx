import { useState } from "react";
import { Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "./Dashboard";
import { useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
];

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.total ?? 0} customer{(data?.total ?? 0) !== 1 ? "s" : ""} total
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setSearchQ(search)}
              placeholder="Search by name or email..."
              className="pl-9 bg-muted/40 border-transparent focus-visible:border-border focus-visible:bg-background"
            />
          </div>
          <Button variant="outline" onClick={() => setSearchQ(search)}>Search</Button>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr,100px,100px,120px] gap-4 px-5 py-3 border-b border-border bg-muted/30">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Orders</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Spent</span>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : !data?.items.length ? (
            <div className="p-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No customers found</p>
              <p className="text-xs text-muted-foreground">Try a different search term.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.items.map((user, i) => (
                <div
                  key={user.id}
                  className="grid grid-cols-1 md:grid-cols-[2fr,100px,100px,120px] gap-4 px-5 py-4 items-center hover:bg-muted/20 transition-colors"
                  data-testid={`customer-row-${user.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                      user.role === "admin"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-foreground">{user.orderCount}</p>
                    <p className="text-xs text-muted-foreground">{user.orderCount === 1 ? "order" : "orders"}</p>
                  </div>
                  <p className="hidden md:block text-sm font-semibold text-foreground">${user.totalSpent.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground px-3">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
