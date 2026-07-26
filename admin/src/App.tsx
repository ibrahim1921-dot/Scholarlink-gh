import { Refine, Authenticated } from "@refinedev/core";
import routerBindings, { NavigateToResource, CatchAllNavigate } from "@refinedev/react-router-v6";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { authProvider } from "./providers/authProvider";
import { dataProvider } from "./providers/dataProvider";
import { Layout } from "./components/layout";
import { Login } from "./pages/login";
import { UserList } from "./pages/users/list";
import { JobList } from "./pages/jobs/list";
import { JobCreate } from "./pages/jobs/create";
import { JobEdit } from "./pages/jobs/edit";
import { ScholarshipList } from "./pages/scholarships/list";
import { ScholarshipCreate } from "./pages/scholarships/create";
import { ScholarshipEdit } from "./pages/scholarships/edit";
import { JobApplicationList } from "./pages/job-applications/list";
import { ScholarshipApplicationList } from "./pages/scholarship-applications/list";
import { PendingScholarshipList } from "./pages/pending-scholarships/list";
import { SuspiciousDocumentList } from "./pages/suspicious-documents/list";
import { AuditLogList } from "./pages/audit-logs/list";
import { AdminDocumentList } from "./pages/documents/list";
import { DashboardPage } from "./pages/dashboard";

function App() {
  return (
    <BrowserRouter>
      <Refine
        routerProvider={routerBindings}
        authProvider={authProvider}
        dataProvider={dataProvider()}
        resources={[
          {
            name: "dashboard",
            list: "/dashboard",
            meta: {
              label: "Dashboard",
            },
          },
          {
            name: "users",
            list: "/users",
            meta: {
              label: "Users",
            },
          },
          {
            name: "jobs",
            list: "/jobs",
            create: "/jobs/create",
            edit: "/jobs/edit/:id",
            meta: {
              label: "Jobs",
            },
          },
          {
            name: "scholarships",
            list: "/scholarships",
            create: "/scholarships/create",
            edit: "/scholarships/edit/:id",
            meta: {
              label: "Scholarships",
            },
          },
          {
            name: "job-applications",
            list: "/job-applications",
            meta: {
              label: "Job Applications",
            },
          },
          {
            name: "scholarship-applications",
            list: "/scholarship-applications",
            meta: {
              label: "Scholarship Applications",
            },
          },
          {
            name: "pending-scholarships",
            list: "/pending-scholarships",
            meta: {
              label: "Pending Scholarships",
            },
          },
          {
            name: "suspicious-documents",
            list: "/suspicious-documents",
            meta: {
              label: "Suspicious Documents",
            },
          },
          {
            name: "audit-logs",
            list: "/audit-logs",
            meta: {
              label: "Audit Logs",
            },
          },
          {
            name: "admin-documents",
            list: "/admin-documents",
            meta: {
              label: "Documents",
            },
          },
        ]}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
        }}
      >
        <Routes>
          <Route
            element={
              <Authenticated
                key="authenticated-inner"
                fallback={<CatchAllNavigate to="/login" />}
              >
                <Layout>
                  <Outlet />
                </Layout>
              </Authenticated>
            }
          >
            <Route index element={<NavigateToResource resource="dashboard" />} />
            
            <Route path="/dashboard">
              <Route index element={<DashboardPage />} />
            </Route>

            <Route path="/users">
              <Route index element={<UserList />} />
            </Route>

            <Route path="/jobs">
              <Route index element={<JobList />} />
              <Route path="create" element={<JobCreate />} />
              <Route path="edit/:id" element={<JobEdit />} />
            </Route>

            <Route path="/scholarships">
              <Route index element={<ScholarshipList />} />
              <Route path="create" element={<ScholarshipCreate />} />
              <Route path="edit/:id" element={<ScholarshipEdit />} />
            </Route>

            <Route path="/job-applications">
              <Route index element={<JobApplicationList />} />
            </Route>

            <Route path="/scholarship-applications">
              <Route index element={<ScholarshipApplicationList />} />
            </Route>

            <Route path="/pending-scholarships">
              <Route index element={<PendingScholarshipList />} />
            </Route>

            <Route path="/suspicious-documents">
              <Route index element={<SuspiciousDocumentList />} />
            </Route>

            <Route path="/audit-logs">
              <Route index element={<AuditLogList />} />
            </Route>

            <Route path="/admin-documents">
              <Route index element={<AdminDocumentList />} />
            </Route>

            <Route path="*" element={<CatchAllNavigate to="/dashboard" />} />
          </Route>

          <Route
            element={
              <Authenticated
                key="authenticated-outer"
                fallback={<Outlet />}
              >
                <NavigateToResource />
              </Authenticated>
            }
          >
            <Route path="/login" element={<Login />} />
          </Route>
        </Routes>
      </Refine>
    </BrowserRouter>
  );
}

export default App;
