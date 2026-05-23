import { Box, VStack } from "@chakra-ui/react";
import { useRef } from "react";
import EmployerHeroSection from "../components/EmployerHeroSection";
import EmployerStatsSection from "../components/EmployerStatsSection";
import EmployerServicesSection from "../components/EmployerServicesSection";
import EmployerTopCompaniesSection from "../components/EmployerTopCompaniesSection";
import EmployerTestimonialsSection from "../components/EmployerTestimonialsSection";
import EmployerResourcesSection from "../components/EmployerResourcesSection";
import EmployerContactSection from "../components/EmployerContactSection";

export default function ForEmployer() {
  const contactSectionRef = useRef<HTMLDivElement | null>(null);

  const scrollToContactSection = () => {
    contactSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <Box mb={-10} bg="#F8FAFC" minH="100vh">
      <VStack spacing={0} align="stretch">
        <EmployerHeroSection onContactClick={scrollToContactSection} />
        <EmployerStatsSection />
        <EmployerServicesSection />
        <EmployerTopCompaniesSection />
        <EmployerTestimonialsSection />
        <EmployerResourcesSection />

        <Box ref={contactSectionRef}>
          <EmployerContactSection />
        </Box>
      </VStack>
    </Box>
  );
}