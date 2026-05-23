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
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import theme from "../../../../../theme";
import LabelItem from "../../../../../components/common/Label";
import { useNotify } from "../../../../../components/notification/NotifyProvider";
import type { ITypePotential, TypePotentialFormValues } from "../types";
import { useCreateTypePotential } from "../api/create";
import { useUpdateTypePotential } from "../api/update";
import { useAuthStore } from "../../../../auth/store/auth.store";
import {
  TYPE_POTENTIAL_STATUS,
  TYPE_POTENTIAL_STATUS_VALUES,
  type TypePotentialStatusType,
} from "../../../../../constant";

interface TypePotentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  data?: ITypePotential;
  onSuccess?: () => void;
}

const safeStr = (v?: string | null) => v ?? "";

const TYPE_POTENTIAL_STATUS_OPTIONS = [...TYPE_POTENTIAL_STATUS_VALUES];

export default function TypePotentialModal({
  isOpen,
  onClose,
  mode,
  data,
  onSuccess,
}: TypePotentialModalProps) {
  const notify = useNotify();
  const { mutateAsync: createTypePotential } = useCreateTypePotential();
  const { mutateAsync: updateTypePotential } = useUpdateTypePotential();
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const companyId = useAuthStore((state) => (state.user as any)?.company_id ?? null);

  const defaultValues: TypePotentialFormValues = useMemo(
    () => ({
      name: "",
      description: "",
      status: TYPE_POTENTIAL_STATUS.ACTIVE,
      unit_id: "",
    }),
    [],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TypePotentialFormValues>({
    mode: "onChange",
    defaultValues,
  });

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && data) {
      reset({
        name: safeStr(data.name),
        description: safeStr(data.description),
        status: data.is_active
          ? TYPE_POTENTIAL_STATUS.ACTIVE
          : TYPE_POTENTIAL_STATUS.INACTIVE,
        unit_id: safeStr(data.unit_id || companyId),
      });
    } else {
      reset({ ...defaultValues, unit_id: companyId ?? "" });
    }
  }, [isOpen, mode, data, reset, defaultValues, companyId]);

  const onSubmit = async (values: TypePotentialFormValues) => {
    setIsSubmittingForm(true);

    const normalizedStatus = values.status as TypePotentialStatusType;

    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      is_active: normalizedStatus === TYPE_POTENTIAL_STATUS.ACTIVE,
      unit_id: values.unit_id || companyId || null,
    };

    try {
      if (mode === "add") {
        await createTypePotential(payload);
        notify({ message: "Type Potential created successfully", type: "success" });
      } else {
        if (!data?.id) return;
        await updateTypePotential({ id: data.id, data: payload });
        notify({ message: "Type Potential updated successfully", type: "success" });
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
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay backdropFilter="blur(0px)" />
      <ModalContent
        maxW={{ base: "95%", md: "860px" }}
        w="100%"
        maxH={{ base: "700px", md: "750px" }}
        borderRadius="24px"
        overflow="hidden"
        display="flex"
        flexDirection="column"
        boxShadow="0 24px 80px rgba(15, 23, 42, 0.18)"
      >
        <ModalHeader px={{ base: 5, md: 7 }} pt={6} pb={3}>
          <Box>
            <Text fontSize="xl" fontWeight="800" color="#1F2937">
              {mode === "add" ? "Create type potential" : "Update type potential"}
            </Text>
            <Text fontSize="sm" color="gray.500" fontWeight="500">
              Configure the name, description, and status of a potential type.
            </Text>
          </Box>
        </ModalHeader>

        <ModalCloseButton top={4} right={4} />

        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
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
              <LabelItem label="Type potential information" fontSize="m" fontWeight={700} color="#334155" mb={4} />

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {mode === "edit" && (
                  <FormControl>
                    <LabelItem label="Type Potential ID" fontSize="md" />
                    <Input
                      value={data?.id ?? "-"}
                      isReadOnly
                      bg="gray.50"
                      borderColor="#d4d4d8cc"
                      size="md"
                    />
                  </FormControl>
                )}

                <FormControl isInvalid={!!errors.name}>
                  <LabelItem label="Name" required fontSize="md" />
                  <Input
                    placeholder="Enter type potential name"
                    borderColor="#d4d4d8cc"
                    size="md"
                    {...register("name", {
                      required: "Name is required",
                      maxLength: { value: 100, message: "Max 100 characters" },
                    })}
                  />
                  <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.status}>
                  <LabelItem label="Status" fontSize="md" />
                  <Select borderColor="#d4d4d8cc" size="md" {...register("status")}>
                    {TYPE_POTENTIAL_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.status?.message}</FormErrorMessage>
                </FormControl>

                <input type="hidden" {...register("unit_id", { required: "Company is required" })} />
              </SimpleGrid>

              <Divider my={5} borderColor="#EDF2F7" />

              <FormControl isInvalid={!!errors.description}>
                <LabelItem label="Description" fontSize="md" />
                <Textarea
                  placeholder="Description..."
                  borderColor="#d4d4d8cc"
                  size="md"
                  rows={4}
                  {...register("description")}
                />
                <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
              </FormControl>
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
