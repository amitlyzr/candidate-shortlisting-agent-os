"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { NextStepViewport } from "nextstepjs"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <NextStepViewport id="main-content-viewport">
          <div className="flex flex-1 flex-col gap-4 px-4 pt-6 pb-4">
            {children}
          </div>
        </NextStepViewport>
      </SidebarInset>
    </SidebarProvider>
  )
}
