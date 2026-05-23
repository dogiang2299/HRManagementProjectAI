import { Box, Button, Divider, Grid, GridItem, HStack, NumberInput, NumberInputField, Radio, RadioGroup, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import SearchCombobox from "../../../../components/common/SearchCombobox";
import { getCurrencySelectOptions, getSalaryFilterConfig, getSalaryUnitLabel, type SalarySelectionCurrency } from "../utils/salaryFilter";

type SalaryFilterSectionProps = {
  selectedCurrency: SalarySelectionCurrency;
  onSelectedCurrencyChange: (value: SalarySelectionCurrency) => void;
  selectedSalaryOption: string;
  onSelectedSalaryOptionChange: (value: string) => void;
  customSalaryFrom: string;
  customSalaryTo: string;
  onCustomSalaryFromChange: (value: string) => void;
  onCustomSalaryToChange: (value: string) => void;
  onApplyCustomRange: () => void;
};

export default function SalaryFilterSection({
  selectedCurrency,
  onSelectedCurrencyChange,
  selectedSalaryOption,
  onSelectedSalaryOptionChange,
  customSalaryFrom,
  customSalaryTo,
  onCustomSalaryFromChange,
  onCustomSalaryToChange,
  onApplyCustomRange,
}: SalaryFilterSectionProps) {
  const currencyOptions = useMemo(() => getCurrencySelectOptions(), []);
  const salaryConfig = useMemo(() => getSalaryFilterConfig(selectedCurrency), [selectedCurrency]);
  const salaryUnitLabel = useMemo(() => getSalaryUnitLabel(selectedCurrency), [selectedCurrency]);

  const isCurrencyAll = selectedCurrency === "all";
  const salaryOptions = salaryConfig?.options ?? [];

  return (
    <Box w="full">
      <Text fontSize="md" fontWeight="700" color="#1E293B" mb={3}>
        Salary
      </Text>

      <VStack align="stretch" spacing={3.5}>
        <SearchCombobox
          value={selectedCurrency}
          onChange={(value) => onSelectedCurrencyChange((value || "all") as SalarySelectionCurrency)}
          options={currencyOptions}
          placeholder="All"
          size="md"
          isClearable={false}
        />

        {isCurrencyAll ? (
          <Box bg="#F8FAFC" border="1px dashed #CBD5E1" borderRadius="14px" px={3} py={3}>
            <Text fontSize="sm" color="#64748B">
              Select the currency first to display salaries.
            </Text>
          </Box>
        ) : (
          <>
            <RadioGroup
              value={selectedSalaryOption}
              onChange={(value) => onSelectedSalaryOptionChange(value)}
            >
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2.5}>
                {salaryOptions.map((item) => (
                  <Radio
                    key={item.value}
                    value={item.value}
                    colorScheme="green"
                    size="md"
                    sx={{
                      ".chakra-radio__control[data-checked]": {
                        bg: "#16A34A",
                        borderColor: "#16A34A",
                      },
                    }}
                  >
                    <Text fontSize="md" color="#334155">
                      {item.label}
                    </Text>
                  </Radio>
                ))}
              </SimpleGrid>
            </RadioGroup>

            <Box bg="#F8FAFC" border="1px solid #E2E8F0" borderRadius="14px" p={3}>
              <Text fontSize="sm" fontWeight="700" color="#334155" mb={3}>
                Manually enter salary range
              </Text>

              <Grid templateColumns="1fr auto 1fr" gap={2.5} alignItems="end">
                <GridItem>
                  <Text fontSize="sm" color="#64748B" mb={1}>
                    From
                  </Text>
                  <HStack spacing={2}>
                    <NumberInput min={0} value={customSalaryFrom} onChange={(value) => onCustomSalaryFromChange(value)} w="full">
                      <NumberInputField bg="white" borderColor="#CBD5E1" />
                    </NumberInput>
                    <Text fontSize="sm" color="#64748B" whiteSpace="nowrap">
                      {salaryUnitLabel}
                    </Text>
                  </HStack>
                </GridItem>

                <GridItem alignSelf="center" pb={2}>
                  <Text fontSize="md" color="#94A3B8" fontWeight="700">
                    -
                  </Text>
                </GridItem>

                <GridItem>
                  <Text fontSize="sm" color="#64748B" mb={1}>
                    Arrive
                  </Text>
                  <HStack spacing={2}>
                    <NumberInput min={0} value={customSalaryTo} onChange={(value) => onCustomSalaryToChange(value)} w="full">
                      <NumberInputField bg="white" borderColor="#CBD5E1" />
                    </NumberInput>
                    <Text fontSize="sm" color="#64748B" whiteSpace="nowrap">
                      {salaryUnitLabel}
                    </Text>
                  </HStack>
                </GridItem>
              </Grid>

              <Button
                mt={3.5}
                w="full"
                h="40px"
                borderRadius="12px"
                bg="#16A34A"
                color="white"
                _hover={{ bg: "#15803D" }}
                onClick={onApplyCustomRange}
              >
                Apply
              </Button>
            </Box>
          </>
        )}
      </VStack>

      <Divider borderColor="#E2E8F0" mt={4} />
    </Box>
  );
}
