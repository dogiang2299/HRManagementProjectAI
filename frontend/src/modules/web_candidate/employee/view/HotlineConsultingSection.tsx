import { useMemo, useState } from "react";
import {
  Box,
  Flex,
  Grid,
  HStack,
  Icon,
  Link,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiMail, FiPhone } from "react-icons/fi";
import HotlineEmployeeItem from "../components/HotlineEmployeeItem";
import { useGetEmployee } from "../api/get";

type HotlineTab = "candidate" | "recruiter";

const candidateSupport = {
  phone: "0377167619",
  email: "dogianga9.2020@gmail.com",
};

const HotlineConsultingSection = () => {
  const [activeTab, setActiveTab] = useState<HotlineTab>("candidate");

  const employeeParams = useMemo(
    () => ({
      pages: 1,
      limit: 50,
      status: "Active",
      sortBy: "created_at",
      sortOrder: "desc" as const,
    }),
    []
  );

  const { data, isLoading, isFetching } = useGetEmployee(employeeParams, {
    staleTime: 1000 * 60 * 5,
  });

  const recruiterEmployees = useMemo(() => {
    const employees = data?.data ?? [];

    return employees.filter((emp: any) =>
      emp?.roles?.some(
        (item: any) =>
          item?.role?.name_role === "Employee" &&
          item?.role?.status !== "Inactive" &&
          item?.role?.is_active !== false
      )
    );
  }, [data]);

  return (
    <Box
  w="full"
  py={{ base: 4, md: 5 }}
  px={{ base: 3, md: 4, xl: 6 }}
  position="relative"
  overflow="hidden"
      bg="linear-gradient(120deg, #1F2B4A 0%, #334371 55%, #3F4F7F 100%)"
>
  <Box
    position="absolute"
    inset={0}
    bg="linear-gradient(180deg, rgba(51,67,113,0.35) 0%, rgba(51,67,113,0.72) 100%)"
    zIndex={0}
  />
      <Box maxW="1120px" mx="auto">
        <Text
          color="white"
          fontWeight="800"
          fontSize={{ base: "lg", md: "xl" }}
          mb={{ base: 3, md: 4 }}
        >
          Consulting Hotline
        </Text>

        <Box position="relative">
          <HStack
            spacing={0}
            align="end"
            mb={0}
            overflowX="auto"
            sx={{
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            <Box
              minW={{ base: "150px", md: "150px" }}
              px={{ base: 3, md: 3 }}
              py={{ base: 2, md: 2.5 }}
              bg={activeTab === "candidate" ? "white" : "#D9DDE3"}
              color={activeTab === "candidate" ? "#334371" : "#9AA3AF"}
              fontWeight="800"
              fontSize={{ base: "sm", md: "15px" }}
              borderTopLeftRadius="18px"
              borderTopRightRadius="40px"
              cursor="pointer"
              userSelect="none"
              transition="all 0.2s ease"
              onClick={() => setActiveTab("candidate")}
            >
              For Job Seekers
            </Box>

            <Box
              minW={{ base: "150px", md: "150px" }}
              ml="-1px"
              px={{ base: 3, md: 3 }}
              py={{ base: 2, md: 2.5 }}
              bg={activeTab === "recruiter" ? "white" : "#D9DDE3"}
              color={activeTab === "recruiter" ? "#334371" : "#9AA3AF"}
              fontWeight="800"
              fontSize={{ base: "sm", md: "15px" }}
              borderTopLeftRadius="18px"
              borderTopRightRadius="40px"
              cursor="pointer"
              userSelect="none"
              transition="all 0.2s ease"
              onClick={() => setActiveTab("recruiter")}
            >
              For Employers
            </Box>
          </HStack>

          <Box
            bg="#F5F7FC"
            borderRadius="0 22px 22px 22px"
            px={{ base: 3, md: 5, xl: 6 }}
            py={{ base: 4, md: 5 }}
            minH={{ base: "auto", md: "160px" }}
            boxShadow="0 12px 30px rgba(15, 23, 42, 0.14)"
          >
            {activeTab === "candidate" ? (
              <Grid
                templateColumns={{ base: "1fr", lg: "1.1fr 0.85fr" }}
                gap={{ base: 5, lg: 6 }}
                alignItems="center"
              >
                <VStack align="start" spacing={{ base: 3, md: 3 }}>
                  <Text
                    color="#1E293B"
                    fontWeight="800"
                    fontSize={{ base: "lg", md: "xl" }}
                    lineHeight="1.2"
                  >
                    Finding a job is difficult{" "}
                    <Text as="span" color="#334371">
                      ITJob already exists
                    </Text>
                  </Text>

                  <Flex
                    direction={{ base: "column", sm: "row" }}
                    w="full"
                    maxW="380px"
                    borderRadius="full"
                    bg="#334371"
                    p="7px"
                    gap="5px"
                  >
                    <Flex
                      flex="1"
                      align="center"
                      justify="center"
                      minH={{ base: "40px", md: "44px" }}
                      color="white"
                      fontWeight="800"
                      fontSize={{ base: "md", md: "lg" }}
                      px={3}
                    >
                      {candidateSupport.phone}
                    </Flex>

                    <Flex
                      as="a"
                      href={`tel:${candidateSupport.phone}`}
                      align="center"
                      justify="center"
                      minW={{ base: "100%", sm: "160px" }}
                      minH={{ base: "38px", md: "44px" }}
                      borderRadius="full"
                      bg="white"
                      color="#334371"
                      fontWeight="800"
                      fontSize={{ base: "sm", md: "md" }}
                      gap={1.5}
                      _hover={{ textDecoration: "none", bg: "#F8FAFC" }}
                    >
                      <Icon as={FiPhone} />
                      <Text>CALL NOW</Text>
                    </Flex>
                  </Flex>

                  <HStack
                    spacing={2}
                    flexWrap="wrap"
                    color="#475569"
                    fontSize={{ base: "xs", md: "sm" }}
                    fontWeight="700"
                  >
                    <Text>Candidate support email:</Text>
                    <HStack
                      spacing={2}
                      bg="rgba(51,67,113,0.08)"
                      px={3}
                      py={2}
                      borderRadius="full"
                    >
                      <Icon as={FiMail} color="#334371" boxSize={4} />
                      <Link
                        href={`mailto:${candidateSupport.email}`}
                        color="#334371"
                        fontSize={{ base: "sm", md: "md" }}
                        _hover={{ textDecoration: "none", opacity: 0.9 }}
                      >
                        {candidateSupport.email}
                      </Link>
                    </HStack>
                  </HStack>
                </VStack>

                <Flex
                  align="center"
                  justify="center"
                  minH={{ base: "150px", md: "180px" }}
                  borderRadius="16px"
                  bg="linear-gradient(180deg, rgba(51,67,113,0.08) 0%, rgba(51,67,113,0.16) 100%)"
                  border="1px dashed"
                  borderColor="rgba(51,67,113,0.25)"
                  px={3}
                >
                  <VStack spacing={2}>
                    <Box
                      px={3}
                      py={1.5}
                      borderRadius="full"
                      bg="#334371"
                      color="white"
                      fontWeight="700"
                      fontSize="xs"
                    >
                      Hello 👋
                    </Box>
                    <Text
                      color="#334371"
                      fontWeight="800"
                      fontSize={{ base: "md", md: "lg" }}
                      textAlign="center"
                    >
                      What can ITJob help you with?
                    </Text>
                    <Text
                      color="#64748B"
                      textAlign="center"
                      maxW="320px"
                      fontSize="sm"
                    >
                      Contact us now for job consulting support and answers
                      information quickly.
                    </Text>
                  </VStack>
                </Flex>
              </Grid>
            ) : (
              <VStack align="stretch" spacing={{ base: 4, md: 5 }}>
                <Box>
                  <Text
                    color="#334155"
                    fontWeight="800"
                    fontSize={{ base: "lg", md: "xl" }}
                    mb={1}
                  >
                    Information to support Employers
                  </Text>
                  <Text color="#64748B" fontSize={{ base: "xs", md: "sm" }}>
                    List of support staff for employers
                  </Text>
                </Box>

                <VStack align="start" spacing={2}>
                  <Text
                    color="#475569"
                    fontWeight="800"
                    fontSize={{ base: "sm", md: "md" }}
                  >
                    Employer support email
                  </Text>

                  <HStack
                    spacing={1.5}
                    bg="rgba(51,67,113,0.08)"
                    px={2.5}
                    py={1.5}
                    borderRadius="full"
                    w="fit-content"
                  >
                    <Icon as={FiMail} color="#334371" boxSize={4} />
                    <Link
                      href={`mailto:${candidateSupport.email}`}
                      color="#334371"
                      fontWeight="700"
                      fontSize={{ base: "xs", md: "sm" }}
                      _hover={{ textDecoration: "none", opacity: 0.9 }}
                    >
                      {candidateSupport.email}
                    </Link>
                  </HStack>
                </VStack>

<Box>
  <Text
    color="#475569"
    fontWeight="700"
    fontSize={{ base: "xs", md: "sm" }}
    mb={2}
  >
    List of consultants
  </Text>

  {isLoading || isFetching ? (
    <Flex justify="center" align="center" minH="100px">
      <Spinner size="sm" color="#334371" />
    </Flex>
  ) : recruiterEmployees.length === 0 ? (
    <Flex
      justify="center"
      align="center"
      minH="100px"
      borderRadius="12px"
      bg="rgba(255,255,255,0.72)"
      border="1px solid"
      borderColor="rgba(148,163,184,0.18)"
    >
      <Text color="#64748B" fontWeight="500" fontSize="sm">
        There are currently no support staff
      </Text>
    </Flex>
  ) : (
    <SimpleGrid
      columns={{ base: 1, md: 2 }}
      spacing={{ base: 1.5, md: 2 }}
    >
      {recruiterEmployees.map((employee: any) => (
        <HotlineEmployeeItem
          key={employee.id}
          employee={employee}
        />
      ))}
    </SimpleGrid>
  )}
</Box>              </VStack>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default HotlineConsultingSection;