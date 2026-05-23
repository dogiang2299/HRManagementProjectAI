import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import theme from "../../../../../theme";
import { useNotify } from "../../../../../components/notification/NotifyProvider";
import BaseTable, { type HeaderTable } from "../../../../../components/common/BaseTable";

export interface RecruitmentPlanBatchForm {
  localId: string;
  batches_title: string;
  from_date: string;
  to_date: string;
  number_recruitment: string;
  monthly_target: string;
  split_target_by_recruiter: boolean;
}

export interface RecruitmentPlanFormState {
  total_real_number: string;
  monthly_target: string;
  expected_deadline: string;
  split_target_by_recruiter: boolean;
  plan_by_batches: boolean;
  batches: RecruitmentPlanBatchForm[];
}

interface TabExecutionPlanProps {
  onFormChange?: (form: RecruitmentPlanFormState) => void;
  initialForm?: RecruitmentPlanFormState | null;
}

interface BatchTableRow {
  id: string;
  batch_name: string;
  time: string;
  hiring_quantity: number;
  monthly_target: string;
  localId: string;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

const formatMonth = (monthStr: string) => {
  if (!monthStr) return "-";
  const [y, m] = monthStr.split("-");
  return `Month ${m}/${y}`;
};

const currentMonth = () => {
  const d = new Date();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${d.getFullYear()}-${month}`;
};

const createEmptyBatch = (): RecruitmentPlanBatchForm => ({
  localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  batches_title: "",
  from_date: "",
  to_date: "",
  number_recruitment: "1",
  monthly_target: currentMonth(),
  split_target_by_recruiter: false,
});

const INIT: RecruitmentPlanFormState = {
  total_real_number: "1",
  monthly_target: currentMonth(),
  expected_deadline: "",
  split_target_by_recruiter: false,
  plan_by_batches: false,
  batches: [],
};

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const titleColor = useColorModeValue("#1F2937", "gray.100");
  const subtle = useColorModeValue("gray.500", "gray.400");
  const line = useColorModeValue("gray.200", "gray.700");

  return (
    <Box mb={6}>
      <Text fontWeight="700" fontSize="md" color={titleColor} letterSpacing="0.2px">
        {title}
      </Text>

      {subtitle && (
        <Text fontSize="sm" color={subtle} mt={1}>
          {subtitle}
        </Text>
      )}

      <Divider mt={3} borderColor={line} />
    </Box>
  );
}

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  const c = useColorModeValue("gray.700", "gray.200");

  return (
    <Text fontSize="14px" fontWeight="600" color={c} mb={1.5}>
      {label}
      {required && (
        <Text as="span" color="red.500" ml={1}>
          *
        </Text>
      )}
    </Text>
  );
}

export default function TabExecutionPlan({ onFormChange, initialForm }: TabExecutionPlanProps) {
  const notify = useNotify();
  const [form, setForm] = useState<RecruitmentPlanFormState>(INIT);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchModalMode, setBatchModalMode] = useState<"create" | "edit">("create");
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [batchDraft, setBatchDraft] = useState<RecruitmentPlanBatchForm>(createEmptyBatch());

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("#E2E8F0", "gray.700");
  const tableWrapBg = useColorModeValue("white", "gray.800");
  const subtle = useColorModeValue("gray.500", "gray.400");
  const totalWrapBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.800");
  const readOnlyBg = useColorModeValue("gray.50", "gray.700");
  const inputBorder = useColorModeValue("#CBD5E1", "gray.600");
  const inputHoverBorder = useColorModeValue("#94A3B8", "gray.500");
  const sectionTitleColor = useColorModeValue("#1F2937", "gray.100");
  const primary = theme?.colors?.primary || "#334371";

  const commonFieldSx = {
    bg: inputBg,
    borderColor: inputBorder,
    borderRadius: "6px",
    fontSize: "md",
    _hover: {
      borderColor: inputHoverBorder,
    },
    _focus: {
      borderColor: primary,
      boxShadow: "0 0 0 1px rgba(51, 67, 113, 0.35)",
    },
    _focusVisible: {
      borderColor: primary,
      boxShadow: "0 0 0 1px rgba(51, 67, 113, 0.35)",
    },
  };

  const sectionCardProps = {
    bg: cardBg,
    border: "1px solid",
    borderColor: border,
    borderRadius: "6px",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
    p: { base: 4, md: 6 },
  };

  const totalBatchRecruitment = useMemo(
    () => form.batches.reduce((sum, item) => sum + (Number(item.number_recruitment) || 0), 0),
    [form.batches]
  );

  const batchColumns = useMemo<HeaderTable[]>(
    () => [
      { name: "Batch Name", key: "batch_name", disableSort: true },
      { name: "Time", key: "time", disableSort: true },
      { name: "Hiring Quantity", key: "hiring_quantity", disableSort: true },
      { name: "Monthly Target", key: "monthly_target", disableSort: true },
    ],
    []
  );

  const batchRows = useMemo<BatchTableRow[]>(
    () =>
      form.batches.map((batch) => ({
        id: batch.localId,
        localId: batch.localId,
        batch_name: batch.batches_title || "(Untitled)",
        time: `${formatDate(batch.from_date)} - ${formatDate(batch.to_date)}`,
        hiring_quantity: Number(batch.number_recruitment) || 0,
        monthly_target: formatMonth(batch.monthly_target),
      })),
    [form.batches]
  );

  // Auto-sync total_real_number with sum of batch quantities
  useEffect(() => {
    if (form.plan_by_batches) {
      setForm((prev) => ({ ...prev, total_real_number: String(totalBatchRecruitment) }));
    }
  }, [totalBatchRecruitment, form.plan_by_batches]);

  useEffect(() => {
    onFormChange?.(form);
  }, [form, onFormChange]);

  useEffect(() => {
    if (!initialForm) return;
    setForm(initialForm);
  }, [initialForm]);

  const update = (
    field: keyof Omit<RecruitmentPlanFormState, "batches">,
    value: string | boolean
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openBatchModal = () => {
    setBatchModalMode("create");
    setEditingBatchId(null);
    setBatchDraft(createEmptyBatch());
    setIsBatchModalOpen(true);
  };

  const openEditBatchModal = (batchId: string) => {
    const targetBatch = form.batches.find((item) => item.localId === batchId);
    if (!targetBatch) return;

    setBatchModalMode("edit");
    setEditingBatchId(batchId);
    setBatchDraft(targetBatch);
    setIsBatchModalOpen(true);
  };

  const closeBatchModal = () => {
    setIsBatchModalOpen(false);
    setBatchModalMode("create");
    setEditingBatchId(null);
  };

  const saveBatch = () => {
    if (!batchDraft.batches_title.trim()) {
      notify({ message: "Please enter the batch name", type: "warning" });
      return;
    }

    if (!batchDraft.from_date || !batchDraft.to_date) {
      notify({ message: "Please enter both start and end dates", type: "warning" });
      return;
    }

    if (!batchDraft.monthly_target) {
      notify({ message: "Please enter a monthly target", type: "warning" });
      return;
    }

    setForm((prev) => {
      if (batchModalMode === "edit" && editingBatchId) {
        return {
          ...prev,
          batches: prev.batches.map((item) =>
            item.localId === editingBatchId ? { ...batchDraft, localId: editingBatchId } : item
          ),
        };
      }

      return {
        ...prev,
        batches: [...prev.batches, batchDraft],
      };
    });

    closeBatchModal();
  };

  const removeBatch = (localId: string) => {
    setForm((prev) => ({
      ...prev,
      batches: prev.batches.filter((item) => item.localId !== localId),
    }));
  };

  return (
    <Box minH="100%" py={1}>
      <VStack spacing={5} align="stretch">
        <Box {...sectionCardProps}>
          <SectionHeader
          
            title="Execution Plan"
            subtitle="Define the target month and actual hiring quantity for this posting to support reporting. You can split this posting into multiple recruitment batches."
          />

          <VStack spacing={5} align="stretch">
            <Box>
              <Text fontSize="md" fontWeight="600" mb={4} color={sectionTitleColor}>
                Plan by Posting
              </Text>

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={5}>
                <GridItem>
                  <FormControl>
                    <FieldLabel label="Actual hiring quantity" required />
                    <Input
                      {...commonFieldSx}
                      h="40px"
                      value={form.total_real_number}
                      isReadOnly={form.plan_by_batches}
                      bg={form.plan_by_batches ? readOnlyBg : inputBg}
                      cursor={form.plan_by_batches ? "default" : undefined}
                      onChange={(e) =>
                        !form.plan_by_batches &&
                        update("total_real_number", e.target.value.replace(/[^\d]/g, ""))
                      }
                      fontSize={14}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FieldLabel label="Monthly target" required />
                    <Input
                      {...commonFieldSx}
                      h="40px"
                      type="month"
                      value={form.monthly_target}
                      onChange={(e) => update("monthly_target", e.target.value)}
                      fontSize={14}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FieldLabel label="Expected deadline" required />
                    <Input
                      {...commonFieldSx}
                      h="40px"
                      type="date"
                      value={form.expected_deadline}
                      onChange={(e) => update("expected_deadline", e.target.value)}
                      fontSize={14}
                    />
                  </FormControl>
                </GridItem>
              </Grid>
            </Box>

            <Box>
              <Checkbox
                size="md"
                isChecked={form.plan_by_batches}
                onChange={(e) => update("plan_by_batches", e.target.checked)}
              >
                <Text fontSize="14" fontWeight="500">
                  Plan by batch
                </Text>
              </Checkbox>
            </Box>

            {form.plan_by_batches && (
              <Box>
                <Button
                  size="sm"
                  bg={primary}
                  color="white"
                  borderRadius="6px"
                  px={5}
                  _hover={{ opacity: 0.92 }}
                  _active={{ opacity: 0.88 }}
                  onClick={openBatchModal}
                >
                  ADD BATCH
                </Button>

                {form.batches.length > 0 ? (
                  <Box mt={4} bg={tableWrapBg}>
                    <BaseTable<BatchTableRow>
                      columns={batchColumns}
                      data={batchRows}
                      hideCheckboxes
                      hideSortButton
                      maxHBaseTable="320px"
                      renderRowActions={(row) => (
                        <HStack spacing={1} justify="center">
                          <IconButton
                            aria-label="Edit batch"
                            icon={<EditIcon />}
                            size="sm"
                            variant="ghost"
                            color="blue.500"
                            borderRadius="6px"
                            _hover={{ bg: useColorModeValue("blue.50", "rgba(59,130,246,0.15)") }}
                            onClick={() => openEditBatchModal(row.localId)}
                          />
                          <IconButton
                            aria-label="Remove batch"
                            icon={<DeleteIcon />}
                            size="sm"
                            variant="ghost"
                            color="red.500"
                            borderRadius="6px"
                            _hover={{ bg: useColorModeValue("red.50", "rgba(239,68,68,0.12)") }}
                            onClick={() => removeBatch(row.localId)}
                          />
                        </HStack>
                      )}
                    />

                    <Flex
                      justify="space-between"
                      align="center"
                      px={4}
                      py={3}
                      bg={totalWrapBg}
                      border="1px solid"
                      borderColor={border}
                      borderTop="none"
                    >
                      <Text fontSize="md" fontWeight="700" color={sectionTitleColor}>
                        Total hiring quantity
                      </Text>
                      <Text fontSize="md" fontWeight="700" color={sectionTitleColor}>
                        {totalBatchRecruitment}
                      </Text>
                    </Flex>
                  </Box>
                ) : (
                  <Text fontSize="14" color={subtle} mt={4}>
                    No batches yet. Click "ADD BATCH" to create one.
                  </Text>
                )}
              </Box>
            )}
          </VStack>
        </Box>
      </VStack>

<Modal isOpen={isBatchModalOpen} onClose={closeBatchModal} isCentered size="xl">
  <ModalOverlay bg="blackAlpha.400" />

  <ModalContent
    maxW="720px"
    borderRadius="14px"
    bg={cardBg}
    border="1px solid"
    borderColor="rgba(226, 232, 240, 0.75)"
    boxShadow="0 20px 55px rgba(15, 23, 42, 0.18)"
    overflow="hidden"
  >
    <ModalHeader px={6} pt={5} pb={3}>
      <VStack spacing={1} align="center">
        <Text fontSize="lg" fontWeight="800" color="gray.800">
          {batchModalMode === "edit" ? "Edit batch" : "Add batch"}
        </Text>

        <Text fontSize="sm" fontWeight="400" color="gray.500">
          {batchModalMode === "edit"
            ? "Update the recruitment batch information"
            : "Create a new recruitment batch for this campaign"}
        </Text>
      </VStack>
    </ModalHeader>

    <ModalCloseButton
      top={4}
      right={4}
      borderRadius="full"
      color="gray.500"
      _hover={{ bg: "gray.100", color: "gray.700" }}
      _active={{ bg: "gray.200" }}
    />

    <ModalBody px={6} pt={2} pb={5}>
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FieldLabel label="Batch Name" required />
          <Input
            {...commonFieldSx}
            h="40px"
            placeholder="Enter batch name"
            value={batchDraft.batches_title}
            onChange={(e) =>
              setBatchDraft((prev) => ({
                ...prev,
                batches_title: e.target.value,
              }))
            }
          />
        </FormControl>

        <Box
          px={3.5}
          py={3}
          borderRadius="10px"
          border="1px solid"
          borderColor="rgba(226, 232, 240, 0.8)"
          bg="rgba(248, 250, 252, 0.75)"
        >
          <Checkbox
            size="md"
            colorScheme="blue"
            isChecked={batchDraft.split_target_by_recruiter}
            onChange={(e) =>
              setBatchDraft((prev) => ({
                ...prev,
                split_target_by_recruiter: e.target.checked,
              }))
            }
          >
            <Box>
              <Text fontSize="sm" fontWeight="700" color="gray.700">
                Split target by recruiter
              </Text>
              <Text fontSize="xs" color="gray.500" mt={0.5}>
                Divide the hiring target across assigned recruiters
              </Text>
            </Box>
          </Checkbox>
        </Box>

        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
          <GridItem>
            <FormControl>
              <FieldLabel label="Start date" required />
              <Input
                {...commonFieldSx}
                h="40px"
                type="date"
                value={batchDraft.from_date}
                onChange={(e) =>
                  setBatchDraft((prev) => ({
                    ...prev,
                    from_date: e.target.value,
                  }))
                }
              />
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl>
              <FieldLabel label="End date" required />
              <Input
                {...commonFieldSx}
                h="40px"
                type="date"
                value={batchDraft.to_date}
                onChange={(e) =>
                  setBatchDraft((prev) => ({
                    ...prev,
                    to_date: e.target.value,
                  }))
                }
              />
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl>
              <FieldLabel label="Hiring Quantity" required />
              <Input
                {...commonFieldSx}
                h="40px"
                placeholder="Example: 10"
                inputMode="numeric"
                value={batchDraft.number_recruitment}
                onChange={(e) =>
                  setBatchDraft((prev) => ({
                    ...prev,
                    number_recruitment: e.target.value.replace(/[^\d]/g, ""),
                  }))
                }
              />
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl>
              <FieldLabel label="Monthly target" required />
              <Input
                {...commonFieldSx}
                h="40px"
                type="month"
                value={batchDraft.monthly_target}
                onChange={(e) =>
                  setBatchDraft((prev) => ({
                    ...prev,
                    monthly_target: e.target.value,
                  }))
                }
              />
            </FormControl>
          </GridItem>
        </Grid>
      </VStack>
    </ModalBody>

    <ModalFooter
      px={6}
      py={4}
      bg="rgba(248, 250, 252, 0.8)"
      borderTop="1px solid"
      borderColor="rgba(226, 232, 240, 0.65)"
    >
      <HStack spacing={3} justify="flex-end" w="100%">
        <Button
          h="38px"
          px={5}
          variant="ghost"
          borderRadius="8px"
          fontSize="sm"
          fontWeight="700"
          color="gray.600"
          _hover={{ bg: "white" }}
          _active={{ bg: "gray.100" }}
          onClick={closeBatchModal}
        >
          Cancel
        </Button>

        <Button
          h="38px"
          px={6}
          bg={primary}
          color="white"
          borderRadius="8px"
          fontSize="sm"
          fontWeight="800"
          boxShadow="0 8px 18px rgba(51, 67, 113, 0.22)"
          _hover={{
            opacity: 0.94,
            transform: "translateY(-1px)",
            boxShadow: "0 10px 22px rgba(51, 67, 113, 0.26)",
          }}
          _active={{
            opacity: 0.9,
            transform: "translateY(0)",
          }}
          onClick={saveBatch}
        >
          {batchModalMode === "edit" ? "Update" : "Confirm"}
        </Button>
      </HStack>
    </ModalFooter>
  </ModalContent>
</Modal>    </Box>
  );
}