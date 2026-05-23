import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Controller, useForm } from "react-hook-form";
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
  Divider,
  Text,
  Textarea,
  Box,
  Switch,
  Flex,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";

import theme from "../../../../theme";
import type { FormValues, ICompanyRegistrationRequest } from "../types";
import { useCreateCompanyRegister } from "../api/add_comregis";
import { useUpdateCompanyRegister } from "../api/update_comregis";
import { todayDateInput, safeStr, toDateInput, normalizeVNPhone } from "../utils";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import LabelItem from "../../../../components/common/Label";
import { COMPANY_REGISTRATION_STATUS_DISPLAY, CompanyRegistrationStatus, type CompanyRegistrationStatusType } from "../../../../constant";
import SearchCombobox from "../../../../components/common/SearchCombobox";



interface CompanyRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit" | "view";
  data?: ICompanyRegistrationRequest;
  onSuccess?: () => void;
}

export default function CompanyRegisterModal({
  isOpen,
  onClose,
  mode,
  data,
  onSuccess,
}: CompanyRegisterModalProps) {
  const notify = useNotify();
  const { mutateAsync: createRegister } = useCreateCompanyRegister();
  const { mutateAsync: updateRegister } = useUpdateCompanyRegister();
  const isViewMode = mode === "view";

  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const defaultValues: FormValues = useMemo(
    () => ({
      companyName: "",
      email: "",
      phone: "",
      address: "",
      website: "",
      recruitmentNeeds: "",
      source: "",
      status: CompanyRegistrationStatus.Pending,
      approvedAt: "",
      adminNote: "",
      is_active: true,
    }),
    []
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues,
  });

  const statusWatch = watch("status");
  const approvedAtWatch = watch("approvedAt");

  // auto fill approvedAt when status=approved
  useEffect(() => {
    if (!isOpen) return;

    if (statusWatch === CompanyRegistrationStatus.Approved) {
      if (!approvedAtWatch) setValue("approvedAt", todayDateInput(), { shouldDirty: true });
    } else {
      // nếu không approved thì clear approvedAt cho đúng logic (tuỳ bạn muốn giữ hay không)
      if (approvedAtWatch) setValue("approvedAt", "", { shouldDirty: true });
    }
  }, [isOpen, statusWatch, approvedAtWatch, setValue]);

  useEffect(() => {
    if (!isOpen) return;

    if ((mode === "edit" || mode === "view") && data) {
      reset({
        companyName: safeStr(data.companyName),
        email: safeStr(data.email),
        phone: safeStr(data.phone),
        address: safeStr(data.address),
        website: safeStr(data.website),
        recruitmentNeeds: safeStr(data.recruitmentNeeds),
        source: safeStr(data.source),
        status: (data.status as CompanyRegistrationStatusType) ?? CompanyRegistrationStatus.Pending,
        approvedAt: toDateInput(data.approvedAt as any),
        adminNote: safeStr(data.adminNote),
        is_active: Boolean(data.is_active),
      });
    } else {
      reset(defaultValues);
    }
  }, [isOpen, mode, data, reset, defaultValues]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmittingForm(true);

    if (mode === "add" && !values.phone.trim()) {
      notify({ message: "Phone is required to create employer account", type: "warning" });
      setIsSubmittingForm(false);
      return;
    }

    // payload gửi backend
    const payload = {
      contactName: values.companyName.trim(),
      contactEmail: values.email.trim(),
      contactPhone: values.phone ? normalizeVNPhone(values.phone) : "",
      companyName: values.companyName.trim(),
      email: values.email.trim(),
      phone: values.phone ? normalizeVNPhone(values.phone) : null,
      address: values.address.trim() || null,
      website: values.website.trim() || null,
      recruitmentNeeds: values.recruitmentNeeds.trim() || null,
      source: values.source.trim() || null,
      status: values.status,
      approvedAt: values.approvedAt ? values.approvedAt : null, // backend new Date()
      adminNote: values.adminNote.trim() || null,
      is_active: Boolean(values.is_active),
    };

    try {
      if (mode === "add") {
        await createRegister(payload as any);
        notify({ message: "Request created successfully", type: "success" });
      } else if (mode === "edit") {
        if (!data?.id) return;
        await updateRegister({ id: data.id, data: payload as any });
        notify({ message: "Request updated successfully", type: "success" });
      }

      onSuccess?.();
      reset(defaultValues);
      onClose();
    } catch (err: any) {
      let msg = "An error occurred";
      const d = err?.response?.data;
      if (d) {
        if (Array.isArray(d.message)) msg = d.message.join(", ");
        else if (typeof d.message === "string") msg = d.message;
        else if (d.message) msg = String(d.message);
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
      >
        <ModalHeader
          color={theme.colors.primary}
          textAlign="center"
          fontWeight={700}
          fontSize="lg"
          py={4}
          flexShrink={0}
        >
          {mode === "add"
            ? "ADD COMPANY REGISTRATION"
            : mode === "edit"
              ? "UPDATE COMPANY REGISTRATION"
              : "VIEW COMPANY REGISTRATION"}
        </ModalHeader>

        <ModalCloseButton />

        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
          <ModalBody pb={4} px={{ base: 4, md: 6 }} flex="1" minH={0} overflowY="auto">
            {/* 1) REQUEST INFO */}
            <Text fontWeight={700} mb={2}>
              Request information
            </Text>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isInvalid={!!errors.companyName}>
                <LabelItem label="Company name" required />
                <Input
                  placeholder="Enter company name"
                  borderColor="#d4d4d8cc"
                  size="md"
                  isReadOnly={isViewMode}
                  {...register("companyName", {
                    required: "Company name is required",
                    maxLength: { value: 255, message: "Max 255 characters" },
                  })}
                />
                <FormErrorMessage>{errors.companyName?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.email}>
                <LabelItem label="Email" required />
                <Input
                  placeholder="company@email.com"
                  borderColor="#d4d4d8cc"
                  size="md"
                  type="email"
                  isReadOnly={isViewMode}
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email format" },
                  })}
                />
                <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.phone}>
                <LabelItem label="Phone" />
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Box
                      border="1px solid"
                      borderColor="#d4d4d8cc"
                      borderRadius="md"
                      overflow="hidden"
                      _focusWithin={{ borderColor: theme.colors.primary }}
                    >
                      <PhoneInput
                        country={"vn"}
                        value={field.value}
                        onChange={(value) => {
                          if (!isViewMode) field.onChange(value);
                        }}
                        disabled={isViewMode}
                        inputStyle={{
                          width: "100%",
                          border: "none",
                          height: "32px",
                          fontSize: "14px",
                        }}
                        buttonStyle={{ border: "none" }}
                      />
                    </Box>
                  )}
                />
                <FormErrorMessage>{errors.phone?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.address}>
                <LabelItem label="Address" />
                <Input
                  placeholder="Enter address"
                  borderColor="#d4d4d8cc"
                  size="md"
                  isReadOnly={isViewMode}
                  {...register("address", { maxLength: { value: 300, message: "Max 300 characters" } })}
                />
                <FormErrorMessage>{errors.address?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.website}>
                <LabelItem label="Website" />
                <Input
                  placeholder="https://your-company.com"
                  borderColor="#d4d4d8cc"
                  size="md"
                  isReadOnly={isViewMode}
                  {...register("website", { maxLength: { value: 255, message: "Max 255 characters" } })}
                />
                <FormErrorMessage>{errors.website?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.source}>
                <LabelItem label="Source" />
                <Input
                  placeholder="Google, Facebook, Referral..."
                  borderColor="#d4d4d8cc"
                  size="md"
                  isReadOnly={isViewMode}
                  {...register("source", { maxLength: { value: 255, message: "Max 255 characters" } })}
                />
                <FormErrorMessage>{errors.source?.message}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            <FormControl isInvalid={!!errors.recruitmentNeeds} mt={4}>
              <LabelItem label="Recruitment needs" />
              <Textarea
                placeholder="Describe hiring needs"
                borderColor="#d4d4d8cc"
                size="md"
                rows={3}
                isReadOnly={isViewMode}
                {...register("recruitmentNeeds", {
                  maxLength: { value: 2000, message: "Max 2000 characters" },
                })}
              />
              <FormErrorMessage>{errors.recruitmentNeeds?.message}</FormErrorMessage>
            </FormControl>

            <Divider my={4} />

            {/* 2) STATUS */}
            <Text fontWeight={700} mb={2}>
              Status & Approval
            </Text>

            <Flex
              gap={6}
              align={{ base: "stretch", md: "flex-end" }}
              direction={{ base: "column", md: "row" }}
              flexWrap="wrap"
            >
              <FormControl isInvalid={!!errors.status} w={{ base: "100%", md: "240px" }}>
                <LabelItem label="Status" required />
                <Controller
                  name="status"
                  control={control}
                  rules={{ required: "Status is required" }}
                  render={({ field }) => (
                    <SearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      options={Object.values(CompanyRegistrationStatus).map((v) => ({
                        id: v,
                        name: COMPANY_REGISTRATION_STATUS_DISPLAY[v],
                      }))}
                      placeholder="Select status"
                      size="md"
                      isDisabled={isViewMode}
                      isClearable={false}
                    />
                  )}
                />
                <FormErrorMessage>{errors.status?.message}</FormErrorMessage>
              </FormControl>

              <FormControl w="160px">
                <LabelItem label="Active" />
                <Flex align="center" h="40px">
                  <Switch size="lg" {...register("is_active")} isDisabled={isViewMode} />
                </Flex>
              </FormControl>
            </Flex>

            <Divider my={4} />

            
            <FormControl isInvalid={!!errors.adminNote}>
              <LabelItem label="Note" />
              <Textarea
                placeholder="Example: Please verify company email domain / Call to confirm phone number..."
                borderColor="#d4d4d8cc"
                size="md"
                rows={4}
                isReadOnly={isViewMode}
                {...register("adminNote", { maxLength: { value: 1000, message: "Max 1000 characters" } })}
              />
              <FormErrorMessage>{errors.adminNote?.message}</FormErrorMessage>
            </FormControl>
          </ModalBody>

          <ModalFooter gap={3} px={{ base: 4, md: 6 }} pb={5} flexShrink={0} borderTop="1px solid" borderColor="#E2E8F0">
            <Button variant="outline" onClick={onClose}>
              {isViewMode ? "CLOSE" : "CANCEL"}
            </Button>

            {!isViewMode ? (
              <Button
                type="submit"
                bg={theme.colors.primary}
                color="white"
                _hover={{ opacity: 0.9 }}
                isLoading={isSubmittingForm}
                loadingText={mode === "add" ? "Creating..." : "Updating..."}
              >
                {mode === "add" ? "ADD" : "UPDATE"}
              </Button>
            ) : null}
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
