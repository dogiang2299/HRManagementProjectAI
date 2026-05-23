import type { DetailField, DetailSection } from "../types";

export const INFOR_COMPANY_DETAIL_SECTIONS: Record<string, DetailSection> = {
  company: {
    title: "Company",
    fields: [
      { key: "infor_code", label: "Company Code", note: "Internal company code" },
      { key: "full_name", label: "Company Name", note: "Full company name" },
      { key: "acronym_name", label: "Short Name", note: "Abbreviated or trading name" },
      { key: "description", label: "Description", note: "Company description" },
      { key: "status", label: "Status", note: "Display status" },
      { key: "image_logo", label: "Company Logo", note: "Company logo", type: "image" },
      // { key: "is_active", label: "Visible On UI", note: "Hidden/shown by soft delete", type: "boolean" },
    ] satisfies DetailField[],
  },
  businessRegistration: {
    title: "Business Registration",
    fields: [
      { key: "code_business", label: "Business License No.", note: "Business license number" },
      { key: "date_of_issue", label: "Issue Date", note: "Issue date" },
      { key: "place_of_issue", label: "Issued By", note: "Issuing authority" },
    ] satisfies DetailField[],
  },
  contact: {
    title: "Contact",
    fields: [
      { key: "address", label: "Address", note: "Address" },
      { key: "short_address", label: "Short Address", note: "Short address" },
      { key: "email", label: "Email", note: "Email" },
      { key: "website", label: "Website", note: "Website" },
    ] satisfies DetailField[],
  },
};

export const formatDate = (value?: string | Date | null) => {
    if(!value){
        return '/';
    }
    const date = new Date(value);
    if(isNaN(date.getTime())) return '/';

    return date.toLocaleDateString('vi-VN');
}
