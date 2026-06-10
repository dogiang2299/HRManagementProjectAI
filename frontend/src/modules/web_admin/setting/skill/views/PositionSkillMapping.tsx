import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Tag,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { FiMinus, FiRefreshCw } from "react-icons/fi";
import { useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { useNotify } from "../../../../../components/notification/NotifyProvider";
import {
  useAddSkillToPosition,
  useGetPositionSkillTree,
  useGetSkillsForPosition,
  useRemoveSkillFromPosition,
  useSearchSkillsForPositionMapping,
} from "../api/positionSkill";
import type { TaxonomySkill } from "../types";

const taxonomyPath = (skill: TaxonomySkill) => {
  const mapping = skill.taxonomyMappings?.[0];
  const group = skill.taxonomy_group || mapping?.taxonomy_group;
  const subgroup = skill.taxonomy_subgroup || mapping?.taxonomy_subgroup;
  if (!group && !subgroup) return "Unmapped";
  if (group && subgroup) return `${group} / ${subgroup}`;
  return group || subgroup || "Unmapped";
};

export function PositionSkillMapping() {
  const notify = useNotify();
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [treeSearch, setTreeSearch] = useState("");
  const [debouncedTreeSearch] = useDebounce(treeSearch, 400);

  const treeQuery = useGetPositionSkillTree({ search: debouncedTreeSearch });
  const positionQuery = useGetSkillsForPosition(selectedPositionId);

  const [skillSearch, setSkillSearch] = useState("");
  const [debouncedSkillSearch] = useDebounce(skillSearch, 400);
  const searchQuery = useSearchSkillsForPositionMapping(debouncedSkillSearch, 20);

  const { mutateAsync: addSkill, isPending: isAdding } = useAddSkillToPosition();
  const { mutateAsync: removeSkill, isPending: isRemoving } = useRemoveSkillFromPosition();

  const groups = treeQuery.data?.groups ?? [];
  const selectedPosition = positionQuery.data?.position ?? null;
  const positionSkills = positionQuery.data?.skills ?? [];

  const positionSkillIdSet = useMemo(() => new Set(positionSkills.map((s) => s.id)), [positionSkills]);

  const handleAdd = async (skillId: string) => {
    if (!selectedPositionId) return;
    try {
      const res = await addSkill({ positionId: selectedPositionId, skillId });
      if (res.warning) {
        notify({ type: "warning", message: res.warning });
      } else {
        notify({ type: "success", message: "Skill added to position" });
      }
    } catch (error) {
      notify({
        type: "error",
        message: "Add skill failed",
        description: (error as any)?.response?.data?.message || (error as any)?.message,
      });
    }
  };

  const handleRemove = async (skillId: string) => {
    if (!selectedPositionId) return;
    try {
      const res = await removeSkill({ positionId: selectedPositionId, skillId });
      if (res.warning) {
        notify({ type: "warning", message: res.warning });
      } else {
        notify({ type: "success", message: "Skill removed from position" });
      }
    } catch (error) {
      notify({
        type: "error",
        message: "Remove skill failed",
        description: (error as any)?.response?.data?.message || (error as any)?.message,
      });
    }
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Flex align="center" justify="space-between" gap={3} wrap="wrap">
        <Text fontSize="xl" fontWeight="900" color="#1E293B">
          Position Skill Mapping
        </Text>
        <Tooltip label="Refresh" hasArrow>
          <IconButton
            aria-label="Refresh"
            icon={<FiRefreshCw />}
            variant="outline"
            onClick={() => {
              treeQuery.refetch();
              positionQuery.refetch();
            }}
          />
        </Tooltip>
      </Flex>

      <Flex gap={4} align="stretch" minH="640px">
        {/* Left panel */}
        <Box
          w={{ base: "100%", md: "360px" }}
          flexShrink={0}
          border="1px solid #E2E8F0"
          borderRadius="12px"
          bg="white"
          overflow="hidden"
        >
          <Box px={4} py={3} bg="#F8FAFC" borderBottom="1px solid #E2E8F0">
            <Text fontWeight="900" color="#1E293B">
              Position groups
            </Text>
            <InputGroup mt={3}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon />
              </InputLeftElement>
              <Input
                value={treeSearch}
                onChange={(e) => setTreeSearch(e.target.value)}
                placeholder="Search positions..."
              />
            </InputGroup>
          </Box>

          <Box px={2} py={2} maxH={{ base: "auto", md: "640px" }} overflowY="auto">
            {treeQuery.isFetching ? (
              <Flex justify="center" py={10}>
                <Spinner color="#334371" />
              </Flex>
            ) : (
              groups.map((group) => {
                const groupKey = group.id || group.name;
                const isExpanded = expandedGroups[groupKey] ?? true;
                return (
                  <Box key={groupKey} mb={2}>
                    <Button
                      w="100%"
                      variant="ghost"
                      justifyContent="space-between"
                      fontWeight="900"
                      onClick={() =>
                        setExpandedGroups((prev) => ({
                          ...prev,
                          [groupKey]: !isExpanded,
                        }))
                      }
                    >
                      <HStack spacing={2} minW={0}>
                        <Text noOfLines={1}>{group.name}</Text>
                        <Badge borderRadius="full" colorScheme="blue">
                          {group.positions.length}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="#64748B">
                        {isExpanded ? "−" : "+"}
                      </Text>
                    </Button>

                    {isExpanded && (
                      <VStack align="stretch" spacing={1} mt={1} pl={3}>
                        {group.positions.map((pos) => {
                          const isSelected = pos.id === selectedPositionId;
                          return (
                            <Button
                              key={pos.id}
                              w="100%"
                              variant={isSelected ? "solid" : "ghost"}
                              colorScheme={isSelected ? "blue" : undefined}
                              justifyContent="space-between"
                              fontWeight={isSelected ? "900" : "700"}
                              onClick={() => setSelectedPositionId(pos.id)}
                            >
                              <HStack spacing={2} minW={0}>
                                <Text noOfLines={1}>{pos.name || "(Unnamed position)"}</Text>
                                <Badge borderRadius="full">{pos.skills.length}</Badge>
                              </HStack>
                            </Button>
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

        {/* Right panel */}
        <Box flex="1" border="1px solid #E2E8F0" borderRadius="12px" bg="white" overflow="hidden">
          <Box px={4} py={3} bg="#F8FAFC" borderBottom="1px solid #E2E8F0">
            <Text fontWeight="900" color="#1E293B" noOfLines={1}>
              {selectedPosition
                ? `${selectedPosition.group?.name_group ?? "Unknown group"} / ${selectedPosition.name_post ?? "Unknown position"}`
                : "Select a position"}
            </Text>
            <Text mt={1} fontSize="sm" color="#64748B">
              {selectedPosition ? `${positionSkills.length} required skills` : "Pick a position from the left panel."}
            </Text>
          </Box>

          <Box p={4}>
            {!selectedPositionId ? (
              <Box p={8} border="1px dashed #CBD5E1" borderRadius="12px" bg="#F8FAFC">
                <Text fontWeight="900" color="#1E293B">
                  Choose a position
                </Text>
                <Text mt={1} color="#64748B">
                  Select a position to view and manage its required skills.
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" spacing={4}>
                <Box border="1px solid #E2E8F0" borderRadius="12px" p={3}>
                  <Text fontWeight="900" color="#1E293B">
                    Add skill
                  </Text>
                  <InputGroup mt={2}>
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon />
                    </InputLeftElement>
                    <Input
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      placeholder="Search skill by name or alias..."
                    />
                  </InputGroup>

                  {debouncedSkillSearch.trim() && (
                    <Box mt={3}>
                      {searchQuery.isFetching ? (
                        <Flex justify="center" py={4}>
                          <Spinner />
                        </Flex>
                      ) : (
                        <VStack align="stretch" spacing={2}>
                          {(searchQuery.data ?? []).slice(0, 8).map((skill) => {
                            const alreadyAdded = positionSkillIdSet.has(skill.id);
                            const missingTaxonomy = !skill.taxonomyMappings?.length;
                            return (
                              <Flex
                                key={skill.id}
                                align="center"
                                justify="space-between"
                                border="1px solid #E2E8F0"
                                borderRadius="10px"
                                p={2}
                                gap={3}
                              >
                                <Box minW={0}>
                                  <HStack spacing={2} flexWrap="wrap">
                                    <Text fontWeight="900" noOfLines={1}>
                                      {skill.name}
                                    </Text>
                                    {missingTaxonomy && (
                                      <Badge colorScheme="orange" borderRadius="full">
                                        Missing taxonomy
                                      </Badge>
                                    )}
                                  </HStack>
                                  <Text fontSize="sm" color="#64748B" noOfLines={1}>
                                    {taxonomyPath(skill)}
                                  </Text>
                                </Box>
                                <Button
                                  size="sm"
                                  onClick={() => handleAdd(skill.id)}
                                  isLoading={isAdding}
                                  isDisabled={alreadyAdded}
                                >
                                  {alreadyAdded ? "Added" : "Add"}
                                </Button>
                              </Flex>
                            );
                          })}
                        </VStack>
                      )}
                    </Box>
                  )}
                </Box>

                <Box>
                  <Text fontWeight="900" color="#1E293B" mb={2}>
                    Required skills
                  </Text>
                  {positionQuery.isFetching ? (
                    <Flex justify="center" py={8}>
                      <Spinner />
                    </Flex>
                  ) : positionSkills.length === 0 ? (
                    <Box p={8} border="1px dashed #CBD5E1" borderRadius="12px" bg="#F8FAFC">
                      <Text fontWeight="900" color="#1E293B">
                        No skills mapped
                      </Text>
                      <Text mt={1} color="#64748B">
                        Use search above to add skills to this position.
                      </Text>
                    </Box>
                  ) : (
                    <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={3}>
                      {positionSkills.map((skill) => {
                        const missingTaxonomy = !skill.taxonomyMappings?.length;
                        return (
                          <Box key={skill.id} border="1px solid #E2E8F0" borderRadius="12px" p={3}>
                            <Flex justify="space-between" align="flex-start" gap={3}>
                              <Box minW={0}>
                                <HStack spacing={2} flexWrap="wrap">
                                  <Text fontWeight="900" color="#1E293B" noOfLines={1}>
                                    {skill.name}
                                  </Text>
                                  <Badge
                                    colorScheme={skill.is_active ? "green" : "gray"}
                                    borderRadius="full"
                                  >
                                    {skill.is_active ? "ACTIVE" : "INACTIVE"}
                                  </Badge>
                                  {missingTaxonomy && (
                                    <Badge colorScheme="orange" borderRadius="full">
                                      Missing taxonomy
                                    </Badge>
                                  )}
                                </HStack>
                                <Text mt={1} fontSize="sm" color="#64748B" noOfLines={1}>
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

                              <Tooltip label="Remove from position" hasArrow>
                                <IconButton
                                  aria-label="Remove from position"
                                  size="sm"
                                  icon={<FiMinus />}
                                  colorScheme="red"
                                  variant="ghost"
                                  isLoading={isRemoving}
                                  onClick={() => handleRemove(skill.id)}
                                />
                              </Tooltip>
                            </Flex>
                          </Box>
                        );
                      })}
                    </SimpleGrid>
                  )}
                </Box>
              </VStack>
            )}
          </Box>
        </Box>
      </Flex>
    </VStack>
  );
}

