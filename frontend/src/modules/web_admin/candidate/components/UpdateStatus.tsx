import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  RadioGroup,
  VStack,
  Radio,
  ModalFooter,
  HStack,
  Button,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { APPLICATION_STATUS_STEPS } from "../../../../constant";
export type UpdateStatusProps = {
  isOpen: boolean;
  onClose: () => void;
  currentStatus?: string;
  onUpdate: (newStatus: string) => void | Promise<unknown>;
  isLoading?: boolean;
};

const UpdateStatus = ({
  isOpen,
  onClose,
  currentStatus,
  onUpdate,
  isLoading = false,
}: UpdateStatusProps) => {
  const normalizedCurrentStatus = (currentStatus || "").trim().toLowerCase();
  const defaultStatus =
    APPLICATION_STATUS_STEPS.find((step) => step.value.toLowerCase() === normalizedCurrentStatus)?.value ||
    APPLICATION_STATUS_STEPS[0].value;

  const [selectedStatus, setSelectedStatus] = useState<string>(defaultStatus);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedStatus(defaultStatus);
  }, [isOpen, defaultStatus]);

  const handleSubmitStatus = async () => {
    await onUpdate(selectedStatus);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay bg="blackAlpha.300" />
      <ModalContent>
        <ModalHeader textAlign="center">UPDATE STATUS</ModalHeader>
        <ModalBody>
          <RadioGroup value={selectedStatus} onChange={setSelectedStatus}>
            <VStack align="stretch" spacing={3}>
              {APPLICATION_STATUS_STEPS.map((step) => (
                <Radio
                  key={step.value}
                  value={step.value}
                  sx={{
                    ".chakra-radio__control": {
                      borderColor: "gray.400",
                      _hover: { borderColor: "#334371" },
                      _checked: {
                        bg: "#334371",
                        borderColor: "#334371",
                      },
                      _focusVisible: {
                        boxShadow: "0 0 0 3px rgba(51, 67, 113, 0.25)",
                      },
                    },
                  }}
                >
                  {step.label}
                </Radio>
              ))}
            </VStack>
          </RadioGroup>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={2}>
            <Button variant="ghost" onClick={onClose}>
              CANCEL
            </Button>
            <Button
              background="#334371"
              color="white"
              onClick={handleSubmitStatus}
              isLoading={isLoading}
            >
              SAVE
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UpdateStatus;