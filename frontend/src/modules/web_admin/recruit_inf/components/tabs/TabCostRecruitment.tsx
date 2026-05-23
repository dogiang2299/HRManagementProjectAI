import { MinusIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  IconButton,
  Input,
  Select,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import theme from "../../../../../theme";
import { formatCompactMoney } from "../../../../../types";
import { Currency } from "../../types";
import SearchCombobox from "../../../../../components/common/SearchCombobox";

export interface RecruitmentCostItemForm {
  localId: string;
  cost_type: string;
  amount: string;
}

export interface RecruitmentCostFormState {
  currency: string;
  items: RecruitmentCostItemForm[];
}

interface TabRecruitmentCostProps {
  onFormChange?: (form: RecruitmentCostFormState) => void;
  initialForm?: RecruitmentCostFormState;
  initialItems?: RecruitmentCostItemForm[];
}

const createEmptyCostItem = (): RecruitmentCostItemForm => ({
  localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  cost_type: "",
  amount: "",
});

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const titleColor = useColorModeValue("#1F2937", "gray.100");
  const subtle = useColorModeValue("gray.500", "gray.400");

  return (
    <Box mb={3}>
      <Text
        fontWeight="700"
        fontSize="15px"
        color={titleColor}
        letterSpacing="0.1px"
        lineHeight="1.25"
      >
        {title}
      </Text>

      {subtitle && (
        <Text fontSize="13px" color={subtle} mt={0.5} lineHeight="1.45">
          {subtitle}
        </Text>
      )}
    </Box>
  );
}

export default function TabRecruitmentCost({
  onFormChange,
  initialForm,
  initialItems,
}: TabRecruitmentCostProps) {
  const [currency, setCurrency] = useState("VND");
  const [items, setItems] = useState<RecruitmentCostItemForm[]>([
    createEmptyCostItem(),
  ]);

  const pageBg = useColorModeValue("transparent", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("rgba(226, 232, 240, 0.75)", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const headerBg = useColorModeValue("rgba(248, 250, 252, 0.8)", "gray.900");
  const inputBg = useColorModeValue("white", "gray.800");
  const inputBorder = useColorModeValue("rgba(203, 213, 225, 0.75)", "gray.600");
  const inputHoverBorder = useColorModeValue("#94A3B8", "gray.500");
  const sectionTitleColor = useColorModeValue("#1F2937", "gray.100");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const removeHoverBg = useColorModeValue("red.50", "rgba(239,68,68,0.12)");
  const totalBg = useColorModeValue("rgba(248, 250, 252, 0.78)", "whiteAlpha.50");
  const primary = theme?.colors?.primary || "#334371";

  const commonFieldSx = {
    bg: inputBg,
    borderColor: inputBorder,
    borderRadius: "6px",
    fontSize: "14px",
    minH: "36px",
    _placeholder: {
      color: "gray.400",
      fontSize: "14px",
    },
    _hover: {
      borderColor: inputHoverBorder,
    },
    _focus: {
      borderColor: primary,
      boxShadow: "0 0 0 1px rgba(51, 67, 113, 0.25)",
    },
    _focusVisible: {
      borderColor: primary,
      boxShadow: "0 0 0 1px rgba(51, 67, 113, 0.25)",
    },
  };

  const sectionCardProps = {
    bg: cardBg,
    border: "1px solid",
    borderColor: border,
    borderRadius: "8px",
    boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
    p: { base: 3, md: 4 },
  };

  const total = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [items]
  );

  const totalCompactText = formatCompactMoney(total, currency);
  const totalFullText = `${total.toLocaleString("en-US")} ${currency}`;
  const currencyOptions = Currency.map((item) => ({
    id: item.code,
    name: `${item.flag} ${item.name} (${item.code})`,
  }));
  useEffect(() => {
    onFormChange?.({
      currency,
      items,
    });
  }, [currency, items, onFormChange]);

  useEffect(() => {
    if (initialForm) {
      setCurrency(initialForm.currency || "VND");

      if (initialForm.items?.length) {
        setItems(initialForm.items);
      } else {
        setItems([createEmptyCostItem()]);
      }

      return;
    }

    if (!initialItems) return;

    if (initialItems.length === 0) {
      setItems([createEmptyCostItem()]);
      return;
    }

    setItems(initialItems);
  }, [initialForm, initialItems]);

  const updateItem = (
    localId: string,
    field: keyof Omit<RecruitmentCostItemForm, "localId">,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.localId === localId ? { ...item, [field]: value } : item
      )
    );
  };

  const addRow = () => {
    setItems((prev) => [...prev, createEmptyCostItem()]);
  };

  const removeRow = (localId: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.localId !== localId);
      return next.length > 0 ? next : [createEmptyCostItem()];
    });
  };

  return (
    <Box bg={pageBg} minH="100%" py={0}>
      <VStack spacing={4} align="stretch">
        <Box {...sectionCardProps}>
<Flex
  align={{ base: "stretch", md: "flex-start" }}
  justify="space-between"
  gap={3}
  direction={{ base: "column", md: "row" }}
  mb={3}
>
  <SectionHeader
    title="Recruitment Costs"
    subtitle="Track additional recruitment expenses and estimate the total budget."
  />

  <Box minW={{ base: "100%", md: "180px" }}>
    <Text
      fontSize="13px"
      fontWeight="600"
      color={muted}
      mb={1}
      lineHeight="1.2"
    >
      Currency
    </Text>

    <SearchCombobox
      value={currency}
      onChange={(value) => setCurrency(value)}
      options={currencyOptions}
      placeholder="Select currency"
      size="sm"
      fontSize="sm"
    />
  </Box>
</Flex>

          <VStack spacing={3.5} align="stretch">
            <Box>
              <Text
                fontSize="15px"
                fontWeight="700"
                mb={2.5}
                color={sectionTitleColor}
                lineHeight="1.3"
              >
                Other Costs
              </Text>

              <Box
                border="1px solid"
                borderColor={border}
                borderRadius="8px"
                overflow="hidden"
              >
                <Grid
                  templateColumns="1.35fr 0.9fr 40px"
                  bg={headerBg}
                  borderBottom="1px solid"
                  borderColor={border}
                >
                  <GridItem px={3} py={2}>
                    <Text
                      fontSize="14px"
                      fontWeight="700"
                      color={sectionTitleColor}
                    >
                      Cost Item
                    </Text>
                  </GridItem>

                  <GridItem px={3} py={2}>
                    <Text
                      fontSize="14px"
                      fontWeight="700"
                      color={sectionTitleColor}
                      textAlign="right"
                    >
                      Estimated Cost ({currency})
                    </Text>
                  </GridItem>

                  <GridItem />
                </Grid>

                <VStack spacing={0} align="stretch">
                  {items.map((item, index) => (
                    <Grid
                      key={item.localId}
                      templateColumns="1.35fr 0.9fr 40px"
                      px={3}
                      py={2}
                      gap={3}
                      borderBottom={
                        index === items.length - 1 ? "none" : "1px solid"
                      }
                      borderColor={border}
                      alignItems="center"
                      _hover={{ bg: rowHoverBg }}
                      transition="background 0.15s ease"
                    >
                      <GridItem>
                        <Input
                          {...commonFieldSx}
                          h="36px"
                          placeholder="Enter cost item"
                          value={item.cost_type}
                          onChange={(e) =>
                            updateItem(item.localId, "cost_type", e.target.value)
                          }
                        />
                      </GridItem>

                      <GridItem>
                        <Input
                          {...commonFieldSx}
                          h="36px"
                          placeholder={`Enter amount in ${currency}`}
                          value={item.amount}
                          onChange={(e) => {
                            const digitsOnly = e.target.value.replace(/[^\d]/g, "");
                            updateItem(item.localId, "amount", digitsOnly);
                          }}
                          textAlign="right"
                        />
                      </GridItem>

                      <GridItem display="flex" justifyContent="center">
                        <IconButton
                          aria-label="Remove cost row"
                          icon={<MinusIcon boxSize={3} />}
                          variant="ghost"
                          color="red.500"
                          borderRadius="6px"
                          size="sm"
                          h="32px"
                          minW="32px"
                          _hover={{ bg: removeHoverBg }}
                          onClick={() => removeRow(item.localId)}
                        />
                      </GridItem>
                    </Grid>
                  ))}
                </VStack>
              </Box>

              <Button
                mt={3}
                onClick={addRow}
                bg={primary}
                color="white"
                borderRadius="6px"
                px={4}
                h="34px"
                fontSize="14px"
                fontWeight="700"
                _hover={{ opacity: 0.92 }}
                _active={{ opacity: 0.88 }}
                w="fit-content"
              >
                Add row
              </Button>
            </Box>

            <Flex
              align="center"
              justify="space-between"
              px={3}
              py={2.5}
              bg={totalBg}
              border="1px solid"
              borderColor={border}
              borderRadius="8px"
            >
              <Text fontSize="15px" fontWeight="700" color={sectionTitleColor}>
                Total
              </Text>

              <Box textAlign="right">
               

                <Text fontSize="14px" fontWeight="700" color={sectionTitleColor} mt={0.5}>
                  {totalFullText}
                </Text>
              </Box>
            </Flex>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}