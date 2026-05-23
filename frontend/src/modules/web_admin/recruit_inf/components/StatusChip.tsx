import { Badge } from "@chakra-ui/react";
import { RECRUITMENT_STATUS_DISPLAY, type RecruitmentStatusType } from "../../../../constant";


export default function StatusChip({
  status,
}: {
  status: RecruitmentStatusType;
}) {
  const colorMap: Record<RecruitmentStatusType, string> = {
    PUBLIC: "green",
    INTERNAL: "purple",
    CLOSED: "gray",
    STOP_RECEIVING: "orange",
    DRAFT: "blue",
  };

  return (
    <Badge
      px={2.5}
      py={1}
      borderRadius="full"
      textTransform="none"
      fontWeight="600"
      variant="subtle"
      colorScheme={colorMap[status]}
      whiteSpace="nowrap"
      fontSize="xs"
    >
      {RECRUITMENT_STATUS_DISPLAY[status]}
    </Badge>
  );
}