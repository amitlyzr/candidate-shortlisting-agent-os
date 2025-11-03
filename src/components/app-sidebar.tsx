"use client"

import * as React from "react"
import {
  IconCamera,
  IconFileAi,
  IconFileDescription,
  IconHelp,
  IconSettings,
  IconUserCheck,
  IconFileText,
  IconUsersGroup,
  IconCalendar,
  IconHistory,
  IconCurrencyDollar,
  IconBrandGithub
} from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "./providers/AuthProvider"
import { Button } from "./ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { useNextStep } from "nextstepjs"
import { Separator } from "./ui/separator"

const data = {
  user: {
    name: "HR Manager",
    email: "hr@lyzr.ai",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Shortlist Candidates",
      url: "/",
      icon: IconUserCheck,
      id: "nav-shortlist",
    },
    {
      title: "JD Library",
      url: "/jd-library",
      icon: IconFileText,
      id: "nav-jd-library",
    },
    {
      title: "Candidate Database",
      url: "/candidate-database",
      icon: IconUsersGroup,
      id: "nav-candidate-database",
    },
    {
      title: "Previous Sessions",
      url: "/sessions",
      icon: IconHistory,
      id: "nav-sessions",
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { email, credits } = useAuth();
  const { startNextStep } = useNextStep();

  const handleStartTour = () => {
    startNextStep("sidebarTour");
  };

  const navSec = [
    {
      title: "Book a Demo",
      url: "https://www.lyzr.ai/book-demo/",
      icon: IconCalendar,
      external: true,
    },
    {
      title: "Github",
      url: "https://github.com/amitlyzr/candidate-shortlisting-agent-os",
      icon: IconBrandGithub,
      external: true,
    },
    {
      title: "Feature Requests",
      url: "https://www.lyzr.ai/book-demo/",
      icon: IconSettings,
      external: true,
    },
    {
      title: `Credits: ${credits}`,
      url: "#",
      icon: IconCurrencyDollar,
    },
  ]

  const user = {
    email: email || "hr@test.ai",
    avatar: "/avatars/shadcn.jpg",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 my-4"
            >
              <Link href="/" className="flex items-center gap-3 py-3">
                <Image
                  src="/lyzr-logo.png"
                  alt="Lyzr Logo"
                  width={48}
                  height={24}
                  className="h-6 w-auto flex-shrink-0"
                />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">HR Candidate</span>
                  <span className="text-sm font-semibold">Shortlisting Agent</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <Separator className="my-2" />
          <SidebarMenuItem className="mt-2">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm">Navigations</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost"
                      size="sm"
                      className="h-auto p-1"
                      onClick={handleStartTour}
                      id="sidebar-tour-trigger"
                    >
                      <IconHelp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Learn how to use the application</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={navSec} className="mt-auto" />
      </SidebarContent>
      <Separator className="my-2" />
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
