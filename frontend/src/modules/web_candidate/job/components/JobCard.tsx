import {
  LinkBox,
  Box,
  Image,
  Text,
  Flex,
  LinkOverlay,
  HStack,
  Tag,
  Icon,
  IconButton,
  useDisclosure,
} from "@chakra-ui/react";
import { FiBookmark } from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import { formatSalary, type IJobItem } from "../types/job";
import { useAuthStore } from "../../../auth/store/auth.store";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { RECRUIT_BASE_ROLE } from "../../../../constant/roles";
import { useCheckSavedJob, useToggleSaveJob } from "../api/saveJob";
import { useEffect, useState } from "react";
import { resolveCompanyLogoUrl } from "../../../../utils/companyLogo";
import { logo } from "../../../../assets/logo";
import CandidateLoginModal from "../../auth/components/CandidateLoginModal";

type JobCardProps = {
  job: IJobItem;
  leftAccent?: boolean;
};

const JobCard = ({ job, leftAccent }: JobCardProps) => {
  const notify = useNotify();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authUser = useAuthStore((state) => state.user);
  const toggleSaveJobMutation = useToggleSaveJob();
  const [savedLocal, setSavedLocal] = useState(false);
  const {
    isOpen: isLoginOpen,
    onOpen: onLoginOpen,
    onClose: onLoginClose,
  } = useDisclosure();

  const roleNames = (authUser?.roles ?? [])
    .map((r: any) => r?.role?.name_role || r?.name_role || r?.name || "")
    .filter(Boolean);
  const isCandidateLoggedIn = Boolean(
    isAuthenticated && roleNames.includes(RECRUIT_BASE_ROLE.Candidate),
  );
  const { data: savedState } = useCheckSavedJob(job.id, {
    enabled: Boolean(job.id && isCandidateLoggedIn),
  });

  useEffect(() => {
    if (typeof savedState?.is_saved === "boolean") {
      setSavedLocal(savedState.is_saved);
    }
  }, [savedState?.is_saved]);

  const saveJob = async () => {
    try {
      const res = await toggleSaveJobMutation.mutateAsync(job.id);
      setSavedLocal(Boolean(res?.saved));

      notify({
        message: res?.message || (res?.saved ? "Job posting saved" : "The job posting has been unsaved"),
        type: "success",
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Cannot save information at this time";
      notify({
        message: "An error occurred",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
        type: "error",
      });
    }
  };

  const ensureCandidateLogin = () => {
    if (isCandidateLoggedIn) return true;

    notify({
      message: "Please log in",
      description: "You need to log in to your candidate account to save information.",
      type: "warning",
    });
    onLoginOpen();
    return false;
  };

  const handleSaveJobClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!ensureCandidateLogin()) return;
    await saveJob();
  };

  const title = job.post_title || "Untitled Job";
  const companyName = job.department?.full_name || "Unknown Company";
  const companyLogo =
    resolveCompanyLogoUrl(job.department?.image_logo) ||
    resolveCompanyLogoUrl((job as any)?.inforCompany?.image_logo) ||
    resolveCompanyLogoUrl((job as any)?.company?.image_logo);
  const location =
    job.workLocation?.short_address ||
    job.work_location_name ||
    job.workLocation?.full_name ||
    "Unknown Location";

  const salaryText = formatSalary(
    job.salary_from,
    job.salary_to,
    job.salary_currency
  );

  return (
    <>
    <LinkBox
      position="relative"
                          bg="white"
                          border="1px solid"
                          borderColor="#E5E7EB"
                          borderRadius="20px"
                          px={{ base: 3.5, md: 4 }}
                          py={{ base: 3.5, md: 4 }}
                          boxShadow="0 1px 2px rgba(16,24,40,0.04)"
                          transition="all 0.2s ease"
                          overflow="hidden"
                          _before={{
                            content: '""',
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: "4px",
                            bg: "#334371",
                            opacity: 0.75,
                          }}
                          _hover={{
                            boxShadow: "0 12px 28px rgba(51,67,113,0.14)",
                            transform: "translateY(-2px)",
                          }}
    >
      <Flex gap="12px" align="stretch" h="100%">
        {/* Logo */}
        <Box
          w="58px"
          h="58px"
          minW="58px"
          border="1px solid"
          borderColor="#D9E2EC"
          borderRadius="12px"
          bg="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
          mt="2px"
          flexShrink={0}
        >
          <Image
            src={companyLogo || logo}
            alt={companyName}
            objectFit="contain"
            w="78%"
            h="78%"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.dataset.fallbackApplied === "1") return;
              img.dataset.fallbackApplied = "1";
              img.src = logo;
            }}
          />
        </Box>

        {/* Right content */}
        <Flex flex="1" direction="column" justify="space-between" minW={0}>
          {/* Top */}
          <Box minW={0}>
            <LinkOverlay as={RouterLink} to={`/it-job/jobs/${job.id}`}>
              <Text
                fontSize="15px"
                fontWeight="700"
                color="#25364A"
                lineHeight="1.35"
                noOfLines={2}
                _hover={{ color: "#2B6CB0" }}
              >
                {title}
              </Text>
            </LinkOverlay>

            <Text
              mt="4px"
              fontSize="12px"
              fontWeight="600"
              color="#7B8794"
              textTransform="uppercase"
              noOfLines={1}
            >
              {companyName}
            </Text>
          </Box>

          {/* Bottom */}
          <Flex justify="space-between" align="center" gap="10px">
            <HStack spacing="8px" flexWrap="wrap" minW={0}>
              <Tag
                px="12px"
                py="5px"
                borderRadius="full"
                bg="#F1F3F5"
                color="#314155"
                fontSize="12px"
                fontWeight="600"
                minH="unset"
                maxW="140px"
              >
                <Text noOfLines={1}>{salaryText}</Text>
              </Tag>

              <Tag
                px="12px"
                py="5px"
                borderRadius="full"
                bg="#F1F3F5"
                color="#314155"
                fontSize="12px"
                fontWeight="600"
                minH="unset"
                maxW="150px"
              >
                <Text noOfLines={1}>{location}</Text>
              </Tag>
            </HStack>

            <IconButton
              aria-label={savedLocal ? "Unsave the message" : "Save this information"}
              type="button"
              w="40px"
              h="40px"
              minW="40px"
              borderRadius="full"
              border="1px solid"
              borderColor="#ececec"
              color={savedLocal ? "white" : "#26365F"}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ bg: "#334371", color: "white", borderColor: "#26365F" }}
              bg={savedLocal ? "#26365F" : "white"}
              flexShrink={0}
              zIndex={2}
              variant="ghost"
              icon={<Icon as={FiBookmark} boxSize={5} color="currentColor" fill={savedLocal ? "currentColor" : "none"} />}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={handleSaveJobClick}
            />
          </Flex>
        </Flex>
      </Flex>
    </LinkBox>
    <CandidateLoginModal
      isOpen={isLoginOpen}
      onClose={onLoginClose}
      onSuccess={saveJob}
    />
    </>
  );
};

export default JobCard;
