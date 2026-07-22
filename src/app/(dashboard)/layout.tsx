import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { isDemoMode } from "@/lib/queries";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const demo = isDemoMode();
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <p className="text-sm text-muted-foreground">
            Your morning AI-industry brief, gathered by a managed agent.
          </p>
          {demo && (
            <span className="ml-auto rounded-full border border-dashed border-primary/50 px-3 py-1 text-xs text-primary">
              Demo data — connect Supabase to go live
            </span>
          )}
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
