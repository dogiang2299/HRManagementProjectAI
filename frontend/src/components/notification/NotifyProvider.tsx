import React, { createContext, useContext } from 'react';
import { useToast, Box, HStack, Text, Icon, type ToastPosition } from '@chakra-ui/react';

import { MdCheckCircle, MdWarning, MdError, MdInfo, MdDownload } from 'react-icons/md';

export type NotifyType = 'success' | 'warning' | 'error' | 'info' | 'export';

interface NotifyOptions {
  message: string;
  description?: React.ReactNode;
  type?: NotifyType;
  placement?: ToastPosition;
  duration?: number | null;
}

type NotifyFn = (options: NotifyOptions) => void;

const iconMap: Record<NotifyType, React.ReactNode> = {
  success: <Icon as={MdCheckCircle} color="green.500" boxSize={6} />,
  warning: <Icon as={MdWarning} color="yellow.500" boxSize={6} />,
  error: <Icon as={MdError} color="red.500" boxSize={6} />,
  info: <Icon as={MdInfo} color="blue.500" boxSize={6} />,
  export: <Icon as={MdDownload} color="blue.600" boxSize={6} />,
};

const NotifyContext = createContext<NotifyFn>(() => {});

export const useNotify = () => useContext(NotifyContext);

export const NotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast();

  const notify: NotifyFn = ({
    message,
    description,
    type = 'info',
    placement = 'bottom',
    duration = 1.5,
  }) => {
    toast({
      position: placement,
      duration: duration === null ? null : duration * 1000,
      isClosable: true,

      render: () => (
        <Box
          bg="white"
          p={4}
          rounded="md"
          shadow="md"
          borderLeft="4px solid"
          borderColor={
            type === 'success'
              ? 'green.500'
              : type === 'warning'
                ? 'yellow.500'
                : type === 'error'
                  ? 'red.500'
                  : 'blue.500'
          }
        >
          <HStack align="flex-start" spacing={3}>
            {iconMap[type]}
            <Box>
              <Text fontWeight="bold">{message}</Text>
              {description && (
                <Text fontSize="sm" color="gray.600">
                  {description}
                </Text>
              )}
            </Box>
          </HStack>
        </Box>
      ),
    });
  };

  return <NotifyContext.Provider value={notify}>{children}</NotifyContext.Provider>;
};
