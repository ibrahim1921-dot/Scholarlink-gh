import React, { useState } from "react";
import { useForm } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft } from "lucide-react";

export const ScholarshipCreate: React.FC = () => {
  const navigate = useNavigate();
  const { onFinish, mutationResult } = useForm({
    action: "create",
    resource: "scholarships",
    redirect: "list",
  });

  const [formData, setFormData] = useState({
    name: "",
    provider: "",
    category: "UNDERGRADUATE_GHANA",
    destinationCountry: "",
    eligibleFields: "",
    gpaRequirement: "",
    fundingCoverage: "",
    deadline: "",
    officialLink: "",
    requirements: "",
    selectionCriteria: "",
    additionalNotes: "",
    imageUrl: "",
    status: "OPEN",
    allowsAssistedApplication: false,
    assistedApplicationFee: "",
    sponsored: false,
    sponsorName: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFinish({
      ...formData,
      gpaRequirement: formData.gpaRequirement ? parseFloat(formData.gpaRequirement) : null,
      assistedApplicationFee: formData.assistedApplicationFee ? parseFloat(formData.assistedApplicationFee) : null,
      deadline: formData.deadline ? formData.deadline : null,
    });
  };

  return (
    <Card className="shadow-sm max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader className="flex flex-row items-center justify-between pb-6 border-b">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/scholarships")} type="button">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-2xl text-primary font-bold">Create Scholarship</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Scholarship Name <span className="text-destructive">*</span></Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider <span className="text-destructive">*</span></Label>
              <Input id="provider" name="provider" value={formData.provider} onChange={handleChange} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
              <select
                id="category"
                name="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="UNDERGRADUATE_GHANA">Undergraduate (Ghana)</option>
                <option value="UNDERGRADUATE_INTERNATIONAL">Undergraduate (International)</option>
                <option value="POSTGRADUATE_GHANA">Postgraduate (Ghana)</option>
                <option value="POSTGRADUATE_INTERNATIONAL">Postgraduate (International)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status <span className="text-destructive">*</span></Label>
              <select
                id="status"
                name="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="OPEN">Open</option>
                <option value="CLOSING_SOON">Closing Soon</option>
                <option value="CLOSED">Closed</option>
                <option value="FULL">Full</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="destinationCountry">Destination Country</Label>
              <Input id="destinationCountry" name="destinationCountry" value={formData.destinationCountry} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fundingCoverage">Funding Coverage</Label>
              <Input id="fundingCoverage" name="fundingCoverage" value={formData.fundingCoverage} onChange={handleChange} placeholder="e.g. Full Tuition, $5000" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="eligibleFields">Eligible Fields (comma separated)</Label>
              <Input id="eligibleFields" name="eligibleFields" value={formData.eligibleFields} onChange={handleChange} placeholder="e.g. Engineering, Medicine" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpaRequirement">Minimum GPA</Label>
              <Input id="gpaRequirement" name="gpaRequirement" type="number" step="0.1" max="4.0" min="0.0" value={formData.gpaRequirement} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="officialLink">Official Link</Label>
              <Input id="officialLink" name="officialLink" type="url" value={formData.officialLink} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input id="imageUrl" name="imageUrl" type="url" title="Must be a valid HTTP(S) URL" value={formData.imageUrl} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" name="deadline" type="date" value={formData.deadline} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea id="requirements" name="requirements" value={formData.requirements} onChange={handleChange} rows={4} placeholder="Detailed requirements..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="selectionCriteria">Selection Criteria</Label>
            <Textarea id="selectionCriteria" name="selectionCriteria" value={formData.selectionCriteria} onChange={handleChange} rows={3} />
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
        </CardContent>
        <CardFooter className="flex justify-end gap-4 border-t pt-6 pb-6">
          <Button variant="outline" type="button" onClick={() => navigate("/scholarships")}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutationResult.isLoading}>
            {mutationResult.isLoading ? "Creating..." : "Create Scholarship"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
