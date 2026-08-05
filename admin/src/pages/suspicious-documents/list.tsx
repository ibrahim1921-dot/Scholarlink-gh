import React, { useState } from "react";
import { useTable, useCustomMutation } from "@refinedev/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, FileText } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

export const SuspiciousDocumentList: React.FC = () => {
  const {
    tableQueryResult: { data, isLoading },
    current,
    setCurrent,
    pageCount,
  } = useTable({
    resource: "suspicious-documents",
    pagination: {
      mode: "client",
      current: 1,
      pageSize: 10,
    },
  });

  const [actionDoc, setActionDoc] = useState<any>(null);
  const [actionType, setActionType] = useState<"VERIFIED" | "REJECTED" | null>(null);
  const [notes, setNotes] = useState("");

  const { mutate } = useCustomMutation();

  const handleAction = () => {
    if (!actionDoc || !actionType) return;
    
    mutate(
      {
        url: `/documents/admin/${actionDoc.id}/status`,
        method: "put",
        values: { status: actionType, notes },
      },
      {
        onSuccess: () => {
          setActionDoc(null);
          setActionType(null);
          setNotes("");
        },
      }
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <CardTitle className="text-2xl text-primary font-bold">Review Queue (Suspicious & Rejected)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>ID</TableHead>
                <TableHead>Student Email</TableHead>
                <TableHead>Filename</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>AI Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Loading suspicious documents...
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No documents pending review
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((doc: any) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.id}</TableCell>
                    <TableCell>{doc.student_email}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        {doc.filename}
                      </div>
                    </TableCell>
                    <TableCell>{doc.document_type}</TableCell>
                    <TableCell>
                      <span className="text-sm text-destructive">{doc.verification_notes || "Flagged for review"}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActionDoc(doc);
                          setActionType("VERIFIED");
                          setNotes("");
                        }}
                        className="mr-2 border-success text-success hover:bg-success hover:text-success-foreground"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActionDoc(doc);
                          setActionType("REJECTED");
                          setNotes(doc.verification_notes || "");
                        }}
                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
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
        {pageCount > 1 && (
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
              disabled={current === pageCount}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!actionDoc} onOpenChange={(open) => {
        if (!open) {
          setActionDoc(null);
          setNotes("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "VERIFIED" ? "Approve Document?" : "Reject Document?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "VERIFIED"
                ? `Are you sure you want to verify this document from ${actionDoc?.student_email}? This overrides the AI's assessment.`
                : `Are you sure you want to reject this document from ${actionDoc?.student_email}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              {actionType === "VERIFIED" ? "Approval Notes (Optional)" : "Rejection Reason (Required)"}
            </label>
            <Textarea 
              value={notes} 
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder="Add your notes here..."
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={actionType === "REJECTED" && !notes.trim()}
              className={actionType === "REJECTED" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-success text-success-foreground hover:bg-success/90"}
            >
              {actionType === "VERIFIED" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
