export interface IPositionItem {
    id: string;
    name_post?: string | null;
    position_code?: string | null;
}

export interface IPositionGroup {
    id: string;
    name_group: string;
    slug?: string | null;
    description?: string | null;
    created_at?: string;
    updated_at?: string;
    positions?: IPositionItem[];
}

export interface MainHeaderProps {
    logoSrc: string;
    isLoggedIn?: boolean;
    user?: {
        id?: string;
        employee_name?: string;
        avatar?: string;
        email?: string;
    } | null;
    groups?: IPositionGroup[];
    onLoginClick?: () => void;
    onRegisterClick?: () => void;
    onRecruiterClick?: () => void;
    onLogout?: () => void;
}

export type IGroupPositionData = IPositionGroup;
export type Pagination = {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
};

export type GetGroupPositionParams = {
    pages?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' | string;
};

export type GetGroupPositionResponse = {
    data: IPositionGroup[];
    pagination: Pagination;
};