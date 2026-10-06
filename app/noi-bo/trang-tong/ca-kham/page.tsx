import { ArrowLeft, CalendarSearch } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function Page() {
  return (
    <section className="flex min-h-[65vh] items-center justify-center">
      <div className="w-full max-w-xl border bg-white px-6 py-12 text-center sm:px-10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
          <CalendarSearch className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#173b57]">
          Chưa chọn ca khám
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Vui lòng chọn một ca từ lịch khám được phân công để xem thông tin,
          chỉ định dịch vụ và kê đơn thuốc.
        </p>
        <Link
          href="/noi-bo/trang-tong/lich-kham"
          className={`${buttonVariants({ variant: "default" })} mt-6`}
        >
          <ArrowLeft aria-hidden="true" /> Về lịch khám của tôi
        </Link>
      </div>
    </section>
  );
}
