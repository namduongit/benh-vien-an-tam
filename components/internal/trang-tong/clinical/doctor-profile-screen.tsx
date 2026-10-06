"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/button";

import { doctorProfileInternalService } from "@/lib/services/doctor/DoctorProfileService";
import type {
    DoctorProfileResponse,
    UpdateDoctorProfilePayload,
} from "@/types/doctor-profile";

import {
    DetailGrid,
    DetailItem,
    PortalAction,
    PortalPageHeader,
    PortalSection,
    StatusPill,
} from "@/components/internal/portal-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function DoctorProfileScreen() {
    const [profile, setProfile] = useState<DoctorProfileResponse | null>(null);
    const [formData, setFormData] = useState<UpdateDoctorProfilePayload>({
        name: "",
        specialty: "",
        workplace: "",
        introduction: "",
        expertise: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function loadProfile() {
            try {
                setLoading(true);
                setErrorMessage(null);

                const res = await doctorProfileInternalService.getMyProfile(controller.signal);

                if (res && res.Data) {
                    const data = res.Data;
                    setProfile(data);
                    setFormData({
                        name: data.name || "",
                        specialty: data.specialty || "",
                        workplace: data.workplace || "",
                        introduction: data.introduction || "",
                        expertise: data.expertise || "",
                    });
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    console.error("Lỗi tải hồ sơ bác sĩ:", err);
                    setErrorMessage("Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadProfile();
        return () => controller.abort();
    }, []);

    const handleChange = (
        field: keyof UpdateDoctorProfilePayload,
        value: string
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!formData.name.trim()) {
            setErrorMessage("Họ và tên không được để trống.");
            return;
        }
        if (!formData.specialty.trim()) {
            setErrorMessage("Chuyên môn ngắn không được để trống.");
            return;
        }
        if (!formData.workplace.trim()) {
            setErrorMessage("Nơi làm việc không được để trống.");
            return;
        }
        if (!formData.introduction.trim()) {
            setErrorMessage("Giới thiệu không được để trống.");
            return;
        }
        if (!formData.expertise.trim()) {
            setErrorMessage("Kinh nghiệm và chuyên môn không được để trống.");
            return;
        }

        try {
            setSaving(true);
            await doctorProfileInternalService.updateMyProfile(formData);
            setSuccessMessage("Cập nhật hồ sơ thành công!");

            if (profile) {
                setProfile({
                    ...profile,
                    ...formData,
                });
            }
        } catch (err) {
            console.error("Lỗi cập nhật hồ sơ bác sĩ:", err);
            if (isAxiosError(err) && err.response?.data?.message) {
                setErrorMessage(err.response.data.message);
            } else {
                setErrorMessage("Có lỗi xảy ra khi lưu hồ sơ. Vui lòng kiểm tra lại.");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Đang tải thông tin hồ sơ bác sĩ...
          </div>
        );
      }

      return (
        <form onSubmit={handleSubmit} className="space-y-6">
          <PortalPageHeader
            eyebrow="Hồ sơ công khai"
            title="Hồ sơ nghề nghiệp"
            description="Cập nhật phần thông tin cá nhân được phép. Chi nhánh và chuyên khoa do quản trị viên phân công."
            actions={
              <Button variant="default" size="sm" type="submit" disabled={saving}>
                <Save className="mr-1 size-4" />
                {saving ? "Đang lưu..." : "Lưu hồ sơ"}
              </Button>
            }
          />

          {/* Thông báo Lỗi / Thành công */}
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-600">
              {successMessage}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
            {/* Khối Thông tin có thể chỉnh sửa */}
            <PortalSection title="Thông tin bác sĩ">
              <div className="grid gap-5 p-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="doctor-name">Họ và tên</Label>
                  <Input
                    id="doctor-name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Ví dụ: Nguyễn Hoàng Minh"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor-specialty">Chuyên môn ngắn</Label>
                  <Input
                    id="doctor-specialty"
                    value={formData.specialty}
                    onChange={(e) => handleChange("specialty", e.target.value)}
                    placeholder="Ví dụ: Tim mạch can thiệp"
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="doctor-workplace">Nơi làm việc</Label>
                  <Input
                    id="doctor-workplace"
                    value={formData.workplace}
                    onChange={(e) => handleChange("workplace", e.target.value)}
                    placeholder="Ví dụ: Khoa Tim mạch · Bệnh viện Đa khoa Thành Phố"
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="doctor-introduction">Giới thiệu</Label>
                  <Textarea
                    id="doctor-introduction"
                    rows={6}
                    value={formData.introduction}
                    onChange={(e) => handleChange("introduction", e.target.value)}
                    placeholder="Bác sĩ chuyên khoa..."
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="doctor-expertise">Kinh nghiệm và chuyên môn</Label>
                  <Textarea
                    id="doctor-expertise"
                    rows={7}
                    value={formData.expertise}
                    onChange={(e) => handleChange("expertise", e.target.value)}
                    placeholder="- Chẩn đoán và điều trị..."
                    required
                  />
                </div>
              </div>
            </PortalSection>

            {/* Khối Phân công hiện tại (Chỉ đọc) */}
            <PortalSection title="Phân công hiện tại">
              <DetailGrid>
                <DetailItem
                  label="Cơ sở"
                  value={profile?.hospitalName || "Chưa phân công"}
                />
                <DetailItem
                  label="Chuyên khoa"
                  value={profile?.departmentDisplay || "Chưa phân công"}
                />
                <DetailItem
                  label="Giá khám"
                  value={
                    profile?.price != null
                      ? `${profile.price.toLocaleString("vi-VN")} đ`
                      : "0 đ"
                  }
                />
                <DetailItem
                  label="Trạng thái tài khoản"
                  value={
                    <StatusPill
                      tone={profile?.accountStatus === "Active" ? "green" : "amber"}
                    >
                      {profile?.accountStatus === "Active" ? "Hoạt động" : "Tạm dừng"}
                    </StatusPill>
                  }
                />
              </DetailGrid>
            </PortalSection>
          </div>
        </form>
      );
}