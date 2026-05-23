import { Employee, InforCompany } from "@prisma/client";

export type InforCompanyWithRelations = InforCompany & {
    field_of_activity_group?: {
        id: string;
        name_group: string;
        slug: string | null;
    } | null;
    employees?: Employee[];
};

export class InformCompanyPaginType {
    total_items: number;
    data: InforCompanyWithRelations[];
    current_page: number;
    item_per_page: number;
}