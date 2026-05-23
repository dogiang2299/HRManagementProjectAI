import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  usePrefersReducedMotion,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useEffect, useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { candidateBlogsUrl } from "../../../../routes/urls";
import { getBlogs, type BlogPost } from "../../../blogs/api/blog.service";
import BlogCard from "../../../blogs/components/BlogsCard";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
`;

const FEATURED_BLOG_LIMIT = 3;

export default function EmployerResourcesSection() {
  const navigate = useNavigate();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const appear = prefersReducedMotion ? undefined : `${fadeUp} 0.6s ease-out both`;

  useEffect(() => {
    let mounted = true;

    const fetchFeaturedPosts = async () => {
      try {
        setLoading(true);
        const response = await getBlogs({ page: 1, limit: FEATURED_BLOG_LIMIT });
        if (mounted) {
          setPosts(Array.isArray(response.data) ? response.data.slice(0, FEATURED_BLOG_LIMIT) : []);
        }
      } catch (error) {
        console.error("Failed to fetch employer blog posts:", error);
        if (mounted) {
          setPosts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchFeaturedPosts();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Box px={{ base: 3, md: 15, xl: 135 }}>
      <Container maxW="7xl">
        <HStack
          justify="space-between"
          align="center"
          mb={10}
          flexWrap="wrap"
          spacing={4}
          animation={appear}
        >
          <Box>
            <Text
              color="#334371"
              fontWeight="800"
              fontSize="sm"
              letterSpacing="0.08em"
              textTransform="uppercase"
              mb={2}
            >
              Blog posts
            </Text>
            <Heading fontSize={{ base: "xl", md: "3xl" }} color="#111827" fontWeight="900">
              Latest articles from ITJob Blog
            </Heading>
          </Box>

          <Button
            variant="ghost"
            color="#334371"
            rightIcon={<FiArrowRight />}
            fontWeight="800"
            transition="all 0.2s ease"
            _hover={{ bg: "transparent", color: "#2B365F", transform: "translateX(2px)" }}
            onClick={() => navigate(candidateBlogsUrl)}
          >
            View more
          </Button>
        </HStack>

        {loading ? (
          <Box textAlign="center" py={12}>
            <Spinner color="#334371" size="lg" />
          </Box>
        ) : posts.length === 0 ? (
          <Box
            bg="white"
            border="1px solid #E2E8F0"
            borderRadius="22px"
            p={8}
            textAlign="center"
            color="#64748B"
          >
            No blog posts available yet.
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={7}>
            {posts.map((post, index) => (
              <Box
                key={post.id || post.slug}
                animation={appear}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <BlogCard
                  post={post}
                  onClick={() => navigate(`${candidateBlogsUrl}/${post.slug}`)}
                />
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Container>
    </Box>
  );
}
