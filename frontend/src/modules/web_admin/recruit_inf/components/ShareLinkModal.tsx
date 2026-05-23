import {
  Box,
  Button,
  HStack,
  Image,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiCopy, FiFacebook, FiLinkedin, FiMail } from "react-icons/fi";
import { FaXTwitter, FaSkype } from "react-icons/fa6";
import { SiZalo } from "react-icons/si";
import { useState } from "react";
import { useNotify } from "../../../../components/notification/NotifyProvider";

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareLink: string;
  title?: string;
}

export default function ShareLinkModal({
  isOpen,
  onClose,
  shareLink,
  title = "Share post",
}: ShareLinkModalProps) {
  const notify = useNotify();
  const [isQrVisible, setIsQrVisible] = useState(false);

  const finalLink = shareLink; // Replace this later if a short-link API is added.

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(finalLink);
      notify({ message: "Share link copied", type: "success" });
    } catch {
      notify({
        message: "Unable to copy share link",
        description: finalLink,
        type: "warning",
      });
    }
  };

  const encodedLink = encodeURIComponent(finalLink);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodedLink}`;

  const socialLinks = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
      icon: <FiFacebook />,
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodeURIComponent("Share recruitment post")}&body=${encodedLink}`,
      icon: <FiMail />,
    },
    {
      label: "Zalo",
      href: `https://zalo.me/share?url=${encodedLink}`,
      icon: <SiZalo />,
    },
    {
      label: "Skype",
      href: `https://web.skype.com/share?url=${encodedLink}`,
      icon: <FaSkype />,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,
      icon: <FiLinkedin />,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedLink}`,
      icon: <FaXTwitter />,
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.400" />

      <ModalContent maxW="760px" w="92%" borderRadius="16px" overflow="hidden">
        <ModalHeader fontSize="2xl" fontWeight="700" pt={5} pb={2}>
          {title}
        </ModalHeader>

        <ModalCloseButton top={4} right={4} />

        <ModalBody px={5} pb={5}>
          <VStack align="stretch" spacing={5}>
            <Text fontSize="sm" color="gray.600">
              The system will generate a shareable link that you can use to post
              this recruitment listing across different channels.
            </Text>

            <Box>
              <Text fontSize="xl" fontWeight="700" mb={2.5}>
                Share link
              </Text>

              <HStack align="stretch" spacing={2.5}>
                <InputGroup size="md">
                  <Input
                    value={finalLink}
                    isReadOnly
                    bg="gray.50"
                    borderColor="gray.200"
                    pr="2.75rem"
                    fontSize="sm"
                    h="44px"
                  />

                  <InputRightElement h="44px">
                    <IconButton
                      aria-label="Copy share link"
                      icon={<FiCopy />}
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                    />
                  </InputRightElement>
                </InputGroup>

                <Button
                  minW="120px"
                  h="44px"
                  size="md"
                  variant="outline"
                  fontSize="sm"
                  fontWeight="600"
                  onClick={() => setIsQrVisible((prev) => !prev)}
                >
                  {isQrVisible ? "Hide QR" : "Get QR"}
                </Button>
              </HStack>

              {isQrVisible && (
                <VStack
                  mt={4}
                  p={4}
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="12px"
                  bg="gray.50"
                  spacing={3}
                >
                  <Image
                    src={qrImageUrl}
                    alt="QR code for recruitment post"
                    boxSize="220px"
                    borderRadius="8px"
                    bg="white"
                    p={2}
                  />

                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Scan this QR code to open the recruitment post quickly.
                  </Text>
                </VStack>
              )}
            </Box>

            <Box>
              <Text fontSize="xl" fontWeight="700" mb={3}>
                Share on social media
              </Text>

              <HStack spacing={3} flexWrap="wrap">
                {socialLinks.map((item) => (
                  <IconButton
                    as="a"
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    icon={item.icon}
                    size="md"
                    variant="outline"
                    borderRadius="10px"
                    fontSize="16px"
                  />
                ))}
              </HStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter bg="gray.50" px={5} py={3}>
          <Button colorScheme="blue" onClick={onClose} size="sm">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}