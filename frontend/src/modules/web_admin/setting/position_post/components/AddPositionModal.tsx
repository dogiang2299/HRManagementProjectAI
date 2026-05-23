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
import { useNotify } from "../../../../../components/notification/NotifyProvider";
import type { PositionPostFormValues } from "../types";
import { useCreatePositionPost } from "../api/create";
import {
  POSITION_POST_STATUS,
  POSITION_POST_STATUS_VALUES,
} from "../../../../../constant";

/* ── Types ── */

export interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Selected branch/company ID from parent form - required and immutable here */
  companyId: string;
  /** Display name of branch/company (read-only) */
  companyName: string;
  /** Callback after successful creation - receives new position ID */
  onSuccess?: (newPositionId: string) => void;
}

/* ── Constants ── */

const POSITION_STATUS_OPTIONS = [...POSITION_POST_STATUS_VALUES];

const safeStr = (v?: string | null) => v ?? "";

/* ── Component ── */

export default function AddPositionModal({
  isOpen,
  onClose,
  companyId,
  companyName,
  onSuccess,
}: AddPositionModalProps) {
  const notify = useNotify();
  const { mutateAsync: createPost } = useCreatePositionPost();
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const defaultValues: PositionPostFormValues = useMemo(
    () => ({
      name_post: "",
      unit_id: companyId,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /* Reset each time the modal opens */
  useEffect(() => {
    if (isOpen) reset({ ...defaultValues, unit_id: companyId });
  }, [isOpen, companyId, defaultValues, reset]);

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  const onSubmit = async (values: PositionPostFormValues) => {
    setIsSubmittingForm(true);
    const payload = {
      name_post: values.name_post.trim() || null,
      unit_id: companyId,
      description_post: safeStr(values.description_post).trim() || null,
      requirements_post: safeStr(values.requirements_post).trim() || null,
      benefits_post: safeStr(values.benefits_post).trim() || null,
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
      const newPost = await createPost(payload as any);
      notify({ message: "Position created successfully", type: "success" });
      onSuccess?.(newPost.id);
      reset(defaultValues);
      onClose();
    } catch (err: any) {
      const d = err?.response?.data;
      const msg = Array.isArray(d?.message)
        ? d.message.join(", ")
        : typeof d?.message === "string"
          ? d.message
          : "An error occurred. Please try again.";
      notify({ message: msg, type: "error" });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
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
              Create position
            </Text>
            <Text fontSize="sm" color="gray.500" fontWeight="500">
              Add a new position under the selected company branch.
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
            <LabelItem label="Basic information" fontSize="sm" fontWeight={700} color="#334155" mb={4} />

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>

              {/* Branch - read-only */}
              <FormControl>
                <LabelItem label="Company branch" fontSize="md" />
                <Input
                  value={companyName}
                  isReadOnly
                  bg="gray.50"
                  borderColor="#d4d4d8cc"
                  size="md"
                  _focus={{ boxShadow: "none", borderColor: "#d4d4d8cc" }}
                  cursor="default"
                />
              </FormControl>

              {/* Position name */}
              <FormControl isInvalid={!!errors.name_post}>
                <LabelItem label="Position name" required fontSize="md" />
                <Input
                  placeholder="Enter position name"
                  borderColor="#d4d4d8cc"
                  size="md"
                  {...register("name_post", {
                    required: "Position name is required",
                    maxLength: { value: 100, message: "Maximum 100 characters" },
                  })}
                />
                <FormErrorMessage>{errors.name_post?.message}</FormErrorMessage>
              </FormControl>

              {/* Status */}
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

            <LabelItem label="Content" fontSize="sm" fontWeight={700} color="#334155" mb={4} />

            <SimpleGrid columns={1} spacing={4}>
              <Controller
                name="description_post"
                control={control}
                render={({ field }) => (
                  <RichTextEditorField
                    label="General job description"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Describe the position..."
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
                    label="Job requirements"
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
                    placeholder="Benefits candidates will receive..."
                    minHeight="160px"
                    error={errors.benefits_post?.message}
                  />
                )}
              /> */}

              <Divider my={3} borderColor="#EDF2F7" />
              <LabelItem label="Benefit details" fontSize="sm" fontWeight={700} color="#334155" mb={3} />

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

            <LabelItem label="Automation settings" fontSize="sm" fontWeight={700} color="#334155" mb={4} />

            <Box px={1}>
              <HStack spacing={8} wrap="wrap">
                <FormControl w="auto">
                  <Checkbox colorScheme="blue" size="md" {...register("auto_rotation")}>
                    <Text fontSize="md" fontWeight="500">Auto rotation</Text>
                  </Checkbox>
                </FormControl>

                <FormControl w="auto">
                  <Checkbox colorScheme="blue" size="md" {...register("auto_eli_candidate")}>
                    <Text fontSize="md" fontWeight="500">Auto eliminate candidate</Text>
                  </Checkbox>
                </FormControl>

                <FormControl w="auto">
                  <Checkbox colorScheme="blue" size="md" {...register("auto_near")}>
                    <Text fontSize="md" fontWeight="500">Auto near</Text>
                  </Checkbox>
                </FormControl>

                <FormControl w="auto">
                  <Checkbox colorScheme="blue" size="md" {...register("is_active")}>
                    <Text fontSize="md" fontWeight="500">Is active</Text>
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
              onClick={handleClose}
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
              SAVE
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
