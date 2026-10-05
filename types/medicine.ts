export enum StockStatusFilter {
    InStock = 1,
    LowStock = 2,
    OutOfStock = 3,
}

export interface MedicineDto {
    uuid: string;
    name: string;
    unit: string;
    price: number;
    stock: number;
    minStock: number;
    status: StockStatusFilter;
}

export interface MedicineDetailDto extends MedicineDto {
    isInsured: boolean;
    insuranceCap: string;
    description: string | null;
    imageUrl: string | null;
}

export interface PaginatedResult<T> {
    items: T[];
    totalCount: number;
    pageIndex: number;
    pageSize: number;
    totalPages: number;
}

export interface MedicineQueryDto {
    search?: string;
    unit?: string;
    stockStatus?: StockStatusFilter;
    pageIndex: number;
    pageSize: number;
}