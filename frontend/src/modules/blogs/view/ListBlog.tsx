import {
  Box,
  Container,
  SimpleGrid,
  Text,
  Input,
  HStack,
  Button,
  VStack,
  Spinner,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BlogCard from "../components/BlogsCard";
import { getBlogs } from "../api/blog.service";
import type { BlogPost } from "../api/blog.service";
import Pagination from "../../../components/common/Pagination";

const categories = [
  "All",
  "IT Career",
  "Programming",
  "CV & Interview",
  "Frontend",
  "Backend",
  "Tester / QA",
  "Data & AI",
  "Workplace Skills",
];

const ITEMS_PER_PAGE = 9;

export default function ListBlog() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [category, setCategory] = useState<string>(() => {
    return searchParams.get("category") || "All";
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Sync URL when category changes
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (category !== "All") {
      newParams.set("category", category);
    }
    setSearchParams(newParams);
  }, [category, setSearchParams]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setCurrentPage(1); // Reset to page 1 when category changes

        const response = await getBlogs({
          category,
          page: 1,
          limit: 50, // Fetch up to 50 articles
        });

        const posts = Array.isArray(response.data) ? response.data : [];
        setAllPosts(posts);
        setTotalCount(response.total || posts.length);
      } catch (err) {
        console.error("Failed to fetch blog posts:", err);
        setAllPosts([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [category]);

  const handleCardClick = (slug: string) => {
    navigate(`/it-job/blogs/${slug}`);
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPosts = allPosts.slice(startIndex, endIndex);

  const displayStart = totalCount === 0 ? 0 : startIndex + 1;
  const displayEnd = Math.min(endIndex, totalCount);

  return (
    <Box minH="100vh" py={0}>
      <Container maxW="1200px">
        <VStack align="stretch" spacing={8}>
          <Box>
            <Text fontSize={{ base: "3xl", md: "5xl" }} fontWeight="900" color="#1E293B">
              Career Handbook
            </Text>
            <Text mt={3} fontSize="lg" color="#64748B" maxW="680px">
              Practical IT career articles for students, freshers, and junior developers.
            </Text>
            {totalCount > 0 && (
              <Text mt={2} fontSize="sm" color="#94A3B8">
                Showing {displayStart}-{displayEnd} of {totalCount} articles
              </Text>
            )}
          </Box>
          <HStack spacing={3} overflowX="auto" pb={2}>
            {categories.map((item) => (
              <Button
                key={item}
                flexShrink={0}
                borderRadius="999px"
                variant="ghost"
                bg={category === item ? "#334371" : "white"}
                color={category === item ? "white" : "#334155"}
                border="1px solid #E2E8F0"
                _hover={{
                  bg: category === item ? "#2A3864" : "#F1F5F9",
                }}
                onClick={() => setCategory(item)}
              >
                {item}
              </Button>
            ))}
          </HStack>

          {loading ? (
            <Box textAlign="center" py={12}>
              <Spinner color="#334371" size="lg" />
            </Box>
          ) : totalCount === 0 ? (
            <Box textAlign="center" py={12}>
              <Text color="#64748B" fontSize="lg">
                No blog posts found
              </Text>
            </Box>
          ) : (
            <>
              <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
                {paginatedPosts.map((post) => (
                  <BlogCard
                    key={post.id || post.slug}
                    post={post}
                    onClick={() => handleCardClick(post.slug)}
                  />
                ))}
              </SimpleGrid>

              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={8}>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </Box>
              )}
            </>
          )}
        </VStack>
      </Container>
    </Box>
  );
}