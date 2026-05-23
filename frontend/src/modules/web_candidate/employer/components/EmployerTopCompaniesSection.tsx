import {
  Box,
  Container,
  Grid,
  Heading,
  Image,
  Text,
  VStack,
  usePrefersReducedMotion,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useMemo } from "react";
import { useGetCompanyCandidate } from "../../company/api/getCompany";
import { resolveCompanyLogoUrl } from "../../../../utils/companyLogo";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
`;

export default function EmployerTopCompaniesSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const appear = prefersReducedMotion ? undefined : `${fadeUp} 0.6s ease-out both`;
  const { data } = useGetCompanyCandidate({
    pages: 1,
    limit: 24,
    search: "",
    status: "active",
  });

  const companies = useMemo(() => {
    const list = data?.data ?? [];
    return list
      .reduce<Array<{ id: string; src: string; alt: string }>>((acc, item, index) => {
        const src = resolveCompanyLogoUrl(item.image_logo);
        if (!src) return acc;

        acc.push({
          id: String(item.id ?? index),
          src,
          alt: item.full_name || `company_${index + 1}`,
        });

        return acc;
      }, [])
      .slice(0, 16);
  }, [data?.data]);

  if (companies.length === 0) {
    return null;
  }

  return (
    <Box
      px={{ base: 3, md: 15, xl: 135 }}
      bg="linear-gradient(180deg, #F8F8FA 0%, #FFFFFF 100%)"
      py={{ base: 14, md: 20 }}
    >
      <Container maxW="7xl">
        <VStack spacing={4} textAlign="center" mb={12} animation={appear}>
          <Text
            color="#334371"
            fontWeight="800"
            fontSize="sm"
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            Trusted employers
          </Text>

          <Heading fontSize={{ base: "2xl", md: "4xl" }} color="#111827" fontWeight="900">
            Top companies on ITJob
          </Heading>

          <Text color="#4B5563" fontSize={{ base: "md", md: "lg" }} maxW="900px" lineHeight="1.8">
            Our employers and partners include leading IT companies, technology corporations,
            and innovative startups looking for high-quality tech talent.
          </Text>
        </VStack>

        <Grid
          templateColumns={{
            base: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
            xl: "repeat(8, 1fr)",
          }}
          gap={5}
        >
          {companies.map((item, index) => (
            <Box
              key={item.id}
              role="group"
              position="relative"
              h={{ base: "110px", md: "128px" }}
              borderRadius="24px"
              bg="white"
              border="1px solid #EEF2F7"
              boxShadow="0 14px 34px rgba(15, 23, 42, 0.045)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              px={5}
              overflow="hidden"
              animation={appear}
              style={{ animationDelay: `${index * 0.05}s` }}
              transition="transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease"
              _before={{
                content: '""',
                position: "absolute",
                inset: 0,
                bg: "linear-gradient(135deg, rgba(51,67,113,0.06), rgba(255,255,255,0))",
                opacity: 0,
                transition: "opacity 0.25s ease",
              }}
              _hover={{
                transform: "translateY(-5px)",
                boxShadow: "0 20px 42px rgba(15, 23, 42, 0.09)",
                borderColor: "#D8E2F2",
                _before: {
                  opacity: 1,
                },
              }}
            >
              <Image
                src={item.src}
                alt={item.alt}
                maxW="88%"
                maxH="64px"
                objectFit="contain"
                filter="grayscale(10%)"
                transition="transform 0.25s ease, filter 0.25s ease, opacity 0.25s ease"
                opacity={0.95}
                _groupHover={{
                  transform: "scale(1.05)",
                  filter: "grayscale(0%)",
                  opacity: 1,
                }}
              />
            </Box>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}