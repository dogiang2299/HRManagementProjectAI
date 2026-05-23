import { Box, Flex, Grid, GridItem, Link as ChakraLink, Text, VStack } from "@chakra-ui/react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import { useEffect, useState } from "react";

type CareerMenuCategory = {
  id: string;
  title: string;
  items: { label: string; to: string }[];
};

const CAREER_MENU_DATA: CareerMenuCategory[] = [
  {
    id: "bao-cao-luong-it",
    title: "IT Salary Report",
    items: [
      { label: "IT Salary Report 2025-2026", to: "/it-job/career/reports/2025-2026" },
      { label: "IT Salary Report 2024-2025", to: "/it-job/career/reports/2024-2025" },
      { label: "IT Salary Report 2023-2024", to: "/it-job/career/reports/2023-2024" },
      { label: "IT Salary Report 2022-2023", to: "/it-job/career/reports/2022-2023" },
    ],
  },
  {
    id: "su-nghiep-it",
    title: "IT Career",
    items: [
      { label: "Roadmap from Junior to Lead", to: "/it-job/career/su-nghiep-it/lo-trinh-tu-junior-den-lead" },
      { label: "Change major to IT in 6 months", to: "/it-job/career/su-nghiep-it/chuyen-nganh-sang-it" },
      { label: "Set smart career goals", to: "/it-job/career/su-nghiep-it/dat-muc-tieu-nghe-nghiep" },
    ],
  },
  {
    id: "ung-tuyen-thang-tien",
    title: "Application & Promotion",
    items: [
      { label: "Checklist CV surpasses ATS", to: "/it-job/career/ung-tuyen-thang-tien/checklist-cv-vuot-ats" },
      { label: "Popular interview question set", to: "/it-job/career/ung-tuyen-thang-tien/cau-hoi-phong-van-pho-bien" },
      { label: "Negotiate salary when receiving offer", to: "/it-job/career/ung-tuyen-thang-tien/dam-phan-luong-khi-nhan-offer" },
    ],
  },
  {
    id: "chuyen-mon-it",
    title: "IT Expertise",
    items: [
      { label: "Backend roadmap for real combat", to: "/it-job/career/chuyen-mon-it/backend-roadmap-thuc-chien" },
      { label: "Basic frontend performance", to: "/it-job/career/chuyen-mon-it/frontend-performance-can-ban" },
      { label: "Introduction to system design", to: "/it-job/career/chuyen-mon-it/nhap-mon-system-design" },
    ],
  },
];

type CareerMegaMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CareerMegaMenu({ isOpen, onClose }: CareerMegaMenuProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(CAREER_MENU_DATA[0].id);

  useEffect(() => {
    if (isOpen) {
      setActiveCategoryId(CAREER_MENU_DATA[0].id);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeCategory =
    CAREER_MENU_DATA.find((category) => category.id === activeCategoryId) ?? CAREER_MENU_DATA[0];

  return (
    <Box
      position="absolute"
      top="100%"
      left="0"
      mt={1}
      w="1080px"
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="18px"
      boxShadow="0 18px 40px rgba(15, 23, 42, 0.12)"
      zIndex={1200}
      overflow="hidden"
      onMouseLeave={onClose}
    >
      <Flex minH="420px">
        <Box
          w="320px"
          bg="#F8FAFC"
          borderRight="1px solid"
          borderColor="gray.200"
          py={3}
        >
          <VStack align="stretch" spacing={0}>
            {CAREER_MENU_DATA.map((category) => {
              const isActive = category.id === activeCategory.id;

              return (
                <Flex
                  key={category.id}
                  align="center"
                  justify="space-between"
                  px={6}
                  py={4}
                  bg={isActive ? "white" : "transparent"}
                  color={isActive ? "#334371" : "#334155"}
                  fontWeight={isActive ? "700" : "500"}
                  borderLeft={isActive ? "4px solid #334371" : "4px solid transparent"}
                  cursor="pointer"
                  _hover={{ bg: "white", color: "#334371" }}
                  onMouseEnter={() => setActiveCategoryId(category.id)}
                >
                  <Text fontSize="15px">
                    {category.title}
                  </Text>
                  <ChevronRightIcon boxSize={5} />
                </Flex>
              );
            })}
          </VStack>
        </Box>

        <Flex flex="1" direction="column" bg="white">
          <Box px={8} py={7} flex="1">
            <Text fontSize="18px" fontWeight="700" color="#111827" mb={5}>
              {activeCategory.title}
            </Text>

            <Grid templateColumns="repeat(2, 1fr)" gap={2}>
              {activeCategory.items.map((item) => (
                <GridItem key={item.to}>
                  <ChakraLink
                    as={RouterLink}
                    to={item.to}
                    color="gray.700"
                    fontWeight="500"
                    _hover={{ textDecoration: "none", color: "#334371" }}
                  >
                    {item.label}
                  </ChakraLink>
                </GridItem>
              ))}
            </Grid>
          </Box>

          <Flex
            justify="center"
            py={4}
            borderTop="1px solid"
            borderColor="gray.100"
          >
            <ChakraLink
              as={RouterLink}
              to="/it-job/career"
              fontWeight="700"
              color="#334371"
              _hover={{ textDecoration: "none", opacity: 0.9 }}
            >
              See all
            </ChakraLink>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}
