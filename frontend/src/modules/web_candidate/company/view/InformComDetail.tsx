import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  HStack,
  Icon,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  FiBriefcase,
  FiCheck,
  FiCopy,
  FiGlobe,
  FiBookmark,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSearch,
} from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { useGetCompanyByID, useGetCompaniesRelated } from "../api/getCompany";
import { useGetJobs } from "../../job/api/getJobs";
import JobCard from "../../job/components/JobCard";
import CompanyCard from "../components/InforCard";
import type { IJobItem } from "../../job/types/job";
import Pagination from "../../../../components/common/Pagination";
import CompanyFollowButton from "../components/CompanyFollowButton";
import ITJobInfoSection from "../../home/components/ITJobInfoSection";
import { resolveCompanyLogoUrl } from "../../../../utils/companyLogo";

const blueGradient = "linear-gradient(90deg, #1A2347 0%, #334371 100%)";
const blueSoft =
  "linear-gradient(90deg, rgba(26,35,71,0.96) 0%, rgba(51,67,113,0.92) 100%)";

const formatDate = (value?: string | null) => {
  if (!value) return "Updating";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Updating";

  return d.toLocaleDateString("vi-VN");
};

const renderValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return "Updating";
  if (typeof value === "string" && !value.trim()) return "Updating";
  return String(value);
};

const ensureHref = (value?: string | null) => {
  if (!value || !value.trim()) return undefined;
  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  return `https://${trimmed}`;
};

const InfoItem = ({
  icon,
  label,
  value,
  href,
}: {
  icon: any;
  label: string;
  value: string;
  href?: string;
}) => {
  return (
    <HStack align="start" spacing={3}>
      <Flex
        w="48px"
        h="48px"
        borderRadius="10px"
        bg="#EBF0FB"
        align="center"
        justify="center"
        flexShrink={0}
      >
        <Icon
          as={icon}
          w="15px"
          h="15px"
          color="#334371"
          sx={{ strokeWidth: 2 }}
        />
      </Flex>

      <Box>
        <Text fontSize="sm" color="#6B7280" mb="2px">
          {label}
        </Text>

        {href ? (
          <Link
            href={href}
            isExternal
            color="#1F2937"
            fontSize="md"
            fontWeight="600"
            _hover={{ color: "#8F6516", textDecoration: "none" }}
            wordBreak="break-word"
          >
            {value}
          </Link>
        ) : (
          <Text
            color="#1F2937"
            fontSize="md"
            fontWeight="600"
            wordBreak="break-word"
          >
            {value}
          </Text>
        )}
      </Box>
    </HStack>
  );
};

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="#D9E2EC"
      borderRadius="18px"
      overflow="hidden"
      boxShadow="0 8px 30px rgba(15, 23, 42, 0.04)"
    >
      <Box bg={blueGradient} px={{ base: 3, md: 5 }} py={{ base: 2.5, md: 3 }}>
        <Text
          color="#E8ECFF"
          fontSize={{ base: "lg", md: "lg" }}
          fontWeight="700"
        >
          {title}
        </Text>
      </Box>

      <Box px={{ base: 3, md: 5 }} py={{ base: 3, md: 4 }}>
        {children}
      </Box>
    </Box>
  );
};

export default function InformComDetail() {
  const { id = "" } = useParams();
  const [jobPage, setJobPage] = useState(1);
  const [isCopied, setIsCopied] = useState(false);
  const [jobSearchName, setJobSearchName] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  useEffect(() => {
    setJobPage(1);
  }, [id]);

  const { data: company, isLoading, error } = useGetCompanyByID(id);
  const {
    data: companyJobsData,
    isLoading: isCompanyJobsLoading,
    error: companyJobsError,
  } = useGetJobs({
    pages: jobPage,
    limit: 10,
    search: "",
    status: "PUBLIC",
    department_id: id,
  });

  const {
    data: relatedCompaniesData = [],
    isLoading: isRelatedCompaniesLoading,
  } = useGetCompaniesRelated(id);

  const companyJobs: IJobItem[] = useMemo(() => {
    const list = companyJobsData?.data ?? [];

    return list
      .filter((job) => {
        const companyId =
          job.positionPost?.inforCompany?.id ??
          job.department_id ??
          job.department?.id;
        return companyId === id;
      })
      .map((job) => ({
        ...job,
        department: job.positionPost?.inforCompany ?? job.department ?? null,
      }));
  }, [companyJobsData?.data, id]);

  const filteredJobs = useMemo(() => {
    if (!jobSearchName.trim()) return companyJobs;
    return companyJobs.filter((job) =>
      (job.post_title || "")
        .toLowerCase()
        .includes(jobSearchName.toLowerCase()),
    );
  }, [companyJobs, jobSearchName]);

  const jobsTotalPages = companyJobsData?.pagination?.totalPages || 1;
  const relatedCompanies = relatedCompaniesData ?? [];

  if (isLoading) {
    return (
      <Flex minH="60vh" align="center" justify="center">
        <Spinner color="#334371" thickness="3px" />
      </Flex>
    );
  }

  if (error || !company) {
    return (
      <Container maxW="1200px" px={{ base: 3, md: 5 }} py={{ base: 5, md: 7 }}>
        <Text color="#6B7280">No company information found.</Text>
      </Container>
    );
  }

  const companyName = renderValue(company.full_name);
  const website = renderValue(company.website);
  const websiteHref = ensureHref(company.website);
  const email = renderValue(company.email);
  const address = renderValue(company.address);
  const phone = renderValue(company.phone_number);
  const fax = renderValue(company.fax);
  const businessType = renderValue(company.business_type);
  const taxCode = renderValue(company.tax_idennumber);
  const companyRegisterCode = renderValue(company.code_company);
  const businessLicenseNo = renderValue(company.code_business);
  const issueDate = formatDate(company.date_of_issue);
  const issuePlace = renderValue(company.place_of_issue);
  const employeeQuantity = renderValue(company.employee_quantity);
  const foundedDate = formatDate(company.date_stablish);
  const fieldOfActivity = renderValue(
    company.field_of_activity_group?.name_group ?? company.field_of_activity,
  );
  const description = renderValue(company.description);
  const isActive = company.is_active ? "Active" : "Stop working";
  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `/it-job/inforcompany/${id}`;
  const encodedShareUrl = encodeURIComponent(shareUrl);
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedShareUrl}`;
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedShareUrl}`;

  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1800);
    } catch {
      // Ignore clipboard errors to avoid breaking UI interaction.
    }
  };

  const handleInstagramShare = async () => {
    await handleCopyShareUrl();
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  // Alternate background images based on company ID (cycles through 3 images)
  const backgroundImageIndex = id ? parseInt(id, 10) % 3 : 0;
  const backgroundImage =
    backgroundImageIndex === 0
      ? "back_company1.png"
      : backgroundImageIndex === 1
        ? "back_company2.png"
        : "back_company3.png";

  return (
    <Container
      bg={"white"}
      maxW="1200px"
      px={{ base: 3, md: 5 }}
      py={{ base: 5, md: 7 }}
    >
      <VStack spacing={{ base: 5, md: 6 }} align="stretch">
        {/* HERO */}
        <Box
          borderRadius="22px"
          overflow="hidden"
          bg={blueSoft}
          boxShadow="0 16px 40px rgba(15, 23, 42, 0.08)"
        >
          {/* Banner */}
          <Box
            h={{ base: "170px", md: "250px", xl: "280px" }}
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              inset="0"
              bgImage={`url('/${backgroundImage}')`}
              bgSize="cover"
              bgPosition={{ base: "center center", md: "center 35%" }}
              bgRepeat="no-repeat"
              transform="scale(1.03)"
            />

            {/* slightly dark overlay so the image is still clear */}
            <Box
              position="absolute"
              inset="0"
              bg="linear-gradient(90deg, rgba(26,35,71,0.50) 0%, rgba(26,35,71,0.18) 42%, rgba(26,35,71,0.38) 100%)"
            />

            {/* bottom light coating for softer banner */}
            <Box
              position="absolute"
              inset="0"
              bg="linear-gradient(180deg, rgba(51,67,113,0.08) 0%, rgba(51,67,113,0.00) 56%, rgba(26,35,71,0.16) 100%)"
            />
          </Box>

          {/* Info area */}
          <Box
            px={{ base: 4, md: 6 }}
            pb={{ base: 4, md: 6 }}
            pt={{ base: 0, md: 0 }}
            bg={blueGradient}
          >
            <Flex
              direction={{ base: "column", md: "row" }}
              align={{ base: "start", md: "end" }}
              justify="space-between"
              gap={{ base: 4, md: 6 }}
              mt={{ base: "-42px", md: "-58px" }}
            >
              <Flex
                gap={{ base: 4, md: 5 }}
                align={{ base: "start", md: "end" }}
                flex="1"
              >
                <Box
                  w={{ base: "92px", md: "150px" }}
                  h={{ base: "92px", md: "150px" }}
                  borderRadius="24px"
                  overflow="hidden"
                  bg="rgba(255,255,255,0.96)"
                  border="1px solid rgba(255,255,255,0.72)"
                  boxShadow="0 16px 36px rgba(15,23,42,0.18)"
                  flexShrink={0}
                  backdropFilter="blur(10px)"
                >
                  <Image
                    src={resolveCompanyLogoUrl(company.image_logo)}
                    alt={company.full_name || "company"}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                    objectPosition="center"
                  />
                </Box>

                <VStack
                  align="start"
                  spacing={{ base: 2, md: 2.5 }}
                  pb={{ base: 0, md: 1 }}
                >
                  <Text
                    color="#FFFFFF"
                    fontSize={{ base: "xl", md: "3xl" }}
                    fontWeight="800"
                    lineHeight="1.2"
                    letterSpacing="-0.02em"
                  >
                    {companyName}
                  </Text>

                  <HStack
                    spacing={2}
                    flexWrap="wrap"
                    color="rgba(255,255,255,0.92)"
                  >
                    <HStack spacing={2}>
                      <Icon as={FiGlobe} boxSize={4} />
                      {websiteHref ? (
                        <Link
                          href={websiteHref}
                          isExternal
                          fontSize={{ base: "sm", md: "md" }}
                          _hover={{ textDecoration: "none", color: "#E8ECFF" }}
                        >
                          {website}
                        </Link>
                      ) : (
                        <Text fontSize={{ base: "sm", md: "md" }}>
                          {website}
                        </Text>
                      )}
                    </HStack>

                    <Text opacity={0.35}>•</Text>

                    <HStack spacing={2}>
                      <Icon as={FiBriefcase} boxSize={4} />
                      <Text fontSize={{ base: "sm", md: "md" }}>
                        {businessType}
                      </Text>
                    </HStack>

                    <Text opacity={0.35}>•</Text>

                    <Text fontSize={{ base: "sm", md: "md" }}>
                      {employeeQuantity !== "Updating"
                        ? `${employeeQuantity} employee`
                        : employeeQuantity}
                    </Text>
                  </HStack>
                </VStack>
              </Flex>

              <CompanyFollowButton
                companyId={id}
                variant="hero"
                followLabel="Follow the company"
                followingLabel="Following"
                buttonProps={{
                  leftIcon: <FiBookmark />,
                  bg: "rgba(255,255,255,0.96)",
                  color: "#26365F",
                  border: "1px solid",
                  borderColor: "rgba(255,255,255,0.45)",
                  borderRadius: "12px",
                  px: { base: 4, md: 5 },
                  h: { base: "42px", md: "44px" },
                  minW: "unset",
                  fontSize: { base: "sm", md: "md" },
                  fontWeight: "700",
                  boxShadow: "0 8px 22px rgba(15,23,42,0.10)",
                  _hover: { bg: "#F8FAFC" },
                  _active: { bg: "#F1F5F9" },
                }}
              />
            </Flex>
          </Box>
        </Box>
        {/* MAIN CONTENT */}
        <Grid
          templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
          gap={{ base: 4, md: 5 }}
          alignItems="start"
        >
          <VStack spacing={{ base: 4, md: 5 }} align="stretch">
            <SectionCard title="Company introduction">
              <VStack align="stretch" spacing={4}>
                <Text
                  color="#1F2937"
                  fontSize="md"
                  lineHeight="1.9"
                  whiteSpace="pre-wrap"
                >
                  {description}
                </Text>
              </VStack>
            </SectionCard>

            <SectionCard title="Company recruitment news">
              <VStack align="stretch" spacing={4}>
                {/* Search Box - Always visible */}
                <Flex gap={3} align="center" w="100%">
                  <InputGroup size="md" flex="1">
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiSearch} color="#94A3B8" boxSize={4} />
                    </InputLeftElement>

                    <Input
                      placeholder="Search by job title..."
                      value={jobSearchName}
                      onChange={(e) => setJobSearchName(e.target.value)}
                      borderRadius="14px"
                      border="1px solid"
                      borderColor="#D9E2EC"
                      bg="white"
                      pl="40px"
                      h="44px"
                      fontSize="14px"
                      color="#1E293B"
                      _placeholder={{ color: "#94A3B8" }}
                      _hover={{
                        borderColor: "#CBD5E1",
                      }}
                      _focus={{
                        borderColor: "#334371",
                        boxShadow: "0 0 0 3px rgba(51, 67, 113, 0.12)",
                        bg: "white",
                      }}
                    />
                  </InputGroup>

                  <Button
                    h="44px"
                    px={5}
                    borderRadius="14px"
                    bg="#334371"
                    color="white"
                    fontWeight="600"
                    leftIcon={<Icon as={FiSearch} boxSize={4} />}
                    _hover={{ bg: "#2A365D" }}
                    _active={{ bg: "#1F2A4D" }}
                    onClick={() => {
                      // Search is filtered in real-time via jobSearchName
                    }}
                  >
                    Find
                  </Button>
                </Flex>

                {/* Content based on loading/error/data state */}
                {isCompanyJobsLoading ? (
                  <Flex minH="160px" align="center" justify="center">
                    <Spinner color="#334371" />
                  </Flex>
                ) : companyJobsError ? (
                  <Text color="#6B7280">Unable to load job posting list.</Text>
                ) : companyJobs.length > 0 ? (
                  <>
                    {/* Jobs List */}
                    <SimpleGrid columns={{ base: 1 }} spacing={4}>
                      {filteredJobs.length > 0 ? (
                        filteredJobs.map((job) => (
                          <JobCard key={job.id} job={job} />
                        ))
                      ) : (
                        <Text color="#6B7280" textAlign="center" py={0} mt={0}>
                          No suitable jobs were found.
                        </Text>
                      )}
                    </SimpleGrid>

                    {filteredJobs.length > 0 && (
                      <Pagination
                        currentPage={jobPage}
                        totalPages={jobsTotalPages}
                        onPageChange={setJobPage}
                      />
                    )}
                  </>
                ) : (
                  <Text color="#6B7280">
                    The company currently has no recruitment news.
                  </Text>
                )}
              </VStack>
            </SectionCard>

            <SectionCard title="Typical big brand in the same field">
              {isRelatedCompaniesLoading ? (
                <Flex minH="120px" align="center" justify="center">
                  <Spinner color="#334371" />
                </Flex>
              ) : relatedCompanies.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3.5}>
                  {relatedCompanies.map((item) => (
                    <CompanyCard key={item.id} company={item} />
                  ))}
                </SimpleGrid>
              ) : (
                <Text color="#6B7280">
                  There are no related companies in the same field.
                </Text>
              )}
            </SectionCard>
          </VStack>

          <VStack spacing={{ base: 4, md: 5 }} align="stretch">
            <SectionCard title="Basic information">
              <SimpleGrid columns={{ base: 1, md: 1 }} spacing={4}>
                <InfoItem
                  icon={FiBriefcase}
                  label="Field of activity"
                  value={fieldOfActivity}
                />
                <InfoItem
                  icon={FiBriefcase}
                  label="Type of business"
                  value={businessType}
                />
                <InfoItem
                  icon={FiBriefcase}
                  label="Number of employees"
                  value={employeeQuantity}
                />
                <InfoItem icon={FiBriefcase} label="Tax code" value={taxCode} />
                <InfoItem
                  icon={FiBriefcase}
                  label="Business registration code"
                  value={companyRegisterCode}
                />
                <InfoItem
                  icon={FiBriefcase}
                  label="Business license number"
                  value={businessLicenseNo}
                />
                <InfoItem
                  icon={FiBriefcase}
                  label="License issuance date"
                  value={issueDate}
                />
                <InfoItem
                  icon={FiBriefcase}
                  label="Place of issuance of license"
                  value={issuePlace}
                />
                <InfoItem
                  icon={FiBriefcase}
                  label="Date of establishment"
                  value={foundedDate}
                />
                <InfoItem
                  icon={FiBriefcase}
                  label="Tracking status"
                  value={isActive}
                />
              </SimpleGrid>
            </SectionCard>

            <SectionCard title="Contact information">
              <SimpleGrid columns={{ base: 1, md: 1 }} spacing={4}>
                <InfoItem
                  icon={FiMapPin}
                  label="Company address"
                  value={address}
                />
                <InfoItem icon={FiPhone} label="Phone number" value={phone} />
                <InfoItem
                  icon={FiMail}
                  label="Email"
                  value={email}
                  href={email !== "Updating" ? `mailto:${email}` : undefined}
                />
                <InfoItem
                  icon={FiGlobe}
                  label="Website"
                  value={website}
                  href={websiteHref}
                />
                <InfoItem icon={FiPhone} label="Fax" value={fax} />
              </SimpleGrid>
            </SectionCard>

            <SectionCard title="Map">
              <Box
                borderRadius="14px"
                overflow="hidden"
                border="1px solid"
                borderColor="#E5ECF7"
                h={{ base: "220px", md: "320px" }}
                bg="#F8FAFC"
              >
                {company.map_link ? (
                  <Box
                    as="iframe"
                    src={company.map_link}
                    w="100%"
                    h="100%"
                    border="0"
                    loading="lazy"
                  />
                ) : (
                  <Flex
                    w="full"
                    h="full"
                    align="center"
                    justify="center"
                    px={5}
                  >
                    <Text color="#6B7280" textAlign="center" fontSize="md">
                      No map data available. You add map_link in the management
                      section company to display the map.
                    </Text>
                  </Flex>
                )}
              </Box>
            </SectionCard>

            <Box
              bg="white"
              border="1px solid"
              borderColor="#D9E2EC"
              borderRadius="18px"
              overflow="hidden"
              boxShadow="0 8px 30px rgba(15, 23, 42, 0.04)"
            >
              <Box
                bg={blueGradient}
                px={{ base: 3, md: 5 }}
                py={{ base: 2.5, md: 3 }}
              >
                <Text color="#E8ECFF" fontSize="lg" fontWeight="700">
                  Share the company with your friends
                </Text>
              </Box>

              <VStack
                align="stretch"
                spacing={3.5}
                px={{ base: 3, md: 5 }}
                py={{ base: 3, md: 4 }}
              >
                <Text fontSize="sm" color="#64748B" fontWeight="600">
                  Copy the path
                </Text>

                <HStack
                  border="1px solid"
                  borderColor="#D9E2EC"
                  borderRadius="12px"
                  bg="#F8FAFC"
                  px={2}
                  py={2}
                  spacing={2}
                >
                  <Text
                    flex="1"
                    color="#475569"
                    fontSize="sm"
                    noOfLines={1}
                    title={shareUrl}
                  >
                    {shareUrl}
                  </Text>

                  <Button
                    onClick={handleCopyShareUrl}
                    size="sm"
                    minW="38px"
                    h="34px"
                    px={2.5}
                    bg={isCopied ? "#2A365D" : "#334371"}
                    color="white"
                    _hover={{ bg: isCopied ? "#2A365D" : "#2A365D" }}
                    leftIcon={
                      <Icon as={isCopied ? FiCheck : FiCopy} boxSize={4} />
                    }
                  >
                    {isCopied ? "Copied" : "Copy"}
                  </Button>
                </HStack>

                <Text fontSize="sm" color="#64748B" fontWeight="600" pt={1}>
                  Share via social networks
                </Text>

                <HStack spacing={2.5}>
                  <Button
                    as={Link}
                    href={facebookShareUrl}
                    isExternal
                    minW="42px"
                    h="42px"
                    p={0}
                    borderRadius="full"
                    border="1px solid"
                    borderColor="#CBD5E1"
                    bg="white"
                    color="#334371"
                    _hover={{ bg: "#EBF0FB", borderColor: "#334371" }}
                    aria-label="Share Facebook"
                  >
                    <Icon as={FaFacebookF} boxSize={4} />
                  </Button>

                  <Button
                    onClick={handleInstagramShare}
                    minW="42px"
                    h="42px"
                    p={0}
                    borderRadius="full"
                    border="1px solid"
                    borderColor="#CBD5E1"
                    bg="white"
                    color="#334371"
                    _hover={{ bg: "#EBF0FB", borderColor: "#334371" }}
                    aria-label="Share on Instagram"
                  >
                    <Icon as={FaInstagram} boxSize={4} />
                  </Button>

                  <Button
                    as={Link}
                    href={linkedInShareUrl}
                    isExternal
                    minW="42px"
                    h="42px"
                    p={0}
                    borderRadius="full"
                    border="1px solid"
                    borderColor="#CBD5E1"
                    bg="white"
                    color="#334371"
                    _hover={{ bg: "#EBF0FB", borderColor: "#334371" }}
                    aria-label="Share on LinkedIn"
                  >
                    <Icon as={FaLinkedinIn} boxSize={4} />
                  </Button>
                </HStack>

                <Text fontSize="xs" color="#64748B">
                  Instagram does not support sharing links directly on the web,
                  so please contact us The system will copy the link first for
                  you.
                </Text>
              </VStack>
            </Box>
          </VStack>
        </Grid>
      </VStack>

      <Box mt={10}>
        <ITJobInfoSection />
      </Box>
    </Container>
  );
}
