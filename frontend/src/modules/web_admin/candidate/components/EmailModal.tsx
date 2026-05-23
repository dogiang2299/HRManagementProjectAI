import {
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  Textarea,
  VStack,
  Input,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import LabelItem from "../../../../components/common/Label";
import { useSendEmail } from "../api/send_email";
import { useGetSettingEmails } from "../../setting/send_email/api/get";
import type { ISettingEmail } from "../../setting/send_email/types";

export type EmailRecipient = {
  candidateId: string;
  candidateName?: string | null;
  candidateEmail?: string | null;
};

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId?: string;
  candidateName?: string;
  candidateEmail?: string;
  recipients?: EmailRecipient[];
  applicationId?: string;
  recruitmentInforId?: string;
  contextLabel?: string;
  defaultSubject?: string;
  defaultBody?: string;
  onSent?: () => void;
}

const htmlEntityMap: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

const hasHtmlTag = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

const htmlToEditableText = (value?: string | null) => {
  if (!value) {
    return "";
  }

  if (!hasHtmlTag(value)) {
    return value;
  }

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/?(ul|ol)[^>]*>/gi, "\n")
    .replace(/<\/?(strong|b|em|i)[^>]*>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, (entity) => htmlEntityMap[entity] || entity)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export default function EmailModal({
  isOpen,
  onClose,
  candidateId,
  candidateName,
  candidateEmail,
  recipients,
  applicationId,
  recruitmentInforId,
  contextLabel,
  defaultSubject,
  defaultBody,
  onSent,
}: EmailModalProps) {
  const notify = useNotify();
  const [templateId, setTemplateId] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>("");

  // Fetch email templates
  const { data: templatesRes, isLoading: isLoadingTemplates } = useGetSettingEmails({
    pages: 1,
    items_per_pages: 100,
    search: "",
  });

  const resolvedRecipients = useMemo<EmailRecipient[]>(() => {
    if (recipients?.length) {
      return recipients;
    }

    if (!candidateId) {
      return [];
    }

    return [
      {
        candidateId,
        candidateName,
        candidateEmail,
      },
    ];
  }, [candidateEmail, candidateId, candidateName, recipients]);

  const recipientLabel =
    resolvedRecipients.length > 1
      ? `${resolvedRecipients.length} candidates`
      : resolvedRecipients[0]?.candidateEmail ||
        resolvedRecipients[0]?.candidateName ||
        "Email not available";

  // Send email mutation
  const sendEmailMutation = useSendEmail();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTemplateId("");
    setSubject(defaultSubject || "");
    setBody(htmlToEditableText(defaultBody));
  }, [defaultBody, defaultSubject, isOpen]);

  // Handle template selection
  const handleTemplateChange = (selectedTemplateId: string) => {
    setTemplateId(selectedTemplateId);
    if (selectedTemplateId) {
      const template = templatesRes?.data?.find(
        (t: ISettingEmail) => t.id === selectedTemplateId
      );
      if (template) {
        setSubject(template.subject || "");
        setBody(htmlToEditableText(template.body));
      }
    }
  };

  const resetForm = () => {
    setTemplateId("");
    setSubject("");
    setBody("");
  };

  const handleSendEmail = async () => {
    const validRecipients = resolvedRecipients.filter((item) => item.candidateId);

    if (validRecipients.length === 0) {
      notify({
        type: "error",
        message: "Candidate is missing",
      });
      return;
    }

    if (!subject.trim()) {
      notify({
        type: "error",
        message: "Subject is required",
      });
      return;
    }

    if (!body.trim()) {
      notify({
        type: "error",
        message: "Email body is required",
      });
      return;
    }

    const results = await Promise.allSettled(
      validRecipients.map((recipient) =>
        sendEmailMutation.mutateAsync({
          candidate_id: recipient.candidateId,
          template_id: templateId || undefined,
          subject: subject.trim(),
          body: body.trim(),
        }),
      ),
    );

    const failedResults = results.filter(
      (result) => result.status === "rejected",
    );
    const successCount = results.length - failedResults.length;

    if (failedResults.length === 0) {
      notify({
        type: "success",
        message: "Email sent successfully",
        description:
          successCount > 1
            ? `Email sent to ${successCount} candidates`
            : `Email sent to ${recipientLabel}`,
      });
      resetForm();
      onSent?.();
      onClose();
      return;
    }

    const firstError = failedResults[0] as PromiseRejectedResult | undefined;
    const error: any = firstError?.reason;
    const errorMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Unknown error occurred";

    notify({
      type: successCount > 0 ? "warning" : "error",
      message:
        successCount > 0
          ? "Some emails could not be sent"
          : "Failed to send email",
      description:
        successCount > 0
          ? `${successCount} sent, ${failedResults.length} failed. ${errorMsg}`
          : errorMsg,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="2xl">
      <ModalOverlay bg="blackAlpha.300" />
      <ModalContent
        maxH={{ base: "700px", md: "750px" }}
        borderRadius="24px"
        boxShadow="0 24px 80px rgba(15, 23, 42, 0.18)"
        overflow="hidden"
        display="flex"
        flexDirection="column"
      >
        <ModalHeader px={{ base: 5, md: 7 }} pt={6} pb={3} flexShrink={0}>
          <Text fontSize="xl" fontWeight="800" color="#1F2937">
            Email
          </Text>
          <Text fontSize="sm" color="gray.500" mt={1}>
            {contextLabel
              ? `Related to ${contextLabel}`
              : applicationId || recruitmentInforId
                ? "Related to selected application"
                : "Send and manage emails for this candidate"}
          </Text>
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody
          px={{ base: 5, md: 7 }}
          pb={5}
          flex="1"
          minH={0}
          overflowY="auto"
        >
          <VStack spacing={4} align="stretch">
            <Box>
              <LabelItem label="Email Template" />
              <Select
                placeholder="Select template (optional)"
                value={templateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                isDisabled={isLoadingTemplates}
              >
                {templatesRes?.data?.map((template: ISettingEmail) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </Select>
            </Box>

            <Box>
              <LabelItem label="Subject" required />
              <Input
                placeholder="Email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={255}
              />
            </Box>

            <Box>
              <LabelItem label="Message Body" required />
              <Textarea
                placeholder="Email message content"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                minH="150px"
                resize="none"
              />
            </Box>

            <Box p={3} bg="#f8fafc" borderRadius="12px" borderLeft="4px solid #0ea5e9">
              <Text fontSize="sm" fontWeight="600">
                Will be sent to:
              </Text>
              <VStack align="stretch" spacing={1} mt={1}>
                {resolvedRecipients.length > 0 ? (
                  resolvedRecipients.map((recipient) => (
                    <Text key={recipient.candidateId} fontSize="sm" color="gray.600">
                      {recipient.candidateName
                        ? `${recipient.candidateName}${
                            recipient.candidateEmail
                              ? ` <${recipient.candidateEmail}>`
                              : ""
                          }`
                        : recipient.candidateEmail || "Email not available"}
                    </Text>
                  ))
                ) : (
                  <Text fontSize="sm" color="gray.600">
                    Email not available
                  </Text>
                )}
              </VStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter px={{ base: 5, md: 7 }} py={4} flexShrink={0} borderTop="1px solid" borderColor="#E2E8F0">
          <HStack spacing={3} justify="flex-end">
            <Button
              variant="ghost"
              onClick={onClose}
              h="44px"
              px={5}
              borderRadius="12px"
            >
              CANCEL
            </Button>
            <Button
              bg="#334371"
              color="white"
              h="44px"
              px={5}
              borderRadius="12px"
              isLoading={sendEmailMutation.isPending}
              onClick={handleSendEmail}
              _hover={{ opacity: 0.92 }}
            >
              SEND
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
