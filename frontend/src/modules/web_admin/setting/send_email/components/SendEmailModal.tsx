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
  Checkbox,
  Box,
  Flex,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import theme from "../../../../../theme";
import LabelItem from "../../../../../components/common/Label";
import { useNotify } from "../../../../../components/notification/NotifyProvider";
import type { ISettingEmail, SendEmailFormValues } from "../types";
import { useCreateSettingEmail } from "../api/create";
import { useUpdateSettingEmail } from "../api/update";
import { useAuthStore } from "../../../../auth/store/auth.store";
import RichTextEditorField from "../../../../../components/common/RichTextEditorField";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  data?: ISettingEmail;
  onSuccess?: () => void;
}

const safeStr = (v?: string | null) => v ?? "";

export default function SendEmailModal({
  isOpen,
  onClose,
  mode,
  data,
  onSuccess,
}: SendEmailModalProps) {
  const notify = useNotify();
  const { mutateAsync: createSettingEmail } = useCreateSettingEmail();
  const { mutateAsync: updateSettingEmail } = useUpdateSettingEmail();
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const companyId = useAuthStore((state) => (state.user as any)?.company_id ?? null);

  const defaultValues: SendEmailFormValues = useMemo(
    () => ({
      name: "",
      unit_id: "",
      subject: "",
      body: "",
      auto_send: false,
    }),
    [],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SendEmailFormValues>({
    mode: "onChange",
    defaultValues,
  });

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && data) {
      reset({
        name: safeStr(data.name),
        unit_id: safeStr(data.unit_id || companyId),
        subject: safeStr(data.subject),
        body: safeStr(data.body),
        auto_send: Boolean(data.auto_send),
      });
    } else {
      reset({ ...defaultValues, unit_id: companyId ?? "" });
    }
  }, [isOpen, mode, data, reset, defaultValues, companyId]);

  const onSubmit = async (values: SendEmailFormValues) => {
    setIsSubmittingForm(true);

    const payload = {
      name: values.name.trim(),
      unit_id: values.unit_id || companyId || null,
      subject: values.subject.trim(),
      body: values.body.trim(),
      auto_send: Boolean(values.auto_send),
      is_active: true,
    };

    try {
      if (mode === "add") {
        await createSettingEmail(payload);
        notify({ message: "Email template created successfully", type: "success" });
      } else {
        if (!data?.id) return;
        await updateSettingEmail({ id: data.id, data: payload });
        notify({ message: "Email template updated successfully", type: "success" });
      }

      onSuccess?.();
      reset(defaultValues);
      onClose();
    } catch (err: any) {
      let msg = "An error occurred";
      if (err?.response?.data) {
        const d = err.response.data;
        if (Array.isArray(d.message)) msg = d.message.join(", ");
        else if (typeof d.message === "string") msg = d.message;
      }
      notify({ message: msg, type: "error" });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay backdropFilter="blur(0px)" />

      <ModalContent
        maxW={{ base: "95%", md: "980px" }}
        w="100%"
        maxH={{ base: "700px", md: "750px" }}
        borderRadius="24px"
        overflow="hidden"
        display="flex"
        flexDirection="column"
        boxShadow="0 24px 80px rgba(15, 23, 42, 0.18)"
      >
        <ModalHeader px={{ base: 5, md: 7 }} pt={6} pb={3}>
          <Flex direction="column" gap={1}>
            <Text fontSize="xl" fontWeight="800" color="#1F2937">
              {mode === "add" ? "Create email template" : "Update email template"}
            </Text>
            <Text fontSize="sm" color="gray.500" fontWeight="500">
              Configure the subject, content, and delivery option for this email template.
            </Text>
          </Flex>
        </ModalHeader>

        <ModalCloseButton top={4} right={4} />

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <ModalBody px={{ base: 5, md: 7 }} pb={5} flex="1" minH={0} overflow="hidden">
            <Box
              border="1px solid"
              borderColor="#E6ECF5"
              borderRadius="20px"
              bg="white"
              p={{ base: 4, md: 5 }}
              h="100%"
              overflowY="auto"
              overflowX="auto"
            >
              <LabelItem label="General information" fontSize="m" fontWeight={700} color="#334155" mb={4} />

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={!!errors.name}>
                  <LabelItem label="Template name" required fontSize="m" />
                  <Input
                    placeholder="Enter template name"
                    borderColor="#D9E2F2"
                    borderRadius="14px"
                    size="md"
                    h="46px"
                    _hover={{ borderColor: "#C7D2E0" }}
                    _focusVisible={{
                      borderColor: "#4C6FFF",
                      boxShadow: "0 0 0 3px rgba(76, 111, 255, 0.12)",
                    }}
                    {...register("name", {
                      required: "Template name is required",
                      maxLength: { value: 300, message: "Max 300 characters" },
                    })}
                  />
                  <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                </FormControl>

                <input type="hidden" {...register("unit_id")} />

                <FormControl isInvalid={!!errors.subject} gridColumn={{ md: "1 / -1" }}>
                  <LabelItem label="Email subject" required fontSize="m" />
                  <Input
                    placeholder="Enter email subject"
                    borderColor="#D9E2F2"
                    borderRadius="14px"
                    size="md"
                    h="46px"
                    _hover={{ borderColor: "#C7D2E0" }}
                    _focusVisible={{
                      borderColor: "#4C6FFF",
                      boxShadow: "0 0 0 3px rgba(76, 111, 255, 0.12)",
                    }}
                    {...register("subject", {
                      required: "Email subject is required",
                      maxLength: { value: 255, message: "Max 255 characters" },
                    })}
                  />
                  <FormErrorMessage>{errors.subject?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <Divider my={5} borderColor="#EDF2F7" />

              <SimpleGrid columns={1} spacing={4}>
                <Controller
                  name="body"
                  control={control}
                  rules={{
                    required: "Email body is required",
                    validate: (value) => {
                      const plainText = value
                        ?.replace(/<(.|\n)*?>/g, "")
                        .replace(/&nbsp;/g, " ")
                        .trim();

                      return plainText ? true : "Email body is required";
                    },
                  }}
                  render={({ field }) => (
                    <RichTextEditorField
                      label="Email body"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Write email content..."
                      minHeight="220px"
                      error={errors.body?.message}
                    />
                  )}
                />
              </SimpleGrid>

              <Divider my={5} borderColor="#EDF2F7" />

              <Box
                border="1px solid"
                borderColor="#E6ECF5"
                borderRadius="16px"
                px={4}
                py={3}
                bg="#F8FAFC"
              >
                <Checkbox colorScheme="blue" size="md" {...register("auto_send")}>
                  <Text fontSize="sm" fontWeight="600" color="#334155">
                    Auto send
                  </Text>
                </Checkbox>
                <Text fontSize="xs" color="gray.500" mt={1} pl={6}>
                  Automatically send this email based on the configured workflow.
                </Text>
              </Box>

              {mode === "edit" && data?.sec_code && (
                <Box mt={4}>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    Template code
                  </Text>
                  <Box
                    px={4}
                    py={3}
                    borderRadius="14px"
                    bg="gray.50"
                    border="1px solid #E6ECF5"
                    fontSize="sm"
                    fontWeight="600"
                    color="gray.700"
                  >
                    {data.sec_code}
                  </Box>
                </Box>
              )}
            </Box>
          </ModalBody>

          <ModalFooter px={{ base: 5, md: 7 }} pb={6} pt={0}>
            <Button
              variant="outline"
              borderColor="#D0D5DD"
              color="#344054"
              mr={3}
              h="44px"
              px={5}
              borderRadius="12px"
              onClick={onClose}
            >
              CANCEL
            </Button>

            <Button
              bg={theme.colors.primary}
              color="white"
              type="submit"
              isLoading={isSubmitting || isSubmittingForm}
              h="44px"
              px={5}
              borderRadius="12px"
              _hover={{ opacity: 0.92 }}
            >
              {mode === "add" ? "SAVE" : "UPDATE"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}