import React, { useState } from "react";
import { useTable } from "@refinedev/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock } from "lucide-react";

export const PaymentList: React.FC = () => {
  const {
    tableQueryResult: { data, isLoading },
    current,
    setCurrent,
    pageCount,
    setFilters,
  } = useTable({
    resource: "payments",
    pagination: {
      mode: "server",
      current: 1,
      pageSize: 10,
    },
  });

  const [searchTerm, setSearchTerm] = useState("");

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

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="flex items-center text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-semibold border border-green-200 w-fit">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Success
          </span>
        );
      case "FAILED":
        return (
          <span className="flex items-center text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-semibold border border-red-200 w-fit">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="flex items-center text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-200 w-fit">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <CardTitle className="text-2xl text-primary font-bold">Payments</CardTitle>
        <form onSubmit={handleSearch} className="flex gap-2 max-w-sm w-full">
          <Input
            type="text"
            placeholder="Search by email or reference..."
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
                <TableHead>Reference</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Loading payments...
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((payment: any) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium text-xs font-mono">{payment.paystackReference}</TableCell>
                    <TableCell>{payment.userEmail}</TableCell>
                    <TableCell>
                      {payment.type === 'AI_CREDIT_BUNDLE' ? 'AI Credits' : 'Application Fee'}
                      {payment.type === 'AI_CREDIT_BUNDLE' && payment.creditsGranted && (
                        <span className="block text-xs text-muted-foreground">
                          +{payment.creditsGranted} Credits
                        </span>
                      )}
                      {payment.type === 'ASSISTED_APPLICATION_FEE' && payment.relatedEntityType && payment.relatedEntityId && (
                        <span className="block text-xs text-muted-foreground">
                          {payment.relatedEntityType} #{payment.relatedEntityId}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      ₵{(payment.amountPesewas / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>{renderStatus(payment.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(payment.createdAt)}
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
    </Card>
  );
};
