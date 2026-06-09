import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { Shield, ShieldOff, UserX, UserCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/models";
import { listAdminUsers } from "@/features/admin/services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Admin — Users" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

// ── Server actions ────────────────────────────────────────────────────────

async function setRole(formData: FormData) {
  "use server";
  await requireRole("admin");
  await dbConnect();
  const id = formData.get("userId") as string;
  const role = formData.get("role") as "admin" | "user";
  await User.updateOne({ _id: id }, { $set: { role } });
  revalidatePath("/admin/users");
}

async function setStatus(formData: FormData) {
  "use server";
  await requireRole("admin");
  await dbConnect();
  const id = formData.get("userId") as string;
  const status = formData.get("status") as "active" | "disabled";
  await User.updateOne({ _id: id }, { $set: { status } });
  revalidatePath("/admin/users");
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  await requireRole("admin");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const search = sp.q ?? "";

  const { items: users, total } = await listAdminUsers({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString()} total
          </p>
        </div>

        {/* Search */}
        <form method="GET" className="flex gap-2">
          <Input
            name="q"
            defaultValue={search}
            placeholder="Search by email or name…"
            className="w-64"
          />
          <Button type="submit" variant="outline">Search</Button>
          {search && (
            <Button asChild variant="ghost">
              <a href="/admin/users">Clear</a>
            </Button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Invites</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{user.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={user.status === "active" ? "outline" : "destructive"}
                      className={user.status === "active" ? "border-green-500/40 text-green-700 dark:text-green-400" : ""}
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {user.inviteCount}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Role toggle */}
                      <form action={setRole}>
                        <input type="hidden" name="userId" value={user._id} />
                        <input
                          type="hidden"
                          name="role"
                          value={user.role === "admin" ? "user" : "admin"}
                        />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          title={user.role === "admin" ? "Demote to user" : "Promote to admin"}
                          className="size-8"
                        >
                          {user.role === "admin" ? (
                            <ShieldOff className="size-3.5" />
                          ) : (
                            <Shield className="size-3.5" />
                          )}
                        </Button>
                      </form>

                      {/* Status toggle */}
                      <form action={setStatus}>
                        <input type="hidden" name="userId" value={user._id} />
                        <input
                          type="hidden"
                          name="status"
                          value={user.status === "active" ? "disabled" : "active"}
                        />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          title={user.status === "active" ? "Disable account" : "Enable account"}
                          className="size-8"
                        >
                          {user.status === "active" ? (
                            <UserX className="size-3.5" />
                          ) : (
                            <UserCheck className="size-3.5" />
                          )}
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <a href={`/admin/users?page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}>
                  <ChevronLeft className="size-4" />
                  Previous
                </a>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <a href={`/admin/users?page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}>
                  Next
                  <ChevronRight className="size-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
