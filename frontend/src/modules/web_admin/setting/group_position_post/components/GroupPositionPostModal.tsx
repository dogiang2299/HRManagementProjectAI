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
import type { GroupPositionPostFormValues, IGroupPositionPost } from "../types";
import { useCreateGroupPositionPost } from "../api/create";
import { useUpdateGroupPositionPost } from "../api/update";
import { useAuthStore } from "../../../../auth/store/auth.store";

interface GroupPositionPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  data?: IGroupPositionPost;
  onSuccess?: () => void;
}

const safeStr = (v?: string | null) => v ?? "";

export default function GroupPositionPostModal({
  isOpen,
  onClose,
  mode,
  data,
  onSuccess,
}: GroupPositionPostModalProps) {
  const notify = useNotify();
  const { mutateAsync: createGroup } = useCreateGroupPositionPost();
  const { mutateAsync: updateGroup } = useUpdateGroupPositionPost();
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const companyId = useAuthStore((state) => (state.user as any)?.company_id ?? null);

  const defaultValues: GroupPositionPostFormValues = useMemo(
    () => ({
      name_group: "",
      slug: "",
      description: "",
      unit_id: "",
    }),
    [],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GroupPositionPostFormValues>({
    mode: "onChange",
    defaultValues,
  });

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && data) {
      reset({
        name_group: safeStr(data.name_group),
        slug: safeStr(data.slug),
        description: safeStr(data.description),
        unit_id: safeStr(data.unit_id || companyId),
      });
    } else {
      reset({ ...defaultValues, unit_id: companyId ?? "" });
    }
  }, [isOpen, mode, data, reset, defaultValues, companyId]);

  const onSubmit = async (values: GroupPositionPostFormValues) => {
    setIsSubmittingForm(true);

    const payload = {
      name_group: values.name_group.trim(),
      slug: values.slug.trim() || null,
      description: values.description.trim() || null,
      unit_id: values.unit_id || companyId || null,
    };

    try {
      if (mode === "add") {
        await createGroup(payload as any);
        notify({ message: "Position Group created successfully", type: "success" });
      } else {
        if (!data?.id) return;
        await updateGroup({ id: data.id, data: payload as any });
        notify({ message: "Position Group updated successfully", type: "success" });
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
              {mode === "add" ? "Create position group" : "Update position group"}
            </Text>
            <Text fontSize="sm" color="gray.500" fontWeight="500">
              Manage the group name, slug, and description.
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
            <LabelItem label="Group information" fontSize="m" fontWeight={700} color="#334155" mb={4} />

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isInvalid={!!errors.name_group}>
                <LabelItem label="Group name" required fontSize="md" />
                <Input
                  placeholder="Enter group name"
                  borderColor="#d4d4d8cc"
                  size="md"
                  {...register("name_group", {
                    required: "Group name is required",
                    maxLength: { value: 150, message: "Max 150 characters" },
                  })}
                />
                <FormErrorMessage>{errors.name_group?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.slug}>
                <LabelItem label="Slug" fontSize="md" />
                <Input
                  placeholder="e.g. cong-nghe-thong-tin"
                  borderColor="#d4d4d8cc"
                  size="md"
                  {...register("slug", {
                    maxLength: { value: 200, message: "Max 200 characters" },
                  })}
                />
                <FormErrorMessage>{errors.slug?.message}</FormErrorMessage>
              </FormControl>

              <input type="hidden" {...register("unit_id", { required: "Company is required" })} />
            </SimpleGrid>

            <Divider my={4} />

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
