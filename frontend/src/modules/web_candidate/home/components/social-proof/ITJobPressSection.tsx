import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ITJobSocialCarousel from "./ITJobSocialCarousel";
import { getBlogs, type BlogPost } from "../../../../blogs/api/blog.service";

const ACCENT_COLORS = [
  { accent: "#14532D", tint: "#ECFDF5" },
  { accent: "#1D4ED8", tint: "#EFF6FF" },
  { accent: "#B91C1C", tint: "#FEF2F2" },
  { accent: "#7C3AED", tint: "#F5F3FF" },
  { accent: "#0F766E", tint: "#F0FDFA" },
  { accent: "#2563EB", tint: "#F8FAFF" },
  { accent: "#EA580C", tint: "#FFF7ED" },
  { accent: "#0EA5E9", tint: "#F0F9FF" },
  { accent: "#334155", tint: "#F8FAFC" },
  { accent: "#BE185D", tint: "#FDF2F8" },
  { accent: "#4338CA", tint: "#EEF2FF" },
  { accent: "#059669", tint: "#ECFDF5" },
];

type PressItem = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  accent: string;
  tint: string;
};

function PressCard({ item, onClick }: { item: PressItem; onClick: () => void }) {
  return (
    <Box
      h="100%"
      minH={{ base: "180px", md: "190px" }}
      bg="white"
      border="1px solid #E2E8F0"
      borderRadius="18px"
      p={{ base: 3, md: 3.5 }}
      boxShadow="0 8px 18px rgba(15, 23, 42, 0.04)"
      transition="transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease"
      cursor="pointer"
      onClick={onClick}
      _hover={{
        transform: "translateY(-2px)",
        boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
        borderColor: item.accent,
      }}
    >
      <VStack align="stretch" spacing={2.5} h="full">
        <HStack spacing={2} align="center">
          <Box
            px={2.5}
            py={0.5}
            borderRadius="full"
            bg={item.tint}
            color={item.accent}
            fontWeight="700"
            fontSize="12px"
            letterSpacing="0.03em"
            textTransform="uppercase"
          >
            {item.category || "ITJob"}
          </Box>
          <Box flex="1" h="1px" bg="linear-gradient(90deg, rgba(148,163,184,0.35), transparent)" />
        </HStack>

        <Text
          color="#0F172A"
          fontSize="15px"
          fontWeight="700"
          lineHeight="1.55"
          noOfLines={2}
        >
          {item.title}
        </Text>

        <Box
          flex="1"
          borderRadius="14px"
          bg={item.tint}
          px={3}
          py={2.5}
          border="1px solid rgba(148,163,184,0.18)"
        >
          <Text color="#475569" fontSize="15px" lineHeight="1.7" noOfLines={3}>
            {item.summary}
          </Text>
        </Box>

        <HStack justify="space-between" align="center">
          <Text color="#64748B" fontSize="12px" fontWeight="700" textTransform="uppercase" letterSpacing="0.06em">
            ITJob Blog
          </Text>
          <Box
            px={2.5}
            py={0.5}
            borderRadius="full"
            bg="#F8FAFC"
            color="#334155"
            fontSize="12px"
            fontWeight="700"
          >
            Xem bài viết
          </Box>
        </HStack>
      </VStack>
    </Box>
  );
}

export default function ITJobPressSection() {
  const navigate = useNavigate();
  const [pressItems, setPressItems] = useState<PressItem[]>([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await getBlogs({ page: 1, limit: 12 });
        const posts: BlogPost[] = res.data || [];

        const items: PressItem[] = posts.map((post, index) => {
          const colors = ACCENT_COLORS[index % ACCENT_COLORS.length];
          return {
            slug: post.slug,
            category: post.category || "Blog",
            title: post.title,
            summary: post.summary || post.content?.replace(/<[^>]*>/g, "").slice(0, 150) || "",
            accent: colors.accent,
            tint: colors.tint,
          };
        });

        setPressItems(items);
      } catch {
        // Silently fail - section just won't show
      }
    };

    fetchBlogs();
  }, []);

  if (pressItems.length === 0) return null;

  return (
    <ITJobSocialCarousel
      title="What does the press say about ITJob?"
      subtitle="Featured articles and media highlights surrounding ITJob, are presented as carousels that can run automatically and click < > to quickly switch back and forth."
      items={pressItems}
      renderItem={(item) => (
        <PressCard
          item={item}
          onClick={() => navigate(`/it-job/blogs/${item.slug}`)}
        />
      )}
      visibleCount={{ base: 1, md: 2, xl: 3 }}
      cardWidth={{ base: 320, md: 350, xl: 373 }}
      autoPlayInterval={3000}
    />
  );
}
