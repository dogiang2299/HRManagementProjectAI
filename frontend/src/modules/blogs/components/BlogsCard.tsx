import {
  Box,
  Image,
  Text,
  Badge,
  HStack,
  VStack,
} from "@chakra-ui/react";

interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  category?: string;
  summary?: string;
  author_name?: string;
  authorName?: string;
  read_time?: number;
  readTime?: number;
  published_at?: string;
  publishedAt?: string;
}

interface BlogCardProps {
  post: BlogPost;
  onClick?: () => void;
}

export default function BlogCard({ post, onClick }: BlogCardProps) {
  // Handle both camelCase and snake_case field names
  const thumbnail = post.thumbnail_url || post.thumbnailUrl || "/placeholder-blog.jpg";
  const author = post.author_name || post.authorName || "Author";
  const readTime = post.read_time || post.readTime || 5;
  const publishedDate = post.published_at || post.publishedAt || new Date().toISOString();

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Box
      bg="white"
      border="1px solid #E2E8F0"
      borderRadius="22px"
      overflow="hidden"
      cursor="pointer"
      transition="all 0.2s ease"
      boxShadow="0 12px 28px rgba(15, 23, 42, 0.08)"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "0 18px 38px rgba(15, 23, 42, 0.14)",
        borderColor: "#CBD5E1",
      }}
      onClick={onClick}
    >
      <Image
        src={thumbnail}
        alt={post.title}
        w="full"
        h="180px"
        objectFit="cover"
        fallbackSrc="/placeholder-blog.jpg"
      />

      <VStack align="stretch" spacing={3} p={5}>
        <HStack justify="space-between">
          {post.category && (
            <Badge
              px={3}
              py={1}
              borderRadius="999px"
              bg="#EEF2FF"
              color="#334371"
              textTransform="none"
              fontSize="xs"
              fontWeight="600"
            >
              {post.category}
            </Badge>
          )}

          <Text fontSize="xs" color="#64748B" fontWeight="600">
            {readTime} min read
          </Text>
        </HStack>

        <Text
          fontSize="lg"
          fontWeight="800"
          color="#1E293B"
          noOfLines={2}
          lineHeight="1.3"
        >
          {post.title}
        </Text>

        <Text fontSize="sm" color="#64748B" noOfLines={3}>
          {post.summary || ""}
        </Text>

        <HStack justify="space-between" pt={2}>
          <Text fontSize="sm" color="#334155" fontWeight="700">
            {author}
          </Text>

          <Text fontSize="xs" color="#94A3B8">
            {formatDate(publishedDate)}
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
}