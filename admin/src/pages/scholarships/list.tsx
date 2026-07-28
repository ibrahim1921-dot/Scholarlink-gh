import React, { useState } from "react";
import { useTable, useCustomMutation, useInvalidate } from "@refinedev/core";
import axios from "axios";
import { API_URL } from "@/providers/authProvider";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight, Edit, Plus, Trash2, CheckCircle, XCircle, Download, Loader2 } from "lucide-react";
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

export const ScholarshipList: React.FC = () => {
  const navigate = useNavigate();
  const {
    tableQueryResult: { data, isLoading },
    current,
    setCurrent,
    pageCount,
    setFilters,
  } = useTable({
    resource: "scholarships",
    pagination: {
      mode: "server",
      current: 1,
      pageSize: 10,
    },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [actionScholarship, setActionScholarship] = useState<any>(null);
  const [actionType, setActionType] = useState<"deactivate" | "verify" | "delete" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<number | null>(null);

  const handleExport = async (id: number, name: string) => {
    setExportingId(id);
    try {
      const token = localStorage.getItem("scholarlink_admin_token");
      const response = await axios.get(
        `${API_URL}/admin/scholarships/${id}/applications/export`,
        {
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scholarship_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_applicants.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export scholarship applications", err);
      alert("Failed to export applications. Please try again.");
    } finally {
      setExportingId(null);
    }
  };

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
    if (!actionScholarship || !actionType) return;
    setActionError(null);
    
    mutate(
      {
        url: actionType === "delete" ? `/scholarships/${actionScholarship.id}` : `/scholarships/${actionScholarship.id}/${actionType}`,
        method: actionType === "delete" ? "delete" : "put",
        values: {},
      },
      {
        onSuccess: () => {
          invalidate({
            resource: "scholarships",
            invalidates: ["list"],
          });
          setActionScholarship(null);
          setActionType(null);
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
        <CardTitle className="text-2xl text-primary font-bold">Scholarships Management</CardTitle>
        <div className="flex gap-4">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-sm w-full">
            <Input
              type="text"
              placeholder="Search name, provider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button type="submit" variant="secondary" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <Button onClick={() => navigate("/scholarships/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Scholarship
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Loading scholarships...
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No scholarships found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((scholarship: any) => (
                  <TableRow key={scholarship.id}>
                    <TableCell className="font-medium">{scholarship.id}</TableCell>
                    <TableCell>{scholarship.name}</TableCell>
                    <TableCell>{scholarship.provider}</TableCell>
                    <TableCell>
                      {scholarship.active && scholarship.verified ? (
                        <span className="text-success text-sm font-medium">Active & Verified</span>
                      ) : !scholarship.verified ? (
                        <span className="text-warning text-sm font-medium">Unverified</span>
                      ) : (
                        <span className="text-destructive text-sm font-medium">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(scholarship.id, scholarship.name)}
                        disabled={exportingId === scholarship.id}
                        className="mr-2"
                        title="Export applicant summary CSV"
                      >
                        {exportingId === scholarship.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/scholarships/edit/${scholarship.id}`)}
                        className="mr-2"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {!scholarship.verified || !scholarship.active ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActionScholarship(scholarship);
                            setActionType("verify");
                            setActionError(null);
                          }}
                          className="mr-2 border-success text-success hover:bg-success hover:text-success-foreground"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActionScholarship(scholarship);
                            setActionType("deactivate");
                            setActionError(null);
                          }}
                          className="mr-2 border-warning text-warning hover:bg-warning hover:text-warning-foreground"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Deactivate
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActionScholarship(scholarship);
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

      <AlertDialog open={!!actionScholarship} onOpenChange={(open) => !open && setActionScholarship(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "verify" ? "Verify Scholarship?" : actionType === "deactivate" ? "Deactivate Scholarship?" : "Delete Scholarship?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "verify"
                ? `Are you sure you want to verify "${actionScholarship?.name}"? It will become visible and active for all students.`
                : actionType === "deactivate"
                ? `Are you sure you want to deactivate "${actionScholarship?.name}"? It will no longer be visible to students.`
                : `This will permanently delete "${actionScholarship?.name}". This cannot be undone.`}
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
              className={actionType === "delete" || actionType === "deactivate" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-success text-success-foreground hover:bg-success/90"}
            >
              {actionType === "verify" ? "Verify" : actionType === "deactivate" ? "Deactivate" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
