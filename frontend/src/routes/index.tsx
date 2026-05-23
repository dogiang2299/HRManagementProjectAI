import { Navigate, createBrowserRouter } from "react-router-dom";
import { RECRUIT_BASE_ROLE } from "../constant/roles";
import {
  candidateBaseUrl,
  candidateCareerArticleUrl,
  candidateCvBuilderUrl,
  candidateCreateCvUrl,
  candidateCvListUrl,
  candidateCareerReportYearUrl,
  candidateCareerReportsUrl,
  candidateCareerUrl,
  candidateChangePasswordUrl,
  candidateDetailUrl,
  candidateConversationUrl,
  candidateMessagesUrl,
  candidateForEmployerUrl,
  candidateForEmployerSuccessUrl,
  candidateHomeUrl,
  candidateInformCompany,
  candidateInformCompanyDetail,
  candidateJobsByGroupUrl,
  candidateJobsByLocationUrl,
  candidateJobDetailUrl,
  candidateLoginUrl,
  candidateMyCvUrl,
  candidateAppliedJobsUrl,
  candidateProfileInforUrl,
  candidateRegisterUrl,
  candidateSavedJobsUrl,
  candidateSuitableJobsUrl,
  candidateUrl,
  companyRegisterUrl,
  dashboardUrl,
  employeeDetailUrl,
  employeeUrl,
  error403Url,
  homeUrl,
  inforCompanyUrl,
  inforCompanyDetailUrl,
  interviewScheUrl,
  jobsDetailUrl,
  jobsUrl,
  layoutUrl,
  positionGroupUrl,
  loginUrl,
  positionPostUrl,
  potentialCandidateUrl,
  rankUrl,
  recruitmentInforAddUrl,
  recruitmentInforDetailUrl,
  recruitmentInforUrl,
  sendEmailUrl,
  settingUrl,
  skillsUrl,
  mailServerUrl,
  generalUrl,
  advancedUrl,
  activityUrl,
  candidateRecommendationJobsUrl,
  conversationsUrl,
  candidateEmployeeContactCandidate,
  candidateBlogsUrl,
  candidateBlogDetailUrl,
} from "./urls";

import { Employees } from "../modules/web_admin/employee/views/Employee";
import { Interview_Schedule } from "../modules/web_admin/interview_schedule/views/Interview_Schedule";
import { PositionPost } from "../modules/web_admin/setting/position_post/views/PositionPost";
import { GroupPositionPost } from "../modules/web_admin/setting/group_position_post/views/GroupPositionPost";
import { Rank } from "../modules/web_admin/setting/rank/views/Rank";
import { SendEmail } from "../modules/web_admin/setting/send_email/views/Email";
import { Skill } from "../modules/web_admin/setting/skill/views/Skill";

import ProtectedRoute from "../modules/auth/components/ProtectedRoute";
import MainLayout from "../components/layout/MainLayout";
import Error403 from "../components/error/403";
import LoginView from "../modules/auth/view/LoginView";
import EmployeeDetail from "../modules/web_admin/employee/views/EmployeeDetail";
import Sibar_Report from "../modules/web_admin/dashboard/views/Sibar_Report";
import General_Sibar from "../modules/web_admin/setting/General_Sibar";
import { Potential } from "../modules/web_admin/potential/views/Potential";
import { Recruitment } from "../modules/web_admin/recruit_inf/views/Recruitment";
import RecruitmentAdd from "../modules/web_admin/recruit_inf/views/RecruitmentAdd";
import RecruitmentDetail from "../modules/web_admin/recruit_inf/views/RecruitmentDetail";
import { Job } from "../modules/web_admin/job/views/Job";
import AdminJobDetail from "../modules/web_admin/job/views/JobDetail";
import { Candidates } from "../modules/web_admin/candidate/views/Candidate";
import { CompanyRegister } from "../modules/web_admin/company_register/views/CompanyRegister";
import { Home } from "../modules/web_admin/home/Home";
import { InforCompany } from "../modules/web_admin/inform_company/views/InformationCompany";
import InformationCompanyDetail from "../modules/web_admin/inform_company/views/InformationCompanyDetail";
import CandidateDetail from "../modules/web_admin/candidate/views/CandidateDetail";
import CandidateLayout from "../modules/web_candidate/layout/CandidateLayout";
import CandidateFooterOnlyLayout from "../modules/web_candidate/layout/CandidateFooterOnlyLayout";
import CandidateRouteMotion from "../modules/web_candidate/layout/CandidateRouteMotion";
import CandidateJobDetail from "../modules/web_candidate/job/views/JobDetail";
import JobsByGroup from "../modules/web_candidate/job/views/JobsByGroup";
import InformComList from "../modules/web_candidate/company/view/InforcompanyList";
import InformComDetail from "../modules/web_candidate/company/view/InformComDetail";
import HomeCandidate from "../modules/web_candidate/home/views/HomeJob";
import ForEmployer from "../modules/web_candidate/employer/views/ForEmployer";
import EmployerRegisterSuccess from "../modules/web_candidate/employer/views/EmployerRegisterSuccess";
import CandidateLoginView from "../modules/web_candidate/auth/view/CandidateLoginView";
import CandidateRegisterView from "../modules/web_candidate/auth/view/CandidateRegisterView";
import JobSaved from "../modules/web_candidate/profile/views/job/JobSaved";
import JobApplied from "../modules/web_candidate/profile/views/job/JobApplied";
import CandidateCVBuilder from "../modules/web_candidate/profile/views/cv/CandidateCVBuilder";
import ProfileInfor from "../modules/web_candidate/profile/views/sercurity/ProfileInfor";
import ChangePassword from "../modules/web_candidate/profile/views/sercurity/ChangePassword";
import GeneralSetting from "../modules/web_admin/generalsetting/view/GeneralSetting";
import AdvancedSecurityPage from "../modules/web_admin/advanced/view/AdvancedSetting";
import ActivityLogs from "../modules/web_admin/activity/view/ActivityLogs";
import MailServerPage from "../modules/web_admin/mailserver/view/MailServerPage";
import RecommendedJobsPage from "../modules/web_candidate/job/views/RecommendedJobsPage";
import CandidateConversationPage from "../modules/web_candidate/conversation/views/CandidateConversationPage";
import EmployerConversationPage from "../modules/web_admin/conversation/views/EmployerConversationPage";
import CandidateCVList from "../modules/web_candidate/profile/views/cv/CandidateCVList";
import CVNonLogin from "../modules/web_candidate/profile/views/cv/CVNonLogin";
import EmployerInvitations from "../modules/web_candidate/applications/view/EmployerInvitations";
import ListBlog from "../modules/blogs/view/ListBlog";
import BlogDetail from "../modules/blogs/view/BlogDetail";
import { useAuthStore } from "../modules/auth/store/auth.store";

const getRoleValues = (user: unknown) => {
  const currentUser = user as any;
  const roleItems = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
  const rawRoles = [
    ...roleItems.flatMap((item: any) => [
      typeof item === "string" ? item : "",
      item?.role,
      item?.role?.name_role,
      item?.role?.role_code,
      item?.name_role,
      item?.role_code,
      item?.name,
    ]),
    currentUser?.role,
    currentUser?.role?.name_role,
    currentUser?.role?.role_code,
    currentUser?.actorRole,
    currentUser?.actor_role,
  ];

  return rawRoles
    .filter((role) => typeof role === "string" && role.trim())
    .map((role) => role.trim().toLowerCase());
};

const ConversationRouteGuard = () => {
  const user = useAuthStore((state) => state.user);
  const roles = getRoleValues(user);
  const isAdmin = roles.includes("admin");
  const isEmployee = roles.includes("employee");
  const isEmployer = roles.includes("employer");
  const canAccessEmployerConversation = isEmployer;

  if (isAdmin || isEmployee) {
    return <Navigate to={dashboardUrl} replace />;
  }

  if (!canAccessEmployerConversation) {
    return <Navigate to={error403Url} replace />;
  }

  return <EmployerConversationPage />;
};

const CandidateCvRouteGuard = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const roles = getRoleValues(user);
  const isCandidate = roles.includes("candidate");

  if (!isAuthenticated || !isCandidate) {
    return <CVNonLogin />;
  }

  return <CandidateCVList />;
};

export const createRouterConfig = () => {
  const { Admin, Employee, Employer } = RECRUIT_BASE_ROLE;

  return createBrowserRouter([
    {
        path: loginUrl,
        element: <LoginView/>
    },
    {
      path: candidateLoginUrl,
      element: (
        <CandidateRouteMotion minH="100vh">
          <CandidateLoginView />
        </CandidateRouteMotion>
      ),
    },
    {
      path: candidateRegisterUrl,
      element: (
        <CandidateRouteMotion minH="100vh">
          <CandidateRegisterView />
        </CandidateRouteMotion>
      ),
    },
    {
    path: candidateBaseUrl,
    element: <CandidateLayout />,
    children: [
      { path: candidateHomeUrl, element: <HomeCandidate /> },
      { path: candidateJobsByGroupUrl, element: <JobsByGroup /> },
      { path: candidateJobsByLocationUrl, element: <JobsByGroup /> },
      { path: candidateJobDetailUrl, element: <CandidateJobDetail /> },
      { path: candidateInformCompany, element: <InformComList /> },
      { path: candidateInformCompanyDetail, element: <InformComDetail /> },
      { path: candidateSavedJobsUrl, element: <JobSaved /> },
      { path: candidateAppliedJobsUrl, element: <JobApplied /> },
      { path: candidateCvListUrl, element: <CandidateCvRouteGuard /> },
      { path: candidateCreateCvUrl, element: <CVNonLogin /> },
      { path: candidateMyCvUrl, element: <Navigate to={candidateCvListUrl} replace /> },
      { path: candidateCvBuilderUrl, element: <CandidateCVBuilder /> },
      { path: candidateProfileInforUrl, element: <ProfileInfor /> },
      { path: candidateChangePasswordUrl, element: <ChangePassword /> },
      { path: candidateRecommendationJobsUrl, element: <RecommendedJobsPage /> },
      { path: candidateConversationUrl, element: <CandidateConversationPage /> },
      { path: candidateBlogsUrl, element: <ListBlog /> },
      { path: candidateBlogDetailUrl, element: <BlogDetail /> },
      {
        path: candidateEmployeeContactCandidate,
        element: <EmployerInvitations />,
      },
    ]
  },
  {
    path: candidateMessagesUrl,
    element: <CandidateLayout />,
    children: [{ index: true, element: <CandidateConversationPage /> }],
  },
  {
    path: candidateForEmployerUrl,
    element: <CandidateFooterOnlyLayout />,
    children: [
      { index: true, element: <ForEmployer /> },
      { path: candidateForEmployerSuccessUrl, element: <EmployerRegisterSuccess /> },
    ],
  },
    {
      path: layoutUrl,
      element: (
         <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
          <MainLayout />
         </ProtectedRoute>
      ),
      children: [
        {
          path: homeUrl,
          element: (
              <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <Home />
             </ProtectedRoute>
          )
        },
        {
          path: dashboardUrl,
          element: (
              <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <Sibar_Report />
             </ProtectedRoute>
          )
        },
        
        {
          path: companyRegisterUrl,
          element: (
             <ProtectedRoute allowedRoles={[Admin]}>
              <CompanyRegister />
             </ProtectedRoute>
          )
        },
        {
          path: employeeUrl,
          element: (
             <ProtectedRoute allowedRoles={[Admin, Employer]}>
              <Employees />
             </ProtectedRoute>
          )
        },
        {
          path: employeeDetailUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employer]}>
              <EmployeeDetail />
            </ProtectedRoute>
          )
        },
        {
          path: inforCompanyUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <InforCompany />
            </ProtectedRoute>
          )
        },
        {
          path: mailServerUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <MailServerPage />
            </ProtectedRoute>
          )
        },
        {
          path: advancedUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <AdvancedSecurityPage />
            </ProtectedRoute>
          )
        },
        {
          path: activityUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <ActivityLogs />
            </ProtectedRoute>
          )
        },
        {
          path: generalUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <GeneralSetting />
            </ProtectedRoute>
          )
        },
        {
          path: inforCompanyDetailUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employer]}>
              <InformationCompanyDetail />
            </ProtectedRoute>
          )
        },
        
        {
          path: recruitmentInforUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <Recruitment />
            </ProtectedRoute>
          )
        },
        {
          path: recruitmentInforAddUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <RecruitmentAdd />
            </ProtectedRoute>
          )
        },
        {
          path: recruitmentInforDetailUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <RecruitmentDetail />
            </ProtectedRoute>
          )
        },
        {
          path: candidateUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <Candidates />
            </ProtectedRoute>
          )
        },
        {
          path: potentialCandidateUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <Potential />
            </ProtectedRoute>
          )
        },
        {
          path: candidateDetailUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <CandidateDetail />
            </ProtectedRoute>
          )
        },
        {
          path: conversationsUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <ConversationRouteGuard />
            </ProtectedRoute>
          )
        },
        {
          path: interviewScheUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <Interview_Schedule />
            </ProtectedRoute>
          )
        },
        {
          path: jobsUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <Job />
            </ProtectedRoute>
          )
        }, 
        {
          path: jobsDetailUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <AdminJobDetail />
            </ProtectedRoute>
          )
        },
        {
          path: positionPostUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <PositionPost />
            </ProtectedRoute>
          )
        },
        {
          path: positionGroupUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <GroupPositionPost />
            </ProtectedRoute>
          )
        },
        {
          path: rankUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <Rank />
            </ProtectedRoute>
          )
        },
        {
          path: sendEmailUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <SendEmail />
            </ProtectedRoute>
          )
        },
        {
          path: skillsUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <Skill />
            </ProtectedRoute>
          )
        }, 
        {
          path: settingUrl,
          element: (
            <ProtectedRoute allowedRoles={[Admin, Employee, Employer]}>
              <General_Sibar />
            </ProtectedRoute>
          )
        },
      ]
    },
    {
      path: error403Url,
      element: <Error403 />
    },
    {
      path: "*",
      element: <div>404 Not Found</div>
    }
  ]);
};
