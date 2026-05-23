import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import ITJobSocialCarousel from "./ITJobSocialCarousel";

type CandidateVoice = {
  author: string;
  quote: string;
  accent: string;
  tint: string;
};

const candidateVoices: CandidateVoice[] = [
  {
    author: "Ms. Truc Nang",
    quote:
      "What I enjoy about ITJob is that it notifies users of new jobs via email regularly. This gives me the opportunity to learn about recruitment jobs that match my experience. Of course, ITJob's interface is very beautiful, easy to use and convenient, helping me find suitable jobs quickly. All information, industries, and regions are updated very methodically. I am very satisfied with this experience.",
    accent: "#1D4ED8",
    tint: "#EFF6FF",
  },
  {
    author: "Mr. Quang Tung",
    quote:
      "ITJob has many jobs with diverse industry characteristics. Accurately and fully reflects the need to find jobs in today's society and the recruitment needs of businesses. Easy-to-understand presentation interface. Besides, ITJob also has many rich content and articles, reflecting the actual recruitment and job needs in the current period.",
    accent: "#0F766E",
    tint: "#F0FDFA",
  },
  {
    author: "Ms. Thanh Vy",
    quote:
      "When you submit your application on the website, an email will be sent to confirm that you have successfully submitted your application. This helps me know and manage the positions and companies I have applied for. Besides, the interface is very easy to use, I can view jobs, company information and review jobs I have viewed, saved, or applied for very easily. Furthermore, most of the companies registering for recruitment are reputable companies, so I am very confident when looking for a job on the ITJob platform.",
    accent: "#B91C1C",
    tint: "#FEF2F2",
  },
  {
    author: "Mr. Hoang Nhan",
    quote:
      "Regarding the search engine, I appreciate that ITJob searches by keyword very accurately, in addition to synthesizing how many related jobs are currently available. As for job announcements, I must say that ITJob sends letters more regularly than my lover (even though I don't have a lover yet).",
    accent: "#EA580C",
    tint: "#FFF7ED",
  },
  {
    author: "Ms. Thuy Linh",
    quote:
      "ITJob is a prominent brand. When it comes to finding a job, people immediately think of ITJob first and then other platforms. In addition, ITJob also has many improvements and changes to better suit current industry trends.",
    accent: "#7C3AED",
    tint: "#F5F3FF",
  },
  {
    author: "Ms. Hoa",
    quote:
      "The feature of saving previous job search requests helps users just click to search quickly, helping to save time. Besides, jobs on ITJob are often jobs with high requirements and good salaries.",
    accent: "#0EA5E9",
    tint: "#F0F9FF",
  },
  {
    author: "Ms. Linh Chi",
    quote:
      "I realize that ITJob profiles are searched a lot by businesses and the interview invitation rate is also high.",
    accent: "#14532D",
    tint: "#ECFDF5",
  },
  {
    author: "Ms. Thu Thao",
    quote:
      "Friendly web interface, speed displays job information quickly and smoothly. Diversity of professions. Mobile applications run smoothly, without sudden exits. Suitable suggested jobs. HR Insider section is useful for job seekers.",
    accent: "#4338CA",
    tint: "#EEF2FF",
  },
  {
    author: "Ms. Thanh Thao",
    quote:
      "ITJob's website interface is very user-friendly, suitable for both first-time users and long-time users. Diverse information about work positions, clear company introduction information. Suggested jobs are often based on user behavior, so the suggested jobs are often very suitable to the user's needs.",
    accent: "#BE185D",
    tint: "#FDF2F8",
  },
  {
    author: "Ms. Thuy Duong",
    quote:
      "ITJob has a variety of industries, companies and organizations. Convenient application form, job seekers can build profiles directly on the ITJob site, can connect with other social accounts to increase interaction and make it easier to find a job.",
    accent: "#334155",
    tint: "#F8FAFC",
  },
  {
    author: "Ms. Thuy Tien",
    quote:
      "I really like ITJob's interface, useful and easy to search. Companies and industries are diverse and there are many jobs from large companies with high salaries as expected. Regarding profile management, I was suggested to make additional edits to make my profile more complete. The ITJob application is quite effective and sophisticated, has a new overview and is changed according to the development of the job market. This makes me quite impressed.",
    accent: "#1E40AF",
    tint: "#EFF6FF",
  },
  {
    author: "Ms. Thanh Thu",
    quote:
      "Daily job notifications are sent to your email to help you easily follow and apply for suitable job positions. In addition, of all the websites I have ever used, ITJob for me is the best job search website. Friendly interface and easy to use.",
    accent: "#059669",
    tint: "#ECFDF5",
  },
];

function CandidateVoiceCard({ item }: { item: CandidateVoice }) {
  const initials = item.author
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <Box
      h="100%"
      minH={{ base: "190px", md: "210px" }}
      bg="white"
      border="1px solid #E2E8F0"
      borderRadius="18px"
      p={{ base: 3, md: 3.5 }}
      boxShadow="0 8px 18px rgba(15, 23, 42, 0.04)"
      transition="transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease"
      _hover={{
        transform: "translateY(-2px)",
        boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
        borderColor: item.accent,
      }}
    >
      <VStack align="stretch" spacing={2.5} h="full">
        <HStack spacing={2.5} align="center">
          <Box
            w="38px"
            h="38px"
            borderRadius="full"
            bg={item.accent}
            color="white"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontWeight="700"
            fontSize="13px"
            letterSpacing="0.04em"
          >
            {initials}
          </Box>
          <VStack align="start" spacing={0} flex="1">
            <Text fontSize="15px" fontWeight="700" color="#0F172A">
              {item.author}
            </Text>
            <Text fontSize="12px" color="#64748B" fontWeight="600">
              ITJob candidate
            </Text>
          </VStack>
        </HStack>

        <Box
          flex="1"
          position="relative"
          borderRadius="14px"
          bg={item.tint}
          px={{ base: 3, md: 3.5 }}
          py={{ base: 3, md: 3.5 }}
          border="1px solid rgba(148,163,184,0.18)"
          overflow="hidden"
        >
          <Text
            position="absolute"
            top="-4px"
            left="12px"
            fontSize="40px"
            lineHeight="1"
            color="rgba(148,163,184,0.18)"
            fontWeight="900"
            pointerEvents="none"
          >
            “
          </Text>
          <Text
            position="absolute"
            bottom="-14px"
            right="12px"
            fontSize="40px"
            lineHeight="1"
            color="rgba(148,163,184,0.18)"
            fontWeight="900"
            pointerEvents="none"
          >
            ”
          </Text>
          <Text color="#475569" fontSize="15px" lineHeight="1.7" position="relative" zIndex={1} noOfLines={4}>
            {item.quote}
          </Text>
        </Box>

        <HStack justify="space-between" align="center">
          <Box
            px={2.5}
            py={0.5}
            borderRadius="full"
            bg="#F8FAFC"
            color="#334155"
            fontSize="12px"
            fontWeight="700"
          >
            Share reality
          </Box>
          <Box
            px={2.5}
            py={0.5}
            borderRadius="full"
            bg={item.tint}
            color={item.accent}
            fontSize="12px"
            fontWeight="800"
          >
            ITJob user voice
          </Box>
        </HStack>
      </VStack>
    </Box>
  );
}

export default function ITJobCandidateVoiceSection() {
  return (
    <ITJobSocialCarousel
      title="What candidates say about ITJob"
      subtitle="Real-life shares from job seekers who are experiencing ITJob every day, displayed with a carousel that can run automatically and click < > to see more."
      items={candidateVoices}
      renderItem={(item) => <CandidateVoiceCard item={item} />}
      visibleCount={{ base: 1, md: 2, xl: 3 }}
      cardWidth={{ base: 320, md: 350, xl: 373 }}
      autoPlayInterval={3400}
    />
  );
}