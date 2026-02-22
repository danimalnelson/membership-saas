"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AvatarEditor from "react-avatar-editor";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  LongFormInput,
  MenuContainer,
  Menu,
  MenuButton,
  MenuItem,
} from "@wine-club/ui";
import { CloudUpload, MagnifyingGlassPlus, MagnifyingGlassMinus } from "geist-icons";
import { Cross } from "@/components/icons/Cross";
import { useBusinessContext } from "@/contexts/business-context";
import { useRequirePermission } from "@/hooks/use-require-permission";

export default function SettingsPage() {
  const { businessId } = useBusinessContext();
  const { allowed } = useRequirePermission("settings.general");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop modal state
  const editorRef = useRef<AvatarEditor | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    logoUrl: "",
    description: "",
    website: "",
    contactEmail: "",
    contactPhone: "",
    timeZone: "America/New_York",
  });
  const timezoneOptions = [
    { value: "America/New_York", label: "Eastern (New York)" },
    { value: "America/Chicago", label: "Central (Chicago)" },
    { value: "America/Denver", label: "Mountain (Denver)" },
    { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
    { value: "America/Anchorage", label: "Alaska (Anchorage)" },
    { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
    { value: "Europe/London", label: "London (GMT)" },
    { value: "Europe/Paris", label: "Paris (CET)" },
    { value: "Europe/Berlin", label: "Berlin (CET)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Asia/Shanghai", label: "Shanghai (CST)" },
    { value: "Australia/Sydney", label: "Sydney (AEST)" },
  ] as const;
  const selectedTimezoneLabel =
    timezoneOptions.find((option) => option.value === formData.timeZone)?.label ??
    "Select timezone";

  // Step 1: File selected -> open crop modal
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED_TYPES = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif",
    ];
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Accepted formats: PNG, JPEG, WebP, GIF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must be under 5MB");
      return;
    }

    setUploadError("");
    setCropFile(file);
    setZoom(1);

    // Reset so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Step 2: Crop confirmed -> export from editor canvas -> upload
  const handleCropConfirm = async () => {
    if (!editorRef.current) return;

    // Get the cropped square canvas directly from the editor
    const canvas = editorRef.current.getImageScaledToCanvas();
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))),
        "image/png"
      );
    });

    setUploading(true);
    setCropFile(null);

    try {
      const body = new FormData();
      body.append("file", blob, "logo.png");
      body.append("businessId", businessId);
      if (formData.logoUrl) {
        body.append("oldUrl", formData.logoUrl);
      }

      const res = await fetch("/api/upload", { method: "POST", body });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const { url } = await res.json();
      setFormData((prev) => ({ ...prev, logoUrl: url }));
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const cancelCrop = () => {
    setCropFile(null);
  };

  const removeLogo = () => {
    setFormData((prev) => ({ ...prev, logoUrl: "" }));
    setUploadError("");
  };

  useEffect(() => {
    const fetchBusiness = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/business/${businessId}`);
        if (!res.ok) throw new Error("Failed to fetch business");
        const data = await res.json();

        setFormData({
          name: data.name || "",
          logoUrl: data.logoUrl || "",
          description: data.description || "",
          website: data.website || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          timeZone: data.timeZone || "America/New_York",
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/business/${businessId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess(true);
      router.refresh(); // Re-fetch server data so sidebar logo updates
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!allowed) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>
              Manage your business information and branding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Business Name */}
            <Input
              id="name"
              type="text"
              label="Business Name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Logo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleFileSelect}
              />

              {formData.logoUrl ? (
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <img
                      src={formData.logoUrl}
                      alt="Logo preview"
                      className="h-20 w-20 rounded-lg object-cover border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 group-hover:bg-black/40 transition-colors cursor-pointer"
                    >
                      <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Change
                      </span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="inline-flex items-center gap-1 text-xs text-gray-800 hover:text-gray-950 transition-colors"
                  >
                    <Cross size={12} className="h-3 w-3" />
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 w-20 h-20 rounded-lg border border-dashed border-gray-700 hover:border-gray-800 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {uploading ? (
                    <div className="h-5 w-5 border-2 border-gray-700 border-t-gray-950 rounded-full animate-spin" />
                  ) : (
                    <CloudUpload className="h-5 w-5 text-gray-800" />
                  )}
                </button>
              )}

              {uploading && (
                <p className="mt-2 text-xs text-muted-foreground">Uploading...</p>
              )}
              {uploadError && (
                <p className="mt-2 text-xs text-red-600">{uploadError}</p>
              )}
            </div>

            {/* Crop Modal */}
            {cropFile && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-xl shadow-xl w-[420px] overflow-hidden">
                  <div className="flex items-center justify-center bg-gray-100 p-4">
                    <AvatarEditor
                      ref={editorRef}
                      image={cropFile}
                      width={340}
                      height={340}
                      border={0}
                      borderRadius={0}
                      scale={zoom}
                      rotate={0}
                      backgroundColor="var(--ds-background-200)"
                    />
                  </div>
                  <div className="px-4 py-3 flex items-center gap-3">
                    <MagnifyingGlassMinus className="h-3.5 w-3.5 text-gray-800 shrink-0" />
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 accent-gray-950"
                    />
                    <MagnifyingGlassPlus className="h-3.5 w-3.5 text-gray-800 shrink-0" />
                  </div>
                  <div className="px-4 py-3 border-t border-gray-300 flex items-center justify-between">
                    <Button
                      variant="tertiary"
                      onClick={cancelCrop}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCropConfirm}
                    >
                      Set Logo
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <LongFormInput
              id="description"
              label="Description"
              rows={4}
              placeholder="Tell customers about your wine club..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />

            {/* Website */}
            <Input
              id="website"
              type="url"
              label="Website"
              placeholder="https://yourwebsite.com"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
            />

            {/* Contact Email */}
            <Input
              id="contactEmail"
              type="email"
              label="Contact Email"
              placeholder="support@yourwineclub.com"
              value={formData.contactEmail}
              onChange={(e) =>
                setFormData({ ...formData, contactEmail: e.target.value })
              }
            />

            {/* Contact Phone */}
            <Input
              id="contactPhone"
              type="tel"
              label="Contact Phone"
              placeholder="+1234567890"
              value={formData.contactPhone}
              onChange={(e) =>
                setFormData({ ...formData, contactPhone: e.target.value })
              }
            />

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Timezone
              </label>
              <MenuContainer className="w-full">
                <MenuButton
                  type="button"
                  variant="secondary"
                  className="w-full justify-between"
                  showChevron
                >
                  {selectedTimezoneLabel}
                </MenuButton>
                <Menu width={280}>
                  {timezoneOptions.map((option) => (
                    <MenuItem
                      key={option.value}
                      onClick={() =>
                        setFormData({ ...formData, timeZone: option.value })
                      }
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Menu>
              </MenuContainer>
              <p className="mt-1 text-12 text-muted-foreground">
                Used for displaying dates and times across the dashboard
              </p>
            </div>

          </CardContent>
        </Card>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
            Profile updated successfully!
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="min-w-32">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

