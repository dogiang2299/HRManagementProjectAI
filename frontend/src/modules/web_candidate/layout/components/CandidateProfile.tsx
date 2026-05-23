import { Menu, MenuButton, Button, Text, HStack, Avatar, MenuList, Box, VStack, Divider } from "@chakra-ui/react";
import { FiBriefcase, FiFileText, FiUser, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import ProfileMenuSection from "./ProfileSection";
import {
  candidateAppliedJobsUrl,
  candidateChangePasswordUrl,
  candidateCvListUrl,
  candidateEmployeeContactCandidate,
  candidateLoginUrl,
  candidateProfileInforUrl,
  candidateSavedJobsUrl,
  candidateSuitableJobsUrl,
} from "../../../../routes/urls";
import { getCandidateAvatarUrl, useGetMyCandidateProfile } from "../../profile/api/myCv";

type CandidateProfileMenuProps = {
  user?: {
    fullName?: string;
    email?: string;
    avatar?: string;
    id?: string | number;
  };
  onLogout: () => void;
};

const CandidateProfileMenu = ({
  user,
  onLogout,
}: CandidateProfileMenuProps) => {
  const navigate = useNavigate();
  const profileQuery = useGetMyCandidateProfile();
  const profile = profileQuery.data;
  const displayName = profile?.candidate_name || user?.fullName || "User";
  const displayEmail = profile?.email || profile?.employee?.email_account || user?.email || "";
  const avatarSrc = getCandidateAvatarUrl(profile?.avatar_file) || user?.avatar || "";

  return (
    <Menu placement="bottom-end" offset={[0, 10]}>
      <MenuButton
        as={Button}
        variant="ghost"
        p={0}
        minW="auto"
        h="auto"
        _hover={{ bg: "transparent" }}
        _active={{ bg: "transparent" }}
      >
        <HStack spacing={1.5}>
          <Avatar
            size="sm"
            name={displayName}
            src={avatarSrc}
            bg="#D9E1EF"
          />
        </HStack>
      </MenuButton>

      <MenuList
        minW="380px"
        maxW="380px"
        p={0}
        borderRadius="20px"
        border="1px solid #E6EBF2"
        overflow="hidden"
        boxShadow="0 14px 40px rgba(15, 23, 42, 0.12)"
      >
        {/* Header */}
        <Box px={5} py={4}>
          <HStack spacing={3} align="start">
            <Avatar
              size="md"
              name={displayName}
              src={avatarSrc}
              bg="#D9E1EF"
            />

            <VStack align="start" spacing={0.5} flex={1}>
              <Text fontSize="md" fontWeight="700" color="#2F4358">
                {displayName}
              </Text>

              <Text fontSize="sm" color="#5F6B7A">
                Verified account
              </Text>

              <HStack spacing={2} color="#5F6B7A" fontSize="sm">
                {displayEmail && <Text noOfLines={1}>{displayEmail}</Text>}
                {!displayEmail && <Text noOfLines={1}>Information is updating</Text>}
              </HStack>
            </VStack>
          </HStack>
        </Box>

        <Divider borderColor="#E6EBF2" />

        {/* Body */}
        <Box px={5} py={3}>
          <VStack align="stretch" spacing={1}>
            <ProfileMenuSection
              icon={FiBriefcase}
              title="Job search management"
              defaultOpen
              items={[
                { label: "Saved jobs",onClick: () => navigate(candidateSavedJobsUrl) },
                { label: "Job applied for", onClick: () => navigate(candidateAppliedJobsUrl) },
                // { label: "Install job suggestions", onClick: () => navigate("/job-alert-settings") },
              ]}
            />

            <ProfileMenuSection
              icon={FiFileText}
              title="Personal Profile Management & Security"
              defaultOpen
              items={[
                { label: "My CV", onClick: () => navigate(candidateCvListUrl) },
                { label: "Employers want to connect with you", onClick: () => navigate(candidateEmployeeContactCandidate) },
              ]}
            />


            <ProfileMenuSection
              icon={FiUser}
              title="Personal & Security"
              defaultOpen
              items={[
                { label: "Personal information settings", onClick: () => navigate(candidateProfileInforUrl) },
                { label: "Change password", onClick: () => navigate(candidateChangePasswordUrl) },
              ]}
            />
          </VStack>

          <Box pt={3}>
            <Button
              w="full"
              h="44px"
              borderRadius="999px"
              bg="#F3F5F7"
              color="#2F4358"
              fontSize="sm"
              fontWeight="700"
              leftIcon={<FiLogOut />}
              _hover={{ bg: "#EAEFF4" }}
              onClick={() => {
                onLogout();
                navigate(candidateLoginUrl);
              }}
            >
              Sign out
            </Button>
          </Box>
        </Box>
      </MenuList>
    </Menu>
  );
};

export default CandidateProfileMenu;
