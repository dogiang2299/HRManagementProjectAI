  import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    Button,
    Heading,
    Text,
  } from "@chakra-ui/react";
  import React from "react";

  interface ModalConfirmProps {
    ComponentElement?: React.ComponentType;
    title?: string;
    titleButton?: string;
    cancelButtonText?: string;
    message?: string;
    open: boolean;
    setOpen: (open: boolean) => void;
    onClick?: () => void;
    showCancelButton?: boolean;
    confirmButtonProps?: React.ComponentProps<typeof Button>;
    cancelButtonProps?: React.ComponentProps<typeof Button>;
    children?: React.ReactNode;
  }

  export function ModalConfirm({
    ComponentElement,
    title,
    message,
    open,
    setOpen,
    onClick,
    titleButton = "OK",
    cancelButtonText = "Cancel",
    showCancelButton = true,
    confirmButtonProps,
    cancelButtonProps,
    children,
  }: ModalConfirmProps) {
    const handleClose = () => setOpen(false);

    const handleConfirm = () => {
      onClick?.();
    };

    return (
      <>
        {ComponentElement && <ComponentElement />}

        <Modal isOpen={open} onClose={handleClose} isCentered>
          <ModalOverlay />
          <ModalContent
            borderRadius="md"
            padding="0"
            width={{ base: "90%", md: "550px" }}
            maxW="lg"
          >
            <ModalHeader p={0}>
              <ModalCloseButton right="16px" top="16px" size="lg" />
            </ModalHeader>

            <ModalBody
              padding="24px 32px 16px 32px"
              textAlign="left"
              pt={title ? "16px" : "24px"}
            >
              <Heading fontSize="xl" fontWeight="500" mb={title ? 2 : 0}>
                {title || "Are you sure?"}
              </Heading>

              {children ? (
                children
              ) : (
                <Text fontSize="md" color="#595959" mt={2}>
                  {message || "This action cannot be undone."}
                </Text>
              )}
            </ModalBody>

            <ModalFooter
              padding="16px 32px 24px 32px"
              justifyContent="flex-end"
              gap={4}
            >
              {showCancelButton && (
                <Button
                  background="#e0e0e0"
                  color="#09090b"
                  borderRadius="md"
                  fontWeight="600"
                  height="40px"
                  minWidth="120px"
                  _hover={{ background: "#d5d5d5" }}
                  onClick={handleClose}
                  {...cancelButtonProps}
                >
                  {cancelButtonText}
                </Button>
              )}

              <Button
                background="#8B0000"
                color="white"
                fontWeight="700"
                borderRadius="md"
                height="40px"
                minWidth="120px"
                _hover={{ background: "#a00000" }}
                onClick={handleConfirm}
                {...confirmButtonProps}
              >
                {titleButton}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  }
