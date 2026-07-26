import React, { useState } from "react";
import { useTable, useCustomMutation, useInvalidate } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight, Edit, Plus, Trash2, XCircle } from "lucide-react";
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

export const JobList: React.FC = () => {
  const navigate = useNavigate();
  const {
    tableQueryResult: { data, isLoading },
    current,
    setCurrent,
    pageCount,
    setFilters,
  } = useTable({
    resource: "jobs",
    pagination: {
      mode: "server",
      current: 1,
      pageSize: 10,
    },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [actionJob, setActionJob] = useState<any>(null);
  const [actionType, setActionType] = useState<"deactivate" | "delete" | null>(null);
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
    if (!actionJob || !actionType) return;
    setActionError(null);
    
    mutate(
      {
        url: actionType === "delete" ? `/jobs/${actionJob.id}` : `/jobs/${actionJob.id}/deactivate`,
        method: actionType === "delete" ? "delete" : "put",
        values: {},
      },
      {
        onSuccess: () => {
          invalidate({
            resource: "jobs",
            invalidates: ["list"],
          });
          setActionJob(null);
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
        <CardTitle className="text-2xl text-primary font-bold">Jobs Management</CardTitle>
        <div className="flex gap-4">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-sm w-full">
            <Input
              type="text"
              placeholder="Search title, company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button type="submit" variant="secondary" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <Button onClick={() => navigate("/jobs/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Job
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Loading jobs...
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No jobs found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((job: any) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.id}</TableCell>
                    <TableCell>{job.title}</TableCell>
                    <TableCell>{job.company}</TableCell>
                    <TableCell>
                      {job.active ? (
                        <span className="text-success text-sm font-medium">Active</span>
                      ) : (
                        <span className="text-destructive text-sm font-medium">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/jobs/edit/${job.id}`)}
                        className="mr-2"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {job.active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActionJob(job);
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
                          setActionJob(job);
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

      <AlertDialog open={!!actionJob} onOpenChange={(open) => !open && setActionJob(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "delete" ? "Delete Job Listing?" : "Deactivate Job Listing?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "delete"
                ? `This will permanently delete "${actionJob?.title}" at ${actionJob?.company}. This cannot be undone.`
                : `Are you sure you want to deactivate "${actionJob?.title}" at ${actionJob?.company}? It will no longer be visible to students.`}
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionType === "delete" ? "Delete" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
