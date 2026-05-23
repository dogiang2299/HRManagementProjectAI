import { VStack, Box } from "@chakra-ui/react";
import { useMemo } from "react";
import JobList from "../../job/views/JobList";
import InformComList from "../../company/view/InforcompanyList";
import JobSuggestion from "../../job/views/JobSuggestion";
import FeaturedGroupJobsSection from "../../job/views/FeaturedGroupJobsSection";
import HotlineConsultingSection from "../../employee/view/HotlineConsultingSection";
import ITJobInfoSection from "../components/ITJobInfoSection";
import ITJobPressSection from "../components/social-proof/ITJobPressSection";
import ITJobCandidateVoiceSection from "../components/social-proof/ITJobCandidateVoiceSection";
import BannerCarousel from "../../layout/BannerCarousel";
import { bannerData } from "../type";
import RotatingFeatureJobs from "../components/RotatingFeatureJobs";
import FloatingLogoMarquee from "../../company/components/ViewRound";
import FeaturedCompaniesCarousel from "../../company/views/FeaturedCompaniesCarousel";
import { useGetCompanyCandidate } from "../../company/api/getCompany";
import { resolveCompanyLogoUrl } from "../../../../utils/companyLogo";
import JobAttractive from "../../job/views/JobAttractive";

export default function HomeCandidate() {
  const { data: companiesRes } = useGetCompanyCandidate({
    pages: 1,
    limit: 50,
    search: "",
    status: "active",
  });

  const logos = useMemo(() => {
    const companies = companiesRes?.data ?? [];
    const sizes = [88, 110, 94, 132, 100, 120];

    return companies.reduce<Array<{ id: string; src: string; alt: string; size: number }>>(
      (acc, company, index) => {
        const src = resolveCompanyLogoUrl(company.image_logo);
        if (!src) return acc;

        acc.push({
          id: String(company.id ?? index),
          src,
          alt: company.full_name || `Company logo ${index + 1}`,
          size: sizes[index % sizes.length],
        });

        return acc;
      },
      [],
    );
  }, [companiesRes?.data]);
  return (
    <VStack
      gap={4}
      py={{ base: 3, md: 5, xl: 5 }}
      px={{ base: 3, md: 15, xl: 150 }}
      flexDirection="column"
      bg="white"
      w="full"
      maxW="100%"
      overflowX="hidden"
      overflowY={'hidden'}
      align="stretch"
    >
      
      {/* content */}
      <VStack w="full" spacing={10} align="stretch">
        <JobSuggestion />
        <JobList />

        <BannerCarousel
          banners={bannerData}
          autoPlay={true}
          autoPlayInterval={2500}
        />
    <JobAttractive/>
        <InformComList />
        <Box
          position="relative"
          left="50%"
          right="50%"
          ml="-50vw"
          mr="-50vw"
          w="100vw"
          overflow="hidden"
        >
          <RotatingFeatureJobs />
        </Box>
        <FeaturedGroupJobsSection />

        <FeaturedCompaniesCarousel />

        <ITJobPressSection />

        <ITJobCandidateVoiceSection />

        <Box
          my={4}
          position="relative"
          left="50%"
          right="50%"
          ml="-50vw"
          mr="-50vw"
          w="100vw"
          mt={6}
          overflow="hidden"
        >
          {logos.length > 0 ? (
            <FloatingLogoMarquee
              logos={logos}
              speed={38}
              height="360px"
              bg="#f5f6f8"
            />
          ) : null}
        </Box>

        <Box mx={{ base: -3, md: -15, xl: "-150px" }}>
          <HotlineConsultingSection />
        </Box>

        <ITJobInfoSection />
      </VStack>
    </VStack>
  );
}
