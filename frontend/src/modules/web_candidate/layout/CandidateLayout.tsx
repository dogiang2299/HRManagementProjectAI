import { matchPath, useLocation, useNavigate, useOutlet } from "react-router-dom";
import { Box, Flex } from "@chakra-ui/react";
import MainHeader from "./MainHeader";
import TopCVStyleHero from "./Banner";
import CandidateFooter from "./CandidateFooter";
import CandidateRouteMotion from "./CandidateRouteMotion";
import { useAuthStore } from "../../auth/store/auth.store";
import { RECRUIT_BASE_ROLE } from "../../../constant/roles";
import {
  candidateAppliedJobsUrl,
  candidateApplicationsUrl,
  candidateCareerUrl,
  candidateCvListUrl,
  candidateForEmployerUrl,
  candidateHomeUrl,
  candidateInformCompany,
  candidateInformCompanyDetail,
  candidateJobsByGroupUrl,
  candidateJobDetailUrl,
  candidateConversationUrl,
  candidateMessagesUrl,
  candidateLoginUrl,
  candidateMyCvUrl,
  candidateProfileInforUrl,
  candidateProfileUrl,
  candidateRecommendationJobsUrl,
  candidateRegisterUrl,
  candidateSavedJobsUrl,
  candidateSercurityUrl,
  candidateSuitableJobsUrl,
  candidateChangePasswordUrl,
  candidateEmployeeContactCandidate,
  candidateBlogsUrl,
  candidateCreateCvUrl,
} from "../../../routes/urls";
import { logo } from "../../../assets/logo";
// import AiChatWidget from "../ai_chat/components/AiChatWidget";

const CandidateLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const roleNames = (authUser?.roles ?? [])
    .map((r: any) => r?.role?.name_role || r?.name_role || r?.name || "")
    .filter(Boolean);

  const isCandidateUser = roleNames.includes(RECRUIT_BASE_ROLE.Candidate);
  const isLoggedIn = Boolean(isAuthenticated && isCandidateUser);

  const isJobDetailPage = Boolean(matchPath(candidateJobDetailUrl, location.pathname));
  const isHomeJobsPage = Boolean(matchPath(candidateHomeUrl, location.pathname));
  const isJobsByGroupPage = Boolean(matchPath(candidateJobsByGroupUrl, location.pathname));
  const isCareerPage = location.pathname.startsWith(candidateCareerUrl);
  const isCompanyListPage = location.pathname.startsWith(candidateInformCompany);
  const isCompanyDetailPage = Boolean(matchPath(candidateInformCompanyDetail, location.pathname));
  const isProfilePage = location.pathname.startsWith(candidateProfileUrl);
  const isProfileInforPage = location.pathname.startsWith(candidateProfileInforUrl);
  const isSavedJobsPage = location.pathname.startsWith(candidateSavedJobsUrl);
  const isAppliedJobsPage = location.pathname.startsWith(candidateAppliedJobsUrl);
  const isSuitableJobsPage = location.pathname.startsWith(candidateSuitableJobsUrl);
  const isRecommendedJobsPage = location.pathname.startsWith(candidateRecommendationJobsUrl);
  const isConversationPage =
    location.pathname.startsWith(candidateConversationUrl) ||
    location.pathname.startsWith(candidateMessagesUrl);
  const isMyCvPage = location.pathname.startsWith(candidateMyCvUrl);
  const isMyCvListPage = location.pathname.startsWith(candidateCvListUrl);
  const isSecurityPage = location.pathname.startsWith(candidateSercurityUrl);
  const isChangePasswordPage = location.pathname.startsWith(candidateChangePasswordUrl);
  const isEmployerInvitationsPage = location.pathname.startsWith(candidateEmployeeContactCandidate);
  const isMyApplicationsPage = location.pathname.startsWith(candidateApplicationsUrl);
  const isBlogsPage = location.pathname.startsWith(candidateBlogsUrl);
  const isCreateCvPage = location.pathname.startsWith(candidateCreateCvUrl);

  const shouldHideBanner =
    isJobDetailPage ||
    isJobsByGroupPage ||
    isCareerPage ||
    isCompanyListPage ||
    isCompanyDetailPage ||
    isProfilePage ||
    isProfileInforPage ||
    isSavedJobsPage ||
    isAppliedJobsPage ||
    isSuitableJobsPage ||
    isRecommendedJobsPage ||
    isConversationPage ||
    isMyCvPage ||
    isMyCvListPage ||
    isSecurityPage ||
    isChangePasswordPage ||
    isMyApplicationsPage ||
    isEmployerInvitationsPage ||
    isBlogsPage ||
    isCreateCvPage;

  const user = isLoggedIn
    ? {
        id: authUser?.id ?? undefined,
        employee_name: authUser?.employee_name ?? undefined,
        avatar: authUser?.avatar ?? undefined,
        email: authUser?.email_account ?? undefined,
      }
    : null;

  return (
    <Flex direction="column" minH="100vh" bg="#ffffff" overflowX="clip">
      <MainHeader
        logoSrc={logo}
        isLoggedIn={isLoggedIn}
        user={user}
        onLoginClick={() => navigate(candidateLoginUrl)}
        onRegisterClick={() => navigate(candidateRegisterUrl)}
        onRecruiterClick={() => navigate(candidateForEmployerUrl)}
        onLogout={() => {
          logout();
        }}
      />

      <Box as="main" flex="1">
        <CandidateRouteMotion disableScrollReveal={isConversationPage}>
          {!shouldHideBanner && <TopCVStyleHero />}
          {outlet}
        </CandidateRouteMotion>
      </Box>

      
      {!isConversationPage && <CandidateFooter />}
      {/* <FloatingAiChat />
      {isLoggedIn && <AiChatWidget />} */}
    </Flex>
  );
};

export default CandidateLayout;
