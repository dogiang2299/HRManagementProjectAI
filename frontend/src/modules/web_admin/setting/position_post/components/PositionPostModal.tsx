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
  HStack,
  Box,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import theme from "../../../../../theme";
import LabelItem from "../../../../../components/common/Label";
import RichTextEditorField from "../../../../../components/common/RichTextEditorField";
import PositionSkillsEditor from "./PositionSkillsEditor";
import { useNotify } from "../../../../../components/notification/NotifyProvider";
import type { IPositionPost, PositionPostFormValues } from "../types";
import { useCreatePositionPost } from "../api/create";
import { useUpdatePositionPost } from "../api/update";
import {
  POSITION_POST_STATUS,
  POSITION_POST_STATUS_VALUES,
  type PositionPostStatusType,
} from "../../../../../constant";
import { useAuthStore } from "../../../../auth/store/auth.store";

interface PositionPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  data?: IPositionPost;
  onSuccess?: () => void;
}

const safeStr = (v?: string | null) => v ?? "";

const POSITION_STATUS_OPTIONS = [...POSITION_POST_STATUS_VALUES];

export default function PositionPostModal({
  isOpen,
  onClose,
  mode,
  data,
  onSuccess,
}: PositionPostModalProps) {
  const notify = useNotify();
  const { mutateAsync: createPost } = useCreatePositionPost();
  const { mutateAsync: updatePost } = useUpdatePositionPost();
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [savedPositionId, setSavedPositionId] = useState<string | null>(null);
  const companyId = useAuthStore((state) => (state.user as any)?.company_id ?? null);
  const positionIdForSkills = mode === "edit" ? data?.id : savedPositionId;

  const defaultValues: PositionPostFormValues = useMemo(
    () => ({
      name_post: "",
      unit_id: "",
      description_post: "",
      requirements_post: "",
      benefits_post: "",
      benefit_more: {
        competitive_salary: "",
        professional_environment: "",
        training_and_development: "",
        career_opportunities: "",
        allowances_and_welfare: "",
      },
      auto_rotation: false,
      auto_eli_candidate: false,
      auto_near: false,
      status: POSITION_POST_STATUS.ACTIVE,
      is_active: true,
    }),
    [],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PositionPostFormValues>({
    mode: "onChange",
    defaultValues,
  });

  useEffect(() => {
    if (!isOpen) return;
    setSavedPositionId(null);
    if (mode === "edit" && data) {
      const bm = (data as any).benefit_more || {};
      reset({
        name_post: safeStr(data.name_post),
        unit_id: safeStr(data.unit_id || companyId),
        description_post: safeStr(data.description_post),
        requirements_post: safeStr(data.requirements_post),
        benefits_post: safeStr(data.benefits_post),
        benefit_more: {
          competitive_salary: safeStr(bm.competitive_salary),
          professional_environment: safeStr(bm.professional_environment),
          training_and_development: safeStr(bm.training_and_development),
          career_opportunities: safeStr(bm.career_opportunities),
          allowances_and_welfare: safeStr(bm.allowances_and_welfare),
        },
        auto_rotation: Boolean(data.auto_rotation),
        auto_eli_candidate: Boolean(data.auto_eli_candidate),
        auto_near: Boolean(data.auto_near),
        status:
          (safeStr(data.status) as PositionPostStatusType) ||
          POSITION_POST_STATUS.ACTIVE,
        is_active: Boolean(data.is_active),
      });
    } else {
      reset({ ...defaultValues, unit_id: companyId ?? "" });
    }
  }, [isOpen, mode, data, reset, defaultValues, companyId]);

  const onSubmit = async (values: PositionPostFormValues) => {
    setIsSubmittingForm(true);

    const payload = {
      name_post: values.name_post.trim() || null,
      unit_id: values.unit_id || companyId || null,
      description_post: values.description_post.trim() || null,
      requirements_post: values.requirements_post.trim() || null,
      benefits_post: values.benefits_post.trim() || null,
      benefit_more: {
        competitive_salary: values.benefit_more?.competitive_salary?.trim() || null,
        professional_environment: values.benefit_more?.professional_environment?.trim() || null,
        training_and_development: values.benefit_more?.training_and_development?.trim() || null,
        career_opportunities: values.benefit_more?.career_opportunities?.trim() || null,
        allowances_and_welfare: values.benefit_more?.allowances_and_welfare?.trim() || null,
      },
      auto_rotation: Boolean(values.auto_rotation),
      auto_eli_candidate: Boolean(values.auto_eli_candidate),
      auto_near: Boolean(values.auto_near),
      status: values.status.trim() || null,
      is_active: Boolean(values.is_active),
    };

    try {
      if (mode === "add") {
        const created = await createPost(payload as any);
        setSavedPositionId(created?.id ?? null);
        notify({
          message: "Position post created",
          description: "You can add default skills below, then close when done.",
          type: "success",
        });
        onSuccess?.();
      } else {
        if (!data?.id) return;
        await updatePost({ id: data.id, data: payload as any });
        notify({ message: "Position Post updated successfully", type: "success" });
        onSuccess?.();
        reset(defaultValues);
        onClose();
      }
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
          <Box>
            <Text fontSize="xl" fontWeight="800" color="#1F2937">
              {mode === "add" ? "Create position post" : "Update position post"}
            </Text>
            <Text fontSize="sm" color="gray.500" fontWeight="500">
              Configure position details, content, and automation settings.
            </Text>
          </Box>
        </ModalHeader>

        <ModalCloseButton top={4} right={4} />

        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
          <ModalBody
            px={{ base: 5, md: 7 }}
            pb={5}
            flex="1"
            minH={0}
            overflow="hidden"
            display="flex"
            flexDirection="column"
          >
            <Box
              border="1px solid"
              borderColor="#E6ECF5"
              borderRadius="20px"
              bg="white"
              p={{ base: 4, md: 5 }}
              flex="1"
              minH={0}
              overflowY="auto"
              overflowX="auto"
            >
              <LabelItem label="Basic information" fontSize="m" fontWeight={700} color="#334155" mb={4} />

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {mode === "edit" && (
                <FormControl>
                  <LabelItem label="Position Code (Auto)" fontSize="md" />
                  <Input
                    value={data?.position_code ?? "Auto generate after save"}
                    isReadOnly
                    bg="gray.50"
                    borderColor="#d4d4d8cc"
                    size="md"
                  />
                </FormControl>
              )}

              <FormControl isInvalid={!!errors.name_post}>
                <LabelItem label="Position name" required fontSize="md" />
                <Input
                  placeholder="Enter position name"
                  borderColor="#d4d4d8cc"
                  size="md"
                  {...register("name_post", {
                    required: "Position name is required",
                    maxLength: { value: 100, message: "Max 100 characters" },
                  })}
                />
                <FormErrorMessage>{errors.name_post?.message}</FormErrorMessage>
              </FormControl>

              <input type="hidden" {...register("unit_id")} />

              <FormControl isInvalid={!!errors.status}>
                <LabelItem label="Status" fontSize="md" />
                <Select borderColor="#d4d4d8cc" size="md" {...register("status")}>
                  {POSITION_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.status?.message}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>

              <Divider my={5} borderColor="#EDF2F7" />

              <LabelItem label="Content" fontSize="m" fontWeight={700} color="#334155" mb={4} />

            <SimpleGrid columns={1} spacing={4}>
              <Controller
                name="description_post"
                control={control}
                render={({ field }) => (
                  <RichTextEditorField
                    label="Description"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Job description..."
                    minHeight="180px"
                    error={errors.description_post?.message}
                  />
                )}
              />

              <Controller
                name="requirements_post"
                control={control}
                render={({ field }) => (
                  <RichTextEditorField
                    label="Requirements"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Candidate requirements..."
                    minHeight="180px"
                    error={errors.requirements_post?.message}
                  />
                )}
              />

              {/* <Controller
                name="benefits_post"
                control={control}
                render={({ field }) => (
                  <RichTextEditorField
                    label="Benefits"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Benefits offered..."
                    minHeight="160px"
                    error={errors.benefits_post?.message}
                  />
                )}
              /> */}
              
              <LabelItem label="Benefit details" fontSize="sm" fontWeight={700} color="#334155" mb={0} />

              <Controller
                name="benefit_more.competitive_salary"
                control={control}
                render={({ field }) => (
                  <RichTextEditorField
                    label="Competitive salary"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Describe salary & compensation..."
                    minHeight="120px"
                  />
                )}
              />

              <Controller
                name="benefit_more.professional_environment"
                control={control}
                render={({ field }) => (
                  <RichTextEditorField
                    label="Professional environment"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Describe work environment..."
                    minHeight="120px"
                  />
                )}
              />

              <Controller
                name="benefit_more.training_and_development"
                control={control}
                render={({ field }) => (
                  <RichTextEditorField
                    label="Training & development"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Describe training programs..."
                    minHeight="120px"
                  />
                )}
              />

              <Controller
                name="benefit_more.career_opportunities"
                control={control}
                render={({ field }) => (
                  <RichTextEditorField
                    label="Career opportunities"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Describe career growth paths..."
                    minHeight="120px"
                  />
                )}
              />

              <Controller
                name="benefit_more.allowances_and_welfare"
                control={control}
                render={({ field }) => (
                  <RichTextEditorField
                    label="Allowances & welfare"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Describe allowances, insurance, welfare..."
                    minHeight="120px"
                  />
                )}
              />
            </SimpleGrid>

              <Divider my={5} borderColor="#EDF2F7" />

              <LabelItem label="Position skills" fontSize="m" fontWeight={700} color="#334155" mb={2} />
              <Text fontSize="sm" color="gray.500" mb={3}>
                Default skills for this position. They auto-load when creating recruitment posts.
                {mode === "add" && !savedPositionId
                  ? " Save the position first to enable skill mapping."
                  : ""}
              </Text>
              <PositionSkillsEditor
                positionId={positionIdForSkills}
                persistToPosition
                disabled={!positionIdForSkills}
              />

              <Divider my={5} borderColor="#EDF2F7" />

              <LabelItem label="Automation settings" fontSize="m" fontWeight={700} color="#334155" mb={4} />

              <Box px={1}>
                <HStack spacing={8} wrap="wrap">
                <FormControl w="auto">
                  <Checkbox
                    colorScheme="blue"
                    size="md"
                    {...register("auto_rotation")}
                  >
                    <Text fontSize="sm" fontWeight="500">
                      Auto rotation
                    </Text>
                  </Checkbox>
                </FormControl>

                <FormControl w="auto">
                  <Checkbox
                    colorScheme="blue"
                    size="md"
                    {...register("auto_eli_candidate")}
                  >
                    <Text fontSize="sm" fontWeight="500">
                      Auto eliminate candidate
                    </Text>
                  </Checkbox>
                </FormControl>

                <FormControl w="auto">
                  <Checkbox
                    colorScheme="blue"
                    size="md"
                    {...register("auto_near")}
                  >
                    <Text fontSize="sm" fontWeight="500">
                      Auto near
                    </Text>
                  </Checkbox>
                </FormControl>

                <FormControl w="auto">
                  <Checkbox
                    colorScheme="blue"
                    size="md"
                    {...register("is_active")}
                  >
                    <Text fontSize="sm" fontWeight="500">
                      Is active
                    </Text>
                  </Checkbox>
                </FormControl>
                </HStack>
              </Box>
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
            {mode === "add" && savedPositionId ? (
              <Button
                bg={theme.colors.primary}
                color="white"
                h="44px"
                px={5}
                borderRadius="12px"
                _hover={{ opacity: 0.92 }}
                onClick={() => {
                  reset(defaultValues);
                  setSavedPositionId(null);
                  onClose();
                }}
              >
                DONE
              </Button>
            ) : (
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
            )}
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
