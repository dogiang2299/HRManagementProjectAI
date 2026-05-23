import { Box, Button, Divider, Heading, HStack, ListItem, Text, UnorderedList, VStack } from "@chakra-ui/react";
import { FiDownload } from "react-icons/fi";

type CVPreviewProps = {
  structuredData?: Record<string, any> | null;
};

const toArray = (value: unknown) => (Array.isArray(value) ? value : []);

// Normalize text lists so the preview does not render object/null values.
// This helper is used for responsibilities, certificates, and languages.
const toStringArray = (value: unknown) =>
  toArray(value)
    .map((item) => String(item || "").trim())
    .filter(Boolean);

// Prefer the backend-extracted duration, then fall back to start/end dates.
// This keeps phrases like "6 months" displayed correctly in the preview.
const formatPeriod = (item: Record<string, any>) =>
  String(item.duration || "").trim() ||
  [item.startDate, item.endDate].filter(Boolean).join(" - ") ||
  "Duration not provided";

export default function CVPreview({ structuredData }: CVPreviewProps) {
  const data = structuredData || {};
  const personal = (data.personalInfo && typeof data.personalInfo === "object" ? data.personalInfo : {}) as Record<string, any>;

  const skills = toStringArray(data.skills);
  const experience = toArray(data.experiences).length
    ? toArray(data.experiences)
    : toArray(data.experience);
  const education = toArray(data.education);
  const projects = toArray(data.projects);
  const certificates = toStringArray(data.certificates);
  const languages = toStringArray(data.languages);

  return (
    <Box bg="white" border="1px solid" borderColor="#E5E7EB" borderRadius="16px" p={{ base: 4, md: 6 }}>
      <HStack justify="space-between" align="start" mb={4}>
        <Box>
          <Heading size="md" color="#1F2937">CV Preview</Heading>
          <Text fontSize="sm" color="#6B7280">Preview based on the current structured data</Text>
        </Box>
        <Button size="sm" leftIcon={<FiDownload />} variant="outline" borderColor="#CBD5E1" isDisabled>
          Export PDF (TODO)
        </Button>
      </HStack>

      <VStack align="stretch" spacing={4}>
        <Box>
          <Text fontSize="lg" fontWeight="800" color="#1F2937">{String(personal.fullName || "Candidate")}</Text>
          <Text fontSize="sm" color="#4B5563">{String(personal.position || "") || "Position not provided"}</Text>
          <Text fontSize="sm" color="#6B7280">
            {[personal.email, personal.phone, personal.address].filter(Boolean).join(" | ") || "Contact details not provided"}
          </Text>
        </Box>

        <Divider />

        <Box>
          <Text fontWeight="700" color="#334371" mb={1}>Preferences</Text>
          <Text fontSize="sm" color="#374151">
            {[
              data.targetSalary ? `Salary: ${data.targetSalary}` : "",
              data.location ? `Location: ${data.location}` : "",
              data.jobType ? `Job type: ${data.jobType}` : "",
            ].filter(Boolean).join(" | ") || "Job preferences not provided"}
          </Text>
        </Box>

        <Box>
          <Text fontWeight="700" color="#334371" mb={1}>Summary</Text>
          <Text fontSize="sm" color="#374151" whiteSpace="pre-wrap">{String(data.summary || "Summary not provided")}</Text>
        </Box>

        <Box>
          <Text fontWeight="700" color="#334371" mb={1}>Skills</Text>
          {skills.length ? (
            <HStack spacing={2} flexWrap="wrap">
              {skills.map((item, index) => (
                <Box key={`${item}-${index}`} px={2.5} py={1} borderRadius="999px" bg="#EEF2FF" color="#334371" fontSize="sm" fontWeight="600">
                  {String(item)}
                </Box>
              ))}
            </HStack>
          ) : (
            <Text fontSize="sm" color="#6B7280">No skills yet</Text>
          )}
        </Box>

        <Box>
          <Text fontWeight="700" color="#334371" mb={1}>Experience</Text>
          {experience.length ? (
            <VStack align="stretch" spacing={2}>
              {experience.map((item: any, index) => {
                const responsibilities = toStringArray(item.responsibilities);

                return (
                  <Box key={index} border="1px solid" borderColor="#EEF2F7" borderRadius="12px" p={3}>
                    <Text fontSize="sm" fontWeight="700" color="#1F2937">{String(item.position || item.role || "") || "Position"}</Text>
                    <Text fontSize="sm" color="#4B5563">{String(item.company || "") || "Company"}</Text>
                    <Text fontSize="xs" color="#6B7280">{formatPeriod(item)}</Text>
                    <Text fontSize="sm" color="#374151" mt={1} whiteSpace="pre-wrap">{String(item.description || "")}</Text>
                    {responsibilities.length > 0 ? (
                      <UnorderedList spacing={1} pl={5} mt={2}>
                        {responsibilities.map((responsibility, responsibilityIndex) => (
                          <ListItem key={`${responsibility}-${responsibilityIndex}`} fontSize="sm" color="#374151">
                            {responsibility}
                          </ListItem>
                        ))}
                      </UnorderedList>
                    ) : null}
                  </Box>
                );
              })}
            </VStack>
          ) : (
            <Text fontSize="sm" color="#6B7280">No experience yet</Text>
          )}
        </Box>

        <Box>
          <Text fontWeight="700" color="#334371" mb={1}>Education</Text>
          {education.length ? (
            <VStack align="stretch" spacing={2}>
              {education.map((item: any, index) => (
                <Box key={index} border="1px solid" borderColor="#EEF2F7" borderRadius="12px" p={3}>
                  <Text fontSize="sm" fontWeight="700" color="#1F2937">{String(item.school || "") || "School not provided"}</Text>
                  <Text fontSize="sm" color="#4B5563">{String(item.major || "") || "Major not provided"}</Text>
                  <Text fontSize="xs" color="#6B7280">{formatPeriod(item)}</Text>
                  {item.description ? (
                    <Text fontSize="sm" color="#374151" mt={1} whiteSpace="pre-wrap">{String(item.description)}</Text>
                  ) : null}
                </Box>
              ))}
            </VStack>
          ) : (
            <Text fontSize="sm" color="#6B7280">No education yet</Text>
          )}
        </Box>

        <Box>
          <Text fontWeight="700" color="#334371" mb={1}>Projects</Text>
          {projects.length ? (
            <VStack align="stretch" spacing={2}>
              {projects.map((item: any, index) => {
                const responsibilities = toStringArray(item.responsibilities);
                const technologies = toStringArray(item.technologies);

                return (
                  <Box key={index} border="1px solid" borderColor="#EEF2F7" borderRadius="12px" p={3}>
                    <Text fontSize="sm" fontWeight="700" color="#1F2937">{String(item.name || "") || "Project"}</Text>
                    <Text fontSize="sm" color="#374151" mt={1} whiteSpace="pre-wrap">{String(item.description || "")}</Text>
                    {responsibilities.length > 0 ? (
                      <UnorderedList spacing={1} pl={5} mt={2}>
                        {responsibilities.map((responsibility, responsibilityIndex) => (
                          <ListItem key={`${responsibility}-${responsibilityIndex}`} fontSize="sm" color="#374151">
                            {responsibility}
                          </ListItem>
                        ))}
                      </UnorderedList>
                    ) : null}
                    {technologies.length > 0 ? (
                      <Text fontSize="xs" color="#6B7280" mt={1}>Tech: {technologies.join(", ")}</Text>
                    ) : null}
                  </Box>
                );
              })}
            </VStack>
          ) : (
            <Text fontSize="sm" color="#6B7280">No projects yet</Text>
          )}
        </Box>

        <Box>
          <Text fontWeight="700" color="#334371" mb={1}>Certificates</Text>
          {certificates.length ? (
            <UnorderedList spacing={1} pl={5}>
              {certificates.map((item, index) => (
                <ListItem key={`${item}-${index}`} fontSize="sm" color="#374151">{String(item)}</ListItem>
              ))}
            </UnorderedList>
          ) : (
            <Text fontSize="sm" color="#6B7280">No certificates yet</Text>
          )}
        </Box>

        <Box>
          <Text fontWeight="700" color="#334371" mb={1}>Languages</Text>
          {languages.length ? (
            <UnorderedList spacing={1} pl={5}>
              {languages.map((item, index) => (
                <ListItem key={`${item}-${index}`} fontSize="sm" color="#374151">{String(item)}</ListItem>
              ))}
            </UnorderedList>
          ) : (
            <Text fontSize="sm" color="#6B7280">No languages yet</Text>
          )}
        </Box>
      </VStack>
    </Box>
  );
}
