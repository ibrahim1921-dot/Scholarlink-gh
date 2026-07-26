import React, { useState } from "react";
import { useTable, useCustomMutation, useInvalidate } from "@refinedev/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight,  } from "lucide-react";
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

export const JobApplicationList: React.FC = () => {
  const {
    tableQueryResult: { data, isLoading },
    current,
    setCurrent,
    pageCount,
    setFilters,
  } = useTable({
    resource: "job-applications",
    pagination: {
      mode: "server",
      current: 1,
      pageSize: 10,
    },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [actionApp, setActionApp] = useState<any>(null);
  const [actionType, setActionType] = useState<string | null>(null);

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
    if (!actionApp || !actionType) return;
    
    mutate(
      {
        url: `/admin/job-applications/${actionApp.id}/status`,
        method: "patch",
        values: { status: actionType },
      },
      {
        onSuccess: () => {
          setActionApp(null);
          setActionType(null);
          invalidate({
            resource: "job-applications",
            invalidates: ["list"],
          });
        },
        onError: (error: any) => {
          alert(`Failed to update status: ${error?.response?.data?.message || error?.message || "Unknown error"}`);
          setActionApp(null);
          setActionType(null);
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESEARCHING":
      case "IN_PROGRESS":
        return <span className="bg-muted text-muted-foreground text-xs px-2.5 py-1 rounded-full font-semibold border border-muted">{status.replace("_", " ")}</span>;
      case "SUBMITTED":
      case "INTERVIEW":
        return <span className="bg-warning/20 text-warning text-xs px-2.5 py-1 rounded-full font-semibold border border-warning/30">{status}</span>;
      case "AWARDED":
        return <span className="bg-success/20 text-success text-xs px-2.5 py-1 rounded-full font-semibold border border-success/30">Awarded</span>;
      case "REJECTED":
        return <span className="bg-destructive/20 text-destructive text-xs px-2.5 py-1 rounded-full font-semibold border border-destructive/30">Rejected</span>;
      default:
        return <span className="bg-muted text-muted-foreground text-xs px-2.5 py-1 rounded-full font-semibold border border-muted">{status}</span>;
    }
  };

  const handleStatusChange = (app: any, newStatus: string) => {
    setActionApp(app);
    setActionType(newStatus);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <CardTitle className="text-2xl text-primary font-bold">Job Applications</CardTitle>
        <form onSubmit={handleSearch} className="flex gap-2 max-w-sm w-full">
          <Input
            type="text"
            placeholder="Search by job title, company..."
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
                <TableHead>Applicant Email</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Loading applications...
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((app: any) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.id}</TableCell>
                    <TableCell>{app.student?.email || "N/A"}</TableCell>
                    <TableCell>{app.job?.title || "N/A"}</TableCell>
                    <TableCell>{app.job?.company || "N/A"}</TableCell>
                    <TableCell>
                      {getStatusBadge(app.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <select
                        className="border border-input bg-background rounded px-2 py-1 text-sm mr-2"
                        value={app.status}
                        onChange={(e) => handleStatusChange(app, e.target.value)}
                      >
                        <option value="RESEARCHING">Researching</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="AWARDED">Awarded</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
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

      <AlertDialog open={!!actionApp} onOpenChange={(open) => !open && setActionApp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Change Application Status
            </AlertDialogTitle>
            <AlertDialogDescription>
              Change {actionApp?.student?.email}'s application status from {actionApp?.status?.replace("_", " ")} to {actionType?.replace("_", " ")}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
