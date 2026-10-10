"use client";

import {
  Activity,
  Eye,
  Hospital as HospitalIcon,
  PackageSearch,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import {
  DetailGrid,
  DetailItem,
  MetricCard,
  MetricGrid,
  PortalPageHeader,
  PortalSection,
  PortalTable,
  StatusPill,
} from "@/components/internal/portal-ui";
import { SafeMarkdown } from "@/components/shared/safe-markdown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mockMedicalServices } from "@/data/mocks/medical-services";
import {
  BaseStatus,
  type Department,
  Hospital,
  type Medicine,
  MedicineUnit,
} from "@/types/models";
import {
  adminDepartmentService,
  type AdminDepartmentItem,
  type DepartmentRequest,
} from "@/lib/services/department/AdminDepartmentService";
import {
  adminHospitalService,
  type AdminHospitalItem,
  type CreateHospitalRequest,
} from "@/lib/services/hospital/AdminHospitalService";
import {
  adminMedicineService,
  type AdminMedicineItem,
  type MedicineRequest,
} from "@/lib/services/medicine/AdminMedicineService";

type ManagedRecord = {
  Uuid: string;
  Name: string;
  Status: BaseStatus;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date;
};

type CatalogConfig<T extends ManagedRecord> = {
  eyebrow: string;
  title: string;
  description: string;
  singular: string;
  icon: ReactNode;
  initialItems: T[];
  columns: string[];
  searchText: (item: T) => string;
  renderCells: (item: T) => ReactNode[];
  renderDetail: (item: T) => ReactNode;
  renderForm: (item: T, update: <K extends keyof T>(key: K, value: T[K]) => void) => ReactNode;
  createDraft?: () => T;
  onCreate?: (item: T) => Promise<T>;
  onSave?: (item: T) => Promise<T>;
  onDelete?: (item:T) => Promise<void>;
  onRestore?: (item:T) => Promise<void>;
};

const dateFormatter = new Intl.DateTimeFormat("vi-VN");
const moneyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

function isDeleted(item: ManagedRecord) {
  return item.DeletedAt.getTime() > 0;
}

function statusLabel(status: BaseStatus) {
  return status === BaseStatus.Active ? "Hoạt động" : "Tạm ngưng";
}

function RecordStatus({ item }: { item: ManagedRecord }) {
  if (isDeleted(item)) return <StatusPill tone="red">Đã xóa</StatusPill>;
  return <StatusPill tone={item.Status === BaseStatus.Active ? "green" : "amber"}>{statusLabel(item.Status)}</StatusPill>;
}

function CatalogManagementScreen<T extends ManagedRecord>({ config }: { config: CatalogConfig<T> }) {
  const [items, setItems] = useState<T[]>(() => config.initialItems.map((item) => ({ ...item })));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [visibility, setVisibility] = useState("current");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [draft, setDraft] = useState<T | null>(null);
  const [draftMode, setDraftMode] = useState<"create" | "edit" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const filteredItems = items.filter((item) => {
    const matchesQuery = !normalizedQuery || config.searchText(item).toLocaleLowerCase("vi").includes(normalizedQuery);
    const matchesStatus = status === "all" || item.Status === status;
    const matchesVisibility = visibility === "all" || (visibility === "deleted" ? isDeleted(item) : !isDeleted(item));
    return matchesQuery && matchesStatus && matchesVisibility;
  });
  const detailItem = items.find((item) => item.Uuid === detailId) ?? null;
  const activeCount = items.filter((item) => !isDeleted(item) && item.Status === BaseStatus.Active).length;
  const deletedCount = items.filter(isDeleted).length;
  const insuredCount = items.filter((item) => "IsInsured" in item && item.IsInsured).length;

  function updateDraft<K extends keyof T>(key: K, value: T[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  }

  async function saveDraft() {
    if (!draft || isSubmitting) return;

    setIsSubmitting(true);
    setMutationError(null);

    try {
      const isCreating = draftMode === "create";
      const savedItem = isCreating
        ? config.onCreate
          ? await config.onCreate(draft)
          : { ...draft, CreatedAt: new Date(), UpdatedAt: new Date() }
        : config.onSave
          ? await config.onSave(draft)
          : { ...draft, UpdatedAt: new Date() };

      setItems((current) =>
        isCreating
          ? [savedItem, ...current]
          : current.map((item) =>
              item.Uuid === savedItem.Uuid ? savedItem : item,
            ),
      );

      setDraft(null);
      setDraftMode(null);
    } catch (error) {
      console.error("Không thể lưu bản ghi:", error);
      setMutationError(
        draftMode === "create"
          ? `Không thể thêm ${config.singular}. Vui lòng thử lại.`
          : "Không thể lưu thay đổi. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteItem(item: T) {
    if (!config.onDelete || isSubmitting) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa "${item.Name}" không?`,
    );

    if (!confirmed) return;

    setIsSubmitting(true);

    try {
      // Gọi handleDeleteHospital được truyền từ bên ngoài
      await config.onDelete(item);

      // Cập nhật giao diện sau khi API thành công
      setItems((current) =>
        current.map((candidate) =>
          candidate.Uuid === item.Uuid
            ? {
                ...candidate,
                DeletedAt: new Date(),
                UpdatedAt: new Date(),
              }
            : candidate,
        ),
      );
    } catch (error) {
      console.error("Xóa thất bại:", error);
      setMutationError(`Không thể xóa ${config.singular}.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function restoreItem(item: T) {
    if (!config.onRestore || isSubmitting) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn khôi phục "${item.Name}" không?`,
    );

    if (!confirmed) return;

    setIsSubmitting(true);

    try {
      await config.onRestore(item);

      setItems((current) => current.map((candidate) =>
        candidate.Uuid === item.Uuid
          ? { ...candidate, DeletedAt: new Date(0), UpdatedAt: new Date() }
          : candidate,
      ));

    } catch (error) {
      console.error("Khôi phục thất bại:", error);
      setMutationError(`Không thể khôi phục ${config.singular}.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const rows = filteredItems.map((item) => [
    ...config.renderCells(item),
    <RecordStatus key={`${item.Uuid}-status`} item={item} />,
    <div key={`${item.Uuid}-actions`} className="flex items-center justify-end gap-1">
      <Button type="button" variant="ghost" size="icon-sm" title="Xem chi tiết" aria-label={`Xem chi tiết ${item.Name}`} onClick={() => setDetailId(item.Uuid)}>
        <Eye />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" title="Chỉnh sửa" aria-label={`Chỉnh sửa ${item.Name}`} onClick={() => { setMutationError(null); setDraftMode("edit"); setDraft({ ...item }); }}>
        <Pencil />
      </Button>
      <Button type="button" variant={isDeleted(item) ? "outline" : "destructive"} size="icon-sm" title={isDeleted(item) ? "Khôi phục" : "Xóa"} aria-label={`${isDeleted(item) ? "Khôi phục" : "Xóa"} ${item.Name}`} onClick={isDeleted(item) ? () => restoreItem(item) : () => deleteItem(item)}>
        {isDeleted(item) ? <RotateCcw /> : <Trash2 />}
      </Button>
    </div>,
  ]);

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        actions={config.createDraft ? (
          <Button
            type="button"
            onClick={() => {
              setMutationError(null);
              setDraftMode("create");
              setDraft(config.createDraft?.() ?? null);
            }}
          >
            <Plus />
            Thêm {config.singular}
          </Button>
        ) : undefined}
      />
      <MetricGrid>
        <MetricCard label="Tổng bản ghi" value={String(items.length)} detail={`${items.length - deletedCount} bản ghi hiện hành`} icon={config.icon} />
        <MetricCard label="Đang hoạt động" value={String(activeCount)} detail="Không bao gồm bản ghi đã xóa" icon={<Activity className="size-5" />} tone="green" />
        <MetricCard label="Đã xóa" value={String(deletedCount)} detail="Có thể khôi phục bất kỳ lúc nào" icon={<Trash2 className="size-5" />} tone="red" />
        <MetricCard label={"IsInsured" in (items[0] ?? {}) ? "Có bảo hiểm" : "Cập nhật gần đây"} value={"IsInsured" in (items[0] ?? {}) ? String(insuredCount) : String(items.filter((item) => item.UpdatedAt >= new Date("2026-08-14")).length)} detail={"IsInsured" in (items[0] ?? {}) ? "Theo cấu hình danh mục" : "Từ 14/08/2026"} icon={<ShieldCheck className="size-5" />} tone="cyan" />
      </MetricGrid>

      <PortalSection title={`Danh sách ${config.title.toLocaleLowerCase("vi")}`} description={`${filteredItems.length} kết quả theo bộ lọc hiện tại`}>
        <div className="grid gap-3 border-b bg-[#fbfdfe] p-4 lg:grid-cols-[minmax(16rem,1fr)_12rem_12rem]">
          <label className="relative">
            <span className="sr-only">Tìm kiếm</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Tìm ${config.title.toLocaleLowerCase("vi")}...`} className="pl-9" />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" aria-label="Lọc trạng thái">
            <option value="all">Tất cả trạng thái</option>
            <option value={BaseStatus.Active}>Hoạt động</option>
            <option value={BaseStatus.InActive}>Tạm ngưng</option>
          </select>
          <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" aria-label="Lọc trạng thái xóa">
            <option value="current">Bản ghi hiện hành</option>
            <option value="deleted">Đã xóa</option>
            <option value="all">Tất cả bản ghi</option>
          </select>
        </div>
        {rows.length ? (
          <PortalTable caption={`Danh sách ${config.title.toLocaleLowerCase("vi")}`} columns={[...config.columns, "Trạng thái", "Thao tác"]} rows={rows} />
        ) : (
          <div className="p-10 text-center text-sm text-muted-foreground">Không có bản ghi phù hợp với bộ lọc.</div>
        )}
      </PortalSection>

      <Dialog open={Boolean(detailItem)} onOpenChange={(open) => { if (!open) setDetailId(null); }}>
        <DialogContent className="max-w-3xl">
          {detailItem ? (
            <>
              <DialogHeader>
                <DialogTitle>{detailItem.Name}</DialogTitle>
                <DialogDescription>Chi tiết {config.singular} và trạng thái dữ liệu hiện tại.</DialogDescription>
              </DialogHeader>
              <div className="mt-5 space-y-5">{config.renderDetail(detailItem)}</div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDetailId(null)}>Đóng</Button>
                <Button type="button" onClick={() => { setMutationError(null); setDraftMode("edit"); setDraft({ ...detailItem }); setDetailId(null); }}><Pencil />Chỉnh sửa</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => { if (!open) { setDraft(null); setDraftMode(null); setMutationError(null); } }}>
        <DialogContent className="max-w-4xl">
          {draft ? (
            <form onSubmit={(event) => { event.preventDefault(); void saveDraft(); }}>
              <DialogHeader>
                <DialogTitle>{draftMode === "create" ? "Thêm" : "Chỉnh sửa"} {config.singular}</DialogTitle>
                <DialogDescription>
                  {draftMode === "create"
                    ? `Nhập thông tin để tạo ${config.singular} mới.`
                    : `Cập nhật thông tin ${config.singular}.`}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">{config.renderForm(draft, updateDraft)}</div>
              {mutationError ? <p className="mt-4 text-sm text-destructive">{mutationError}</p> : null}
              <DialogFooter>
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => { setDraft(null); setDraftMode(null); setMutationError(null); }}>Hủy</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Đang lưu..." : draftMode === "create" ? `Thêm ${config.singular}` : "Lưu thay đổi"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <div className={wide ? "space-y-2 sm:col-span-2" : "space-y-2"}><Label>{label}</Label>{children}</div>;
}

function StatusField({ value, onChange }: { value: BaseStatus; onChange: (value: BaseStatus) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value as BaseStatus)} className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
      <option value={BaseStatus.Active}>Hoạt động</option>
      <option value={BaseStatus.InActive}>Tạm ngưng</option>
    </select>
  );
}

function MarkdownField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [preview, setPreview] = useState(false);
  return (
    <Field label={label} wide>
      <div className="flex gap-1 border-b pb-2">
        <Button type="button" size="sm" variant={preview ? "ghost" : "secondary"} onClick={() => setPreview(false)}>Soạn thảo</Button>
        <Button type="button" size="sm" variant={preview ? "secondary" : "ghost"} onClick={() => setPreview(true)}>Xem trước</Button>
      </div>
      {preview ? <div className="min-h-36 rounded-md border bg-slate-50 p-4 text-sm"><SafeMarkdown content={value} /></div> : <Textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-36 font-mono text-sm" placeholder="Hỗ trợ **in đậm**, danh sách và đoạn văn Markdown" />}
    </Field>
  );
}

function CommonDetail({ item, children }: { item: ManagedRecord; children: ReactNode }) {
  return (
    <>
      <DetailGrid>
        {children}
        <DetailItem label="Trạng thái" value={<RecordStatus item={item} />} />
        <DetailItem label="Ngày tạo" value={dateFormatter.format(item.CreatedAt)} />
        <DetailItem label="Cập nhật" value={dateFormatter.format(item.UpdatedAt)} />
        <DetailItem label="DeletedAt" value={isDeleted(item) ? dateFormatter.format(item.DeletedAt) : "Chưa xóa"} />
      </DetailGrid>
    </>
  );
}

function MarkdownDetail({ title, content }: { title: string; content: string }) {
  return <section className="rounded-lg border p-5"><h3 className="mb-3 font-semibold text-[#173b57]">{title}</h3><SafeMarkdown content={content} /></section>;
}

function mapToHospital(item: AdminHospitalItem): Hospital {
  const status =
    (item.status as unknown) === 0 || item.status === BaseStatus.Active || (item.status as unknown) === "Active"
      ? BaseStatus.Active
      : BaseStatus.InActive;

  return {
    Uuid: item.uuid,
    Name: item.name ?? "",
    Address: item.address ?? "",
    Slug: item.slug ?? "",
    Image: item.image ?? "",
    LImage: item.image ?? "",
    MapUrl: item.mapUrl ?? "",
    NumberOfRoom: item.numberOfRoom ?? 0,
    Description: item.description ?? "",
    DetailService: item.detailService ?? "",
    WorkingHour: item.workingHour ?? "",
    Status: status,
    CreatedAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    UpdatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    DeletedAt: item.deletedAt ? new Date(item.deletedAt) : new Date(0),
  };
}

function mapToHospitalRequest(hospital: Hospital): CreateHospitalRequest {
  return {
    name: hospital.Name.trim(),
    address: hospital.Address.trim(),
    slug: hospital.Slug.trim(),
    image: hospital.Image,
    mapUrl: hospital.MapUrl,
    numberOfRoom: hospital.NumberOfRoom,
    description: hospital.Description,
    detailService: hospital.DetailService,
    workingHour: hospital.WorkingHour,
    status: hospital.Status,
  };
}

function createEmptyHospital(): Hospital {
  const now = new Date();

  return {
    Uuid: "",
    Name: "",
    Address: "",
    Slug: "",
    Image: "",
    LImage: "",
    MapUrl: "",
    NumberOfRoom: 0,
    Description: "",
    DetailService: "",
    WorkingHour: "",
    Status: BaseStatus.Active,
    CreatedAt: now,
    UpdatedAt: now,
    DeletedAt: new Date(0),
  };
}

export function HospitalsManagementScreen() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    adminHospitalService
      .getAll(controller.signal)
      .then((res) => {
        if (!active) return;

        const rawList = res.data ?? res.Data ?? [];
        setHospitals(rawList.map(mapToHospital));
      })
      .catch((err) => {
        if (!active) return;

        console.error("Lỗi khi tải danh sách cơ sở y tế:", err);
        setError("Không tải được danh sách cơ sở y tế");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  async function handleSaveHospital(
    hospital: Hospital
  ): Promise<Hospital> {
    const response = await adminHospitalService.update(
      hospital.Uuid,
      mapToHospitalRequest(hospital));

    const updatedHospital = response.data ?? response.Data;

    if (!updatedHospital) {
      throw new Error("Không nhận được dữ liệu cơ sở y tế sau khi cập nhật");
    }
    return mapToHospital(updatedHospital);
  }

  async function handleCreateHospital(
    hospital: Hospital,
  ): Promise<Hospital> {
    const response = await adminHospitalService.create(
      mapToHospitalRequest(hospital),
    );
    const createdHospital = response.data ?? response.Data;

    if (!createdHospital) {
      throw new Error("Không nhận được dữ liệu cơ sở y tế sau khi tạo");
    }

    return mapToHospital(createdHospital);
  }

  async function handleDeleteHospital(hospital: Hospital): Promise<void> {
    await adminHospitalService.delete(hospital.Uuid);
  }

  async function handleRestoreHospital(hospital: Hospital): Promise<void> {
    await adminHospitalService.restore(hospital.Uuid);
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Đang tải...</div>;
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>;

  return <CatalogManagementScreen config={{
    eyebrow: "Danh mục toàn hệ thống",
    title: "Cơ sở y tế",
    singular: "cơ sở y tế",
    description: "Quản lý đầy đủ thông tin vận hành, nội dung giới thiệu và vòng đời dữ liệu của các cơ sở.",
    icon: <HospitalIcon className="size-5" />,
    initialItems: hospitals,
    columns: ["Cơ sở", "Địa chỉ", "Số phòng", "Giờ làm việc", "Cập nhật"],
    searchText: (item) => `${item.Name} ${item.Slug} ${item.Address}`,
    renderCells: (item) => [
      <div key="name"><div className="font-semibold">{item.Name}</div><div className="mt-1 text-xs text-muted-foreground">/{item.Slug}</div></div>,
      <span key="address" className="block max-w-72 whitespace-normal">{item.Address}</span>,
      item.NumberOfRoom,
      item.WorkingHour,
      dateFormatter.format(item.UpdatedAt),
    ],
    renderDetail: (item) => <><CommonDetail item={item}><DetailItem label="Slug" value={item.Slug} /><DetailItem label="Địa chỉ" value={item.Address} /><DetailItem label="Số phòng" value={item.NumberOfRoom} /><DetailItem label="Giờ làm việc" value={item.WorkingHour} /><DetailItem label="Ảnh đại diện" value={item.Image} /><DetailItem label="Bản đồ" value={<a className="text-primary underline" href={item.MapUrl} target="_blank" rel="noreferrer">Mở Google Maps</a>} /></CommonDetail><MarkdownDetail title="Mô tả" content={item.Description} /><MarkdownDetail title="Chi tiết dịch vụ" content={item.DetailService} /></>,
    renderForm: (item, update) => <><Field label="Tên cơ sở"><Input required value={item.Name} onChange={(event) => update("Name", event.target.value)} /></Field><Field label="Slug"><Input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" title="Chỉ dùng chữ thường, số và dấu gạch ngang" value={item.Slug} onChange={(event) => update("Slug", event.target.value)} /></Field><Field label="Địa chỉ" wide><Input required value={item.Address} onChange={(event) => update("Address", event.target.value)} /></Field><Field label="Số phòng"><Input required min={0} type="number" value={item.NumberOfRoom} onChange={(event) => update("NumberOfRoom", Number(event.target.value))} /></Field><Field label="Trạng thái"><StatusField value={item.Status} onChange={(value) => update("Status", value)} /></Field><Field label="Giờ làm việc" wide><Input value={item.WorkingHour} onChange={(event) => update("WorkingHour", event.target.value)} placeholder="Ví dụ: Thứ Hai - Thứ Sáu, 07:00 - 17:00" /></Field><Field label="URL ảnh đại diện" wide><Input type="text" value={item.Image} onChange={(event) => update("Image", event.target.value)} placeholder="https://..." /></Field><Field label="URL bản đồ" wide><Input type="url" value={item.MapUrl} onChange={(event) => update("MapUrl", event.target.value)} placeholder="https://..." /></Field><MarkdownField label="Mô tả (Markdown)" value={item.Description} onChange={(value) => update("Description", value)} /><MarkdownField label="Chi tiết dịch vụ (Markdown)" value={item.DetailService} onChange={(value) => update("DetailService", value)} /></>,
    createDraft: createEmptyHospital,
    onCreate: handleCreateHospital,
    onSave: handleSaveHospital,
    onDelete: handleDeleteHospital,
    onRestore: handleRestoreHospital,
  }} />;
}

function mapToDepartment(item: AdminDepartmentItem): Department {
  return {
    Uuid: item.uuid,
    Icon: item.icon ?? "",
    Slug: item.slug ?? "",
    Name: item.name ?? "",
    Description: item.description ?? "",
    Status: item.status,
    CreatedAt: new Date(item.createdAt),
    UpdatedAt: new Date(item.updatedAt),
    DeletedAt: item.deletedAt ? new Date(item.deletedAt) : new Date(0),
  };
}

function mapToDepartmentRequest(item: Department): DepartmentRequest {
  return {
    icon: item.Icon,
    slug: item.Slug.trim(),
    name: item.Name.trim(),
    description: item.Description,
    status: item.Status,
  };
}

function createEmptyDepartment(): Department {
  const now = new Date();
  return {
    Uuid: "",
    Icon: "",
    Slug: "",
    Name: "",
    Description: "",
    Status: BaseStatus.Active,
    CreatedAt: now,
    UpdatedAt: now,
    DeletedAt: new Date(0),
  };
}

export function DepartmentsManagementScreen() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    adminDepartmentService.getAll(controller.signal)
      .then((response) => {
        if (!active) return;
        setDepartments((response.data ?? response.Data ?? []).map(mapToDepartment));
      })
      .catch((requestError) => {
        if (!active) return;
        console.error("Lỗi khi tải danh sách chuyên khoa:", requestError);
        setError("Không tải được danh sách chuyên khoa");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  async function saveDepartment(item: Department) {
    const response = await adminDepartmentService.update(item.Uuid, mapToDepartmentRequest(item));
    const saved = response.data ?? response.Data;
    if (!saved) throw new Error("API không trả về chuyên khoa đã cập nhật");
    return mapToDepartment(saved);
  }

  async function createDepartment(item: Department) {
    const response = await adminDepartmentService.create(mapToDepartmentRequest(item));
    const saved = response.data ?? response.Data;
    if (!saved) throw new Error("API không trả về chuyên khoa đã tạo");
    return mapToDepartment(saved);
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Đang tải...</div>;
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>;

  return <CatalogManagementScreen config={{
    eyebrow: "Danh mục chuyên môn",
    title: "Chuyên khoa",
    singular: "chuyên khoa",
    description: "Quản lý định danh, nội dung mô tả và trạng thái sử dụng của danh mục chuyên khoa gốc.",
    icon: <Stethoscope className="size-5" />,
    initialItems: departments,
    columns: ["Chuyên khoa", "Slug", "Mô tả", "Ngày tạo", "Cập nhật"],
    searchText: (item) => `${item.Name} ${item.Slug} ${item.Description}`,
    renderCells: (item) => [item.Name, item.Slug, <span key="description" className="block max-w-80 truncate">{item.Description}</span>, dateFormatter.format(item.CreatedAt), dateFormatter.format(item.UpdatedAt)],
    renderDetail: (item) => <><CommonDetail item={item}><DetailItem label="Slug" value={item.Slug} /><DetailItem label="Biểu tượng" value={item.Icon} /></CommonDetail><MarkdownDetail title="Mô tả chuyên khoa" content={item.Description} /></>,
    renderForm: (item, update) => <><Field label="Tên chuyên khoa"><Input required value={item.Name} onChange={(event) => update("Name", event.target.value)} /></Field><Field label="Slug"><Input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={item.Slug} onChange={(event) => update("Slug", event.target.value)} /></Field><Field label="Đường dẫn biểu tượng"><Input value={item.Icon} onChange={(event) => update("Icon", event.target.value)} /></Field><Field label="Trạng thái"><StatusField value={item.Status} onChange={(value) => update("Status", value)} /></Field><MarkdownField label="Mô tả (Markdown)" value={item.Description} onChange={(value) => update("Description", value)} /></>,
    createDraft: createEmptyDepartment,
    onCreate: createDepartment,
    onSave: saveDepartment,
    onDelete: (item) => adminDepartmentService.delete(item.Uuid),
    onRestore: (item) => adminDepartmentService.restore(item.Uuid),
  }} />;
}

export function MedicalServicesManagementScreen() {
  return <CatalogManagementScreen config={{
    eyebrow: "Danh mục chuyên môn",
    title: "Dịch vụ y tế",
    singular: "dịch vụ y tế",
    description: "Quản lý giá, quyền lợi bảo hiểm, lịch thực hiện và nội dung dịch vụ dùng chung.",
    icon: <Activity className="size-5" />,
    initialItems: mockMedicalServices,
    columns: ["Dịch vụ", "Giá", "Giờ thực hiện", "Bảo hiểm", "Nổi bật", "Cập nhật"],
    searchText: (item) => `${item.Name} ${item.Slug} ${item.Description} ${item.WorkingHour}`,
    renderCells: (item) => [<div key="name"><div className="font-semibold">{item.Name}</div><div className="mt-1 text-xs text-muted-foreground">/{item.Slug}</div></div>, moneyFormatter.format(item.Price), item.WorkingHour, item.IsInsured ? `${Math.round(item.InsuranceCap * 100)}%` : "Không", item.IsFeatured ? "Có" : "Không", dateFormatter.format(item.UpdatedAt)],
    renderDetail: (item) => <><CommonDetail item={item}><DetailItem label="Slug" value={item.Slug} /><DetailItem label="Giá tham chiếu" value={moneyFormatter.format(item.Price)} /><DetailItem label="Giờ thực hiện" value={item.WorkingHour} /><DetailItem label="Bảo hiểm" value={item.IsInsured ? `Có, tối đa ${Math.round(item.InsuranceCap * 100)}%` : "Không"} /><DetailItem label="Dịch vụ nổi bật" value={item.IsFeatured ? "Có" : "Không"} /><DetailItem label="Hình ảnh" value={item.Image} /></CommonDetail><MarkdownDetail title="Mô tả" content={item.Description} /><MarkdownDetail title="Chi tiết dịch vụ" content={item.DetailService} /></>,
    renderForm: (item, update) => <><Field label="Tên dịch vụ"><Input required value={item.Name} onChange={(event) => update("Name", event.target.value)} /></Field><Field label="Slug"><Input required value={item.Slug} onChange={(event) => update("Slug", event.target.value)} /></Field><Field label="Giá tham chiếu"><Input required min={0} type="number" value={item.Price} onChange={(event) => update("Price", Number(event.target.value))} /></Field><Field label="Giờ thực hiện"><Input value={item.WorkingHour} onChange={(event) => update("WorkingHour", event.target.value)} /></Field><Field label="Trạng thái"><StatusField value={item.Status} onChange={(value) => update("Status", value)} /></Field><Field label="Mức chi trả bảo hiểm (0-1)"><Input min={0} max={1} step={0.1} type="number" disabled={!item.IsInsured} value={item.InsuranceCap} onChange={(event) => update("InsuranceCap", Number(event.target.value))} /></Field><Field label="Tùy chọn" wide><div className="flex flex-wrap gap-6 rounded-md border p-3 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={item.IsInsured} onChange={(event) => update("IsInsured", event.target.checked)} />Áp dụng bảo hiểm</label><label className="flex items-center gap-2"><input type="checkbox" checked={item.IsFeatured} onChange={(event) => update("IsFeatured", event.target.checked)} />Dịch vụ nổi bật</label></div></Field><MarkdownField label="Mô tả (Markdown)" value={item.Description} onChange={(value) => update("Description", value)} /><MarkdownField label="Chi tiết dịch vụ (Markdown)" value={item.DetailService} onChange={(value) => update("DetailService", value)} /></>,
  }} />;
}

const medicineUnitLabels: Record<MedicineUnit, string> = {
  [MedicineUnit.Other]: "Khác",
  [MedicineUnit.Tablet]: "Viên",
  [MedicineUnit.Bottle]: "Chai",
  [MedicineUnit.Box]: "Hộp",
  [MedicineUnit.Tube]: "Tuýp",
  [MedicineUnit.Sachet]: "Gói",
};

function mapToMedicine(item: AdminMedicineItem): Medicine {
  return {
    Uuid: item.uuid,
    Image: item.image ?? "",
    Name: item.name ?? "",
    Description: item.description ?? "",
    Price: item.price ?? 0,
    Unit: item.unit,
    Status: item.status,
    IsInsured: item.isInsured,
    InsuranceCap: item.insuranceCap ?? 0,
    CreatedAt: new Date(item.createdAt),
    UpdatedAt: new Date(item.updatedAt),
    DeletedAt: item.deletedAt ? new Date(item.deletedAt) : new Date(0),
  };
}

function mapToMedicineRequest(item: Medicine): MedicineRequest {
  return {
    image: item.Image,
    name: item.Name.trim(),
    description: item.Description,
    price: item.Price,
    unit: item.Unit,
    status: item.Status,
    isInsured: item.IsInsured,
    insuranceCap: item.IsInsured ? item.InsuranceCap : 0,
  };
}

function createEmptyMedicine(): Medicine {
  const now = new Date();
  return {
    Uuid: "",
    Image: "",
    Name: "",
    Description: "",
    Price: 0,
    Unit: MedicineUnit.Other,
    Status: BaseStatus.Active,
    IsInsured: false,
    InsuranceCap: 0,
    CreatedAt: now,
    UpdatedAt: now,
    DeletedAt: new Date(0),
  };
}

export function MedicinesManagementScreen() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    adminMedicineService.getAll(controller.signal)
      .then((response) => {
        if (!active) return;
        setMedicines((response.data ?? response.Data ?? []).map(mapToMedicine));
      })
      .catch((requestError) => {
        if (!active) return;
        console.error("Lỗi khi tải danh mục thuốc:", requestError);
        setError("Không tải được danh mục thuốc");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  async function saveMedicine(item: Medicine) {
    const response = await adminMedicineService.update(item.Uuid, mapToMedicineRequest(item));
    const saved = response.data ?? response.Data;
    if (!saved) throw new Error("API không trả về thuốc đã cập nhật");
    return mapToMedicine(saved);
  }

  async function createMedicine(item: Medicine) {
    const response = await adminMedicineService.create(mapToMedicineRequest(item));
    const saved = response.data ?? response.Data;
    if (!saved) throw new Error("API không trả về thuốc đã tạo");
    return mapToMedicine(saved);
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Đang tải...</div>;
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>;

  return <CatalogManagementScreen config={{
    eyebrow: "Danh mục dược",
    title: "Danh mục thuốc",
    singular: "thuốc",
    description: "Quản lý thuốc gốc từ Medicine model; tồn kho vẫn được theo dõi riêng tại từng chi nhánh.",
    icon: <PackageSearch className="size-5" />,
    initialItems: medicines,
    columns: ["Thuốc", "Mô tả", "Đơn vị", "Đơn giá", "Bảo hiểm", "Cập nhật"],
    searchText: (item) => `${item.Name} ${item.Description} ${medicineUnitLabels[item.Unit]}`,
    renderCells: (item) => [item.Name, <span key="description" className="block max-w-72 whitespace-normal">{item.Description}</span>, medicineUnitLabels[item.Unit], moneyFormatter.format(item.Price), item.IsInsured ? `${Math.round(item.InsuranceCap * 100)}%` : "Không", dateFormatter.format(item.UpdatedAt)],
    renderDetail: (item) => <><CommonDetail item={item}><DetailItem label="Đơn vị" value={medicineUnitLabels[item.Unit]} /><DetailItem label="Đơn giá" value={moneyFormatter.format(item.Price)} /><DetailItem label="Bảo hiểm" value={item.IsInsured ? `Có, tối đa ${Math.round(item.InsuranceCap * 100)}%` : "Không"} /><DetailItem label="Hình ảnh" value={item.Image || "Chưa cập nhật"} /></CommonDetail><section className="rounded-lg border p-5"><h3 className="mb-2 font-semibold text-[#173b57]">Mô tả thuốc</h3><p className="text-sm leading-6 text-muted-foreground">{item.Description || "Đang cập nhật"}</p></section></>,
    renderForm: (item, update) => <><Field label="Tên thuốc"><Input required value={item.Name} onChange={(event) => update("Name", event.target.value)} /></Field><Field label="Đơn vị"><select value={item.Unit} onChange={(event) => update("Unit", event.target.value as MedicineUnit)} className="h-10 w-full rounded-md border bg-white px-3 text-sm">{Object.values(MedicineUnit).map((unit) => <option key={unit} value={unit}>{medicineUnitLabels[unit]}</option>)}</select></Field><Field label="Đơn giá"><Input required min={0} type="number" value={item.Price} onChange={(event) => update("Price", Number(event.target.value))} /></Field><Field label="Trạng thái"><StatusField value={item.Status} onChange={(value) => update("Status", value)} /></Field><Field label="Mức chi trả bảo hiểm (0-1)"><Input min={0} max={1} step={0.1} type="number" disabled={!item.IsInsured} value={item.InsuranceCap} onChange={(event) => update("InsuranceCap", Number(event.target.value))} /></Field><Field label="Bảo hiểm"><label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm"><input type="checkbox" checked={item.IsInsured} onChange={(event) => update("IsInsured", event.target.checked)} />Áp dụng bảo hiểm</label></Field><Field label="URL hình ảnh" wide><Input value={item.Image} onChange={(event) => update("Image", event.target.value)} /></Field><Field label="Mô tả" wide><Textarea value={item.Description} onChange={(event) => update("Description", event.target.value)} /></Field></>,
    createDraft: createEmptyMedicine,
    onCreate: createMedicine,
    onSave: saveMedicine,
    onDelete: (item) => adminMedicineService.delete(item.Uuid),
    onRestore: (item) => adminMedicineService.restore(item.Uuid),
  }} />;
}
