"use client";

import { ListFilter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type DiscoveryFilter = {
  key: string;
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
};

type DiscoveryFiltersProps = {
  pathname: string;
  currentParams: string;
  filters: DiscoveryFilter[];
};

const allValue = "__all__";

export function DiscoveryFilters({
  pathname,
  currentParams,
  filters,
}: DiscoveryFiltersProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const params = new URLSearchParams(currentParams);
    return Object.fromEntries(
      filters.map((filter) => [filter.key, params.get(filter.key) || allValue]),
    );
  });

  function applyFilters() {
    const params = new URLSearchParams(currentParams);
    params.delete("page");
    filters.forEach((filter) => {
      const value = values[filter.key];
      if (value && value !== allValue) params.set(filter.key, value);
      else params.delete(filter.key);
    });
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    setOpen(false);
  }

  function clearFilters() {
    const params = new URLSearchParams(currentParams);
    params.delete("page");
    filters.forEach((filter) => params.delete(filter.key));
    setValues(Object.fromEntries(filters.map((filter) => [filter.key, allValue])));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    setOpen(false);
  }

  function renderControls(prefix: string) {
    return filters.map((filter) => {
      const id = `${prefix}-filter-${filter.key}`;
      return (
        <div key={filter.key} className="space-y-2">
          <Label htmlFor={id}>{filter.label}</Label>
          <Select
            items={[
              { value: allValue, label: filter.allLabel },
              ...filter.options,
            ]}
            value={values[filter.key] || allValue}
            onValueChange={(value) =>
              setValues((current) => ({
                ...current,
                [filter.key]: value || allValue,
              }))
            }
          >
            <SelectTrigger id={id} className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={allValue}>{filter.allLabel}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    });
  }

  return (
    <>
      <div className="hidden rounded-xl border bg-card p-4 lg:block">
        <h2 className="font-semibold">Bộ lọc</h2>
        <div className="mt-4 space-y-4">{renderControls("desktop")}</div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={clearFilters}>
            Xóa lọc
          </Button>
          <Button type="button" onClick={applyFilters}>
            Áp dụng
          </Button>
        </div>
      </div>

      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button type="button" variant="outline" className="h-10 w-full" />
            }
          >
            <ListFilter aria-hidden="true" />
            Bộ lọc
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(22rem,90vw)]">
            <SheetHeader>
              <SheetTitle>Lọc kết quả</SheetTitle>
              <SheetDescription>
                Chọn các điều kiện phù hợp rồi áp dụng.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 overflow-y-auto px-4">
              {renderControls("mobile")}
            </div>
            <SheetFooter className="grid grid-cols-2">
              <Button type="button" variant="outline" onClick={clearFilters}>
                Xóa lọc
              </Button>
              <Button type="button" onClick={applyFilters}>
                Áp dụng
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
