import React, { useState } from "react";
import { useTable, useCustomMutation, useInvalidate } from "@refinedev/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const UserList: React.FC = () => {
  const {
    tableQueryResult: { data, isLoading },
    current,
    setCurrent,
    pageCount,
    setFilters,
  } = useTable({
    resource: "users",
    pagination: {
      mode: "server",
      current: 1,
      pageSize: 10,
    },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [actionUser, setActionUser] = useState<any>(null);
  const [actionType, setActionType] = useState<"promote" | "demote" | "delete" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { mutate } = useCustomMutation();
  const invalidate = useInvalidate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters([
      {
        field: "search",
        operator: "eq",
        value: searchTerm,
      },
    ]);
  };

  const handleAction = () => {
    if (!actionUser || !actionType) return;
    setActionError(null);
    
    mutate(
      {
        url: actionType === "delete" ? `/admin/users/${actionUser.id}` : `/admin/users/${actionUser.id}/${actionType}`,
        method: actionType === "delete" ? "delete" : "post",
        values: {},
      },
      {
        onSuccess: () => {
          setActionUser(null);
          setActionType(null);
          invalidate({
            resource: "users",
            invalidates: ["list"],
          });
        },
        onError: (error: any) => {
          setActionError(error?.response?.data?.message || error?.message || "An error occurred");
        }
      }
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <CardTitle className="text-2xl text-primary font-bold">User Management</CardTitle>
        <form onSubmit={handleSearch} className="flex gap-2 max-w-sm w-full">
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit" variant="secondary" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.role === "ADMIN" ? (
                        <span className="bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-full font-semibold border border-secondary">
                          Admin
                        </span>
                      ) : (
                        <span className="bg-muted text-muted-foreground text-xs px-2.5 py-1 rounded-full font-semibold">
                          Student
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.enabled ? (
                        <span className="text-success text-sm font-medium">Active</span>
                      ) : (
                        <span className="text-destructive text-sm font-medium">Disabled</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end">
                      {user.role === "STUDENT" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActionUser(user);
                            setActionType("promote");
                            setActionError(null);
                          }}
                          className="mr-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          <ShieldCheck className="h-4 w-4 mr-1" />
                          Promote
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActionUser(user);
                            setActionType("demote");
                            setActionError(null);
                          }}
                          className="mr-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <ShieldAlert className="h-4 w-4 mr-1" />
                          Demote
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActionUser(user);
                          setActionType("delete");
                          setActionError(null);
                        }}
                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrent((prev) => Math.max(prev - 1, 1))}
            disabled={current === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground mx-4">
            Page {current} of {pageCount}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrent((prev) => Math.min(prev + 1, pageCount))}
            disabled={current === pageCount || pageCount === 0}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={!!actionUser} onOpenChange={(open) => !open && setActionUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "promote" ? "Promote User to Admin?" : actionType === "demote" ? "Demote Admin to Student?" : "Delete User?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "promote"
                ? `Are you sure you want to grant administrator privileges to ${actionUser?.email}? They will gain full access to the admin dashboard.`
                : actionType === "demote"
                ? `Are you sure you want to revoke administrator privileges from ${actionUser?.email}? They will lose access to the admin dashboard.`
                : `This will permanently delete ${actionUser?.email}. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionError && (
            <div className="text-sm font-medium text-destructive mt-2">
              {actionError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={actionType === "demote" || actionType === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {actionType === "delete" ? "Delete" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
