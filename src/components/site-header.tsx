"use client"

import * as React from "react"
// import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { toast } from "sonner"
// import { IconBulb } from "@tabler/icons-react"
// import Image from "next/image"

export function SiteHeader() {
  // const [open, setOpen] = React.useState(false)
  // const [title, setTitle] = React.useState("")
  // const [description, setDescription] = React.useState("")

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault()
  //   toast.success("Feature request submitted! Thank you for your feedback.")
  //   setTitle("")
  //   setDescription("")
  //   setOpen(false)
  // }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Candidate Shortlisting</h1>
        {/* <div className="ml-auto flex items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
                <IconBulb className="h-4 w-4" />
                Feature Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit a Feature Request</DialogTitle>
                <DialogDescription>
                  Tell us what feature you&apos;d like to see in the app.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="feature-title">Title</Label>
                  <Input
                    id="feature-title"
                    placeholder="e.g., Add export to PDF"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feature-description">Description</Label>
                  <Textarea
                    id="feature-description"
                    placeholder="Describe the feature you&apos;d like to see..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Submit Request
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div> */}
      </div>
    </header>
  )
}
