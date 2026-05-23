export class InformCompanyFilterType {
    items_per_page?: number;
    page?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}