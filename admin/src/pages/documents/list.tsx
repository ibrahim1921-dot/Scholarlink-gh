import React, { useState } from "react";
import { useTable, useCustomMutation } from "@refinedev/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight, FileText, CheckCircle, XCircle, Download, Info } from "lucide-react";
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
import axios from "axios";
import { API_URL } from "@/providers/authProvider";

export const AdminDocumentList: React.FC = () => {
  const {
    tableQueryResult: { data, isLoading },
    current,
    setCurrent,
    pageCount,
    setFilters,
  } = useTable({
    resource: "admin-documents",
    pagination: {
      mode: "server",
      current: 1,
      pageSize: 10,
    },
    syncWithLocation: true,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");

  // Modals state
  const [actionDoc, setActionDoc] = useState<any>(null);
  const [actionType, setActionType] = useState<"VERIFIED" | "REJECTED" | null>(null);
  const [notes, setNotes] = useState("");
  
  const [insightDoc, setInsightDoc] = useState<any>(null);

  const { mutate } = useCustomMutation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const filters: any[] = [];
    if (searchTerm) filters.push({ field: "search", operator: "eq", value: searchTerm });
    if (status) filters.push({ field: "status", operator: "eq", value: status });
    if (type) filters.push({ field: "type", operator: "eq", value: type });
    setFilters(filters, "replace");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatus("");
    setType("");
    setFilters([], "replace");
  };

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

  const downloadFile = async (doc: any) => {
    try {
      const token = localStorage.getItem("scholarlink_admin_token");
      const response = await axios.get(`${API_URL}/documents/admin/documents/${doc.id}/download`, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const headerVal = response.headers["content-type"];
      const contentType = typeof headerVal === "string" ? headerVal : "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      // Inline view for PDFs/images often works by just opening the object URL
      // If it forces a download, we can use a hidden anchor.
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename; // provides a hint for download
      // try to open inline first, if it can't, it will download
      a.target = "_blank"; 
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download document", err);
      alert("Failed to download or view the document. It may have been deleted.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <span className="bg-success/20 text-success border-success/30 text-xs px-2.5 py-1 rounded-full font-semibold border">Verified</span>;
      case "PENDING":
        return <span className="bg-warning/20 text-warning border-warning/30 text-xs px-2.5 py-1 rounded-full font-semibold border">Pending</span>;
      case "REJECTED":
        return <span className="bg-destructive/20 text-destructive border-destructive/30 text-xs px-2.5 py-1 rounded-full font-semibold border">Rejected</span>;
      case "SUSPICIOUS":
        return <span className="bg-blue-100 text-blue-700 border-blue-300 text-xs px-2.5 py-1 rounded-full font-semibold border">Suspicious</span>;
      default:
        return <span className="bg-muted text-muted-foreground text-xs px-2.5 py-1 rounded-full font-semibold border">{status}</span>;
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleString();
  };

  const inputClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col space-y-4 pb-6">
        <CardTitle className="text-2xl text-primary font-bold">Document Management</CardTitle>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground mb-1 block">Search</label>
            <Input
              type="text"
              placeholder="Filename or student email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-40">
            <label className="text-xs text-muted-foreground mb-1 block">Status</label>
            <select
              className={inputClassName}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="SUSPICIOUS">Suspicious</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="w-48">
            <label className="text-xs text-muted-foreground mb-1 block">Document Type</label>
            <select
              className={inputClassName}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="TRANSCRIPT">Transcript</option>
              <option value="CV">CV</option>
              <option value="STATEMENT">Statement</option>
              <option value="REFERENCE">Reference</option>
              <option value="IDENTITY">Identity</option>
              <option value="FINANCIAL_PROOF">Financial Proof</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="default">
              <Search className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </form>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Student Email</TableHead>
                <TableHead>Filename</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Loading documents...
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No documents found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((doc: any) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.student_email}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium max-w-[200px] truncate" title={doc.filename}>{doc.filename}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs uppercase text-muted-foreground tracking-wider">{doc.document_type}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(doc.verification_status)}
                        {doc.verification_notes && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                            onClick={() => setInsightDoc(doc)}
                            title="View AI Insight"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(doc.uploaded_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile(doc)}
                          title="Download/View File"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        {/* Only show Approve/Reject for non-Verified, or let them override anytime */}
                        {doc.verification_status !== "VERIFIED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActionDoc(doc);
                              setActionType("VERIFIED");
                              setNotes("");
                            }}
                            className="border-success text-success hover:bg-success hover:text-success-foreground"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {doc.verification_status !== "REJECTED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActionDoc(doc);
                              setActionType("REJECTED");
                              setNotes(doc.verification_notes || "");
                            }}
                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pageCount > 0 && (
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

      {/* AI Insight Modal */}
      <AlertDialog open={!!insightDoc} onOpenChange={(open) => !open && setInsightDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>AI Document Insight</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-foreground mt-2 border-l-4 border-blue-500 pl-4 py-1 bg-slate-50 rounded-r-md leading-relaxed whitespace-pre-wrap">
              {insightDoc?.verification_notes}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Update Modal */}
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
                ? `Are you sure you want to verify this document from ${actionDoc?.student_email}?`
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
