import React, { useState, useEffect } from "react";
import { useForm } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Plus, X } from "lucide-react";

export const JobEdit: React.FC = () => {
  const navigate = useNavigate();
  const { onFinish, mutationResult, queryResult } = useForm({
    action: "edit",
    resource: "jobs",
    redirect: "list",
  });

  const jobData = queryResult?.data?.data;
  const isLoading = queryResult?.isLoading;

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    location: "",
    fieldOfStudy: "",
    requiredEducationLevel: "",
    minimumGpa: "",
    salaryRange: "",
    applicationUrl: "",
    imageUrl: "",
    applicationDeadline: "",
    employmentType: "FULL_TIME",
    experienceLevel: "ENTRY_LEVEL",
    workMode: "ON_SITE",
    allowsAssistedApplication: true,
    assistedApplicationFee: "",
    sponsored: false,
    sponsorName: "",
  });

  const [requirements, setRequirements] = useState<string[]>([]);
  const [newReq, setNewReq] = useState("");

  useEffect(() => {
    if (jobData) {
      setFormData({
        title: jobData.title || "",
        company: jobData.company || "",
        description: jobData.description || "",
        location: jobData.location || "",
        fieldOfStudy: jobData.fieldOfStudy || "",
        requiredEducationLevel: jobData.requiredEducationLevel || "",
        minimumGpa: jobData.minimumGpa !== null ? String(jobData.minimumGpa) : "",
        salaryRange: jobData.salaryRange || "",
        applicationUrl: jobData.applicationUrl || "",
        imageUrl: jobData.imageUrl || "",
        applicationDeadline: jobData.applicationDeadline ? new Date(jobData.applicationDeadline).toISOString().slice(0, 16) : "",
        employmentType: jobData.employmentType || "FULL_TIME",
        experienceLevel: jobData.experienceLevel || "ENTRY_LEVEL",
        workMode: jobData.workMode || "ON_SITE",
        allowsAssistedApplication: jobData.allowsAssistedApplication ?? true,
        assistedApplicationFee: jobData.assistedApplicationFee !== null ? String(jobData.assistedApplicationFee) : "",
        sponsored: jobData.sponsored || false,
        sponsorName: jobData.sponsorName || "",
      });
      setRequirements(jobData.requirements || []);
    }
  }, [jobData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addRequirement = () => {
    if (newReq.trim() && !requirements.includes(newReq.trim())) {
      setRequirements([...requirements, newReq.trim()]);
      setNewReq("");
    }
  };

  const removeRequirement = (req: string) => {
    setRequirements(requirements.filter((r) => r !== req));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFinish({
      ...formData,
      minimumGpa: formData.minimumGpa ? parseFloat(formData.minimumGpa) : null,
      assistedApplicationFee: formData.assistedApplicationFee ? parseFloat(formData.assistedApplicationFee) : null,
      requirements,
      applicationDeadline: formData.applicationDeadline ? new Date(formData.applicationDeadline).toISOString() : null,
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading job details...</div>;
  }

  return (
    <Card className="shadow-sm max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader className="flex flex-row items-center justify-between pb-6 border-b">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")} type="button">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-2xl text-primary font-bold">Edit Job Listing</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title <span className="text-destructive">*</span></Label>
              <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company <span className="text-destructive">*</span></Label>
              <Input id="company" name="company" value={formData.company} onChange={handleChange} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" value={formData.location} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryRange">Salary Range</Label>
              <Input id="salaryRange" name="salaryRange" value={formData.salaryRange} onChange={handleChange} placeholder="e.g. $50,000 - $70,000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumGpa">Minimum GPA</Label>
              <Input id="minimumGpa" name="minimumGpa" type="number" step="0.1" max="4.0" min="0.0" value={formData.minimumGpa} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type <span className="text-destructive">*</span></Label>
              <select
                id="employmentType"
                name="employmentType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.employmentType}
                onChange={handleChange}
                required
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="FREELANCE">Freelance</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Experience Level <span className="text-destructive">*</span></Label>
              <select
                id="experienceLevel"
                name="experienceLevel"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.experienceLevel}
                onChange={handleChange}
                required
              >
                <option value="ENTRY_LEVEL">Entry Level</option>
                <option value="MID_LEVEL">Mid Level</option>
                <option value="SENIOR_LEVEL">Senior Level</option>
                <option value="EXECUTIVE">Executive</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workMode">Work Mode <span className="text-destructive">*</span></Label>
              <select
                id="workMode"
                name="workMode"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.workMode}
                onChange={handleChange}
                required
              >
                <option value="ON_SITE">On Site</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fieldOfStudy">Field of Study</Label>
              <Input id="fieldOfStudy" name="fieldOfStudy" value={formData.fieldOfStudy} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requiredEducationLevel">Education Level</Label>
              <Input id="requiredEducationLevel" name="requiredEducationLevel" value={formData.requiredEducationLevel} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="applicationUrl">Application URL</Label>
              <Input id="applicationUrl" name="applicationUrl" type="url" value={formData.applicationUrl} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input id="imageUrl" name="imageUrl" type="url" pattern="^(https?://[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+)?$" title="Must be a valid HTTP(S) URL" value={formData.imageUrl} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="applicationDeadline">Application Deadline</Label>
              <Input id="applicationDeadline" name="applicationDeadline" type="datetime-local" value={formData.applicationDeadline} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-primary">Assisted Application & Sponsorship</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowsAssistedApplication"
                    name="allowsAssistedApplication"
                    checked={formData.allowsAssistedApplication}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <Label htmlFor="allowsAssistedApplication">Allows Assisted Application</Label>
                </div>
                {formData.allowsAssistedApplication && !formData.sponsored && (
                  <div className="space-y-2">
                    <Label htmlFor="assistedApplicationFee">Assisted Application Fee (₵)</Label>
                    <Input
                      id="assistedApplicationFee"
                      name="assistedApplicationFee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.assistedApplicationFee}
                      onChange={handleChange}
                      className="max-w-xs"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sponsored"
                    name="sponsored"
                    checked={formData.sponsored}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <Label htmlFor="sponsored">Sponsored (Free to Apply)</Label>
                </div>
                {formData.sponsored && (
                  <div className="space-y-2">
                    <Label htmlFor="sponsorName">Sponsor Name</Label>
                    <Input
                      id="sponsorName"
                      name="sponsorName"
                      value={formData.sponsorName}
                      onChange={handleChange}
                      className="max-w-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t pt-6 mt-6">
            <Label>Requirements (List)</Label>
            <div className="flex gap-2">
              <Input
                value={newReq}
                onChange={(e) => setNewReq(e.target.value)}
                placeholder="e.g. 3+ years of React experience"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRequirement();
                  }
                }}
              />
              <Button type="button" onClick={addRequirement} variant="secondary">
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
            {requirements.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {requirements.map((req, idx) => (
                  <div key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-primary/20">
                    {req}
                    <button type="button" onClick={() => removeRequirement(req)} className="text-primary hover:text-destructive transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-4 border-t pt-6 pb-6">
          <Button variant="outline" type="button" onClick={() => navigate("/jobs")}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutationResult.isLoading}>
            {mutationResult.isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
