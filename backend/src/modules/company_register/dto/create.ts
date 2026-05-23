export class CreateCompanyRegistrationDto {
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  source?: string;

  companyName: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  recruitmentNeeds?: string;
  adminNote?: string;

  status?: string;
  createdById?: string; // nhân viên tạo hồ sơ
  is_active?: boolean;
}