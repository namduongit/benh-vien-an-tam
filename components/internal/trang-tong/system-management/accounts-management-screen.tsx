"use client";

import {
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Stethoscope,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import {
  MetricCard,
  MetricGrid,
  PortalPageHeader,
  PortalSection,
  PortalTable,
  StatusPill,
} from "@/components/internal/portal-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminAccountService,
  type AdminAccountItem,
  type AdminAccountOptions,
} from "@/lib/services/account/AdminAccountService";
import { BaseStatus, Gender } from "@/types/models";

type RecordFilter = "active" | "deleted" | "all";

type AccountView = Omit<AdminAccountItem, "createdAt" | "updatedAt" | "deletedAt"> & {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
};

type AccountDraft = {
  uuid?: string;
  phone: string;
  password: string;
  roleUuid: string;
  hospitalUuid: string;
  status: BaseStatus;
  name: string;
  gender: Gender | "";
  birthdate: string;
  email: string;
  slug: string;
  avatar: string;
  medicalCode: string;
  price: string;
  departmentDisplay: string;
  introduction: string;
  expertise: string;
  specialty: string;
  workplace: string;
  isFeatured: boolean;
};

const emptyOptions: AdminAccountOptions = { roles: [], hospitals: [] };
const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

function mapAccount(item: AdminAccountItem): AccountView {
  return {
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
    deletedAt: item.deletedAt ? new Date(item.deletedAt) : new Date(0),
  };
}

function isDeleted(account: AccountView) {
  return account.deletedAt.getTime() > 0;
}

export function AccountsManagementScreen() {
  const [accounts, setAccounts] = useState<AccountView[]>([]);
  const [options, setOptions] = useState<AdminAccountOptions>(emptyOptions);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleUuid, setRoleUuid] = useState("all");
  const [status, setStatus] = useState("all");
  const [recordFilter, setRecordFilter] = useState<RecordFilter>("active");
  const [message, setMessage] = useState("");
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AccountDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    Promise.all([
      adminAccountService.getAll(controller.signal),
      adminAccountService.getOptions(controller.signal),
    ])
      .then(([accountsResponse, optionsResponse]) => {
        if (!active) return;
        setAccounts((accountsResponse.data ?? accountsResponse.Data ?? []).map(mapAccount));
        setOptions(optionsResponse.data ?? optionsResponse.Data ?? emptyOptions);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Lỗi khi tải tài khoản:", error);
        setLoadError("Không tải được danh sách tài khoản");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const activeAccounts = accounts.filter((account) => !isDeleted(account));
  const deletedAccounts = accounts.filter(isDeleted);
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const filteredAccounts = accounts.filter((account) => {
    const searchText = `${account.phone} ${account.uuid} ${account.roleName ?? ""} ${account.hospitalName ?? "Toàn hệ thống"}`.toLocaleLowerCase("vi");
    const matchesRecord = recordFilter === "all" ||
      (recordFilter === "deleted" ? isDeleted(account) : !isDeleted(account));

    return (!normalizedQuery || searchText.includes(normalizedQuery)) &&
      (roleUuid === "all" || account.roleUuid === roleUuid) &&
      (status === "all" || account.status === status) &&
      matchesRecord;
  });

  function openCreate() {
    setMutationError(null);
    setDraft({
      phone: "",
      password: "",
      roleUuid: options.roles[0]?.uuid ?? "",
      hospitalUuid: "",
      status: BaseStatus.Active,
      name: "",
      gender: "",
      birthdate: "",
      email: "",
      slug: "",
      avatar: "",
      medicalCode: "",
      price: "",
      departmentDisplay: "",
      introduction: "",
      expertise: "",
      specialty: "",
      workplace: "",
      isFeatured: false,
    });
  }

  function openEdit(account: AccountView) {
    setMutationError(null);
    const patientProfile = account.patientProfile;
    const doctorProfile = account.doctorProfile;
    setDraft({
      uuid: account.uuid,
      phone: account.phone,
      password: "",
      roleUuid: account.roleUuid ?? "",
      hospitalUuid: account.hospitalUuid ?? "",
      status: account.status,
      name: doctorProfile?.name ?? patientProfile?.name ?? "",
      gender: patientProfile?.gender ?? "",
      birthdate: patientProfile?.birthdate.slice(0, 10) ?? "",
      email: patientProfile?.email ?? "",
      slug: doctorProfile?.slug ?? "",
      avatar: doctorProfile?.avatar ?? patientProfile?.avatar ?? "",
      medicalCode: patientProfile?.medicalCode ?? "",
      price: doctorProfile ? String(doctorProfile.price) : "",
      departmentDisplay: doctorProfile?.departmentDisplay ?? "",
      introduction: doctorProfile?.introduction ?? "",
      expertise: doctorProfile?.expertise ?? "",
      specialty: doctorProfile?.specialty ?? "",
      workplace: doctorProfile?.workplace ?? "",
      isFeatured: doctorProfile?.isFeatured ?? false,
    });
  }

  async function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || submitting) return;

    setSubmitting(true);
    setMutationError(null);
    try {
      const payload = {
        phone: draft.phone.trim(),
        roleUuid: draft.roleUuid,
        hospitalUuid: draft.hospitalUuid || null,
        status: draft.status,
      };
      const profilePayload = selectedRole?.isDoctor
        ? {
            name: draft.name.trim(),
            avatar: draft.avatar.trim(),
            slug: draft.slug.trim(),
            price: draft.price ? Number(draft.price) : undefined,
            departmentDisplay: draft.departmentDisplay.trim(),
            introduction: draft.introduction.trim(),
            expertise: draft.expertise.trim(),
            specialty: draft.specialty.trim(),
            workplace: draft.workplace.trim(),
            isFeatured: draft.isFeatured,
          }
        : {
            name: draft.name.trim(),
            avatar: draft.avatar.trim(),
            gender: draft.gender as Gender,
            birthdate: draft.birthdate,
            email: draft.email.trim(),
            medicalCode: draft.medicalCode.trim(),
          };
      const response = draft.uuid
        ? await adminAccountService.update(draft.uuid, {
            ...payload,
            ...profilePayload,
            ...(draft.password ? { password: draft.password } : {}),
          })
        : await adminAccountService.create({
            ...payload,
            ...profilePayload,
            password: draft.password,
          });
      const saved = response.data ?? response.Data;
      if (!saved) throw new Error("API không trả về tài khoản");

      const mapped = mapAccount(saved);
      setAccounts((current) => draft.uuid
        ? current.map((item) => item.uuid === mapped.uuid ? mapped : item)
        : [mapped, ...current]);
      setMessage(draft.uuid ? `Đã cập nhật tài khoản ${mapped.phone}.` : `Đã tạo tài khoản ${mapped.phone}.`);
      setDraft(null);
    } catch (error) {
      console.error("Không thể lưu tài khoản:", error);
      setMutationError("Không thể lưu tài khoản. Kiểm tra thông tin tài khoản và hồ sơ.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateDeletedAt(account: AccountView, deleted: boolean) {
    if (submitting) return;
    if (!window.confirm(`${deleted ? "Xóa" : "Khôi phục"} tài khoản ${account.phone}?`)) return;

    setSubmitting(true);
    setMutationError(null);
    try {
      if (deleted) await adminAccountService.delete(account.uuid);
      else await adminAccountService.restore(account.uuid);

      const now = new Date();
      setAccounts((current) => current.map((item) => item.uuid === account.uuid
        ? { ...item, deletedAt: deleted ? now : new Date(0), updatedAt: now }
        : item));
      setMessage(deleted
        ? `Đã xóa tài khoản ${account.phone}. Dữ liệu vẫn được giữ để khôi phục.`
        : `Đã khôi phục tài khoản ${account.phone}.`);
    } catch (error) {
      console.error("Không thể thay đổi tài khoản:", error);
      setMutationError(`Không thể ${deleted ? "xóa" : "khôi phục"} tài khoản.`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Đang tải...</div>;
  if (loadError) return <div className="p-8 text-center text-destructive">{loadError}</div>;

  const selectedRole = draft
    ? options.roles.find((role) => role.uuid === draft.roleUuid)
    : undefined;

  const rows = filteredAccounts.map((account) => {
    const deleted = isDeleted(account);
    return [
      <div key={`${account.uuid}-identity`}>
        <p>{account.phone}</p>
        <p className="mt-1 font-mono text-xs font-normal text-muted-foreground">{account.uuid.slice(0, 8)}</p>
      </div>,
      <StatusPill key={`${account.uuid}-role`} tone={account.roleIsDoctor ? "blue" : "purple"}>{account.roleName ?? "Chưa gán role"}</StatusPill>,
      account.hospitalName ?? "Toàn hệ thống",
      <StatusPill key={`${account.uuid}-status`} tone={account.status === BaseStatus.Active ? "green" : "amber"}>{account.status === BaseStatus.Active ? "Hoạt động" : "Vô hiệu hóa"}</StatusPill>,
      <div key={`${account.uuid}-record`}>
        <StatusPill tone={deleted ? "red" : "green"}>{deleted ? "Đã xóa" : "Đang quản lý"}</StatusPill>
        {deleted ? <p className="mt-1 text-xs text-muted-foreground">{dateTimeFormatter.format(account.deletedAt)}</p> : null}
      </div>,
      dateTimeFormatter.format(account.updatedAt),
      <div key={`${account.uuid}-actions`} className="flex gap-1">
        {!deleted ? <Button type="button" size="icon-sm" variant="ghost" aria-label={`Sửa ${account.phone}`} onClick={() => openEdit(account)}><Pencil /></Button> : null}
        <Button type="button" size="sm" variant={deleted ? "outline" : "destructive"} disabled={submitting} onClick={() => void updateDeletedAt(account, !deleted)}>
          {deleted ? <RotateCcw /> : <Trash2 />}{deleted ? "Khôi phục" : "Xóa"}
        </Button>
      </div>,
    ];
  });

  return (
    <div className="space-y-6">
      <PortalPageHeader eyebrow="Kiểm soát truy cập" title="Tài khoản hệ thống" description="Quản lý trạng thái, role, chi nhánh và vòng đời dữ liệu của tài khoản nhân sự." actions={<Button type="button" size="sm" onClick={openCreate}><Plus />Tạo tài khoản</Button>} />
      <MetricGrid>
        <MetricCard label="Đang quản lý" value={String(activeAccounts.length)} detail={`${activeAccounts.filter((item) => item.status === BaseStatus.Active).length} tài khoản hoạt động`} icon={<UsersRound className="size-5" />} />
        <MetricCard label="Role đang dùng" value={String(new Set(activeAccounts.map((item) => item.roleUuid)).size)} detail={`${options.roles.length} role đã cấu hình`} icon={<ShieldAlert className="size-5" />} tone="cyan" />
        <MetricCard label="Bác sĩ" value={String(activeAccounts.filter((item) => item.roleIsDoctor).length)} detail="Chỉ tính bản ghi chưa xóa" icon={<Stethoscope className="size-5" />} tone="green" />
        <MetricCard label="Đã xóa" value={String(deletedAccounts.length)} detail="Có thể khôi phục bất kỳ lúc nào" icon={<Trash2 className="size-5" />} tone="red" />
      </MetricGrid>
      {message ? <p role="status" className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
      {mutationError && !draft ? <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{mutationError}</p> : null}
      <PortalSection title="Danh sách tài khoản" description={`${filteredAccounts.length} kết quả theo bộ lọc hiện tại`}>
        <div className="border-b bg-[#fbfdfe] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1 lg:max-w-sm">
              <span className="sr-only">Tìm tài khoản</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm số điện thoại, mã hoặc cơ sở" className="h-9 pl-9" />
            </label>
            <select aria-label="Lọc theo role" value={roleUuid} onChange={(event) => setRoleUuid(event.target.value)} className="h-9 rounded-md border bg-white px-3 text-sm">
              <option value="all">Tất cả role</option>
              {options.roles.map((role) => <option key={role.uuid} value={role.uuid}>{role.name}</option>)}
            </select>
            <select aria-label="Lọc theo trạng thái tài khoản" value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-md border bg-white px-3 text-sm">
              <option value="all">Mọi trạng thái</option>
              <option value={BaseStatus.Active}>Hoạt động</option>
              <option value={BaseStatus.InActive}>Vô hiệu hóa</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Lọc vòng đời bản ghi">
            {([
              ["active", `Đang quản lý (${activeAccounts.length})`],
              ["deleted", `Đã xóa (${deletedAccounts.length})`],
              ["all", `Tất cả (${accounts.length})`],
            ] as const).map(([value, label]) => (
              <Button key={value} type="button" size="sm" variant={recordFilter === value ? "default" : "outline"} aria-pressed={recordFilter === value} onClick={() => setRecordFilter(value)}>{label}</Button>
            ))}
          </div>
        </div>
        {rows.length > 0 ? (
          <PortalTable caption="Danh sách tài khoản hệ thống" columns={["Tài khoản", "Role", "Chi nhánh", "Trạng thái", "Bản ghi", "Cập nhật", "Thao tác"]} rows={rows} />
        ) : (
          <p className="p-8 text-center text-sm text-muted-foreground">Không có tài khoản phù hợp với bộ lọc.</p>
        )}
      </PortalSection>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => { if (!open) setDraft(null); }}>
        <DialogContent className="max-w-3xl">
          {draft ? (
            <form onSubmit={saveAccount}>
              <DialogHeader>
                <DialogTitle>{draft.uuid ? "Chỉnh sửa" : "Tạo"} tài khoản</DialogTitle>
              </DialogHeader>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account-phone">Số điện thoại</Label>
                  <Input id="account-phone" required value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-password">{draft.uuid ? "Mật khẩu mới (tùy chọn)" : "Mật khẩu"}</Label>
                  <Input id="account-password" type="password" required={!draft.uuid} minLength={8} value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-role">Role</Label>
                  <select id="account-role" 
                    required value={draft.roleUuid} 
                    disabled={Boolean(draft.uuid)}
                    onChange={(event) => setDraft({ ...draft, roleUuid: event.target.value })} 
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70">
                    <option value="" disabled>Chọn role</option>
                    {options.roles.map(role => <option key={role.uuid} value={role.uuid}>{role.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-hospital">Cơ sở</Label>
                  <select id="account-hospital" 
                    value={draft.hospitalUuid} 
                    onChange={(event) => setDraft({ ...draft, hospitalUuid: event.target.value })} 
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="">Toàn hệ thống</option>
                    {options.hospitals.map((hospital) => <option key={hospital.uuid} value={hospital.uuid}>{hospital.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-status">Trạng thái</Label>
                  <select id="account-status" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as BaseStatus })} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    <option value={BaseStatus.Active}>Hoạt động</option><option value={BaseStatus.InActive}>Vô hiệu hóa</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Họ và tên</Label>
                  <Input id="profile-name" required minLength={2} maxLength={100} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-avatar">Ảnh đại diện (tùy chọn)</Label>
                  <Input id="profile-avatar" maxLength={2048} placeholder="URL hoặc đường dẫn ảnh" value={draft.avatar} onChange={(event) => setDraft({ ...draft, avatar: event.target.value })} />
                </div>
                {selectedRole?.isDoctor ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="doctor-slug">Slug bác sĩ</Label>
                      <Input id="doctor-slug" required maxLength={160} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="nguyen-van-an" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doctor-price">Giá khám (tùy chọn)</Label>
                      <Input id="doctor-price" type="number" min={0} step={1} value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doctor-department">Khoa hiển thị (tùy chọn)</Label>
                      <Input id="doctor-department" maxLength={200} value={draft.departmentDisplay} onChange={(event) => setDraft({ ...draft, departmentDisplay: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doctor-specialty">Chuyên khoa (tùy chọn)</Label>
                      <Input id="doctor-specialty" maxLength={200} value={draft.specialty} onChange={(event) => setDraft({ ...draft, specialty: event.target.value })} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="doctor-workplace">Nơi công tác (tùy chọn)</Label>
                      <Input id="doctor-workplace" maxLength={200} value={draft.workplace} onChange={(event) => setDraft({ ...draft, workplace: event.target.value })} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="doctor-introduction">Giới thiệu (tùy chọn)</Label>
                      <Textarea id="doctor-introduction" value={draft.introduction} onChange={(event) => setDraft({ ...draft, introduction: event.target.value })} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="doctor-expertise">Kinh nghiệm chuyên môn (tùy chọn)</Label>
                      <Textarea id="doctor-expertise" value={draft.expertise} onChange={(event) => setDraft({ ...draft, expertise: event.target.value })} />
                    </div>
                    <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
                      <input type="checkbox" checked={draft.isFeatured} onChange={(event) => setDraft({ ...draft, isFeatured: event.target.checked })} className="size-4 rounded border" />
                      Hiển thị
                    </label>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="patient-gender">Giới tính</Label>
                      <select id="patient-gender" required value={draft.gender} onChange={(event) => setDraft({ ...draft, gender: event.target.value as Gender })} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                        <option value="" disabled>Chọn giới tính</option>
                        <option value={Gender.Female}>Nữ</option>
                        <option value={Gender.Male}>Nam</option>
                        <option value={Gender.Other}>Khác</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patient-birthdate">Ngày sinh</Label>
                      <Input id="patient-birthdate" type="date" required value={draft.birthdate} onChange={(event) => setDraft({ ...draft, birthdate: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patient-email">Email</Label>
                      <Input id="patient-email" type="email" required maxLength={254} value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patient-medical-code">Mã bệnh nhân (tùy chọn)</Label>
                      <Input id="patient-medical-code" maxLength={50} placeholder="" value={draft.medicalCode} onChange={(event) => setDraft({ ...draft, medicalCode: event.target.value })} />
                    </div>
                  </>
                )}
              </div>
              {mutationError ? <p className="mt-4 text-sm text-destructive">{mutationError}</p> : null}
              <DialogFooter>
                <Button type="button" variant="outline" disabled={submitting} onClick={() => setDraft(null)}>Hủy</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Đang lưu..." : "Lưu tài khoản"}</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
