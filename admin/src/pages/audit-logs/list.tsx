import React, { useState } from "react";
import { useTable } from "@refinedev/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export const AuditLogList: React.FC = () => {
  const {
    tableQueryResult: { data, isLoading },
    current,
    setCurrent,
    pageCount,
    setFilters,
  } = useTable({
    resource: "audit-logs",
    pagination: {
      mode: "server",
      current: 1,
      pageSize: 20,
    },
    syncWithLocation: true,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [entityType, setEntityType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In Refine, we pass an array of filters
    const filters: any[] = [];
    
    if (searchTerm) {
      filters.push({ field: "search", operator: "eq", value: searchTerm });
    }
    
    if (entityType) {
      filters.push({ field: "entityType", operator: "eq", value: entityType });
    }
    
    if (startDate) {
      // Add time to make it beginning of day if not present
      filters.push({ field: "startDate", operator: "eq", value: `${startDate}T00:00:00` });
    }
    
    if (endDate) {
      // Add time to make it end of day
      filters.push({ field: "endDate", operator: "eq", value: `${endDate}T23:59:59` });
    }

    setFilters(filters, "replace");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setEntityType("");
    setStartDate("");
    setEndDate("");
    setFilters([], "replace");
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const inputClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col space-y-4 pb-6">
        <CardTitle className="text-2xl text-primary font-bold">Audit Logs</CardTitle>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground mb-1 block">Search</label>
            <Input
              type="text"
              placeholder="Admin email, action, detail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-48">
            <label className="text-xs text-muted-foreground mb-1 block">Entity Type</label>
            <select
              className={inputClassName}
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              <option value="">All Entities</option>
              <option value="USER">User</option>
              <option value="DOCUMENT">Document</option>
              <option value="SCHOLARSHIP">Scholarship</option>
              <option value="JOB">Job</option>
              <option value="APPLICATION">Application</option>
            </select>
          </div>
          <div className="w-40">
            <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="w-40">
            <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
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
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin Email</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(log.timestamp)}</TableCell>
                    <TableCell className="font-medium">{log.adminEmail}</TableCell>
                    <TableCell>
                      <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md font-semibold font-mono">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>{log.entityType}</TableCell>
                    <TableCell>{log.entityId}</TableCell>
                    <TableCell className="max-w-xs truncate" title={log.detail}>{log.detail}</TableCell>
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
    </Card>
  );
};
