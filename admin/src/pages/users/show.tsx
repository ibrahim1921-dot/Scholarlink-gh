import React, { useState } from "react";
import { useShow, useCustom, useCustomMutation, useInvalidate, useNavigation } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User as UserIcon, 
  CreditCard, 
  FileText, 
  GraduationCap, 
  Activity, 
  MessageSquare,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  Download,
  Info
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { API_URL } from "@/providers/authProvider";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const UserShow: React.FC = () => {
  const { queryResult } = useShow({
    resource: "users",
  });

  const { data: userOverviewData, isLoading: isOverviewLoading } = queryResult;
  const user = userOverviewData?.data;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ username: "", phoneNumber: "" });
  
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteActionType, setDeleteActionType] = useState<"delete" | "force_delete">("delete");
  const [forceDeleteEmail, setForceDeleteEmail] = useState("");
  const [deleteActionError, setDeleteActionError] = useState<string | null>(null);
  
  const { list } = useNavigation();
  
  const { mutate, isLoading: isMutating } = useCustomMutation();
  const invalidate = useInvalidate();

  React.useEffect(() => {
    if (user) {
      setEditFormData({
        username: user.username || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user]);

  const handleEditSubmit = () => {
    if (!user) return;
    
    // We do a PATCH to /users/{id}
    mutate({
      url: `/admin/users/${user.id}`,
      method: "patch",
      values: editFormData,
      successNotification: () => ({
        message: "User details updated successfully",
        type: "success",
      }),
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        invalidate({
          resource: "users",
          invalidates: ["detail"],
          id: user.id
        });
      }
    });
  };

  const handleToggleStatus = () => {
    if (!user) return;
    const action = user.enabled ? "suspend" : "activate";
    
    mutate({
      url: `/admin/users/${user.id}/${action}`,
      method: "post",
      values: {},
      successNotification: () => ({
        message: `User ${action}d successfully`,
        type: "success",
      }),
    }, {
      onSuccess: () => {
        setIsSuspendDialogOpen(false);
        invalidate({
          resource: "users",
          invalidates: ["detail"],
          id: user.id
        });
      }
    });
  };

  const handleDeleteUser = () => {
    if (!user) return;
    setDeleteActionError(null);
    
    let url = `/admin/users/${user.id}`;
    if (deleteActionType === "force_delete") {
        url += "?force=true";
    }
    
    mutate({
      url,
      method: "delete",
      values: {},
      successNotification: () => ({
        message: "User deleted successfully",
        type: "success",
      }),
    }, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        list("users");
      },
      onError: (error: any) => {
        const errMsg = error?.response?.data?.message || error?.message || "";
        const isConflict = error?.response?.status === 409 || 
                           error?.statusCode === 409 || 
                           error?.status === 409 || 
                           errMsg.includes("Cannot delete: user has");
                           
        if (deleteActionType === "delete" && isConflict) {
           setDeleteActionType("force_delete");
           setForceDeleteEmail("");
           setDeleteActionError(errMsg || "Dependencies exist");
        } else {
           setDeleteActionError(errMsg || "An error occurred");
        }
      }
    });
  };

  if (isOverviewLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading user workspace...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center text-destructive">User not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden text-primary text-2xl font-bold">
            {user.profilePictureUrl ? (
              <img src={user.profilePictureUrl} alt={user.username} className="h-full w-full object-cover" />
            ) : (
              user.username?.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.username}</h1>
            <div className="flex items-center space-x-2 text-muted-foreground mt-1">
              <span>{user.email}</span>
              <span>•</span>
              <span>{user.phoneNumber}</span>
              <span>•</span>
              <Badge variant={user.enabled ? "default" : "destructive"}>
                {user.enabled ? "Active" : "Disabled"}
              </Badge>
              {user.role === "ADMIN" && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {/* Edit User Modal */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Edit User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit User Details</DialogTitle>
                <DialogDescription>
                  Make changes to the user's profile here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={editFormData.phoneNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button disabled={isMutating} onClick={handleEditSubmit}>Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Suspend/Activate Account Modal */}
          <AlertDialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className={user.enabled 
                  ? "text-amber-600 border-amber-600 hover:bg-amber-600 hover:text-white"
                  : "text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                }
              >
                {user.enabled ? "Suspend Account" : "Activate Account"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  {user.enabled 
                    ? "This action will immediately revoke all active sessions for this user and prevent them from logging in. An automated email will be sent notifying them of the suspension."
                    : "This will restore the user's access to the application."
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleToggleStatus}
                  className={user.enabled ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "bg-green-600 hover:bg-green-700 text-white"}
                >
                  {user.enabled ? "Yes, Suspend" : "Yes, Activate"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Account Modal */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
             if (!open) {
                setIsDeleteDialogOpen(false);
                setDeleteActionType("delete");
                setDeleteActionError(null);
             }
          }}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-white" onClick={() => setIsDeleteDialogOpen(true)}>
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {deleteActionType === "force_delete" ? "Force Delete User?" : "Are you absolutely sure?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteActionType === "force_delete"
                    ? "This will permanently delete: applications, documents, and this user's entire account. Payment records will be kept but anonymized."
                    : "This action cannot be undone. This will permanently delete the user's account and remove all their data from our servers."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              {deleteActionType === "force_delete" && (
                 <div className="py-4">
                   <p className="text-sm font-medium mb-2">Type <strong>{user?.email}</strong> to confirm:</p>
                   <Input 
                     value={forceDeleteEmail} 
                     onChange={(e) => setForceDeleteEmail(e.target.value)} 
                     placeholder="Enter user email to force delete"
                   />
                 </div>
              )}
              {deleteActionError && (
                <div className="text-sm font-medium text-destructive mt-2">
                  {deleteActionError}
                </div>
              )}
              
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteUser();
                  }}
                  disabled={deleteActionType === "force_delete" && forceDeleteEmail !== user?.email}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Yes, Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Profile</div>
            <div className="text-2xl font-bold">{user.profileCompletionPercentage}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">AI Credits</div>
            <div className="text-2xl font-bold">{user.aiCreditsRemaining}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Documents</div>
            <div className="text-2xl font-bold">{user.totalDocuments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Payments</div>
            <div className="text-2xl font-bold">{user.totalPayments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Scholarships</div>
            <div className="text-2xl font-bold">{user.appliedScholarships}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Jobs</div>
            <div className="text-2xl font-bold">{user.appliedJobs || 0}</div>
          </CardContent>
        </Card>

      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6 space-x-6">
          <TabsTrigger value="profile" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 py-3 bg-transparent">
            <UserIcon className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 py-3 bg-transparent">
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 py-3 bg-transparent">
            <CreditCard className="w-4 h-4 mr-2" />
            AI & Billing
          </TabsTrigger>
          <TabsTrigger value="scholarships" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 py-3 bg-transparent">
            <GraduationCap className="w-4 h-4 mr-2" />
            Scholarships
          </TabsTrigger>
          <TabsTrigger value="jobs" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 py-3 bg-transparent">
            <Briefcase className="w-4 h-4 mr-2" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 py-3 bg-transparent">
            <Activity className="w-4 h-4 mr-2" />
            Activity & Security
          </TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 py-3 bg-transparent">
            <MessageSquare className="w-4 h-4 mr-2" />
            Support & Notes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="m-0">
          <ProfileTab user={user} />
        </TabsContent>
        <TabsContent value="documents" className="m-0">
          <DocumentsTab userId={user.id} />
        </TabsContent>
        <TabsContent value="billing" className="m-0">
          <BillingTab userId={user.id} aiCreditsRemaining={user.aiCreditsRemaining} aiCreditsUsedTotal={user.aiCreditsUsedTotal} lifetimeSpending={user.lifetimeSpending} />
        </TabsContent>
        <TabsContent value="scholarships" className="mt-0 outline-none">
          <ScholarshipsTab userId={user.id} />
        </TabsContent>
        <TabsContent value="jobs" className="mt-0 outline-none">
          <JobsTab userId={user.id} />
        </TabsContent>
        <TabsContent value="activity" className="m-0">
          <ActivityTab userId={user.id} user={user} />
        </TabsContent>
        <TabsContent value="notes" className="m-0">
          <NotesTab userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// --- Sub-components for lazy loading ---

const ProfileTab = ({ user }: { user: any }) => {
  const renderLanguages = (langStr: string) => {
    if (!langStr) return "Not specified";
    try {
      const parsed = JSON.parse(langStr);
      if (Array.isArray(parsed)) {
        return (
          <div className="flex flex-wrap gap-1">
            {parsed.map((lang: any, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-xs font-normal">
                <span className="font-medium mr-1">{lang.language}:</span> {lang.level}
              </Badge>
            ))}
          </div>
        );
      }
    } catch (e) {
      // Fallback for simple comma-separated strings
      return (
        <div className="flex flex-wrap gap-1">
          {langStr.split(',').map((lang: string, idx: number) => (
            <Badge key={idx} variant="secondary" className="text-xs font-normal">
              {lang.trim()}
            </Badge>
          ))}
        </div>
      );
    }
    return langStr;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Profile Details</CardTitle>
        <CardDescription>Academic background and preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!user.hasProfile ? (
          <div className="text-muted-foreground py-8 text-center border rounded-md border-dashed">
            This user has not set up their student profile yet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Academic Background</h3>
              <div className="grid grid-cols-3 gap-y-3">
                <span className="text-muted-foreground text-sm font-medium">Institution:</span>
                <span className="col-span-2 font-medium">{user.institution || "Not specified"}</span>
                
                <span className="text-muted-foreground text-sm font-medium">Education Level:</span>
                <span className="col-span-2">{user.educationLevel || "Not specified"}</span>
                
                <span className="text-muted-foreground text-sm font-medium">Field of Study:</span>
                <span className="col-span-2">{user.fieldOfStudy || "Not specified"}</span>
                
                <span className="text-muted-foreground text-sm font-medium">GPA:</span>
                <span className="col-span-2">{user.gpa ? parseFloat(user.gpa).toFixed(2) : "Not specified"}</span>
                
                <span className="text-muted-foreground text-sm font-medium">Graduation:</span>
                <span className="col-span-2">{user.graduationYear || "Not specified"}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Preferences & Details</h3>
              <div className="grid grid-cols-3 gap-y-3">
                <span className="text-muted-foreground text-sm font-medium">Location:</span>
                <span className="col-span-2">{user.originalLocation || "Not specified"}</span>
                
                <span className="text-muted-foreground text-sm font-medium">Country Pref:</span>
                <span className="col-span-2">{user.countryPreference || "Not specified"}</span>
                
                <span className="text-muted-foreground text-sm font-medium">Financial Need:</span>
                <span className="col-span-2">
                  {user.financialNeed ? (
                    <Badge variant="outline">{user.financialNeed}</Badge>
                  ) : "Not specified"}
                </span>

                <span className="text-muted-foreground text-sm font-medium">Start Date:</span>
                <span className="col-span-2">{user.intendedStartDate || "Not specified"}</span>
                
                <span className="text-muted-foreground text-sm font-medium">Languages:</span>
                <span className="col-span-2">{renderLanguages(user.languageProficiency)}</span>
                
                <span className="text-muted-foreground text-sm font-medium">Test Scores:</span>
                <span className="col-span-2">{user.standardizedTests || "Not specified"}</span>

                <span className="text-muted-foreground text-sm font-medium">Completeness:</span>
                <span className="col-span-2">
                  <div className="w-full bg-secondary h-2.5 mt-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${user.profileCompletionPercentage}%` }}
                    ></div>
                  </div>
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 border-t pt-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Biography</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-md">
                {user.bio || "No biography provided."}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Achievements & Activities</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-md">
                {user.achievements || "No achievements listed."}
              </p>
            </div>
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const DocumentsTab = ({ userId }: { userId?: number | string }) => {
  const [page, setPage] = useState(0);
  const size = 10;
  
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

  const [actionDoc, setActionDoc] = useState<any>(null);
  const [actionType, setActionType] = useState<"VERIFIED" | "REJECTED" | null>(null);
  const [notes, setNotes] = useState("");
  const [insightDoc, setInsightDoc] = useState<any>(null);
  
  const { mutate } = useCustomMutation();
  const invalidate = useInvalidate();

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
          invalidate({
            resource: "users",
            invalidates: ["detail"],
          });
          window.location.reload();
        },
        onError: (error: any) => {
          alert(`Failed to update status: ${error?.response?.data?.message || error?.message || "Unknown error"}`);
          setActionDoc(null);
          setActionType(null);
        }
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
      
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename; 
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
  
  const { data, isLoading } = useCustom({
    url: `/admin/users/${userId}/documents`,
    method: "get",
    config: {
      query: { page, size }
    }
  });

  const documents = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uploaded Documents</CardTitle>
        <CardDescription>Document vault and verification history</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No documents found</TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc: any) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium max-w-[200px] truncate" title={doc.filename}>{doc.filename || "Document"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs uppercase text-muted-foreground tracking-wider">{doc.documentType}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(doc.uploadedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(doc.verificationStatus)}
                          {doc.verificationNotes && (
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
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile(doc)}
                            disabled={!doc.storagePath}
                            title="Download/View File"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          {doc.verificationStatus !== "VERIFIED" && (
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
                          
                          {!(doc.verificationStatus === "REJECTED" && doc.adminReviewed) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActionDoc(doc);
                                setActionType("REJECTED");
                                setNotes(doc.verificationNotes || "");
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
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* AI Insight Modal */}
      <AlertDialog open={!!insightDoc} onOpenChange={(open) => !open && setInsightDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>AI Document Insight</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-foreground mt-2 border-l-4 border-blue-500 pl-4 py-1 bg-slate-50 rounded-r-md leading-relaxed whitespace-pre-wrap">
              {insightDoc?.verificationNotes}
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
                ? `Are you sure you want to verify this document?`
                : `Are you sure you want to reject this document?`}
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

const BillingTab = ({ userId, aiCreditsRemaining, aiCreditsUsedTotal, lifetimeSpending }: { userId?: number | string, aiCreditsRemaining: number, aiCreditsUsedTotal: number, lifetimeSpending: number }) => {
  const [page, setPage] = useState(0);
  const size = 10;
  
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [grantAmount, setGrantAmount] = useState("");
  const [grantError, setGrantError] = useState<string | null>(null);
  const [grantSuccess, setGrantSuccess] = useState<string | null>(null);

  const { mutate } = useCustomMutation();
  const invalidate = useInvalidate();
  
  const { data, isLoading } = useCustom({
    url: `/admin/users/${userId}/payments`,
    method: "get",
    config: {
      query: { page, size }
    }
  });

  const payments = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-primary/80">Available AI Credits</div>
                <div className="text-3xl font-bold text-primary">{aiCreditsRemaining}</div>
              </div>
              <Button size="sm" variant="outline" className="border-primary text-primary" onClick={() => {
                setGrantAmount("");
                setGrantError(null);
                setGrantSuccess(null);
                setIsGrantDialogOpen(true);
              }}>Grant Credits</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Total AI Credits Used</div>
            <div className="text-3xl font-bold">{aiCreditsUsedTotal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Lifetime Spending</div>
            <div className="text-3xl font-bold">GHS {lifetimeSpending?.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All transactions made by this user</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading payments...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payments found</TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono text-xs">{payment.paystackReference}</TableCell>
                        <TableCell>GHS {payment.amountPesewas ? (payment.amountPesewas / 100).toFixed(2) : "0.00"}</TableCell>
                        <TableCell>{payment.creditsGranted || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={payment.status === 'SUCCESS' ? 'default' : payment.status === 'FAILED' ? 'destructive' : 'secondary'}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Grant AI Credits Dialog */}
      <AlertDialog open={isGrantDialogOpen} onOpenChange={(open) => !open && setIsGrantDialogOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Grant AI Credits</AlertDialogTitle>
            <AlertDialogDescription>
              Grant AI generation credits to this user. Enter the number of credits to add.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="number"
              min="1"
              placeholder="Number of credits"
              value={grantAmount}
              onChange={(e) => setGrantAmount(e.target.value)}
            />
          </div>
          {grantError && (
            <div className="text-sm font-medium text-destructive">
              {grantError}
            </div>
          )}
          {grantSuccess && (
            <div className="text-sm font-medium text-green-600">
              {grantSuccess}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                const amount = parseInt(grantAmount);
                if (!amount || amount <= 0) {
                  setGrantError("Please enter a valid positive number.");
                  return;
                }
                setGrantError(null);
                mutate(
                  {
                    url: `/admin/users/${userId}/grant-credits`,
                    method: "post",
                    values: { amount },
                  },
                  {
                    onSuccess: (response: any) => {
                      setGrantSuccess(`Granted ${amount} credits. New balance: ${response?.data?.aiCreditsRemaining ?? 'updated'}`);
                      invalidate({ resource: "users", invalidates: ["detail"], id: userId });
                      setTimeout(() => setIsGrantDialogOpen(false), 1500);
                    },
                    onError: (error: any) => {
                      setGrantError(error?.response?.data?.message || error?.message || "Failed to grant credits");
                    }
                  }
                );
              }}
            >
              Grant Credits
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ScholarshipsTab = ({ userId }: { userId?: number | string }) => {
  const [page, setPage] = useState(0);
  const size = 10;
  
  const [actionApp, setActionApp] = useState<any>(null);
  const [actionType, setActionType] = useState<string | null>(null);

  const { mutate } = useCustomMutation();
  const invalidate = useInvalidate();

  const { data, isLoading } = useCustom({
    url: `/admin/users/${userId}/scholarships`,
    method: "get",
    config: {
      query: { page, size }
    }
  });

  const trackers = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

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

  const handleAction = () => {
    if (!actionApp || !actionType) return;
    
    mutate(
      {
        url: `/admin/applications/${actionApp.id}/status`,
        method: "patch",
        values: { status: actionType },
      },
      {
        onSuccess: () => {
          setActionApp(null);
          setActionType(null);
          invalidate({
            resource: "users",
            invalidates: ["detail"],
          });
          // force a quick reload of the component's custom query if invalidate doesn't catch it
          window.location.reload(); 
        },
        onError: (error: any) => {
          alert(`Failed to update status: ${error?.response?.data?.message || error?.message || "Unknown error"}`);
          setActionApp(null);
          setActionType(null);
        },
      }
    );
  };

  const handleStatusChange = (app: any, newStatus: string) => {
    setActionApp(app);
    setActionType(newStatus);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scholarship Activity</CardTitle>
        <CardDescription>Applications and tracking history</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading scholarships...</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>ID</TableHead>
                  <TableHead>Scholarship</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Application Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trackers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No scholarship activity found</TableCell>
                  </TableRow>
                ) : (
                  trackers.map((tracker: any) => (
                    <TableRow key={tracker.id}>
                      <TableCell className="font-medium">{tracker.id}</TableCell>
                      <TableCell>{tracker.scholarship?.title || "Unknown Scholarship"}</TableCell>
                      <TableCell>{tracker.scholarship?.provider || "N/A"}</TableCell>
                      <TableCell>
                        {tracker.applicationMode === "ASSISTED" ? (
                          <span className="text-primary font-medium">Assisted</span>
                        ) : (
                          <span className="text-muted-foreground">Direct</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(tracker.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <select
                          className="border border-input bg-background rounded px-2 py-1 text-sm mr-2"
                          value={tracker.status}
                          onChange={(e) => handleStatusChange(tracker, e.target.value)}
                        >
                          <option value="RESEARCHING">Researching</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="SUBMITTED">Submitted</option>
                          <option value="INTERVIEW">Interview</option>
                          <option value="AWARDED">Awarded</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/scholarships/edit/${tracker.scholarship?.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      <AlertDialog open={!!actionApp} onOpenChange={(open) => !open && setActionApp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Application Status</AlertDialogTitle>
            <AlertDialogDescription>
              Change the application status for {actionApp?.scholarship?.title} from {actionApp?.status?.replace("_", " ")} to {actionType?.replace("_", " ")}?
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

const JobsTab = ({ userId }: { userId?: number | string }) => {
  const [page, setPage] = useState(0);
  const size = 10;
  
  const [actionApp, setActionApp] = useState<any>(null);
  const [actionType, setActionType] = useState<string | null>(null);

  const { mutate } = useCustomMutation();
  const invalidate = useInvalidate();

  const { data, isLoading } = useCustom({
    url: `/admin/users/${userId}/jobs`,
    method: "get",
    config: {
      query: { page, size }
    }
  });

  const trackers = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

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
            resource: "users",
            invalidates: ["detail"],
          });
          window.location.reload(); 
        },
        onError: (error: any) => {
          alert(`Failed to update status: ${error?.response?.data?.message || error?.message || "Unknown error"}`);
          setActionApp(null);
          setActionType(null);
        },
      }
    );
  };

  const handleStatusChange = (app: any, newStatus: string) => {
    setActionApp(app);
    setActionType(newStatus);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Activity</CardTitle>
        <CardDescription>Applications and tracking history</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading jobs...</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>ID</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trackers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  trackers.map((tracker: any) => (
                    <TableRow key={tracker.id}>
                      <TableCell className="font-medium">{tracker.id}</TableCell>
                      <TableCell>{tracker.job?.title || "N/A"}</TableCell>
                      <TableCell>{tracker.job?.company || "N/A"}</TableCell>
                      <TableCell>
                        {getStatusBadge(tracker.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <select
                          className="border border-input bg-background rounded px-2 py-1 text-sm mr-2"
                          value={tracker.status}
                          onChange={(e) => handleStatusChange(tracker, e.target.value)}
                        >
                          <option value="RESEARCHING">Researching</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="SUBMITTED">Submitted</option>
                          <option value="INTERVIEW">Interview</option>
                          <option value="AWARDED">Awarded</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/jobs/edit/${tracker.job?.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      <AlertDialog open={!!actionApp} onOpenChange={(open) => !open && setActionApp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Application Status</AlertDialogTitle>
            <AlertDialogDescription>
              Change the application status for {actionApp?.job?.title} from {actionApp?.status?.replace("_", " ")} to {actionType?.replace("_", " ")}?
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

const ActivityTab = ({ userId, user }: { userId?: number | string, user: any }) => {
  const [page, setPage] = useState(0);
  const size = 10;
  
  const { data, isLoading } = useCustom({
    url: `/admin/users/${userId}/activity`,
    method: "get",
    config: {
      query: { page, size }
    }
  });

  const logs = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>Security status and login details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1 border-r pr-4">
              <span className="text-sm text-muted-foreground">Account Status</span>
              <div className="flex items-center space-x-2">
                {user.accountNonLocked ? <CheckCircle className="text-success h-4 w-4" /> : <XCircle className="text-destructive h-4 w-4" />}
                <span className="font-medium">{user.accountNonLocked ? "Unlocked" : "Locked"}</span>
              </div>
            </div>
            <div className="space-y-1 border-r pr-4">
              <span className="text-sm text-muted-foreground">Failed Logins</span>
              <div className="font-medium">{user.failedLoginAttempts || 0}</div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Last Activity</span>
              <div className="font-medium text-sm">{user.lastActivityAt ? new Date(user.lastActivityAt).toLocaleString() : "Never"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>Administrative and account actions taken on this user</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading activity...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No audit logs found for this user.</TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>{log.adminEmail}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">{log.detail}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const NotesTab = ({ userId }: { userId?: number | string }) => {
  const [page, setPage] = useState(0);
  const [newNote, setNewNote] = useState("");
  const size = 10;
  const invalidate = useInvalidate();
  
  const { data, isLoading } = useCustom({
    url: `/admin/users/${userId}/notes`,
    method: "get",
    config: {
      query: { page, size }
    }
  });

  const { mutate, isLoading: isAdding } = useCustomMutation();

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    mutate({
      url: `/admin/users/${userId}/notes`,
      method: "post",
      values: { note: newNote }
    }, {
      onSuccess: () => {
        setNewNote("");
        invalidate({
          resource: `custom`, // We have to invalidate the custom query.
          invalidates: ["all"]
        });
        // Simplest way to refresh in this custom setup is window.location.reload() or force react-query refetch
        // Refine's invalidate might not catch this custom URL cleanly without query keys, so we'll just reload for now or rely on user refreshing if invalidate fails.
      }
    });
  };

  const notes = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

  return (
    <div className="space-y-6">
      <Card className="bg-amber-50/50 border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-amber-800 text-lg flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Internal Admin Notes
          </CardTitle>
          <CardDescription className="text-amber-700/70">
            These notes are completely private and only visible to administrators. Students will never see them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Textarea 
              placeholder="Add a private note about this user (e.g. 'Potential duplicate account', 'Requested manual verification')..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="bg-white/80 min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button onClick={handleAddNote} disabled={!newNote.trim() || isAdding}>
                {isAdding ? "Adding..." : "Add Private Note"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Note History</h3>
        
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-lg bg-card/50">
            No internal notes have been added for this user yet.
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note: any) => (
              <Card key={note.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-secondary text-xs flex items-center justify-center font-bold">
                        {note.adminEmail.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm">{note.adminEmail}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm mt-2 pl-8">{note.note}</p>
                </CardContent>
              </Card>
            ))}
            
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
