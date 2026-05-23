import { Box, Container, ListItem, Text, UnorderedList, VStack } from "@chakra-ui/react";

const ITJobInfoSection = () => {
  return (
    <Box py={{ base: 2, md: 4 }} mb={-10}>
      <Container maxW="1200px">
        <VStack align="start" spacing={3}>
          <Text
            color="#1E293B"
            fontWeight="800"
            fontSize={{ base: "xl", md: "md" }}
            lineHeight="1.4"
          >
            Opportunity to develop your IT career at leading technology businesses
          </Text>

          <Text
            color="#475569"
            fontSize={{ base: "sm", md: "sm" }}
            lineHeight="1.7"
          >
            In the era of digital transformation, the need to recruit information technology personnel is increasing sharply.
            From programmers, software testers, business analysts to data engineers, AI or DevOps,
            Businesses are always looking for candidates with good professional capabilities and the ability to adapt quickly
            with the technological environment. Above <Text as="span" color="#334371" fontWeight="700">ITJob</Text>,
            Job seekers can access many IT career opportunities suitable to their development orientation,
            Your current skills and income goals.
          </Text>

          <Text
            color="#1E293B"
            fontWeight="800"
            fontSize={{ base: "lg", md: "md" }}
          >
            Why should you find an IT job at ITJob?
          </Text>

          <Box>
            <Text
              color="#1E293B"
              fontWeight="800"
              fontSize={{ base: "md", md: "md" }}
              mb={2}
            >
              Selected IT jobs, updated regularly
            </Text>

            <UnorderedList
              color="#475569"
              spacing={1.5}
              pl={5}
              fontSize={{ base: "sm", md: "sm" }}
              lineHeight="1.8"
            >
              <ListItem>
                Thousands of quality IT job postings are continuously updated from software companies,
                technology startups and digital transformation businesses.
              </ListItem>
              <ListItem>
                Easily search for jobs by position such as Frontend, Backend, Fullstack, Mobile, Tester,
                Business Analyst, Data Analyst, AI Engineer, DevOps and many other majors.
              </ListItem>
            </UnorderedList>
          </Box>

          <Box>
            <Text
              color="#1E293B"
              fontWeight="800"
              fontSize={{ base: "md", md: "md" }}
              mb={2}
            >
              Optimize application documents for the technology industry
            </Text>

            <UnorderedList
              color="#475569"
              spacing={1.5}
              pl={5}
              fontSize={{ base: "sm", md: "sm" }}
              lineHeight="1.8"
            >
              <ListItem>
                Support building professional CVs for IT candidates, highlighting skills, projects,
                technology used and practical experience.
              </ListItem>
              <ListItem>
                Helps employers quickly evaluate candidates' suitability through professional skills,
                Project experience and career orientation.
              </ListItem>
            </UnorderedList>
          </Box>

          <Box>
            <Text
              color="#1E293B"
              fontWeight="800"
              fontSize={{ base: "md", md: "md" }}
              mb={2}
            >
              Connect the right IT candidates with the right businesses
            </Text>

            <UnorderedList
              color="#475569"
              spacing={1.5}
              pl={5}
              fontSize={{ base: "sm", md: "sm" }}
              lineHeight="1.8"
            >
              <ListItem>
                The support system suggests technology jobs suitable to your skills and majors
                and experience of each candidate.
              </ListItem>
              <ListItem>
                Increase connection opportunities between IT candidates and employers through the recruitment platform
                Focused, modern and easy to use.
              </ListItem>
            </UnorderedList>
          </Box>

          <Text
            color="#475569"
            fontSize={{ base: "sm", md: "sm" }}
            lineHeight="1.9"
          >
            In <Text as="span" color="#334371" fontWeight="700">ITJob</Text>, you not only find
            the latest technology recruitment news but also have the opportunity to access the working environment
            Professional, dynamic and rich in development potential. Even if you are a new IT graduate,
            Technology intern or experienced programmer, ITJob will help you shorten the time
            the gap between personal abilities and suitable career opportunities in the information technology industry.
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

export default ITJobInfoSection;