"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRole } from "@/lib/utils";
import { Trash2, Shield, Search, RefreshCcw, Save, X, Pencil } from "lucide-react";

type LinkedProfile = {
  id: string;
  user_id: string;
  player_tag: string;
  clan_tag: string | null;
  in_game_name: string | null;
  role: string | null;
  is_active: boolean;
};

type UserRow = {
  id: string;
  username: string | null;
  in_game_name: string | null;
  role: string | null;
  player_tag: string | null;
  clan_tag: string | null;
  updated_at: string;
  linked_profiles?: LinkedProfile[];
};

const roles: string[] = ["admin", "leader", "coLeader", "elder", "user"];

export default function AdminMembersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | "all">("all");
  const [sortKey, setSortKey] = useState<"updated" | "name" | "role">("updated");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineDraft, setInlineDraft] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<string>("user");

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error((data as any).error || "Failed to load users");
      }
      const data = await res.json();
      setUsers((data as any).users || []);
    } catch (e: any) {
      setError(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    let list = [...users];
    if (roleFilter !== "all") list = list.filter((u) => (u.role || "user") === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          (u.username || "").toLowerCase().includes(q) ||
          (u.in_game_name || "").toLowerCase().includes(q) ||
          (u.player_tag || "").toLowerCase().includes(q) ||
          (u.clan_tag || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortKey === "updated") return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      if (sortKey === "name") {
        const an = (a.username || a.in_game_name || "").toLowerCase();
        const bn = (b.username || b.in_game_name || "").toLowerCase();
        return an.localeCompare(bn);
      }
      if (sortKey === "role") return (a.role || "").localeCompare(b.role || "");
      return 0;
    });
    return list;
  }, [users, roleFilter, search, sortKey]);

  const updateRole = async (userId: string, role: string) => {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({} as any));
      throw new Error((data as any).error || "Failed to update role");
    }
    toast({ title: "Saved", description: "Role updated." });
  };

  const saveEdits = async () => {
    if (!editingId) return;
    setSavingId(editingId);
    try {
      const res = await fetch(`/api/admin/users/${editingId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: editName, in_game_name: editName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error((data as any).error || "Failed to save name");
      }
      if (editRole) {
        const roleRes = await fetch(`/api/admin/users/${editingId}/role`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: editRole }),
        });
        if (!roleRes.ok) {
          const data = await roleRes.json().catch(() => ({} as any));
          throw new Error((data as any).error || "Failed to update role");
        }
      }
      setIsSheetOpen(false);
      toast({ title: "Saved", description: "Member updated successfully." });
      await fetchUsers();
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({} as any));
      throw new Error((data as any).error || "Failed to delete user");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Member Management</h1>
        <p className="text-muted-foreground">View members, manage roles, and remove accounts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 items-stretch">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, tag, or clan tag"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-56">
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {formatRole(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-56">
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Recently Updated</SelectItem>
                  <SelectItem value="name">Name (A–Z)</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchUsers}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-6 w-1/3" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">No members found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Active Tag</TableHead>
                    <TableHead>Clan</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{(u.username || u.in_game_name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{u.username || u.in_game_name || "—"}</span>
                            <span className="text-xs text-muted-foreground">{u.id}</span>
                            <span className="text-xs text-muted-foreground">Updated {new Date(u.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          defaultValue={u.role || "user"}
                          onValueChange={async (v) => {
                            try {
                              await updateRole(u.id, v);
                              await fetchUsers();
                            } catch (e: any) {
                              setError(e.message);
                            }
                          }}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((r) => (
                              <SelectItem key={r} value={r}>
                                {formatRole(r)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {u.player_tag ? <Badge variant="outline">{u.player_tag}</Badge> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {u.clan_tag ? <Badge variant="secondary">{u.clan_tag}</Badge> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          {inlineEditingId === u.id ? (
                            <>
                              <Input
                                value={inlineDraft}
                                onChange={(e) => setInlineDraft(e.target.value)}
                                placeholder="Display name"
                                className="h-8 w-40"
                              />
                              <Button
                                size="sm"
                                onClick={async () => {
                                  setSavingId(u.id);
                                  try {
                                    const res = await fetch(`/api/admin/users/${u.id}/profile`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ username: inlineDraft, in_game_name: inlineDraft }),
                                    });
                                    if (!res.ok) {
                                      const data = await res.json().catch(() => ({} as any));
                                      throw new Error((data as any).error || "Failed to save name");
                                    }
                                    await fetchUsers();
                                    setInlineEditingId(null);
                                    toast({ title: "Saved", description: "Display name updated." });
                                  } catch (e: any) {
                                    setError(e.message);
                                    toast({ title: "Error", description: e.message, variant: "destructive" });
                                  } finally {
                                    setSavingId(null);
                                  }
                                }}
                                disabled={savingId === u.id}
                              >
                                <Save className="h-4 w-4 mr-1" /> {savingId === u.id ? "Saving…" : "Save"}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setInlineEditingId(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setInlineEditingId(u.id);
                                setInlineDraft(u.username || u.in_game_name || "");
                                setEditingId(u.id);
                                setEditName(u.username || u.in_game_name || "");
                                setEditRole(u.role || "user");
                              }}
                            >
                              Quick Edit Name
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingId(u.id);
                              setEditName(u.username || u.in_game_name || "");
                              setEditRole(u.role || "user");
                              setIsSheetOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              if (!confirm("Delete this user and all linked data?")) return;
                              try {
                                await deleteUser(u.id);
                                setUsers((prev) => prev.filter((x) => x.id !== u.id));
                              } catch (e: any) {
                                setError(e.message);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Badge className="capitalize" variant="outline">
                            <Shield className="h-3 w-3 mr-1" /> {formatRole(u.role || "user")}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit Member</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm mb-1">Display Name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Enter display name" />
            </div>
            <div>
              <label className="block text-sm mb-1">Role</label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {formatRole(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button onClick={saveEdits} disabled={savingId === editingId} className="w-full">
              {savingId === editingId ? "Saving…" : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}


