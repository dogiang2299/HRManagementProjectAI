import {
  Box,
  Button,
  Checkbox,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  Icon,
  Input,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  usePrefersReducedMotion,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useMemo, useState } from "react";
import { FiClock, FiPhoneCall } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import SearchCombobox from "../../../../components/common/SearchCombobox";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { useCreateEmployerRegistration } from "../api/create_company_register";
import { candidateForEmployerSuccessUrl } from "../../../../routes/urls";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
`;

const floatGlow = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.5; }
  50% { transform: translate3d(18px, -10px, 0) scale(1.06); opacity: 0.8; }
`;

const contactCards = [
  {
    icon: FiPhoneCall,
    title: "Ho Chi Minh City Hotline",
    value: "0977 460 519",
  },
  {
    icon: FiPhoneCall,
    title: "Hanoi Hotline",
    value: "0983 131 351",
  },
  {
    icon: FiClock,
    title: "Working hours",
    value: "Monday - Friday | 8:30 - 17:00",
  },
];

const sourceOptions = [
  { id: "google_search", name: "Google Search" },
  { id: "facebook", name: "Facebook" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "email", name: "Email" },
  { id: "itjob_consulting_team", name: "ITJob Consulting Team" },
  { id: "friend_referral", name: "Referred by a friend" },
  { id: "other", name: "Other" },
];

export default function EmployerContactSection() {
  const navigate = useNavigate();
  const notify = useNotify();
  const { mutateAsync: createRegistration, isPending } = useCreateEmployerRegistration();
  const prefersReducedMotion = usePrefersReducedMotion();

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [source, setSource] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [area, setArea] = useState("");
  const [website, setWebsite] = useState("");
  const [recruitmentNeeds, setRecruitmentNeeds] = useState("");
  const [acceptedTerm, setAcceptedTerm] = useState(false);

  const sourceName = useMemo(
    () => sourceOptions.find((item) => item.id === source)?.name,
    [source],
  );

  const resetForm = () => {
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setSource("");
    setCompanyName("");
    setArea("");
    setWebsite("");
    setRecruitmentNeeds("");
    setAcceptedTerm(false);
  };

  const onSubmit = async () => {
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      notify({
        type: "warning",
        message: "Please enter all your information.",
        duration: 3
      });
      return;
    }

    if (!companyName.trim()) {
      notify({
        type: "warning",
        message: "Please enter the company name.",
        duration: 3
      });
      return;
    }

    if (!acceptedTerm) {
      notify({
        type: "warning",
        message: "You need to agree to the Terms of Service to continue.",
        duration: 3
      });
      return;
    }

    const normalizedPhone = contactPhone.trim().replace(/^84/, "0");

    try {
      await createRegistration({
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: normalizedPhone,
        source: sourceName,
        companyName: companyName.trim(),
        email: contactEmail.trim().toLowerCase(),
        phone: normalizedPhone,
        address: area || undefined,
        website: website.trim() || undefined,
        recruitmentNeeds: recruitmentNeeds.trim() || undefined,
        status: "pending",
        is_active: true,
      });
      resetForm();
      navigate(candidateForEmployerSuccessUrl);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error?.message || "Unable to submit registration.";

      notify({
        type: "error",
        message: Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage,
        duration: 3
      });
    }
  };

  const appear = prefersReducedMotion ? undefined : `${fadeUp} 0.65s ease-out both`;
  const glow = prefersReducedMotion ? undefined : `${floatGlow} 8s ease-in-out infinite`;

  return (
    <Box
      py={{ base: 14, md: 10 }}
      bg="linear-gradient(90deg, #101A33 0%, #23325E 45%, #334371 100%)"
      color="white"
      position="relative"
      overflow="hidden"
      px={{ base: 3, md: 15, xl: 135 }}
      mt={20}
    >
      <Box
        position="absolute"
        inset={0}
        bg="radial-gradient(circle at 80% 50%, rgba(114,138,201,0.18), transparent 35%)"
        animation={glow}
      />
      <Box
        position="absolute"
        bottom="-100px"
        left="-40px"
        w="240px"
        h="240px"
        borderRadius="full"
        bg="rgba(114,138,201,0.12)"
        filter="blur(18px)"
        animation={glow}
        style={{ animationDelay: '1.5s' }}
      />

      <Container maxW="7xl" position="relative" zIndex={1}>
        <VStack align="start" spacing={4} mb={10} animation={appear}>
          <Heading fontSize={{ base: "2xl", md: "4xl" }} fontWeight="900">
            Find the right IT talent
          </Heading>
          <Text color="rgba(255,255,255,0.82)" fontSize={{ base: "md", md: "lg" }} maxW="800px">
            Leave your contact information so our customer care team can advise you on the service
            package that best fits your company's recruitment needs.
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={7} alignItems="start">
          <Box
            gridColumn={{ base: "auto", xl: "span 2" }}
            bg="white"
            color="#111827"
            borderRadius="28px"
            p={{ base: 6, md: 8 }}
            boxShadow="0 25px 60px rgba(0,0,0,0.18)"
            animation={appear}
            transition="transform 0.28s ease, box-shadow 0.28s ease"
            _hover={{ transform: 'translateY(-4px)', boxShadow: '0 30px 70px rgba(0,0,0,0.2)' }}
          >
            <VStack align="stretch" spacing={8}>
              <Box>
                <Text fontSize="2xl" fontWeight="900" mb={5}>
                  Your information
                </Text>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={5}>
                  <Field label="Full name">
                    <Input
                      placeholder="Enter full name"
                      value={contactName}
                      onChange={(event) => setContactName(event.target.value)}
                    />
                  </Field>
                  <Field label="Work email">
                    <Input
                      placeholder="Enter work email"
                      value={contactEmail}
                      onChange={(event) => setContactEmail(event.target.value)}
                    />
                  </Field>
                  <Field label="Phone number">
                    <Input
                      placeholder="Enter phone number"
                      value={contactPhone}
                      onChange={(event) => setContactPhone(event.target.value)}
                    />
                  </Field>
                   <Field label="How did you hear about the platform?">
                    <SearchCombobox
                      value={source}
                      onChange={setSource}
                      options={sourceOptions}
                      placeholder="Select source"
                      size="md"
                    />
                  </Field>
                </Grid>

        
              </Box>

              <Box>
                <Text fontSize="2xl" fontWeight="900" mb={5}>
                  Company information
                </Text>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={5}>
                  <Field label="Company name">
                    <Input
                      placeholder="Enter company name"
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                    />
                  </Field>
                  <Field label="Area">
                    <Input  
                      placeholder="Enter area"
                      value={area}
                      onChange={(event) => setArea(event.target.value)}
                    />
                  </Field>
                </Grid>

                <Box mt={5}>
                  <Field label="Website address">
                    <Input
                      placeholder="https://your-company.com"
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                    />
                  </Field>
                </Box>

                <Box mt={5}>
                  <Field label="Recruitment needs">
                    <Textarea
                      placeholder="Briefly describe the position, hiring quantity, or your company's needs"
                      rows={5}
                      resize="none"
                      value={recruitmentNeeds}
                      onChange={(event) => setRecruitmentNeeds(event.target.value)}
                    />
                  </Field>
                </Box>
              </Box>

              <Checkbox
                colorScheme="blue"
                isChecked={acceptedTerm}
                onChange={(event) => setAcceptedTerm(event.target.checked)}
              >
                I have read and agree to the Terms of Service and Privacy Policy.
              </Checkbox>

              <Flex justify={{ base: "stretch", md: "flex-end" }}>
                <Button
                  size="lg"
                  bg={acceptedTerm ? "#334371" : "#A3A3A3"}
                  color="white"
                  minW={{ base: "full", md: "140px" }}
                  borderRadius="14px"
                  transition="all 0.22s ease"
                  _hover={{ bg: acceptedTerm ? "#334371" : "#A3A3A3", transform: acceptedTerm ? 'translateY(-2px)' : 'none' }}
                  onClick={onSubmit}
                  isLoading={isPending}
                  isDisabled={!acceptedTerm}
                >
                  CONTACT
                </Button>
              </Flex>
            </VStack>
          </Box>

          <VStack spacing={5} align="stretch" animation={appear} style={{ animationDelay: '0.14s' }}>
            {contactCards.map((item, index) => (
              <Flex
                key={index}
                bg="rgba(255,255,255,0.08)"
                border="1px solid rgba(255,255,255,0.08)"
                borderRadius="22px"
                p={6}
                align="center"
                gap={4}
                backdropFilter="blur(10px)"
                transition="transform 0.25s ease, background 0.25s ease"
                _hover={{ transform: 'translateY(-4px)', bg: 'rgba(255,255,255,0.12)' }}
              >
                <Flex
                  boxSize="52px"
                  borderRadius="full"
                  bg="rgba(133,156,217,0.24)"
                  color="#D2DEFA"
                  align="center"
                  justify="center"
                  flexShrink={0}
                  animation={glow}
                  style={{ animationDelay: `${index * 0.18}s` }}
                >
                  <Icon as={item.icon} boxSize={6} />
                </Flex>

                <Box>
                  <Text color="rgba(255,255,255,0.82)" fontSize="md">
                    {item.title}
                  </Text>
                  <Text fontSize="2xl" fontWeight="900">
                    {item.value}
                  </Text>
                </Box>
              </Flex>
            ))}
          </VStack>
        </SimpleGrid>
      </Container>
    </Box>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <FormControl>
      <FormLabel fontWeight="800" color="#111827">
        {label}
      </FormLabel>
      <Box
        sx={{
          'input, textarea, select': {
            borderRadius: '14px',
            borderColor: '#D9E2F2',
            minHeight: '48px',
            transition: 'all 0.22s ease',
            _hover: { borderColor: '#B8C7E6' },
            _focus: {
              borderColor: '#334371',
              boxShadow: '0 0 0 1px #334371, 0 10px 20px rgba(51,67,113,0.08)',
            },
          },
          textarea: {
            minHeight: '140px',
          },
        }}
      >
        {children}
      </Box>
    </FormControl>
  );
}