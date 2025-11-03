"use client"

import * as React from "react"
import { IconUpload, IconTrash, IconEdit, IconEye } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconDots } from "@tabler/icons-react"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-fetch"
import { ScrollArea } from "@/components/ui/scroll-area"

interface JobDescription {
  id: string
  title: string
  department: string
  location: string
  type: string
  status: string
  fileName: string
  fileType: string
  rawContent: string
  parsedContent: string
  createdAt: string
}

export default function JDLibraryPage() {
  const [jds, setJDs] = React.useState<JobDescription[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isUploading, setIsUploading] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [jdText, setJDText] = React.useState("")
  const [uploadMethod, setUploadMethod] = React.useState<"file" | "text">("file")
  const [viewingJD, setViewingJD] = React.useState<JobDescription | null>(null)
  const [editingJD, setEditingJD] = React.useState<JobDescription | null>(null)
  const [formData, setFormData] = React.useState({
    title: "",
    department: "",
    location: "",
    type: "Full-time",
  })
  const [editForm, setEditForm] = React.useState({
    title: "",
    department: "",
    location: "",
    type: "",
    content: "",
  })

  React.useEffect(() => {
    fetchJDs()
  }, [])

  const fetchJDs = async () => {
    try {
      const response = await authFetch("/api/job-descriptions")
      if (!response.ok) throw new Error("Failed to fetch job descriptions")
      const data = await response.json()
      setJDs(data)
    } catch (error) {
      console.error("Error fetching JDs:", error)
      toast.error("Failed to load job descriptions")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const fileType = file.name.split(".").pop()?.toLowerCase()
      if (!["pdf", "docx", "txt"].includes(fileType || "")) {
        toast.error("Only PDF, DOCX, and TXT files are supported")
        return
      }
      setSelectedFile(file)
      if (!formData.title) {
        setFormData((prev) => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }))
      }
    }
  }

  const handleUpload = async () => {
    if (uploadMethod === "file" && !selectedFile) {
      toast.error("Please select a file")
      return
    }

    if (uploadMethod === "text" && !jdText.trim()) {
      toast.error("Please enter job description text")
      return
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a job title")
      return
    }

    setIsUploading(true)
    const formDataToSend = new FormData()

    if (uploadMethod === "file" && selectedFile) {
      formDataToSend.append("file", selectedFile)
    } else if (uploadMethod === "text") {
      const textBlob = new Blob([jdText], { type: "text/plain" })
      const textFile = new File([textBlob], `${formData.title}.txt`, { type: "text/plain" })
      formDataToSend.append("file", textFile)
    }

    formDataToSend.append("title", formData.title)
    formDataToSend.append("department", formData.department)
    formDataToSend.append("location", formData.location)
    formDataToSend.append("type", formData.type)

    try {
      const response = await authFetch("/api/job-descriptions", {
        method: "POST",
        body: formDataToSend,
      })

      if (!response.ok) throw new Error("Upload failed")

      toast.success("Job description uploaded successfully")
      setIsDialogOpen(false)
      setSelectedFile(null)
      setJDText("")
      setFormData({ title: "", department: "", location: "", type: "Full-time" })
      fetchJDs()
    } catch (error) {
      console.error("Error uploading JD:", error)
      toast.error("Failed to upload job description")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job description?")) return

    try {
      const response = await authFetch(`/api/job-descriptions?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Delete failed")

      toast.success("Job description deleted")
      fetchJDs()
    } catch (error) {
      console.error("Error deleting JD:", error)
      toast.error("Failed to delete job description")
    }
  }

  const handleView = (jd: JobDescription) => {
    setViewingJD(jd)
    setIsViewDialogOpen(true)
  }

  const handleEdit = (jd: JobDescription) => {
    setEditingJD(jd)
    setEditForm({
      title: jd.title,
      department: jd.department,
      location: jd.location,
      type: jd.type,
      content: jd.rawContent || jd.parsedContent || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingJD) return

    try {
      const response = await authFetch(`/api/job-descriptions?id=${editingJD.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) throw new Error("Update failed")

      toast.success("Job description updated successfully")
      setIsEditDialogOpen(false)
      setEditingJD(null)
      fetchJDs()
    } catch (error) {
      console.error("Error updating JD:", error)
      toast.error("Failed to update job description")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Job Description Library
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage and organize your job descriptions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconUpload className="mr-2 h-4 w-4" />
              Upload JD
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Job Description</DialogTitle>
              <DialogDescription>
                Upload a file or paste the job description text directly
              </DialogDescription>
            </DialogHeader>
            <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as "file" | "text")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">Upload File</TabsTrigger>
                <TabsTrigger value="text">Paste Text</TabsTrigger>
              </TabsList>
              <TabsContent value="file" className="space-y-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="file">File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="text" className="space-y-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="jdText">Job Description Text</Label>
                  <Textarea
                    id="jdText"
                    value={jdText}
                    onChange={(e) => setJDText(e.target.value)}
                    placeholder="Paste the job description here..."
                    className="h-[250px] resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {jdText.length} characters
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            <div className="grid gap-4 pt-2">
              <div className="grid gap-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Engineering"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Employment Type</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g., Full-time"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleUpload}
                disabled={
                  (uploadMethod === "file" && !selectedFile) ||
                  (uploadMethod === "text" && !jdText.trim()) ||
                  !formData.title.trim() ||
                  isUploading
                }
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Descriptions</CardTitle>
          <CardDescription>
            {jds.length} job description{jds.length !== 1 ? 's' : ''} in your library
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : jds.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No job descriptions yet. Upload your first JD to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jds.map((jd) => (
                  <TableRow key={jd.id}>
                    <TableCell className="font-medium">{jd.title}</TableCell>
                    <TableCell>{jd.department}</TableCell>
                    <TableCell>{jd.location}</TableCell>
                    <TableCell>{jd.type}</TableCell>
                    <TableCell>
                      {new Date(jd.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={jd.status === "active" ? "default" : "secondary"}
                      >
                        {jd.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <IconDots className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(jd)}>
                            <IconEye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(jd)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(jd.id)}
                          >
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="!max-w-[60vw] w-[60vw] h-[70vh] flex flex-col p-8">
          <DialogHeader>
            <DialogTitle>{viewingJD?.title}</DialogTitle>
            <DialogDescription>
              {viewingJD?.fileName} ({viewingJD?.fileType.toUpperCase()}) • {viewingJD?.department} • {viewingJD?.location}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[55vh] w-full rounded-md border p-4">
            <div className="whitespace-pre-wrap font-mono text-sm">
              {viewingJD?.rawContent || viewingJD?.parsedContent || "No content available"}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="!max-w-[60vw] w-[60vw] h-[85vh] flex flex-col p-8">
          <DialogHeader>
            <DialogTitle>Edit Job Description</DialogTitle>
            <DialogDescription>
              Update job description information and content
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Job Title *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-department">Department</Label>
                <Input
                  id="edit-department"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  placeholder="e.g., Engineering"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-type">Employment Type</Label>
              <Input
                id="edit-type"
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                placeholder="e.g., Full-time"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-content">Job Description Content</Label>
              <Textarea
                id="edit-content"
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                placeholder="Edit the job description content..."
                className="h-[320px] font-mono text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {editForm.content.length} characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
