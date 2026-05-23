import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Tag,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import type { AiRecommendationItem } from "../api/getAiRecommendations";
import { resolveCompanyLogoUrl } from "../../../../utils/companyLogo";

const formatSalary = (
  salaryFrom?: number | null,
  salaryTo?: number | null,
  salaryCurrency?: string | null,
) => {
  const unit = salaryCurrency || "VND";

  if (salaryFrom && salaryTo) {
    return `${salaryFrom.toLocaleString("vi-VN")} - ${salaryTo.toLocaleString("vi-VN")} ${unit}`;
  }

  if (salaryFrom) return `From ${salaryFrom.toLocaleString("en-VN")} ${unit}`;
  if (salaryTo) return `To ${salaryTo.toLocaleString("en-VN")} ${unit}`;
  return "Agree";
};

type Props = {
  item: AiRecommendationItem;
};

export default function AiJobCard({ item }: Props) {
  const job = item.recruitment_infor;
  const title = job.post_title || job.internal_title || "Recruitment news";
  const companyName = job.company?.full_name || "The company has not updated yet";
  const location = job.work_location?.short_address || job.work_location?.full_name || "Location not updated";
  const logo = resolveCompanyLogoUrl(job.company?.image_logo);
  const salaryText = formatSalary(job.salary_from, job.salary_to, job.salary_currency);

  return (
    <Box
      border="1px solid #E2E8F0"
      borderRadius="18px"
      bg="white"
      p={3}
      boxShadow="0 8px 24px rgba(15,23,42,0.06)"
    >
      <Flex gap={3} align="flex-start">
        <Box
          w="48px"
          h="48px"
          minW="48px"
          borderRadius="14px"
          border="1px solid #E2E8F0"
          overflow="hidden"
          bg="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Image src={logo} alt={companyName} objectFit="contain" w="80%" h="80%" />
        </Box>

        <Box flex="1" minW={0}>
          <Text fontSize="14px" fontWeight="700" color="#1E293B" noOfLines={2}>
            {title}
          </Text>
          <Text mt={1} fontSize="12px" fontWeight="600" color="#64748B" noOfLines={1}>
            {companyName}
          </Text>

          <HStack spacing={2} mt={2} flexWrap="wrap">
            <Tag size="sm" borderRadius="full" bg="#EEF2FF" color="#334371">
              Top {item.rank}
            </Tag>
            <Tag size="sm" borderRadius="full" bg="#F8FAFC" color="#475569">
              {salaryText}
            </Tag>
            <Tag size="sm" borderRadius="full" bg="#F8FAFC" color="#475569" maxW="160px">
              <Text noOfLines={1}>{location}</Text>
            </Tag>
          </HStack>

          {item.explanation_short && (
            <Text mt={2} fontSize="12px" color="#475569" lineHeight="1.5">
              {item.explanation_short}
            </Text>
          )}

          <Button
            as={RouterLink}
            to={`/it-job/jobs/${job.id}`}
            size="sm"
            mt={3}
            borderRadius="12px"
            bg="#334371"
            color="white"
            _hover={{ bg: "#2B365D" }}
          >
            See details
          </Button>
        </Box>
      </Flex>
    </Box>
  );
}
