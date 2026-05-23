import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Controller } from "react-hook-form";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormErrorMessage,
  Input,
  SimpleGrid,
  Select,
  Divider,
  Text,
  Textarea,
  Box,
  Image,
  Stack,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import type { BussinessType, IInforCompany, InforCompanyFormValues } from "../types";
import { BUSSINESS_TYPE, BUSINESS_TYPE_OPTIONS } from "../constant";
import { useCreateCompany } from "../api/add_company";
import { useUpdateCompany } from "../api/update_company";
import { useUploadCompanyLogo } from "../api/upload_logo";
import { BASE_URL } from "../../../../constant/config";
import theme from "../../../../theme";
import LabelItem from "../../../../components/common/Label";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { type InforCompanyStatusType, INFOR_COMPANY_STATUS_DISPLAY } from "../../../../constant";
import SearchCombobox from "../../../../components/common/SearchCombobox";
import { useGetPositionGroups } from "../api/get_position_group";


interface InformModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  data?: IInforCompany;
  onSuccess?: () => void;
}

const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");
const safeStr = (v?: string | null) => v ?? "";
const INPUT_BORDER_COLOR = "#E2E8F0";
const PROVINCES = [
  "Ha Noi",
  "Ho Chi Minh",
  "Bac Ninh",
  "Dong Nai",
  "Hung Yen",
  "Da Nang",
  "Hai Phong",
  "An Giang",
  "Ca Mau",
  "Can Tho",
  "Cao Bang",
  "Dak Lak",
  "Dong Thap",
  "Gia Lai",
  "Ha Tinh",
  "Khanh Hoa",
  "Lai Chau",
  "Lam Dong",
  "Lang Son",
  "Lao Cai",
  "Nghe An",
  "Ninh Binh",
  "Phu Tho",
  "Quang Ngai",
  "Quang Ninh",
  "Quang Tri",
  "Son La",
  "Tay Ninh",
  "Thai Nguyen",
  "Thanh Hoa",
  "Hue",
  "Tuyen Quang",
  "Vinh Long",
];

const provinceOptions = PROVINCES.map((province) => ({
  id: province,
  name: province,
}));

const toAbsoluteUploadUrl = (value?: string | null) => {
  const raw = (value || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;

  const cleaned = raw.startsWith("/") ? raw : `/uploads/logo/${raw}`;
  if (!BASE_URL) return cleaned;

  try {
    const origin = new URL(BASE_URL).origin;
    return `${origin}${cleaned}`;
  } catch {
    return cleaned;
  }
};

export default function InformModal({
  isOpen,
  onClose,
  mode,
  data,
  onSuccess,
}: InformModalProps) {
  const notify = useNotify();
  const { mutateAsync: createInform } = useCreateCompany();
  const { mutateAsync: updateInform } = useUpdateCompany();
  const uploadLogoMutation = useUploadCompanyLogo();
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);

  const defaultValues: InforCompanyFormValues = useMemo(
    () => ({
      infor_code: "",

      full_name: "",
      acronym_name: "",
      business_type: BUSSINESS_TYPE.LLC_ONE_MEMBER as BussinessType,
      tax_idennumber: "",
      code_company: "",

      date_stablish: "",
      image_logo: "",

      code_business: "",
      date_of_issue: "",
      place_of_issue: "",
      employee_quantity: "",

      address: "",
      short_address: "",
      map_link: "",
      phone_number: "",
      fax: "",
      email: "",
      website: "",

      status: "",
      field_of_activity_id: "",
      description: "",

      is_active: true,
    }),
    []
  );
  const normalizeVNPhone = (value: string) => {
  const digits = (value || "").replace(/\D/g, ""); // chỉ lấy số
  // 84xxxx -> 0xxxx (VN)
  if (digits.startsWith("84")) return "0" + digits.slice(2);
  if (digits.startsWith("0")) return digits;
  return digits;
};
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InforCompanyFormValues>({
    mode: "onChange",
    defaultValues,
  });

  const { data: positionGroupsData, isLoading: isPositionGroupLoading } = useGetPositionGroups(
    { pages: 1, limit: 200, search: "" },
    { enabled: isOpen },
  );

  const positionGroupOptions = useMemo(() => {
    const groups = positionGroupsData?.data ?? [];
    return groups.map((group) => ({
      id: group.id,
      name: group.name_group,
    }));
  }, [positionGroupsData?.data]);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && data) {
      reset({
        infor_code: safeStr(data.infor_code),

        full_name: safeStr(data.full_name),
        acronym_name: safeStr(data.acronym_name),
        business_type:
          (data.business_type as BussinessType) ??
          (BUSSINESS_TYPE.LLC_ONE_MEMBER as BussinessType),
        tax_idennumber: safeStr(data.tax_idennumber),
        code_company: safeStr(data.code_company),

        date_stablish: toDateInput(data.date_stablish),
        image_logo: safeStr(data.image_logo),

        code_business: safeStr(data.code_business),
        date_of_issue: toDateInput(data.date_of_issue),
        place_of_issue: safeStr(data.place_of_issue),
        employee_quantity: safeStr(data.employee_quantity),

        address: safeStr(data.address),
        short_address: safeStr(data.short_address),
        map_link: safeStr(data.map_link),
        phone_number: safeStr(data.phone_number),
        fax: safeStr(data.fax),
        email: safeStr(data.email),
        website: safeStr(data.website),

        status: (data.status as InforCompanyStatusType) ?? (INFOR_COMPANY_STATUS_DISPLAY.Active as InforCompanyStatusType),
        field_of_activity_id: data.field_of_activity_id ?? data.field_of_activity_group?.id ?? "",
        description: safeStr(data.description),

        is_active: Boolean(data.is_active),
      });
      // Set logo preview for edit mode
      if (data.image_logo) {
        setLogoPreview(toAbsoluteUploadUrl(data.image_logo));
      } else {
        setLogoPreview(null);
      }
      setSelectedLogoFile(null);
    } else {
      reset(defaultValues);
      setLogoPreview(null);
      setSelectedLogoFile(null);
    }
  }, [isOpen, mode, data, reset, defaultValues]);

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);

      if (mode === "edit" && data?.id) {
        // Immediate upload in edit mode
        const response = await uploadLogoMutation.mutateAsync({
          companyId: data.id,
          file,
        });

        if (response.logo_url) {
          setLogoPreview(toAbsoluteUploadUrl(response.logo_url));
        }
        if (response.image_logo) {
          setValue("image_logo", response.image_logo);
        }

        notify({ message: "Logo uploaded successfully", type: "success" });
      } else {
        // In add mode, just store file and show preview
        setSelectedLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        notify({ message: "Logo preview ready. Click Save to create company.", type: "info" });
      }
    } catch (error) {
      notify({ message: "Failed to upload logo", type: "error" });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const onSubmit = async (values: InforCompanyFormValues) => {
    setIsSubmittingForm(true);

    // ✅ Payload: không gửi infor_code vì backend auto generate (service createInfor)
    const payload = {
      full_name: values.full_name.trim() || null,
      acronym_name: values.acronym_name.trim() || null,
      business_type: values.business_type ?? null,
      tax_idennumber: values.tax_idennumber.trim() || null,
      code_company: values.code_company.trim() || null,

      // date input already "YYYY-MM-DD" => backend new Date(date)
      date_stablish: values.date_stablish ? values.date_stablish : null,

      code_business: values.code_business.trim() || null,
      date_of_issue: values.date_of_issue ? values.date_of_issue : null,
      place_of_issue: values.place_of_issue.trim() || null,
      employee_quantity: values.employee_quantity.trim() || null,

      address: values.address.trim() || null,
      short_address: values.short_address.trim() || null,
      map_link: values.map_link.trim() || null,
      phone_number: normalizeVNPhone(values.phone_number),
      fax: values.fax.trim() || null,
      email: values.email.trim() || null,
      website: values.website.trim() || null,

      status: values.status.trim() || null,
      field_of_activity_id: values.field_of_activity_id || null,
      description: values.description.trim() || null,

      is_active: Boolean(values.is_active),
    };

    try {
      if (mode === "add") {
        const newCompany = await createInform(payload as any);
        notify({ message: "Company created successfully", type: "success" });

        // Upload logo if file was selected
        if (selectedLogoFile && newCompany?.id) {
          try {
            await uploadLogoMutation.mutateAsync({
              companyId: newCompany.id,
              file: selectedLogoFile,
            });
            notify({ message: "Logo uploaded successfully", type: "success" });
          } catch (logoErr) {
            // Logo upload failed but company was created
            notify({ message: "Company created but logo upload failed", type: "warning" });
          }
        }
      } else {
        if (!data?.id) return;
        await updateInform({ id: data.id, data: payload as any });
        notify({ message: "Company updated successfully", type: "success" });
      }

      onSuccess?.();
      reset(defaultValues);
      setSelectedLogoFile(null);
      setLogoPreview(null);
      onClose();
    } catch (err: any) {
      let msg = "An error occurred";
      if (err?.response?.data) {
        const d = err.response.data;
        if (Array.isArray(d.message)) msg = d.message.join(", ");
        else if (typeof d.message === "string") msg = d.message;
        else if (d.message) msg = d.message;
      }
      notify({ message: msg, type: "error" });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent
        maxW={{ base: "95%", md: "860px" }}
        w="100%"
        borderRadius="18px"
        maxH="85vh"
        overflow="hidden"
        display="flex"
        flexDirection="column"
        sx={{
          "input.chakra-input, select.chakra-select, textarea.chakra-textarea": {
            h: "37px",
            borderRadius: "6px",
            borderColor: `${INPUT_BORDER_COLOR} !important`,
          },
          ".react-tel-input .form-control": {
            height: "36px !important",
            borderColor: `${INPUT_BORDER_COLOR} !important`,
          },
          ".react-tel-input .flag-dropdown": {
            height: "36px",
            borderColor: `${INPUT_BORDER_COLOR} !important`,
          },
        }}
      >
        <ModalHeader
          color={theme.colors.primary}
          textAlign="center"
          fontWeight={700}
          fontSize="lg"
          py={4}
          flexShrink={0}
        >
          {mode === "add" ? "ADD INFORMATION COMPANY" : "UPDATE INFORMATION COMPANY"}
        </ModalHeader>

        <ModalCloseButton />

        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
          <ModalBody pb={4} px={{ base: 4, md: 6 }} flex="1" minH={0} overflowY="auto">
            {/* 1) COMPANY INFO */}
            <Text fontWeight={700} mb={2}>
              Company information
            </Text>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                    <LabelItem label="Company Code (Auto)"></LabelItem>
                    <Input
                        value={data?.infor_code ?? "Auto generate after save"}
                        isReadOnly
                        bg="gray.50"
                        borderColor="#d4d4d8cc"
                        size="sm"
                    />
                </FormControl>


              <FormControl isInvalid={!!errors.full_name}>
                <LabelItem label="Full name" required />
                <Input
                  placeholder="Enter full name"
                  borderColor="#d4d4d8cc"
                  size="sm"
                  {...register("full_name", {
                    required: "Full name is required",
                    maxLength: { value: 255, message: "Max 255 characters" },
                  })}
                />
                <FormErrorMessage>{errors.full_name?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.acronym_name}>
                <LabelItem label="Acronym name" />
                <Input
                  placeholder="Enter acronym"
                  borderColor="#d4d4d8cc"
                  size="sm"
                  {...register("acronym_name", {
                    maxLength: { value: 50, message: "Max 50 characters" },
                  })}
                />
                <FormErrorMessage>{errors.acronym_name?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.business_type}>
                <LabelItem label="Business type" required />
                <Controller
                  name="business_type"
                  control={control}
                  rules={{ required: "Business type is required" }}
                  render={({ field }) => (
                    <SearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      options={BUSINESS_TYPE_OPTIONS.map((option) => ({
                        id: option.value,
                        name: option.label,
                      }))}
                      placeholder="Select business type"
                      size="sm"
                      isClearable={false}
                    />
                  )}
                />
                <FormErrorMessage>{errors.business_type?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.tax_idennumber}>
                <LabelItem label="Tax identification number" />
                <Input
                  placeholder="Enter tax id"
                  borderColor="#d4d4d8cc"
                  size="sm"
                  {...register("tax_idennumber", {
                    maxLength: { value: 13, message: "Max 13 characters" },
                  })}
                />
                <FormErrorMessage>{errors.tax_idennumber?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.code_company}>
                <LabelItem label="Business registration code" />
                <Input
                  placeholder="Enter registration code"
                  borderColor="#d4d4d8cc"
                  size="sm"
                  {...register("code_company", {
                    maxLength: { value: 10, message: "Max 10 characters" },
                  })}
                />
                <FormErrorMessage>{errors.code_company?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.date_stablish}>
                <LabelItem label="Establish date" />
                <Input
                  type="date"
                  borderColor="#d4d4d8cc"
                  size="sm"
                  {...register("date_stablish")}
                />
                <FormErrorMessage>{errors.date_stablish?.message}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <LabelItem label="Company Logo" />
                <Stack spacing={3}>
                  <Box
                    borderWidth="1px"
                    borderRadius="6px"
                    borderColor="#d4d4d8cc"
                    borderStyle="dashed"
                    p={4}
                    textAlign="center"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ bg: "#f9fafb", borderColor: theme.colors.primary }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      disabled={isUploadingLogo}
                      style={{ display: "none" }}
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      style={{ cursor: isUploadingLogo ? "not-allowed" : "pointer", display: "block" }}
                    >
                      <Text fontSize="sm" color={isUploadingLogo ? "gray.400" : "gray.600"}>
                        {isUploadingLogo ? "Uploading..." : "Click to upload logo (JPG, PNG, GIF, WebP)"}
                      </Text>
                    </label>
                  </Box>

                  {logoPreview && (
                    <Box
                      borderWidth="1px"
                      borderRadius="6px"
                      borderColor="#d4d4d8cc"
                      p={2}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg="gray.50"
                      minH="120px"
                    >
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        maxH="100px"
                        objectFit="contain"
                      />
                    </Box>
                  )}
                </Stack>
              </FormControl>
            </SimpleGrid>

            <Divider my={4} />

            {/* 2) BUSINESS LICENSE */}
            <Text fontWeight={700} mb={2}>
              Business registration / license
            </Text>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isInvalid={!!errors.code_business}>
                <LabelItem label="License number" />
                <Input
                  placeholder="Enter license number"
                  borderColor="#d4d4d8cc"
                  size="sm"
                  {...register("code_business")}
                />
                <FormErrorMessage>{errors.code_business?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.date_of_issue}>
                <LabelItem label="Date of issue" />
                <Input
                  type="date"
                  borderColor="#d4d4d8cc"
                  size="sm"
                  {...register("date_of_issue")}
                />
                <FormErrorMessage>{errors.date_of_issue?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.place_of_issue}>
                <LabelItem label="Place of issue" />
                <Input
                  placeholder="Enter place"
                  borderColor="#d4d4d8cc"
                  size="sm"
                  {...register("place_of_issue")}
                />
                <FormErrorMessage>{errors.place_of_issue?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.employee_quantity}>
                <LabelItem label="Employee quantity" />
                <Input
                  placeholder="Ex: 100 - 500 employees"
                  borderColor="#d4d4d8cc"
                  size="sm"
                  {...register("employee_quantity", {
                    maxLength: { value: 255, message: "Max 255 characters" },
                  })}
                />
                <FormErrorMessage>{errors.employee_quantity?.message}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            <Divider my={4} />

            {/* 3) CONTACT */}
            <Text fontWeight={700} mb={2}>
              Contact information
            </Text>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isInvalid={!!errors.address}>
                <LabelItem label="Address" required />
                <Input
                  placeholder="Enter address"
                  borderColor="#d4d4d8cc"
                  size="sm"
                  {...register("address", {
                    required: "Address is required",
                  })}
                />
                <FormErrorMessage>{errors.address?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.short_address}>
                <LabelItem label="Short address" required />
                <Controller
                  name="short_address"
                  control={control}
                  rules={{
                    required: "Short address is required",
                  }}
                  render={({ field }) => (
                    <SearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      options={provinceOptions}
                      placeholder="Select short address"
                      size="sm"
                      isClearable={false}
                    />
                  )}
                />
                <FormErrorMessage>{errors.short_address?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.map_link}>
                <LabelItem label="Map link" />
                <Input
                  placeholder="https://maps.google.com/..."
                  borderColor="#d4d4d8cc"
                  size="sm"
                  {...register("map_link")}
                />
                <FormErrorMessage>{errors.map_link?.message}</FormErrorMessage>
              </FormControl>

<FormControl isInvalid={!!errors.phone_number}>
  <LabelItem label="Phone number" required />

  <Controller
    name="phone_number"
    control={control}
    rules={{
      required: "Phone number is required",
      validate: (v) => {
        // v kiểu: "84917261221" (thường không có dấu +)
        const digits = (v || "").replace(/\D/g, "");
        if (digits.length < 9) return "Phone number is too short";
        if (digits.length > 15) return "Max 15 digits";
        return true;
      },
    }}
    render={({ field, fieldState }) => {
      const isError = fieldState.invalid;

      return (
        <PhoneInput
            country="vn"
            value={field.value || ""}
            onChange={(value) => field.onChange(value)}
            onBlur={field.onBlur}
            enableSearch
            specialLabel=""
            containerStyle={{ width: "100%" }}
            inputStyle={{
                width: "100%",
              height: "36px",
                fontSize: "14px",
                borderRadius: "3px",
                border: `1px solid ${isError ? "#E53E3E" : "#d4d4d8cc"}`,
                paddingLeft: "52px",         // chừa chỗ cho cờ
                background: "white",
            }}
            buttonStyle={{
                width: "44px",
                borderRadius: "3px 0 0 3px",
                border: `1px solid ${isError ? "#E53E3E" : "#d4d4d8cc"}`,
                background: "white",
            }}
            dropdownStyle={{
                width: "260px",
                borderRadius: "8px",
            }}
            />
      );
    }}
  />

  <FormErrorMessage>{errors.phone_number?.message as any}</FormErrorMessage>
</FormControl>
              <FormControl isInvalid={!!errors.email}>
                <LabelItem label="Email" />
                <Input
                  placeholder="Enter email"
                  borderColor="#d4d4d8cc"
                  size="sm"
                  {...register("email")}
                />
                <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.website}>
                <LabelItem label="Website" />
                <Input
                  placeholder="https://..."
                  borderColor="#d4d4d8cc"
                  size="sm"
                  {...register("website")}
                />
                <FormErrorMessage>{errors.website?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.fax}>
                <LabelItem label="Fax" />
                <Input
                  placeholder="Enter fax"
                  borderColor="#d4d4d8cc"
                  size="sm"
                  {...register("fax")}
                />
                <FormErrorMessage>{errors.fax?.message}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            <Divider my={4} />

            {/* 4) OTHER */}
            <Text fontWeight={700} mb={2}>
              Other
            </Text>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isInvalid={!!errors.status}>
                <LabelItem label="Status" />
                <Select size="sm" {...register("status")}>
  <option value={INFOR_COMPANY_STATUS_DISPLAY.Active}>Active</option>
  <option value={INFOR_COMPANY_STATUS_DISPLAY.Inactive}>Inactive</option>
</Select>
                <FormErrorMessage>{errors.status?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.field_of_activity_id}>
                <LabelItem label="Field of activity" />
                <Controller
                  name="field_of_activity_id"
                  control={control}
                  render={({ field }) => (
                    <SearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      options={positionGroupOptions}
                      placeholder="Select field group"
                      size="sm"
                      isLoading={isPositionGroupLoading}
                    />
                  )}
                />
                <FormErrorMessage>{errors.field_of_activity_id?.message}</FormErrorMessage>
              </FormControl>

              <FormControl
                isInvalid={!!errors.description}
                gridColumn={{ base: "auto", md: "1 / -1" }}
              >
                <LabelItem label="Description" />
                <Textarea
                  placeholder="Enter company description"
                  borderColor="#d4d4d8cc"
                  size="sm"
                  minH="110px"
                  resize="vertical"
                  {...register("description")}
                />
                <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>
          </ModalBody>

          <ModalFooter flexShrink={0} borderTop="1px solid" borderColor="#E2E8F0">
            <Button size="sm" mr={3} onClick={onClose}>
              CANCEL
            </Button>
            <Button
              bg={theme.colors.primary}
              color={theme.colors.white}
              type="submit"
              isLoading={isSubmitting || isSubmittingForm}
              size="sm"
            >
              SAVE
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
