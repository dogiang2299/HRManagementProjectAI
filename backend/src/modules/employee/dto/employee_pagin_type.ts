import { Employee, EmployeeRole, InforCompany, Role } from "@prisma/client";

export type EmployeeWithRelations = Employee & {
    company?: InforCompany | null;
    roles?: Array<EmployeeRole & { role?: Role | null }>;
};

export class EmployeePaginType {
    total_items: number;;
        data: EmployeeWithRelations[];
    current_page: number;
    items_per_page: number;
}