import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  TagCloseButton,
  Select,
  SimpleGrid,
  Spinner,
  Switch,
  Tag,
  Text,
  Textarea,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { FiEdit2, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { ButtonConfig } from "../../../../../components/common/Button";
import SearchCombobox from "../../../../../components/common/SearchCombobox";
import { ModalConfirm } from "../../../../../components/common/ModalConfirm";
import { useNotify } from "../../../../../components/notification/NotifyProvider";
import { SKILL_STATUS } from "../../../../../constant";
import Pagination from "../../../../../components/common/Pagination";
import {
  mapSkillRecordToTaxonomy,
  useGetSkillTaxonomyOptions,
  useGetTaxonomyNodeSummary,
  useGetSkills,
} from "../api/get";
import { useSaveTaxonomySkill } from "../api/create";
import { useUpdateTaxonomySkill } from "../api/update";
import { useDeleteSkill } from "../api/delete";
import {
  useGetTaxonomyNodesCatalog,
  useTaxonomyNodeMutations,
  type TaxonomyNodeRecord,
} from "../api/taxonomyNodes";
import type { SkillTaxonomyPayload, TaxonomySkill } from "../types";

type ActiveTab = "taxonomy" | "missing" | "all";

type NodeFormState = {
  id?: string;
  node_type: "GROUP" | "SUBGROUP";
  name: string;
  parent_id: string;
  is_active: boolean;
};

const emptyNodeForm: NodeFormState = {
  node_type: "GROUP",
  name: "",
  parent_id: "",
  is_active: true,
};

type FormState = {
  id?: string;
  name: string;
  description: string;
  aliases: string[];
  newAlias: string;
  taxonomy_group_node_id: string;
  taxonomy_subgroup_node_id: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  aliases: [],
  newAlias: "",
  taxonomy_group_node_id: "",
  taxonomy_subgroup_node_id: "",
  is_active: true,
};

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");

const getErrorMessage = (error: unknown, fallback: string) => {
  const maybeError = error as {
    response?: { data?: { message?: unknown } };
    message?: unknown;
  };
  const message = maybeError.response?.data?.message ?? maybeError.message ?? fallback;

  if (Array.isArray(message)) return message.join(", ");
  return typeof message === "string" && message.trim() ? message : fallback;
};

const toFormState = (skill: TaxonomySkill): FormState => {
  const mapping = skill.taxonomyMappings?.[0];

  return {
    id: skill.id,
    name: skill.name || "",
    description: skill.description || "",
    aliases: skill.aliases || [],
    newAlias: "",
    taxonomy_group_node_id:
      skill.taxonomy_group_node_id ||
      mapping?.taxonomy_group_node_id ||
      "",
    taxonomy_subgroup_node_id:
      skill.taxonomy_subgroup_node_id ||
      mapping?.taxonomy_subgroup_node_id ||
      "",
    is_active: Boolean(skill.is_active),
  };
};

function uniqueAliases(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of values) {
    const normalized = normalizeText(item);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

function taxonomyPath(skill: TaxonomySkill) {
  const mapping = skill.taxonomyMappings?.[0];
  const group = skill.taxonomy_group || mapping?.taxonomy_group;
  const subgroup = skill.taxonomy_subgroup || mapping?.taxonomy_subgroup;
  if (!group && !subgroup) return "Unmapped";
  if (group && subgroup) return `${group} / ${subgroup}`;
  return group || subgroup || "Unmapped";
}

function getSkillStatusLabel(skill: TaxonomySkill) {
  return skill.is_active ? SKILL_STATUS.ACTIVE : SKILL_STATUS.INACTIVE;
}

const SKILLS_PAGE_SIZE = 5;

export function Skill() {
  const notify = useNotify();
  const [activeTab, setActiveTab] = useState<ActiveTab>("taxonomy");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<TaxonomySkill | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedSubgroupId, setSelectedSubgroupId] = useState<string | null>(null);
  const [isNodeFormOpen, setIsNodeFormOpen] = useState(false);
  const [nodeForm, setNodeForm] = useState<NodeFormState>(emptyNodeForm);
  const [nodeDeleteTarget, setNodeDeleteTarget] = useState<TaxonomyNodeRecord | null>(
    null,
  );
  const [skillsPage, setSkillsPage] = useState(1);

  const summaryQuery = useGetTaxonomyNodeSummary();
  const optionsQuery = useGetSkillTaxonomyOptions();
  const catalogQuery = useGetTaxonomyNodesCatalog();
  const {
    createMutation: createNodeMutation,
    updateMutation: updateNodeMutation,
    deleteMutation: deleteNodeMutation,
  } = useTaxonomyNodeMutations();
  const { mutateAsync: saveTaxonomySkill, isPending: isSavingNew } =
    useSaveTaxonomySkill();
  const { mutateAsync: updateTaxonomySkill, isPending: isUpdating } =
    useUpdateTaxonomySkill();
  const skillsListParams = useMemo(() => {
    const base = {
      pages: skillsPage,
      items_per_pages: SKILLS_PAGE_SIZE,
      search: debouncedSearch || undefined,
      scope: "ALL",
      include_inactive: true,
    };

    if (activeTab === "taxonomy") {
      if (!selectedSubgroupId) return null;
      return { ...base, taxonomy_subgroup_node_id: selectedSubgroupId };
    }
    if (activeTab === "missing") {
      return { ...base, missing_taxonomy_node: true };
    }
    if (activeTab === "all") {
      return base;
    }
    return null;
  }, [activeTab, selectedSubgroupId, debouncedSearch, skillsPage]);

  const skillsListQuery = useGetSkills(
    skillsListParams ?? { pages: 1, items_per_pages: SKILLS_PAGE_SIZE },
    { enabled: skillsListParams !== null },
  );

  const { mutateAsync: deleteSkill, isPending: isDeleting } = useDeleteSkill();

  const options = optionsQuery.data;
  const catalogGroups = catalogQuery.data?.groups ?? [];
  const pagedSkills = useMemo(
    () => (skillsListQuery.data?.data ?? []).map(mapSkillRecordToTaxonomy),
    [skillsListQuery.data],
  );
  const skillsPagination = skillsListQuery.data?.pagination;
  const isSkillsListLoading = skillsListQuery.isLoading && !skillsListQuery.data;
  const isSkillsListFetching = skillsListQuery.isFetching;

  useEffect(() => {
    setSkillsPage(1);
  }, [activeTab, selectedSubgroupId, debouncedSearch]);
  const isSaving = isSavingNew || isUpdating;
  const isNodeSaving = createNodeMutation.isPending || updateNodeMutation.isPending;
  const isNodeDeleting = deleteNodeMutation.isPending;

  const subgroupOptions = useMemo(() => {
    if (!options) return [];
    if (!form.taxonomy_group_node_id) return [];
    return options.subgroupsByGroup?.[form.taxonomy_group_node_id] ?? [];
  }, [form.taxonomy_group_node_id, options]);

  const activeGroupOptions = useMemo(
    () =>
      (options?.groups ?? []).map((item) => ({
        id: item.id,
        name: item.name,
      })),
    [options?.groups],
  );

  const activeSubgroupOptions = useMemo(
    () =>
      subgroupOptions.map((item) => ({
        id: item.id,
        name: item.name,
      })),
    [subgroupOptions],
  );

  const catalogGroupOptions = useMemo(
    () =>
      catalogGroups
        .filter((group) => group.is_active)
        .map((group) => ({ id: group.id, name: group.name })),
    [catalogGroups],
  );

  const openCreate = () => {
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (skill: TaxonomySkill) => {
    setForm(toFormState(skill));
    setIsFormOpen(true);
  };

  const openMapTaxonomy = (skill: TaxonomySkill) => {
    const base = toFormState(skill);
    setForm({
      ...base,
      taxonomy_group_node_id: "",
      taxonomy_subgroup_node_id: "",
      newAlias: "",
    });
    setIsFormOpen(true);
  };

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "taxonomy_group_node_id"
        ? { taxonomy_subgroup_node_id: "" }
        : {}),
    }));
  };

  const addAlias = () => {
    const candidate = normalizeText(form.newAlias);
    if (!candidate) return;
    const exists = (form.aliases ?? []).some(
      (item) => item.toLowerCase() === candidate.toLowerCase(),
    );
    if (exists) {
      notify({
        type: "warning",
        message: "Alias already added",
        description: `"${candidate}" is already in the alias list.`,
      });
      return;
    }
    setForm((prev) => ({
      ...prev,
      aliases: uniqueAliases([...(prev.aliases ?? []), candidate]),
      newAlias: "",
    }));
  };

  const removeAlias = (alias: string) => {
    setForm((prev) => ({
      ...prev,
      aliases: (prev.aliases ?? []).filter((a) => a !== alias),
    }));
  };

  const buildPayload = (): SkillTaxonomyPayload => {
    const name = normalizeText(form.name);
    const taxonomyGroupNodeId = form.taxonomy_group_node_id;
    const taxonomySubgroupNodeId = form.taxonomy_subgroup_node_id;

    if (!name) {
      throw new Error("Skill name is required");
    }

    if (!taxonomyGroupNodeId) {
      throw new Error("Taxonomy group is required");
    }

    if (!taxonomySubgroupNodeId) {
      throw new Error("Taxonomy subgroup is required");
    }

    return {
      name,
      description: normalizeText(form.description) || null,
      aliases: uniqueAliases(form.aliases ?? []),
      taxonomy_group_node_id: taxonomyGroupNodeId,
      taxonomy_subgroup_node_id: taxonomySubgroupNodeId,
      is_active: form.is_active,
    };
  };

  const handleSubmit = async () => {
    let payload: SkillTaxonomyPayload;

    try {
      payload = buildPayload();
    } catch (error) {
      notify({
        type: "error",
        message: getErrorMessage(error, "Invalid skill data"),
      });
      return;
    }

    try {
      if (form.id) {
        await updateTaxonomySkill({ id: form.id, data: payload });
        notify({ type: "success", message: "Skill updated" });
      } else {
        await saveTaxonomySkill(payload);
        notify({ type: "success", message: "Skill saved" });
      }

      setIsFormOpen(false);
      setForm(emptyForm);
      await refreshTaxonomyData();
    } catch (error) {
      notify({
        type: "error",
        message: "Save skill failed",
        description: getErrorMessage(error, "Could not save skill taxonomy."),
      });
    }
  };

  const refreshTaxonomyData = async () => {
    await Promise.all([
      summaryQuery.refetch(),
      optionsQuery.refetch(),
      catalogQuery.refetch(),
      skillsListQuery.refetch(),
    ]);
  };

  const openCreateGroupNode = () => {
    setNodeForm({ ...emptyNodeForm, node_type: "GROUP" });
    setIsNodeFormOpen(true);
  };

  const openCreateSubgroupNode = (parentId: string) => {
    setNodeForm({
      ...emptyNodeForm,
      node_type: "SUBGROUP",
      parent_id: parentId,
    });
    setIsNodeFormOpen(true);
  };

  const openEditNode = (node: TaxonomyNodeRecord) => {
    setNodeForm({
      id: node.id,
      node_type: node.node_type,
      name: node.name,
      parent_id: node.parent_id ?? "",
      is_active: node.is_active,
    });
    setIsNodeFormOpen(true);
  };

  const handleNodeSubmit = async () => {
    const name = normalizeText(nodeForm.name);
    if (!name) {
      notify({ type: "error", message: "Node name is required" });
      return;
    }

    try {
      if (nodeForm.id) {
        await updateNodeMutation.mutateAsync({
          nodeId: nodeForm.id,
          payload: {
            name,
            is_active: nodeForm.is_active,
          },
        });
        notify({ type: "success", message: "Taxonomy node updated" });
      } else if (nodeForm.node_type === "GROUP") {
        await createNodeMutation.mutateAsync({
          node_type: "GROUP",
          name,
        });
        notify({ type: "success", message: "Taxonomy group created" });
      } else {
        if (!nodeForm.parent_id) {
          notify({ type: "error", message: "Parent group is required" });
          return;
        }
        await createNodeMutation.mutateAsync({
          node_type: "SUBGROUP",
          name,
          parent_id: nodeForm.parent_id,
        });
        notify({ type: "success", message: "Taxonomy subgroup created" });
      }

      setIsNodeFormOpen(false);
      setNodeForm(emptyNodeForm);
      await refreshTaxonomyData();
    } catch (error) {
      notify({
        type: "error",
        message: "Save taxonomy node failed",
        description: getErrorMessage(error, "Could not save taxonomy node."),
      });
    }
  };

  const handleNodeDelete = async () => {
    if (!nodeDeleteTarget?.id) return;

    try {
      await deleteNodeMutation.mutateAsync(nodeDeleteTarget.id);
      notify({
        type: "success",
        message: "Taxonomy node deactivated",
        description: `"${nodeDeleteTarget.name}" was soft-deleted.`,
      });

      if (
        nodeDeleteTarget.id === selectedSubgroupId ||
        nodeDeleteTarget.id === selectedGroupId
      ) {
        setSelectedSubgroupId(null);
        setSelectedGroupId(null);
      }

      setNodeDeleteTarget(null);
      await refreshTaxonomyData();
    } catch (error) {
      notify({
        type: "error",
        message: "Deactivate node failed",
        description: getErrorMessage(error, "Could not deactivate taxonomy node."),
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;

    try {
      await deleteSkill(deleteTarget.id);
      notify({
        type: "success",
        message: "Skill deactivated",
        description: `"${deleteTarget.name}" has been marked inactive.`,
      });
      setDeleteTarget(null);
      await refreshTaxonomyData();
    } catch (error) {
      notify({
        type: "error",
        message: "Delete failed",
        description: getErrorMessage(error, "Could not deactivate skill."),
      });
    }
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Flex align="center" justify="space-between" gap={3} wrap="wrap">
        <HStack spacing={2} flexWrap="wrap">
          <ButtonConfig onClick={openCreate}>ADD SKILL</ButtonConfig>

          <HStack spacing={1} bg="white" border="1px solid #E2E8F0" borderRadius="12px" p={1}>
            <Button
              size="sm"
              variant={activeTab === "taxonomy" ? "solid" : "ghost"}
              onClick={() => setActiveTab("taxonomy")}
            >
              Taxonomy Tree
            </Button>
            <Button
              size="sm"
              variant={activeTab === "missing" ? "solid" : "ghost"}
              onClick={() => setActiveTab("missing")}
            >
              Missing Mapping
            </Button>
            <Button
              size="sm"
              variant={activeTab === "all" ? "solid" : "ghost"}
              onClick={() => setActiveTab("all")}
            >
              All Skills
            </Button>
          </HStack>
        </HStack>

        <HStack spacing={2} flexWrap="wrap">
          <InputGroup w={{ base: "100%", md: "360px" }}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon />
            </InputLeftElement>
            <Input
              placeholder="Search skill, alias, description..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </InputGroup>

          <Tooltip label="Refresh taxonomy" hasArrow>
            <IconButton
              aria-label="Refresh taxonomy"
              icon={<FiRefreshCw />}
              variant="outline"
              onClick={() => refreshTaxonomyData()}
            />
          </Tooltip>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
        <Box border="1px solid #E2E8F0" borderRadius="12px" p={4} bg="white">
          <Text fontSize="xs" fontWeight="800" color="#64748B" textTransform="uppercase">
            Total skills
          </Text>
          <Text mt={1} fontSize="2xl" fontWeight="900" color="#1E293B">
            {summaryQuery.data?.totalSkills ?? 0}
          </Text>
        </Box>
        <Box border="1px solid #E2E8F0" borderRadius="12px" p={4} bg="white">
          <Text fontSize="xs" fontWeight="800" color="#64748B" textTransform="uppercase">
            Mapped
          </Text>
          <Text mt={1} fontSize="2xl" fontWeight="900" color="#15803D">
            {summaryQuery.data?.mappedSkillCount ?? 0}
          </Text>
        </Box>
        <Box border="1px solid #E2E8F0" borderRadius="12px" p={4} bg="white">
          <Text fontSize="xs" fontWeight="800" color="#64748B" textTransform="uppercase">
            Missing taxonomy
          </Text>
          <Text mt={1} fontSize="2xl" fontWeight="900" color="#C2410C">
            {summaryQuery.data?.missingSkillCount ?? 0}
          </Text>
        </Box>
      </SimpleGrid>

      {activeTab !== "missing" && catalogGroups.length === 0 && !catalogQuery.isLoading ? (
        <Box border="1px solid #E2E8F0" borderRadius="12px" p={8} bg="white">
          <Text fontWeight="800" color="#1E293B">
            No skills found
          </Text>
          <Text mt={1} color="#64748B">
            Adjust the search keyword or taxonomy filter.
          </Text>
        </Box>
      ) : (
        <Flex gap={4} align="stretch" minH="540px">
          {/* Left sidebar tree */}
          <Box
            w={{ base: "100%", md: "340px" }}
            flexShrink={0}
            border="1px solid #E2E8F0"
            borderRadius="12px"
            bg="white"
            overflow="hidden"
          >
            <Box px={4} py={3} bg="#F8FAFC" borderBottom="1px solid #E2E8F0">
              <Flex justify="space-between" align="center" gap={2}>
                <Box minW={0}>
                  <Text fontWeight="900" color="#1E293B">
                    Taxonomy nodes
                  </Text>
                  <Text mt={1} fontSize="sm" color="#64748B">
                    Manage group/subgroup nodes. Select a subgroup to view skills.
                  </Text>
                </Box>
                <Tooltip label="Add group node" hasArrow>
                  <IconButton
                    aria-label="Add group node"
                    size="sm"
                    icon={<FiPlus />}
                    colorScheme="blue"
                    variant="outline"
                    onClick={openCreateGroupNode}
                  />
                </Tooltip>
              </Flex>
            </Box>

            <Box px={2} py={2} maxH={{ base: "auto", md: "640px" }} overflowY="auto">
              {activeTab === "missing" ? (
                <Box px={2} py={3}>
                  <Text fontSize="sm" fontWeight="800" color="#1E293B">
                    Missing taxonomy mapping
                  </Text>
                  <Text mt={1} fontSize="sm" color="#64748B">
                    {summaryQuery.data?.missingSkillCount ?? 0} skills need taxonomy nodes.
                  </Text>
                </Box>
              ) : catalogQuery.isLoading ? (
                <Flex justify="center" py={6}>
                  <Spinner size="sm" color="#334371" />
                </Flex>
              ) : catalogGroups.length === 0 ? (
                <Box p={4}>
                  <Text fontSize="sm" color="#64748B">
                    No taxonomy nodes yet. Click + to add a group.
                  </Text>
                </Box>
              ) : (
                catalogGroups.map((group) => {
                  const groupId = group.id;
                  const isExpanded = expandedGroups[groupId] ?? true;
                  return (
                    <Box
                      key={groupId}
                      mb={2}
                      opacity={group.is_active ? 1 : 0.55}
                    >
                      <Flex
                        role="group"
                        align="center"
                        gap={1}
                        px={1}
                        py={1}
                        borderRadius="8px"
                        _hover={{ bg: "#F8FAFC" }}
                      >
                        <Button
                          flex="1"
                          justifyContent="space-between"
                          variant="ghost"
                          fontWeight="900"
                          onClick={() =>
                            setExpandedGroups((prev) => ({
                              ...prev,
                              [groupId]: !isExpanded,
                            }))
                          }
                        >
                          <HStack spacing={2} minW={0}>
                            <Text noOfLines={1}>{group.name}</Text>
                            <Badge borderRadius="full" colorScheme="blue">
                              {group.skillCount ?? 0}
                            </Badge>
                            {!group.is_active && (
                              <Badge borderRadius="full" colorScheme="gray">
                                Inactive
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="xs" color="#64748B">
                            {isExpanded ? "−" : "+"}
                          </Text>
                        </Button>
                        <HStack
                          spacing={0}
                          flexShrink={0}
                          opacity={0}
                          transition="opacity 0.15s ease"
                          _groupHover={{ opacity: 1 }}
                        >
                          <Tooltip label="Add subgroup" hasArrow>
                            <IconButton
                              aria-label="Add subgroup"
                              size="xs"
                              variant="ghost"
                              icon={<FiPlus />}
                              isDisabled={!group.is_active}
                              onClick={() => openCreateSubgroupNode(group.id)}
                            />
                          </Tooltip>
                          <Tooltip label="Edit group" hasArrow>
                            <IconButton
                              aria-label="Edit group"
                              size="xs"
                              variant="ghost"
                              icon={<FiEdit2 />}
                              onClick={() => openEditNode(group)}
                            />
                          </Tooltip>
                          <Tooltip label="Deactivate group" hasArrow>
                            <IconButton
                              aria-label="Deactivate group"
                              size="xs"
                              variant="ghost"
                              color="red.600"
                              icon={<FiTrash2 />}
                              isDisabled={!group.is_active}
                              onClick={() => setNodeDeleteTarget(group)}
                            />
                          </Tooltip>
                        </HStack>
                      </Flex>

                      {isExpanded && (
                        <VStack align="stretch" spacing={1} mt={1} pl={3}>
                          {(group.subgroups ?? []).map((subgroup) => {
                            const isSelected = subgroup.id === selectedSubgroupId;
                            return (
                              <Flex
                                key={subgroup.id}
                                role="group"
                                align="center"
                                gap={1}
                                px={1}
                                borderRadius="8px"
                                opacity={subgroup.is_active ? 1 : 0.55}
                                _hover={{ bg: isSelected ? undefined : "#F8FAFC" }}
                              >
                                <Button
                                  flex="1"
                                  justifyContent="space-between"
                                  variant={isSelected ? "solid" : "ghost"}
                                  color={isSelected ? "white" : undefined}
                                  bg={isSelected ? "#334371" : undefined}
                                  fontWeight={isSelected ? "900" : "700"}
                                  _hover={
                                    isSelected
                                      ? { bg: "#2B3A66", color: "white" }
                                      : { bg: "#EEF2FF", color: "#0F172A" }
                                  }
                                  onClick={() => {
                                    setSelectedGroupId(group.id);
                                    setSelectedSubgroupId(subgroup.id);
                                  }}
                                >
                                  <HStack spacing={2} minW={0}>
                                    <Text noOfLines={1}>{subgroup.name}</Text>
                                    <Badge borderRadius="full">
                                      {subgroup.skillCount ?? 0}
                                    </Badge>
                                  </HStack>
                                </Button>
                                <HStack
                                  spacing={0}
                                  flexShrink={0}
                                  opacity={0}
                                  transition="opacity 0.15s ease"
                                  _groupHover={{ opacity: 1 }}
                                >
                                  <Tooltip label="Edit subgroup" hasArrow>
                                    <IconButton
                                      aria-label="Edit subgroup"
                                      size="xs"
                                      variant="ghost"
                                      color={isSelected ? "white" : undefined}
                                      icon={<FiEdit2 />}
                                      onClick={() => openEditNode(subgroup)}
                                    />
                                  </Tooltip>
                                  <Tooltip label="Deactivate subgroup" hasArrow>
                                    <IconButton
                                      aria-label="Deactivate subgroup"
                                      size="xs"
                                      variant="ghost"
                                      color={isSelected ? "red.200" : "red.600"}
                                      icon={<FiTrash2 />}
                                      isDisabled={!subgroup.is_active}
                                      onClick={() => setNodeDeleteTarget(subgroup)}
                                    />
                                  </Tooltip>
                                </HStack>
                              </Flex>
                            );
                          })}
                        </VStack>
                      )}
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>

          {/* Right content */}
          <Box
            flex="1"
            border="1px solid #E2E8F0"
            borderRadius="12px"
            bg="white"
            overflow="hidden"
          >
            <Box px={4} py={3} bg="#F8FAFC" borderBottom="1px solid #E2E8F0">
              <HStack justify="space-between" align="flex-start" gap={3}>
                <Box minW={0}>
                  <Text fontWeight="900" color="#1E293B" noOfLines={1}>
                    {activeTab === "all"
                      ? "All skills"
                      : activeTab === "missing"
                        ? "Missing taxonomy mapping"
                        : selectedSubgroupId
                          ? "Skills in selected subgroup"
                          : "Select a subgroup"}
                  </Text>
                  <Text mt={1} fontSize="sm" color="#64748B" noOfLines={1}>
                    {activeTab === "all" || activeTab === "missing" || selectedSubgroupId
                      ? `${skillsPagination?.totalItems ?? 0} skills${
                          debouncedSearch ? ` matching "${debouncedSearch}"` : ""
                        }`
                      : "Use the left taxonomy tree."}
                  </Text>
                </Box>
              </HStack>
            </Box>

            <Box p={4} position="relative" minH="280px">
              {activeTab === "taxonomy" && !selectedSubgroupId ? (
                <Box p={8} border="1px dashed #CBD5E1" borderRadius="12px" bg="#F8FAFC">
                  <Text fontWeight="900" color="#1E293B">
                    Choose a taxonomy subgroup
                  </Text>
                  <Text mt={1} color="#64748B">
                    Click a subgroup in the left sidebar to see its mapped skills.
                  </Text>
                </Box>
              ) : isSkillsListLoading ? (
                <Flex justify="center" py={16}>
                  <Spinner color="#334371" />
                </Flex>
              ) : pagedSkills.length === 0 ? (
                <Box p={8} border="1px dashed #CBD5E1" borderRadius="12px" bg="#F8FAFC">
                  <Text fontWeight="900" color="#1E293B">
                    No skills found
                  </Text>
                  <Text mt={1} color="#64748B">
                    Try another keyword or taxonomy subgroup.
                  </Text>
                </Box>
              ) : (
                <VStack align="stretch" spacing={3} opacity={isSkillsListFetching ? 0.55 : 1}>
                  {pagedSkills.map((skill) => (
                    <Box
                      key={skill.id}
                      w="100%"
                      border="1px solid #E2E8F0"
                      borderRadius="12px"
                      p={3}
                      bg={skill.is_active ? "white" : "#F8FAFC"}
                    >
                      <Flex justify="space-between" align="center" gap={3}>
                        <Text fontWeight="900" color="#1E293B" flex="1" minW={0}>
                          {skill.name}
                        </Text>
                        <HStack spacing={1} flexShrink={0}>
                          {activeTab === "missing" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openMapTaxonomy(skill)}
                            >
                              Map taxonomy
                            </Button>
                          ) : (
                            <Tooltip label="Edit skill taxonomy" hasArrow>
                              <IconButton
                                aria-label="Edit skill taxonomy"
                                size="sm"
                                variant="ghost"
                                icon={<FiEdit2 />}
                                onClick={() => openEdit(skill)}
                              />
                            </Tooltip>
                          )}
                          <Tooltip label="Deactivate skill" hasArrow>
                            <IconButton
                              aria-label="Deactivate skill"
                              size="sm"
                              variant="ghost"
                              color="red.600"
                              icon={<FiTrash2 />}
                              onClick={() => setDeleteTarget(skill)}
                            />
                          </Tooltip>
                        </HStack>
                      </Flex>

                      <Badge
                        mt={2}
                        colorScheme={skill.is_active ? "green" : "gray"}
                        borderRadius="full"
                      >
                        {getSkillStatusLabel(skill)}
                      </Badge>

                      <Text mt={2} fontSize="sm" color="#64748B">
                        {taxonomyPath(skill)}
                      </Text>

                      {!!skill.aliases?.length && (
                        <HStack mt={2} spacing={2} flexWrap="wrap">
                          {skill.aliases.slice(0, 8).map((alias) => (
                            <Tag key={alias} size="sm" borderRadius="full">
                              {alias}
                            </Tag>
                          ))}
                        </HStack>
                      )}
                    </Box>
                  ))}

                  {(skillsPagination?.totalPages ?? 0) > 1 && (
                    <Pagination
                      currentPage={skillsPagination?.currentPage ?? 1}
                      totalPages={skillsPagination?.totalPages ?? 1}
                      onPageChange={setSkillsPage}
                    />
                  )}
                </VStack>
              )}
            </Box>
          </Box>
        </Flex>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        isCentered
        size="3xl"
      >
        <ModalOverlay />
        <ModalContent borderRadius="16px">
          <ModalHeader>
            <Text fontSize="xl" fontWeight="900" color="#1F2937">
              {form.id ? "Update skill" : "Create skill"}
            </Text>
            <Text mt={1} fontSize="sm" color="#64748B">
              Update basic info, taxonomy mapping and aliases.
            </Text>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <VStack align="stretch" spacing={5}>
              {/* Basic info */}
              <Box>
                <Text fontSize="sm" fontWeight="900" color="#334155" textTransform="uppercase">
                  Basic info
                </Text>
                <Divider my={3} />

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text mb={1} fontWeight="800" color="#334155">
                      Skill name
                    </Text>
                    <Input
                      value={form.name}
                      onChange={(event) => updateForm("name", event.target.value)}
                      placeholder="React, Python, Docker..."
                    />
                  </Box>

                  <Box>
                    <Text mb={1} fontWeight="800" color="#334155">
                      Status
                    </Text>
                    <Select
                      value={form.is_active ? "active" : "inactive"}
                      onChange={(event) =>
                        updateForm("is_active", event.target.value === "active")
                      }
                    >
                      <option value="active">{SKILL_STATUS.ACTIVE}</option>
                      <option value="inactive">{SKILL_STATUS.INACTIVE}</option>
                    </Select>
                  </Box>

                  <Box gridColumn={{ base: "auto", md: "1 / -1" }}>
                    <Text mb={1} fontWeight="800" color="#334155">
                      Description
                    </Text>
                    <Textarea
                      value={form.description}
                      onChange={(event) => updateForm("description", event.target.value)}
                      placeholder="Description is shown in this modal only."
                      minH="110px"
                    />
                  </Box>
                </SimpleGrid>
              </Box>

              {/* Taxonomy mapping */}
              <Box>
                <Text fontSize="sm" fontWeight="900" color="#334155" textTransform="uppercase">
                  Taxonomy mapping
                </Text>
                <Divider my={3} />

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text mb={1} fontWeight="800" color="#334155">
                      Group node
                    </Text>
                    <SearchCombobox
                      value={form.taxonomy_group_node_id}
                      onChange={(value) => updateForm("taxonomy_group_node_id", value)}
                      options={activeGroupOptions}
                      placeholder="Select group node..."
                    />
                  </Box>

                  <Box>
                    <Text mb={1} fontWeight="800" color="#334155">
                      Subgroup node
                    </Text>
                    <SearchCombobox
                      value={form.taxonomy_subgroup_node_id}
                      onChange={(value) =>
                        updateForm("taxonomy_subgroup_node_id", value)
                      }
                      options={activeSubgroupOptions}
                      placeholder={
                        form.taxonomy_group_node_id
                          ? "Select subgroup node..."
                          : "Select group first"
                      }
                      isDisabled={!form.taxonomy_group_node_id}
                    />
                  </Box>
                </SimpleGrid>
              </Box>

              {/* Aliases */}
              <Box>
                <Text fontSize="sm" fontWeight="900" color="#334155" textTransform="uppercase">
                  Aliases
                </Text>
                <Divider my={3} />

                <HStack spacing={2}>
                  <Input
                    value={form.newAlias}
                    onChange={(event) => updateForm("newAlias", event.target.value)}
                    placeholder="Add an alias (e.g. JS, JavaScript)"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addAlias();
                      }
                    }}
                  />
                  <Button variant="outline" onClick={addAlias}>
                    Add
                  </Button>
                </HStack>

                {!!form.aliases.length ? (
                  <HStack mt={3} spacing={2} flexWrap="wrap">
                    {form.aliases.map((alias) => (
                      <Tag key={alias} size="md" borderRadius="full">
                        {alias}
                        <TagCloseButton onClick={() => removeAlias(alias)} />
                      </Tag>
                    ))}
                  </HStack>
                ) : (
                  <Text mt={3} fontSize="sm" color="#64748B">
                    No aliases yet.
                  </Text>
                )}
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" mr={3} onClick={() => setIsFormOpen(false)}>
              CANCEL
            </Button>
            <Button
              leftIcon={<Icon as={FiPlus} />}
              bg="#334371"
              color="white"
              isLoading={isSaving}
              _hover={{ bg: "#2A365D" }}
              onClick={handleSubmit}
            >
              SAVE
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ModalConfirm
        open={Boolean(deleteTarget)}
        setOpen={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Deactivate skill"
        message={`Deactivate "${deleteTarget?.name ?? ""}"? Existing references remain, but the skill will be marked inactive.`}
        titleButton="DEACTIVATE"
        cancelButtonText="CANCEL"
        confirmButtonProps={{ background: "#8B0000", isLoading: isDeleting }}
        onClick={handleDelete}
      />

      <Modal
        isOpen={isNodeFormOpen}
        onClose={() => setIsNodeFormOpen(false)}
        isCentered
        size="lg"
      >
        <ModalOverlay />
        <ModalContent borderRadius="16px">
          <ModalHeader>
            <Text fontSize="xl" fontWeight="900" color="#1F2937">
              {nodeForm.id
                ? "Update taxonomy node"
                : nodeForm.node_type === "GROUP"
                  ? "Create group node"
                  : "Create subgroup node"}
            </Text>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <VStack align="stretch" spacing={4}>
              {nodeForm.node_type === "SUBGROUP" && !nodeForm.id && !nodeForm.parent_id && (
                <Box>
                  <Text mb={1} fontWeight="800" color="#334155">
                    Parent group
                  </Text>
                  <SearchCombobox
                    value={nodeForm.parent_id}
                    onChange={(value) =>
                      setNodeForm((prev) => ({ ...prev, parent_id: value }))
                    }
                    options={catalogGroupOptions}
                    placeholder="Select parent group..."
                  />
                </Box>
              )}

              <Box>
                <Text mb={1} fontWeight="800" color="#334155">
                  {nodeForm.node_type === "GROUP" ? "Group name" : "Subgroup name"}
                </Text>
                <Input
                  value={nodeForm.name}
                  onChange={(event) =>
                    setNodeForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder={
                    nodeForm.node_type === "GROUP"
                      ? "e.g. Data & Databases"
                      : "e.g. SQL / NoSQL"
                  }
                />
              </Box>

              {nodeForm.id && (
                <Flex align="center" justify="space-between">
                  <Text fontWeight="800" color="#334155">
                    Active
                  </Text>
                  <Switch
                    isChecked={nodeForm.is_active}
                    onChange={(event) =>
                      setNodeForm((prev) => ({
                        ...prev,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                </Flex>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" mr={3} onClick={() => setIsNodeFormOpen(false)}>
              CANCEL
            </Button>
            <Button
              bg="#334371"
              color="white"
              isLoading={isNodeSaving}
              _hover={{ bg: "#2A365D" }}
              onClick={handleNodeSubmit}
            >
              SAVE
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ModalConfirm
        open={Boolean(nodeDeleteTarget)}
        setOpen={(open) => {
          if (!open) setNodeDeleteTarget(null);
        }}
        title="Deactivate taxonomy node"
        message={`Deactivate "${nodeDeleteTarget?.name ?? ""}"? ${
          nodeDeleteTarget?.node_type === "GROUP"
            ? "All subgroups under this group will also be deactivated."
            : "Skills mapped to this subgroup remain, but the node will be hidden from active options."
        }`}
        titleButton="DEACTIVATE"
        cancelButtonText="CANCEL"
        confirmButtonProps={{ background: "#8B0000", isLoading: isNodeDeleting }}
        onClick={handleNodeDelete}
      />
    </VStack>
  );
}
