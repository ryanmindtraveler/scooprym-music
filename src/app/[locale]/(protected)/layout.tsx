import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { PropsWithChildren } from 'react';

/**
 * inspired by dashboard-01
 * https://ui.shadcn.com/blocks
 */
export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
      className="bg-neutral-50/50 dark:bg-neutral-950/50 relative overflow-hidden"
    >
      {/* === Atmospheric Background (Fixed & Enhanced) === */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/15 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/15 blur-[120px]" />
        <div className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <DashboardSidebar
        variant="floating"
        className="fixed inset-y-2 md:inset-y-4 left-2 md:left-4 z-50 h-auto! bg-transparent rounded-[32px] overflow-hidden border border-white/20 dark:border-white/5 shadow-2xl"
      />

      {/* Floating Main Content with Rounded Corners */}
      <SidebarInset className="bg-transparent peer-data-[variant=inset]:bg-transparent relative z-10 m-2 md:m-4 rounded-[32px] overflow-hidden border border-white/20 dark:border-white/5 shadow-2xl h-[calc(100svh-2rem)] no-scrollbar md:ml-6 transition-[margin-left] duration-200 ease-linear">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
