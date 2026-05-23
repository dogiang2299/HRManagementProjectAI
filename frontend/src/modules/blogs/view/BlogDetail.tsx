import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  GridItem,
  HStack,
  Image,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiBookOpen,
  FiCalendar,
  FiClock,
  FiCompass,
  FiTag,
  FiTrendingUp,
  FiUser,
} from "react-icons/fi";
import { apiClient } from "../../../lib/api";

interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  category?: string;
  content?: string;
  summary?: string;
  author_name?: string;
  authorName?: string;
  read_time?: number;
  readTime?: number;
  published_at?: string;
  publishedAt?: string;
  tags?: string[];
}

const blogCategories = [
  "IT Career",
  "Programming",
  "CV & Interview",
  "Frontend",
  "Backend",
  "Tester / QA",
  "Data & AI",
  "Workplace Skills",
];

function getThumbnail(post?: BlogPost | null) {
  return post?.thumbnail_url || post?.thumbnailUrl || "";
}

function getAuthor(post?: BlogPost | null) {
  return post?.author_name || post?.authorName || "ITJob Team";
}

function getReadTime(post?: BlogPost | null) {
  return post?.read_time || post?.readTime || 5;
}

function getPublishedDate(post?: BlogPost | null) {
  return post?.published_at || post?.publishedAt || "";
}

function formatDate(dateString?: string) {
  if (!dateString) return "Updating";

  try {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function normalizePostsResponse(responseData: any): BlogPost[] {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  return [];
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const thumbnail = getThumbnail(post);
  const author = getAuthor(post);
  const readTime = getReadTime(post);
  const publishedDate = getPublishedDate(post);

  const contentParagraphs = useMemo(() => {
    const rawContent = post?.content || "";
    return rawContent
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [post?.content]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        setError("Invalid blog slug");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get(`/blog-posts/${slug}`);
        const data = response.data?.data || response.data;

        setPost(data);
      } catch (err: any) {
        console.error("Failed to fetch blog post:", err);
        setError(
          err?.response?.data?.message ||
            err?.response?.statusText ||
            "Failed to load blog post",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  useEffect(() => {
    const fetchPopularPosts = async () => {
      try {
        const response = await apiClient.get("/blog-posts", {
          params: {
            page: 1,
            limit: 5,
          },
        });

        const posts = normalizePostsResponse(response.data)
          .filter((item) => item.slug !== slug)
          .slice(0, 4);

        setPopularPosts(posts);
      } catch (err) {
        console.error("Failed to fetch popular blog posts:", err);
        setPopularPosts([]);
      }
    };

    fetchPopularPosts();
  }, [slug]);

  if (loading) {
    return (
      <Box bg="#F8FAFC" minH="100vh" py={12}>
        <Container maxW="1200px">
          <Box textAlign="center" py={24}>
            <Spinner color="#334371" size="xl" thickness="4px" />
            <Text mt={5} color="#64748B" fontWeight="700">
              Loading article...
            </Text>
          </Box>
        </Container>
      </Box>
    );
  }

  if (error || !post) {
    return (
      <Box bg="#F8FAFC" minH="100vh" py={3}>
        <Container maxW="1000px">
          <VStack align="stretch" spacing={6}>
            <Button
              leftIcon={<FiArrowLeft />}
              variant="ghost"
              w="fit-content"
              color="#334371"
              fontWeight="800"
              _hover={{ bg: "#EEF2FF" }}
              onClick={() => navigate("/it-job/blogs")}
            >
              Back to Career Handbook
            </Button>

            <Box
              bg="white"
              border="1px solid #E2E8F0"
              borderRadius="24px"
              p={10}
              textAlign="center"
            >
              <Text fontSize="lg" color="#64748B" fontWeight="700">
                {error || "Blog post not found"}
              </Text>
            </Box>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box  minH="100vh" py={{ base: 8, md: 6 }}>
      <Container maxW="1200px">
        <VStack align="stretch" spacing={8}>
          <Button
            leftIcon={<FiArrowLeft />}
            variant="ghost"
            w="fit-content"
            color="#334371"
            fontWeight="800"
            _hover={{ bg: "#EEF2FF" }}
            onClick={() => navigate("/it-job/blogs")}
          >
            Back to Career Handbook
          </Button>

          <Grid
            templateColumns={{ base: "1fr", lg: "minmax(0, 1fr) 360px" }}
            gap={{ base: 6, lg: 8 }}
            alignItems="start"
          >
            <GridItem minW={0}>
              <Box
                bg="white"
                border="1px solid #E2E8F0"
                borderRadius="28px"
                overflow="hidden"
                boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)"
              >
                <Box p={{ base: 6, md: 9 }}>
                  <VStack align="stretch" spacing={6}>
                    <HStack spacing={3} flexWrap="wrap">
                      {post.category ? (
                        <Badge
                          w="fit-content"
                          px={3}
                          py={1}
                          borderRadius="999px"
                          bg="#EEF2FF"
                          color="#334371"
                          textTransform="none"
                          fontSize="sm"
                          fontWeight="800"
                        >
                          {post.category}
                        </Badge>
                      ) : null}

                      <HStack color="#64748B" fontSize="sm" fontWeight="700">
                        <FiClock />
                        <Text>{readTime} min read</Text>
                      </HStack>
                    </HStack>

                    <Box>
                      <Text
                        as="h1"
                        fontSize={{ base: "3xl", md: "3xl" }}
                        fontWeight="950"
                        color="#1E293B"
                        lineHeight="1.12"
                        letterSpacing="-0.03em"
                      >
                        {post.title}
                      </Text>

                      {post.summary ? (
                        <Text
                          mt={5}
                          fontSize={{ base: "md", md: "xl" }}
                          color="#64748B"
                          lineHeight="1.8"
                          maxW="820px"
                        >
                          {post.summary}
                        </Text>
                      ) : null}
                    </Box>

                    <HStack
                      spacing={{ base: 3, md: 6 }}
                      flexWrap="wrap"
                      pt={4}
                      borderTop="1px solid #E2E8F0"
                      color="#64748B"
                      fontSize="sm"
                      fontWeight="700"
                    >
                      <HStack>
                        <FiUser />
                        <Text>{author}</Text>
                      </HStack>

                      <HStack>
                        <FiCalendar />
                        <Text>{formatDate(publishedDate)}</Text>
                      </HStack>

                      <HStack>
                        <FiBookOpen />
                        <Text>Career Handbook</Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </Box>

                {thumbnail ? (
                  <Image
                    src={thumbnail}
                    alt={post.title}
                    w="full"
                    maxH={{ base: "260px", md: "440px" }}
                    objectFit="cover"
                    fallbackSrc="/placeholder-blog.jpg"
                  />
                ) : null}

                <Box p={{ base: 6, md: 9 }}>
                  <VStack align="stretch" spacing={6}>
                    {contentParagraphs.length > 0 ? (
                      contentParagraphs.map((paragraph, index) => (
                        <Text
                          key={`${index}-${paragraph.slice(0, 24)}`}
                          color="#475569"
                          fontSize={{ base: "md", md: "lg" }}
                          lineHeight="1.9"
                          whiteSpace="pre-line"
                        >
                          {paragraph}
                        </Text>
                      ))
                    ) : (
                      <Text
                        color="#475569"
                        fontSize={{ base: "md", md: "lg" }}
                        lineHeight="1.9"
                        whiteSpace="pre-line"
                      >
                        {post.content || "This article is being updated."}
                      </Text>
                    )}
                  </VStack>
                </Box>
              </Box>
            </GridItem>

            <GridItem>
              <VStack
                align="stretch"
                spacing={5}
                position={{ base: "static", lg: "sticky" }}
                top="24px"
              >
                <Box
                  bg="#334371"
                  color="white"
                  borderRadius="26px"
                  p={6}
                  boxShadow="0 18px 38px rgba(51, 67, 113, 0.22)"
                >
                  <VStack align="stretch" spacing={4}>
                    <HStack>
                      <Box
                        w="42px"
                        h="42px"
                        borderRadius="16px"
                        display="grid"
                        placeItems="center"
                        bg="rgba(255,255,255,0.14)"
                      >
                        <FiCompass />
                      </Box>

                      <Box>
                        <Text fontSize="lg" fontWeight="900">
                          Article overview
                        </Text>
                        <Text fontSize="sm" color="whiteAlpha.800">
                          Quick information
                        </Text>
                      </Box>
                    </HStack>

                    <Divider borderColor="whiteAlpha.300" />

                    <SimpleGrid columns={2} spacing={3}>
                      <Box>
                        <Text fontSize="xs" color="whiteAlpha.700">
                          Category
                        </Text>
                        <Text mt={1} fontWeight="900">
                          {post.category || "IT Career"}
                        </Text>
                      </Box>

                      <Box>
                        <Text fontSize="xs" color="whiteAlpha.700">
                          Read time
                        </Text>
                        <Text mt={1} fontWeight="900">
                          {readTime} min
                        </Text>
                      </Box>

                      <Box gridColumn="1 / -1">
                        <Text fontSize="xs" color="whiteAlpha.700">
                          Published
                        </Text>
                        <Text mt={1} fontWeight="900">
                          {formatDate(publishedDate)}
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </VStack>
                </Box>

                <Box
                  bg="white"
                  border="1px solid #E2E8F0"
                  borderRadius="24px"
                  p={6}
                  boxShadow="0 12px 28px rgba(15, 23, 42, 0.06)"
                >
                  <VStack align="stretch" spacing={4}>
                    <HStack color="#1E293B">
                      <FiTrendingUp color="#334371" />
                      <Text fontSize="lg" fontWeight="900">
                        Popular articles
                      </Text>
                    </HStack>

                    <VStack align="stretch" spacing={3}>
                      {popularPosts.length > 0 ? (
                        popularPosts.map((item, index) => (
                          <Box
                            key={item.id || item.slug}
                            role="button"
                            border="1px solid #EEF2F7"
                            borderRadius="18px"
                            p={4}
                            cursor="pointer"
                            transition="all 0.2s ease"
                            _hover={{
                              bg: "#F8FAFC",
                              borderColor: "#CBD5E1",
                              transform: "translateY(-1px)",
                            }}
                            onClick={() => navigate(`/it-job/blogs/${item.slug}`)}
                          >
                            <HStack align="start" spacing={3}>
                              <Text
                                minW="30px"
                                color="#334371"
                                fontSize="lg"
                                fontWeight="950"
                              >
                                {String(index + 1).padStart(2, "0")}
                              </Text>

                              <Box minW={0}>
                                <Text
                                  color="#1E293B"
                                  fontWeight="850"
                                  fontSize="sm"
                                  lineHeight="1.45"
                                  noOfLines={2}
                                >
                                  {item.title}
                                </Text>

                                <Text
                                  mt={1}
                                  color="#94A3B8"
                                  fontSize="xs"
                                  fontWeight="700"
                                >
                                  {getReadTime(item)} min read
                                </Text>
                              </Box>
                            </HStack>
                          </Box>
                        ))
                      ) : (
                        <Text color="#64748B" fontSize="sm">
                          Popular articles are being updated.
                        </Text>
                      )}
                    </VStack>
                  </VStack>
                </Box>

                <Box
                  bg="white"
                  border="1px solid #E2E8F0"
                  borderRadius="24px"
                  p={6}
                  boxShadow="0 12px 28px rgba(15, 23, 42, 0.06)"
                >
                  <VStack align="stretch" spacing={4}>
                    <HStack color="#1E293B">
                      <FiTag color="#334371" />
                      <Text fontSize="lg" fontWeight="900">
                        Topics
                      </Text>
                    </HStack>

                    <Wrap spacing={2}>
                      {blogCategories.map((category) => (
                        <WrapItem key={category}>
                          <Badge
                            as="button"
                            px={3}
                            py={1.5}
                            borderRadius="999px"
                            bg={
                              category === post.category ? "#334371" : "#F8FAFC"
                            }
                            color={
                              category === post.category ? "white" : "#334155"
                            }
                            border="1px solid #E2E8F0"
                            textTransform="none"
                            fontSize="xs"
                            fontWeight="800"
                            cursor="pointer"
                            _hover={{
                              bg:
                                category === post.category
                                  ? "#2A3864"
                                  : "#EEF2FF",
                            }}
                            onClick={() =>
                              navigate(
                                `/it-job/blogs?category=${encodeURIComponent(
                                  category,
                                )}`,
                              )
                            }
                          >
                            {category}
                          </Badge>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </VStack>
                </Box>

                <Button
                  h="52px"
                  borderRadius="18px"
                  bg="white"
                  color="#334371"
                  border="1px solid #CBD5E1"
                  fontWeight="900"
                  _hover={{ bg: "#EEF2FF" }}
                  onClick={() => navigate("/it-job/blogs")}
                >
                  View all articles
                </Button>
              </VStack>
            </GridItem>
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
}