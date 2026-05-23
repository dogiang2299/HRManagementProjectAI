import React, { useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { Box, Center, Flex, Text, VStack } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { BASE_URL, URL_API_CANDIDATE } from "../../../../constant/config";
import apiClient from "../../../../lib/api";

type CandidateCvTabProps = {
  candidateId: string;
  cvFile?: string | null;
  cvUrl?: string | null;
  previewLabel?: string;
  onUploaded?: () => void | Promise<unknown>;
  maxMb?: number; // default 5
  acceptExt?: string[]; // default ["pdf","doc","docx"]
};
export type CandidateCvTabHandle = {
  pickFile: () => void;
};
const CandidateCvTab = forwardRef<CandidateCvTabHandle, CandidateCvTabProps>(
({ candidateId, cvFile, cvUrl: cvUrlProp, previewLabel, onUploaded, maxMb = 5, acceptExt = ["pdf","doc","docx"] }, ref) => {

  const inputRef = useRef<HTMLInputElement | null>(null);
  const notify = useNotify();
  const queryClient = useQueryClient();

  const pickFile = () => inputRef.current?.click();

  useImperativeHandle(ref, () => ({
    pickFile,
  }));
  const hasCv = !!(cvUrlProp || cvFile);

  const resolvedCvUrl = useMemo(() => {
    if (cvUrlProp) {
      if (/^(https?:)?\/\//i.test(cvUrlProp) || cvUrlProp.startsWith("data:")) {
        return cvUrlProp;
      }
      if (cvUrlProp.startsWith("/uploads/")) {
        return `${BASE_URL}${cvUrlProp}`;
      }
      return `${BASE_URL}/uploads/cv/${cvUrlProp}`;
    }

    if (!cvFile) return "";
    return `${BASE_URL}/uploads/cv/${cvFile}`;
  }, [cvFile, cvUrlProp]);


  const onChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !acceptExt.includes(ext)) {
    notify({
        type: "warning",
        message: "Invalid file",
        description: `Receive only ${acceptExt.map((x) => x.toUpperCase()).join("/")}`,
    });

    e.target.value = "";
    return;
    }
    if (f.size > maxMb * 1024 * 1024) {
      notify({
        type: "warning",
        message: "Deleted",
        description: `File maximum ${maxMb}MB`,
    });

      e.target.value = "";
      return;
    }

    // auto upload luôn cho đúng "1 nút"
    void upload(f);
    e.target.value = "";
  };

  const upload = async (file: File) => {
    try {
      const form = new FormData();
      form.append("cv", file);

      if (!hasCv) {
        form.append("candidate_id", candidateId);
        await apiClient.post(`${URL_API_CANDIDATE}/upload-cv`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await apiClient.put(`${URL_API_CANDIDATE}/${candidateId}/cv`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      queryClient.invalidateQueries({ queryKey: ["candidate-audit-logs", candidateId] });
      await onUploaded?.();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Upload failed");
    }
  };

  return (
    <Box p={4} >
      {/* ONLY ONE BUTTON - TOP RIGHT */}
      <Flex justify="flex-end" mb={-3}>
        <input
          ref={inputRef}
          type="file"
          accept={acceptExt.map((x) => `.${x}`).join(",")}
          style={{ display: "none" }}
          onChange={onChangeFile}
        />
       
      </Flex>

      {/* PREVIEW ONLY */}
      {hasCv ? (
        <VStack align="stretch" spacing={3}>
          <Text fontSize="sm" fontWeight="700" color="#243B53">
            {previewLabel || "CV Preview"}
          </Text>
        <Box
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          h="580px"
          overflow="hidden"
          bg="gray.50"
        >
          <iframe
            title="CV Preview"
            src={resolvedCvUrl}
            style={{ width: "100%", height: "100%", border: 0 }}
          />
        </Box>
        </VStack>
      ) : (
        <Center
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          h="500px"
          bg="gray.50"
        >
          <VStack spacing={2}>
            <Text fontWeight="600">No CV yet</Text>
            <Text fontSize="sm" color="gray.600">
              Click "Upload new CV" to upload.
            </Text>
          </VStack>
        </Center>
      )}
    </Box>
  );
}
)
export default CandidateCvTab;
