import {
  Box,
  Input,
  List,
  ListItem,
  Spinner,
} from '@chakra-ui/react';
import { useRef, useState, useMemo, useEffect } from 'react';
import { ChevronDownIcon, CloseIcon } from '@chakra-ui/icons';

export default function SearchCombobox({
  value,
  onChange,
  options,
  placeholder = 'Select account...',
  isDisabled,
  isAsync = false,
  onSearchChange,
  onLoadMore,
  isLoading,
  hasNextPage,
  zIndex = 2000,
  isClearable = true,
  size = 'sm',
  inputHeight,
  fontSize = 'sm',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id?: string; name?: string }[];
  placeholder?: string;
  isDisabled?: boolean;
  isAsync?: boolean;
  onSearchChange?: (keyword: string) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasNextPage?: boolean;
  zIndex?: any;
  isClearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  inputHeight?: string | number;
  fontSize?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAsync && onSearchChange && open) {
      const handler = setTimeout(() => {
        onSearchChange(search);
      }, 300);

      return () => clearTimeout(handler);
    }
  }, [search, isAsync, onSearchChange, open]);

  useEffect(() => {
    if (!open) return;

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (ref.current && !ref.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, [open]);

  const selected = options.find((a) => a?.id === value);

  const displayOptions = useMemo(() => {
    if (isAsync) return options;
    return options.filter((acc) => (acc?.name ?? '').toLowerCase().includes(search.toLowerCase()));
  }, [options, search, isAsync]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isAsync || !onLoadMore || !hasNextPage || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 5) {
      onLoadMore();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value !== '') {
      onChange('');
    }
    setSearch('');
    if (isAsync && onSearchChange) {
      onSearchChange('');
    }
  };

  const showClearButton = value && !isDisabled && isClearable;
  const textSize = fontSize;
  const dropdownZIndex = typeof zIndex === 'number' ? zIndex + 1 : zIndex;
  const resolvedHeight =
    inputHeight ?? (size === 'lg' ? '48px' : size === 'md' ? '40px' : '32px');

  return (
    <Box position="relative" ref={ref} zIndex={open ? zIndex : 'auto'}>
      <Input
        isDisabled={isDisabled}
        placeholder={placeholder}
        size={size}
        h={resolvedHeight}
        pr="38px"
        value={open ? search : selected?.name || (value ? 'Loading...' : '')}
        onChange={(e) => {
          setSearch(e.target.value);
          if (!open) setOpen(true);
        }}
        onClick={() => setOpen(true)}
        fontSize={textSize}
        autoComplete="off"
        fontWeight="semibold"
      />

      <Box
        position="absolute"
        right="10px"
        top="50%"
        transform="translateY(-50%)"
        zIndex={1}
        cursor={showClearButton && !isLoading ? 'pointer' : 'default'}
        onClick={showClearButton && !isLoading ? handleClear : undefined}
      >
        {isLoading ? (
          <Spinner size="xs" color="blue.500" />
        ) : showClearButton ? (
          <CloseIcon
            color="gray.400"
            w={3}
            h={3}
            _hover={{ color: 'red.500' }}
          />
        ) : (
          <ChevronDownIcon boxSize="20px" color="gray.400" />
        )}
      </Box>

      {open && (
        <Box
          position="absolute"
          top="108%"
          left={0}
          right={0}
          bg="white"
          shadow="md"
          border="1px solid #e5e5e5"
          borderRadius="md"
          zIndex={dropdownZIndex}
          maxH="180px"
          overflowY="auto"
          ref={listRef}
          onScroll={handleScroll}
        >
          <List>
            {displayOptions.length > 0 ? (
              <>
                {displayOptions.map((a) => (
                  <ListItem
                    key={a?.id}
                    px={3}
                    py={2}
                    fontSize={textSize}
                    cursor="pointer"
                    _hover={{ bg: 'gray.100' }}
                    bg={a?.id === value ? 'blue.50' : 'white'}
                    onClick={() => {
                      const nextValue = a?.id || '';
                      if (nextValue !== value) {
                        onChange(nextValue);
                      }
                      setSearch('');
                      setOpen(false);
                    }}
                    fontWeight="semibold"
                  >
                    {a?.name}
                  </ListItem>
                ))}
                {isLoading && hasNextPage && (
                  <ListItem px={3} py={2} textAlign="center">
                    <Spinner size="xs" />
                  </ListItem>
                )}
              </>
            ) : (
              <ListItem px={3} py={2} color="gray.500" textAlign="center" fontSize={textSize}>
                {isLoading ? 'Loading...' : 'No results'}
              </ListItem>
            )}
          </List>
        </Box>
      )}
    </Box>
  );
}
