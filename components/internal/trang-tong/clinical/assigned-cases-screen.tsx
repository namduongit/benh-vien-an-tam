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
import { CheckCircle2, Clock3, FilePlus2, Save } from "lucide-react";

function Field({
    label,
    defaultValue,
    type = "text",
}: {
    label: string;
    defaultValue?: string;
    type?: string;
}) {
    return (
        <div className= "space-y-2" >
        <Label>{ label } </Label>
        < Input type = { type } defaultValue = { defaultValue } />
            </div>
  );
}

export function AssignedCasesScreen() {
    return (
        <div className= "space-y-6" >
        <PortalPageHeader
        eyebrow="Ca đang xử lý · 09:30"
    title = "Nguyễn Thị Lan"
    description = "Mã y tế BN-10248 · Nữ · Lịch được phân công trực tiếp cho bạn."
    actions = {
          <>
        <PortalAction>Hủy ca có lý do </PortalAction>
            < PortalAction variant = "default" >
            <CheckCircle2 className="mr-2 size-4" /> Hoàn thành ca
                </PortalAction>
                </>
}
      />
    < div className = "grid gap-6 xl:grid-cols-[0.8fr_1.2fr]" >
        <div className="space-y-6" >
            <PortalSection title="Thông tin lượt khám" >
                <DetailGrid>
                <DetailItem label="Thời gian" value = "09:30 · 23/09/2026" />
                    <DetailItem label="Phòng" value = "P.203" />
                        <DetailItem label="Loại lịch" value = "Khám theo bác sĩ" />
                            <DetailItem
                label="Trạng thái"
value = {< StatusPill tone = "blue" > Đã check -in </StatusPill>}
              />
    < DetailItem
label = "Ghi chú đặt lịch"
value = "Đau ngực nhẹ khi vận động trong 3 ngày gần đây."
    />
    <DetailItem label="Mã lịch" value = "APT-DOC-10248" />
        </DetailGrid>
        </PortalSection>

        < PortalSection title = "Lịch liên quan gần đây" >
            <div className="divide-y" >
            {
                [
                "12/06/2026 · Khám tim mạch · Hoàn thành",
                "08/02/2026 · Điện tim · Hoàn thành",
              ].map((item) => (
                    <div key= { item } className = "flex items-center gap-3 px-5 py-4 text-sm" >
                    <Clock3 className="size-4 text-primary" />
                    <span>{ item } </span>
                </div>
                ))
            }
                </div>
                </PortalSection>
                </div>

                < PortalSection
title = "Kê đơn cho ca khám"
description = "Chỉ có thể chỉnh sửa khi đơn còn trạng thái chưa thanh toán."
    >
    <div className="space-y-5 p-5" >
        <div className="grid gap-4 sm:grid-cols-[1fr_7rem_7rem]" >
            <Field label="Thuốc" defaultValue = "Paracetamol 500mg" />
                <Field label="Số lượng" defaultValue = "10" type = "number" />
                    <Field label="Đơn vị" defaultValue = "Viên" />
                        </div>

                        < div className = "grid gap-4 sm:grid-cols-3" >
                            <Field label="Mỗi lần" defaultValue = "1" type = "number" />
                                <Field label="Lần / ngày" defaultValue = "2" type = "number" />
                                    <Field label="Số ngày" defaultValue = "5" type = "number" />
                                        </div>

                                        < div className = "space-y-2" >
                                            <Label htmlFor="doctor-medicine-note" > Hướng dẫn sử dụng </Label>
                                                < Input id = "doctor-medicine-note" defaultValue = "Uống sau ăn sáng và tối" />
                                                    </div>

                                                    < button className = "flex w-full items-center justify-center gap-2 border border-dashed border-primary/40 bg-secondary/50 py-3 text-sm font-semibold text-primary hover:bg-secondary" >
                                                        <FilePlus2 className="size-4" /> Thêm thuốc vào đơn
                                                            </button>

                                                            < div className = "space-y-2" >
                                                                <Label htmlFor="prescription-note" > Ghi chú đơn thuốc </Label>
                                                                    < Textarea id = "prescription-note" rows = { 4} placeholder = "Lưu ý chung cho người bệnh" />
                                                                        </div>

                                                                        < div className = "flex justify-end" >
                                                                            <PortalAction variant="default" >
                                                                                <Save className="mr-2 size-4" /> Lưu đơn thuốc
                                                                                    </PortalAction>
                                                                                    </div>
                                                                                    </div>
                                                                                    </PortalSection>
                                                                                    </div>
                                                                                    </div>
  );
}