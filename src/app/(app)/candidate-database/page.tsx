"use client"

import * as React from "react"
import { IconUpload, IconTrash, IconEye, IconEdit } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { jsPDF } from "jspdf"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { authFetch } from "@/lib/auth-fetch"

interface Candidate {
  id: string
  name: string
  email: string | null
  phone: string | null
  currentRole: string
  currentCompany: string
  location: string
  experience: string
  groupName: string
  fileName: string
  fileType: string
  rawContent: string
  parsedContent: string
  createdAt: string
}

export default function CandidateDatabasePage() {
  const [candidates, setCandidates] = React.useState<Candidate[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isUploading, setIsUploading] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false)
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([])
  const [resumeText, setResumeText] = React.useState("")
  const [uploadMethod, setUploadMethod] = React.useState<"file" | "text">("file")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [groupName, setGroupName] = React.useState("Not Specified")
  const [editingCandidate, setEditingCandidate] = React.useState<Candidate | null>(null)
  const [viewingCandidate, setViewingCandidate] = React.useState<Candidate | null>(null)
  const [editForm, setEditForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    currentRole: "",
    currentCompany: "",
    location: "",
    experience: "",
    groupName: "",
  })

  React.useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    try {
      const response = await authFetch("/api/candidates")
      if (!response.ok) throw new Error("Failed to fetch candidates")
      const data = await response.json()
      setCandidates(data)
    } catch (error) {
      console.error("Error fetching candidates:", error)
      toast.error("Failed to load candidates")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => {
      const fileType = file.name.split(".").pop()?.toLowerCase()
      return ["pdf", "docx", "doc"].includes(fileType || "")
    })

    if (validFiles.length !== files.length) {
      toast.error("Some files were skipped. Only PDF, DOC, and DOCX files are supported")
    }

    setSelectedFiles(validFiles)
  }

  const handleUpload = async () => {
    if (uploadMethod === "file" && selectedFiles.length === 0) {
      toast.error("Please select at least one file")
      return
    }

    if (uploadMethod === "text" && !resumeText.trim()) {
      toast.error("Please paste resume text")
      return
    }

    setIsUploading(true)
    const formData = new FormData()

    // Add group name to form data
    formData.append("groupName", groupName)

    if (uploadMethod === "file") {
      selectedFiles.forEach((file) => {
        formData.append("files", file)
      })
    } else if (uploadMethod === "text") {
      // Convert text to PDF since Lyzr API doesn't support .txt files
      try {
        const pdf = new jsPDF()

        // Split text into lines and add to PDF with wrapping
        const lines = pdf.splitTextToSize(resumeText, 180) // 180mm width for wrapping
        pdf.setFontSize(10)
        pdf.text(lines, 15, 15) // Start at 15mm from left and top

        // Convert PDF to Blob
        const pdfBlob = pdf.output('blob')
        const pdfFile = new File([pdfBlob], "Resume.pdf", { type: "application/pdf" })
        formData.append("files", pdfFile)
      } catch (error) {
        console.error("Error converting text to PDF:", error)
        toast.error("Failed to convert text to PDF")
        setIsUploading(false)
        return
      }
    }

    try {
      const response = await authFetch("/api/candidates", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const result = await response.json()
      toast.success(`${result.uploaded} resume${result.uploaded !== 1 ? 's' : ''} uploaded successfully`)
      setIsDialogOpen(false)
      setSelectedFiles([])
      setResumeText("")
      setGroupName("Not Specified") // Reset to default
      fetchCandidates()
    } catch (error) {
      console.error("Error uploading resumes:", error)
      toast.error("Failed to upload resumes")
    } finally {
      setIsUploading(false)
    }
  }

  const handleEdit = (candidate: Candidate) => {
    setEditingCandidate(candidate)
    setEditForm({
      name: candidate.name,
      email: candidate.email || "",
      phone: candidate.phone || "",
      currentRole: candidate.currentRole,
      currentCompany: candidate.currentCompany,
      location: candidate.location,
      experience: candidate.experience,
      groupName: candidate.groupName,
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingCandidate) return

    try {
      const response = await authFetch(`/api/candidates?id=${editingCandidate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) throw new Error("Update failed")

      toast.success("Candidate updated successfully")
      setIsEditDialogOpen(false)
      setEditingCandidate(null)
      fetchCandidates()
    } catch (error) {
      console.error("Error updating candidate:", error)
      toast.error("Failed to update candidate")
    }
  }

  const handleView = (candidate: Candidate) => {
    setViewingCandidate(candidate)
    setIsViewDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this candidate?")) return

    try {
      const response = await authFetch(`/api/candidates?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Delete failed")

      toast.success("Candidate deleted")
      fetchCandidates()
    } catch (error) {
      console.error("Error deleting candidate:", error)
      toast.error("Failed to delete candidate")
    }
  }

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.currentRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.currentCompany.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Candidate Database
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage and organize candidate profiles
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconUpload className="mr-2 h-4 w-4" />
              Upload Resumes
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Candidate Resumes</DialogTitle>
              <DialogDescription>
                Upload resume files or paste resume text. Information will be extracted automatically.
              </DialogDescription>
            </DialogHeader>

            {/* Group Name Input */}
            <div className="grid gap-2 pt-4">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Candidates will be organized under this group name for easier management.
              </p>
            </div>

            <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as "file" | "text")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">Upload Files</TabsTrigger>
                <TabsTrigger value="text">Paste Text</TabsTrigger>
              </TabsList>
              <TabsContent value="file" className="space-y-4">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="files">Resume Files</Label>
                    <Input
                      id="files"
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported formats: PDF, DOC, DOCX.
                    </p>
                    {selectedFiles.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium">Selected files: {selectedFiles.length}</p>
                        <ul className="list-disc list-inside mt-1">
                          {selectedFiles.slice(0, 5).map((file, index) => (
                            <li key={index}>{file.name}</li>
                          ))}
                          {selectedFiles.length > 5 && (
                            <li>...and {selectedFiles.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="text" className="space-y-4">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="resume-text">Resume Text</Label>
                    <Textarea
                      id="resume-text"
                      placeholder="Paste the resume content here..."
                      className="min-h-[250px] h-[250px] font-mono text-sm resize-none"
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste the complete resume text. It will be converted to PDF and uploaded automatically.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button
                onClick={handleUpload}
                disabled={
                  (uploadMethod === "file" && selectedFiles.length === 0) ||
                  (uploadMethod === "text" && !resumeText.trim()) ||
                  isUploading
                }
              >
                {isUploading
                  ? "Processing..."
                  : uploadMethod === "file"
                    ? `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`
                    : "Upload Resume"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Candidates</CardTitle>
              <CardDescription>
                {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''} in your database
              </CardDescription>
            </div>
            <div className="w-64">
              <Input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : filteredCandidates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery
                ? "No candidates match your search."
                : "No candidates yet. Upload resumes to get started."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Resume</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{candidate.name}</span>
                        {candidate.email && (
                          <span className="text-xs text-muted-foreground">
                            {candidate.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{candidate.currentRole}</TableCell>
                    <TableCell>{candidate.currentCompany}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {candidate.groupName || "CDO - Chief Delivery Officer Group"}
                      </Badge>
                    </TableCell>
                    <TableCell>{candidate.location}</TableCell>
                    <TableCell>{candidate.experience}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {candidate.fileType.toUpperCase()}
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
                          <DropdownMenuItem onClick={() => handleView(candidate)}>
                            <IconEye className="mr-2 h-4 w-4" />
                            View Resume
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(candidate)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(candidate.id)}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="!max-w-[60vw] w-[60vw] h-[60vh] flex flex-col p-8">
          <DialogHeader>
            <DialogTitle>Edit Candidate Profile</DialogTitle>
            <DialogDescription>
              Update candidate information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Current Role</Label>
                <Input
                  id="edit-role"
                  value={editForm.currentRole}
                  onChange={(e) => setEditForm({ ...editForm, currentRole: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-company">Current Company</Label>
                <Input
                  id="edit-company"
                  value={editForm.currentCompany}
                  onChange={(e) => setEditForm({ ...editForm, currentCompany: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-experience">Years of Experience</Label>
              <Input
                id="edit-experience"
                value={editForm.experience}
                onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-group">Group Name</Label>
              <Input
                id="edit-group"
                value={editForm.groupName}
                onChange={(e) => setEditForm({ ...editForm, groupName: e.target.value })}
                placeholder="Enter group name"
              />
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

      {/* View Resume Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="!max-w-[60vw] w-[60vw] h-[70vh] flex flex-col p-8">
          <DialogHeader>
            <DialogTitle>Resume - {viewingCandidate?.name}</DialogTitle>
            <DialogDescription>
              {viewingCandidate?.fileName} ({viewingCandidate?.fileType.toUpperCase()})
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
            <div className="whitespace-pre-wrap font-mono text-sm">
              {viewingCandidate?.rawContent || "No content available"}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
