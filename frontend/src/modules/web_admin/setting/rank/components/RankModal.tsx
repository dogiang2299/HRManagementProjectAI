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
  Checkbox,
  Box,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import theme from "../../../../../theme";
import LabelItem from "../../../../../components/common/Label";
import { useNotify } from "../../../../../components/notification/NotifyProvider";
import type { IRank, RankFormValues } from "../types";
import { useCreateRank } from "../api/create";
import { useUpdateRank } from "../api/update";
import {
  RANK_STATUS,
  RANK_STATUS_VALUES,
  type RankStatusType,
} from "../../../../../constant";
import { useAuthStore } from "../../../../auth/store/auth.store";

interface RankModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  data?: IRank;
  onSuccess?: () => void;
}

const safeStr = (v?: string | null) => v ?? "";

const RANK_STATUS_OPTIONS = [...RANK_STATUS_VALUES];

export default function RankModal({
  isOpen,
  onClose,
  mode,
  data,
  onSuccess,
}: RankModalProps) {
  const notify = useNotify();
  const { mutateAsync: createRank } = useCreateRank();
  const { mutateAsync: updateRank } = useUpdateRank();
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const companyId = useAuthStore((state) => (state.user as any)?.company_id ?? null);

  const defaultValues: RankFormValues = useMemo(
    () => ({
      name_rank: "",
      unit_id: "",
      status: RANK_STATUS.ACTIVE,
      description: "",
      is_active: true,
    }),
    [],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RankFormValues>({
    mode: "onChange",
    defaultValues,
  });

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && data) {
      reset({
        name_rank: safeStr(data.name_rank),
        unit_id: safeStr(data.unit_id || companyId),
        status:
          (safeStr(data.status) as RankStatusType) ||
          RANK_STATUS.ACTIVE,
        description: safeStr(data.description),
        is_active: Boolean(data.is_active),
      });
    } else {
      reset({ ...defaultValues, unit_id: companyId ?? "" });
    }
  }, [isOpen, mode, data, reset, defaultValues, companyId]);

  const onSubmit = async (values: RankFormValues) => {
    setIsSubmittingForm(true);

    const payload = {
      name_rank: values.name_rank.trim() || null,
      unit_id: values.unit_id || companyId || null,
      status: values.status,
      description: values.description.trim() || null,
      is_active: Boolean(values.is_active),
    };

    try {
      if (mode === "add") {
        await createRank(payload as any);
        notify({ message: "Rank created successfully", type: "success" });
      } else {
        if (!data?.id) return;
        await updateRank({ id: data.id, data: payload as any });
        notify({ message: "Rank updated successfully", type: "success" });
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
              {mode === "add" ? "Create rank" : "Update rank"}
            </Text>
            <Text fontSize="sm" color="gray.500" fontWeight="500">
              Manage rank name, company, description, and status.
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
            <LabelItem label="Rank information" fontSize="m" fontWeight={700} color="#334155" mb={4} />

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {mode === "edit" && (
                <FormControl>
                  <LabelItem label="Rank Code (Auto)" fontSize="md" />
                  <Input
                    value={data?.rank_code ?? "Auto generate after save"}
                    isReadOnly
                    bg="gray.50"
                    borderColor="#d4d4d8cc"
                    size="md"
                  />
                </FormControl>
              )}

              <FormControl isInvalid={!!errors.name_rank}>
                <LabelItem label="Rank name" required fontSize="md" />
                <Input
                  placeholder="Enter rank name"
                  borderColor="#d4d4d8cc"
                  size="md"
                  {...register("name_rank", {
                    required: "Rank name is required",
                    maxLength: { value: 100, message: "Max 100 characters" },
                  })}
                />
                <FormErrorMessage>{errors.name_rank?.message}</FormErrorMessage>
              </FormControl>

              <input type="hidden" {...register("unit_id")} />

              <FormControl isInvalid={!!errors.status}>
                <LabelItem label="Status" fontSize="md" />
                <Select borderColor="#d4d4d8cc" size="md" {...register("status")}>
                  {RANK_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.status?.message}</FormErrorMessage>
              </FormControl>
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

            <Divider my={5} borderColor="#EDF2F7" />

            <FormControl w="auto">
              <Checkbox colorScheme="blue" size="md" {...register("is_active")}>
                <Text fontSize="sm" fontWeight="500">
                  Is active
                </Text>
              </Checkbox>
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
