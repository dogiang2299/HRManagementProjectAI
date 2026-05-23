export interface ICompanyInfoCard {
  id?: string;
  full_name?: string | null;
  acronym_name?: string | null;
  image_logo?: string | null;
  address?: string | null;
  short_address?: string | null;
    field_of_activity_id?: string | null;
    field_of_activity_group?: {
        id: string;
        name_group: string;
        slug?: string | null;
    } | null;
    field_of_activity?: string | null;
}

export interface ICompanyDetail extends ICompanyInfoCard {
    infor_code?: string | null;
    business_type?: string | null;
    tax_idennumber?: string | null;
    code_company?: string | null;

    date_stablish?: string | null;
    code_business?: string | null;
    date_of_issue?: string | null;
    place_of_issue?: string | null;
    employee_quantity?: string | null;

    phone_number?: string | null;
    fax?: string | null;
    email?: string | null;
    website?: string | null;
    status?: string | null;
    description?: string | null;
    map_link?: string | null;
    is_active?: boolean;
}

export type ICompanyInformData = ICompanyInfoCard;
export type Pagination = {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number
}

export type GetCompanyInfromParams = {
    pages?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' | string;
}

export type GetCompanyInformResponse = {
    data: ICompanyInfoCard[];
    pagination: Pagination
}
