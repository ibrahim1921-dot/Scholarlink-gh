import React from "react";
import { useList } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, ShieldAlert, Hourglass } from "lucide-react";

export const DashboardPage: React.FC = () => {
  // Fetch Pending Scholarships
  const { data: pendingScholarships, isLoading: isLoadingScholarships } = useList({
    resource: "pending-scholarships",
    pagination: { mode: "server", current: 1, pageSize: 1 },
  });

  // Fetch Suspicious Documents
  const { data: suspiciousDocs, isLoading: isLoadingDocs } = useList({
    resource: "suspicious-documents",
    pagination: { mode: "server", current: 1, pageSize: 1 },
  });

  // Fetch Total Users
  const { data: users, isLoading: isLoadingUsers } = useList({
    resource: "users",
    pagination: { mode: "server", current: 1, pageSize: 1 },
  });

  // Fetch Recent Audit Logs
  const { data: auditLogs, isLoading: isLoadingLogs } = useList({
    resource: "audit-logs",
    pagination: { mode: "server", current: 1, pageSize: 5 },
    sorters: [
      {
        field: "timestamp",
        order: "desc",
      },
    ],
  });

  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary mb-6">Dashboard Overview</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingUsers ? "..." : users?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered platform users
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Scholarships</CardTitle>
            <Hourglass className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingScholarships ? "..." : pendingScholarships?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting verification
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Suspicious Documents</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingDocs ? "..." : suspiciousDocs?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Flagged for admin review
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm mt-8">
        <CardHeader>
          <CardTitle className="text-lg text-primary">Recent Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingLogs ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                ) : auditLogs?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No recent activity
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs?.data.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(log.timestamp)}</TableCell>
                      <TableCell className="font-medium">{log.adminEmail}</TableCell>
                      <TableCell>
                        <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md font-semibold font-mono">
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {log.entityType} ({log.entityId})
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
