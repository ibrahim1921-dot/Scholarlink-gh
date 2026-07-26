import React from "react";
import { useTable, useCustomMutation } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckCircle, Trash2, ExternalLink } from "lucide-react";
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

export const PendingScholarshipList: React.FC = () => {
  const navigate = useNavigate();
  const {
    tableQueryResult: { data, isLoading },
    current,
    setCurrent,
    pageCount,
  } = useTable({
    resource: "pending-scholarships",
    pagination: {
      mode: "server",
      current: 1,
      pageSize: 10,
    },
  });

  const [actionScholarship, setActionScholarship] = React.useState<any>(null);
  const [actionType, setActionType] = React.useState<"verify" | "reject" | null>(null);

  const { mutate } = useCustomMutation();

  const handleAction = () => {
    if (!actionScholarship || !actionType) return;
    
    // Using deactivate endpoint as a reject mechanism for pending ones, 
    // or just leaving them unverified (the backend might need a hard delete if rejected)
    // For now we assume deactivate handles rejection/hiding, or we just use verify
    const url = actionType === "verify" 
      ? `/scholarships/${actionScholarship.id}/verify`
      : `/scholarships/${actionScholarship.id}/deactivate`;

    mutate(
      {
        url,
        method: "put",
        values: {},
      },
      {
        onSuccess: () => {
          setActionScholarship(null);
          setActionType(null);
        },
      }
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <CardTitle className="text-2xl text-primary font-bold">Pending Scholarships</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Loading pending scholarships...
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No pending scholarships
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((scholarship: any) => (
                  <TableRow key={scholarship.id}>
                    <TableCell className="font-medium">{scholarship.id}</TableCell>
                    <TableCell>{scholarship.name}</TableCell>
                    <TableCell>{scholarship.provider}</TableCell>
                    <TableCell>{scholarship.createdAt ? new Date(scholarship.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/scholarships/edit/${scholarship.id}`)}
                        className="mr-2"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View/Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActionScholarship(scholarship);
                          setActionType("verify");
                        }}
                        className="mr-2 border-success text-success hover:bg-success hover:text-success-foreground"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActionScholarship(scholarship);
                          setActionType("reject");
                        }}
                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Reject
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
              {actionType === "verify" ? "Verify Scholarship?" : "Reject Scholarship?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "verify"
                ? `Are you sure you want to verify "${actionScholarship?.name}"? It will become visible to all students.`
                : `Are you sure you want to reject "${actionScholarship?.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={actionType === "reject" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-success text-success-foreground hover:bg-success/90"}
            >
              {actionType === "verify" ? "Verify" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
