import React from "react";
import { useMenu, useLogout, useGetIdentity } from "@refinedev/core";
import { NavLink, Outlet } from "react-router-dom";
import { Users, LogOut, LayoutDashboard, Briefcase, GraduationCap, FileText, FileSearch, ShieldAlert, Hourglass, ClipboardList, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoFull from "@/assets/logo-full.png";

export const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { menuItems } = useMenu();
  const { mutate: logout } = useLogout();
  const { data: identity } = useGetIdentity<{ name: string }>();

  const iconMap: Record<string, React.ReactNode> = {
    dashboard: <LayoutDashboard size={20} />,
    users: <Users size={20} />,
    jobs: <Briefcase size={20} />,
    scholarships: <GraduationCap size={20} />,
    "job-applications": <FileText size={20} />,
    "scholarship-applications": <FileSearch size={20} />,
    "pending-scholarships": <Hourglass size={20} />,
    "suspicious-documents": <ShieldAlert size={20} />,
    "audit-logs": <ClipboardList size={20} />,
    "admin-documents": <FolderOpen size={20} />,
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card flex flex-col shadow-sm">
        <div className="p-6 border-b flex items-center justify-center">
          <div className="flex flex-col items-center">
            <img src={logoFull} alt="ScholarLink" className="h-8 object-contain mb-2" />
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
              Admin Portal
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.route ?? "/"}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`
              }
            >
              {iconMap[item.name.toLowerCase()] || <LayoutDashboard size={20} />}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t">
          {identity && (
            <div className="mb-4 px-2">
              <p className="text-sm font-medium">Logged in as</p>
              <p className="text-xs text-muted-foreground truncate">{identity.name}</p>
            </div>
          )}
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-8">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
};
