import {
  Badge,
  Box,
  Checkbox,
  Grid,
  HStack,
  IconButton,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@chakra-ui/icons";
import { useEffect, useMemo, useState } from "react";
import SearchCombobox from "../../../../../components/common/SearchCombobox";
import { useNotify } from "../../../../../components/notification/NotifyProvider";
import { useGetSkills, mapSkillRecordToTaxonomy } from "../../skill/api/get";
import {
  useAddSkillToPosition,
  useGetSkillsForPosition,
  useRemoveSkillFromPosition,
} from "../../skill/api/positionSkill";

export type PositionSkillRow = {
  skill_id: string;
  skill_name: string;
  is_required: boolean;
  missing_taxonomy?: boolean;
};

const PAGE_SIZE = 8;

export const mapApiSkillToPositionRow = (skill: any): PositionSkillRow => {
  const mappings = skill?.taxonomyMappings;
  return {
    skill_id: skill.id,
    skill_name: skill.name || "Skill",
    is_required: skill.is_required ?? true,
    missing_taxonomy: Array.isArray(mappings) ? mappings.length === 0 : false,
  };
};

type PositionSkillsEditorProps = {
  disabled?: boolean;
  persistToPosition?: boolean;
  positionId?: string | null;
  skills?: PositionSkillRow[];
  onSkillsChange?: (skills: PositionSkillRow[]) => void;
};

export default function PositionSkillsEditor({
  disabled = false,
  persistToPosition = false,
  positionId,
  skills: controlledSkills,
  onSkillsChange,
}: PositionSkillsEditorProps) {
  const notify = useNotify();
  const [pickerValue, setPickerValue] = useState("");
  const [page, setPage] = useState(1);
  const [localSkills, setLocalSkills] = useState<PositionSkillRow[]>([]);

  const subtle = useColorModeValue("gray.500", "gray.400");
  const inputBorder = useColorModeValue("rgba(203, 213, 225, 0.75)", "gray.600");
  const inputBg = useColorModeValue("white", "gray.800");
  const sectionTitleColor = useColorModeValue("#1F2937", "gray.100");

  const { data: allSkillsData, isLoading: isAllSkillsLoading } = useGetSkills({
    pages: 1,
    items_per_pages: 500,
    scope: "ALL",
    include_inactive: true,
  });

  const positionSkillsQuery = useGetSkillsForPosition(
    persistToPosition && positionId ? positionId : null,
  );

  const addMutation = useAddSkillToPosition();
  const removeMutation = useRemoveSkillFromPosition();

  const skills = persistToPosition
    ? (positionSkillsQuery.data?.skills ?? []).map(mapApiSkillToPositionRow)
    : (controlledSkills ?? localSkills);

  const setSkills = (next: PositionSkillRow[]) => {
    if (persistToPosition) return;
    if (onSkillsChange) onSkillsChange(next);
    else setLocalSkills(next);
  };

  const allSkillOptions = useMemo(() => {
    const selected = new Set(skills.map((s) => s.skill_id));
    return (allSkillsData?.data ?? [])
      .map((raw) => mapSkillRecordToTaxonomy(raw))
      .filter((skill) => skill.is_active !== false)
      .filter((skill) => !selected.has(skill.id))
      .map((skill) => ({ id: skill.id, name: skill.name || "" }))
      .filter((item) => Boolean(item.name))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allSkillsData, skills]);

  const totalPages = Math.max(1, Math.ceil(skills.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pagedSkills = skills.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const handleAdd = async (skillId: string) => {
    if (!skillId || disabled) return;
    if (skills.some((s) => s.skill_id === skillId)) {
      setPickerValue("");
      return;
    }

    const raw = (allSkillsData?.data ?? []).find((s: any) => s.id === skillId);
    const row = mapApiSkillToPositionRow(
      raw ? mapSkillRecordToTaxonomy(raw) : { id: skillId, name: "Skill" },
    );

    if (persistToPosition && positionId) {
      try {
        const result = await addMutation.mutateAsync({ positionId, skillId });
        if (result.warning) {
          notify({
            type: "warning",
            message: "Skill added",
            description: result.warning,
          });
        }
        await positionSkillsQuery.refetch();
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          (Array.isArray(err?.response?.data?.message)
            ? err.response.data.message.join(", ")
            : "Could not add skill to position");
        notify({ type: "error", message: msg });
        return;
      }
    } else {
      setSkills([...skills, row]);
    }

    setPickerValue("");
    setPage(Math.max(1, Math.ceil((skills.length + 1) / PAGE_SIZE)));
  };

  const handleRemove = async (skillId: string) => {
    if (disabled) return;

    if (persistToPosition && positionId) {
      try {
        await removeMutation.mutateAsync({ positionId, skillId });
        await positionSkillsQuery.refetch();
      } catch (err: any) {
        notify({
          type: "error",
          message: err?.response?.data?.message || "Could not remove skill",
        });
        return;
      }
    } else {
      setSkills(skills.filter((s) => s.skill_id !== skillId));
    }
  };

  const toggleRequired = (skillId: string, isRequired: boolean) => {
    if (persistToPosition) return;
    setSkills(
      skills.map((s) =>
        s.skill_id === skillId ? { ...s, is_required: isRequired } : s,
      ),
    );
  };

  return (
    <Box>
      <SearchCombobox
        value={pickerValue}
        onChange={handleAdd}
        options={allSkillOptions}
        isLoading={isAllSkillsLoading || positionSkillsQuery.isFetching}
        placeholder="Select skill to add..."
        isDisabled={disabled || (persistToPosition && !positionId)}
        size="md"
        fontSize="sm"
      />

      {skills.length > 0 ? (
        <Box
          mt={3}
          border="1px solid"
          borderColor={inputBorder}
          borderRadius="8px"
          overflow="hidden"
          bg={inputBg}
        >
          <Grid
            templateColumns="minmax(0, 1fr) 100px 44px"
            gap={3}
            px={3}
            py={2}
            bg="gray.50"
            display={{ base: "none", md: "grid" }}
          >
            <Text fontSize="xs" fontWeight="700" color={subtle}>
              Skill
            </Text>
            <Text fontSize="xs" fontWeight="700" color={subtle}>
              Required
            </Text>
            <Box />
          </Grid>

          {pagedSkills.map((item, index) => (
            <Grid
              key={item.skill_id}
              templateColumns={{ base: "1fr", md: "minmax(0, 1fr) 100px 44px" }}
              gap={{ base: 2.5, md: 3 }}
              alignItems={{ base: "stretch", md: "center" }}
              px={3}
              py={3}
              borderTop={index === 0 ? "0" : "1px solid"}
              borderColor={inputBorder}
            >
              <Box minW={0}>
                <HStack spacing={2}>
                  <Text fontSize="sm" fontWeight="700" color={sectionTitleColor} noOfLines={1}>
                    {item.skill_name}
                  </Text>
                  {item.missing_taxonomy && (
                    <Badge colorScheme="orange" variant="subtle" fontSize="10px">
                      Missing taxonomy
                    </Badge>
                  )}
                </HStack>
              </Box>

              <Checkbox
                isChecked={item.is_required}
                isDisabled={disabled || persistToPosition}
                onChange={(e) => toggleRequired(item.skill_id, e.target.checked)}
                fontSize="sm"
                fontWeight="600"
              >
                Required
              </Checkbox>

              <IconButton
                aria-label={`Remove ${item.skill_name}`}
                icon={<CloseIcon boxSize={2.5} />}
                h="36px"
                minW="36px"
                size="sm"
                variant="ghost"
                isDisabled={disabled}
                onClick={() => handleRemove(item.skill_id)}
              />
            </Grid>
          ))}

          {skills.length > PAGE_SIZE && (
            <HStack
              justify="space-between"
              px={3}
              py={2}
              borderTop="1px solid"
              borderColor={inputBorder}
              bg="gray.50"
            >
              <Text fontSize="xs" color={subtle} fontWeight="600">
                Showing {pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, skills.length)} of{" "}
                {skills.length} skills
              </Text>
              <HStack spacing={2}>
                <IconButton
                  aria-label="Previous page"
                  icon={<ChevronLeftIcon />}
                  size="sm"
                  variant="outline"
                  isDisabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                />
                <Text fontSize="xs" fontWeight="700" minW="52px" textAlign="center">
                  {page}/{totalPages}
                </Text>
                <IconButton
                  aria-label="Next page"
                  icon={<ChevronRightIcon />}
                  size="sm"
                  variant="outline"
                  isDisabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                />
              </HStack>
            </HStack>
          )}
        </Box>
      ) : (
        <Text mt={2} fontSize="sm" color={subtle}>
          No skills added yet.
        </Text>
      )}
    </Box>
  );
}
