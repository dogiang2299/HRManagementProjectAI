import { Currency, type CurrencyValue } from "../../../web_admin/recruit_inf/types";
import type { IRecruitmentInfor } from "../types/job";

export type SalarySelectionCurrency = "all" | CurrencyValue;

export type SalaryFilterOption = {
  value: string;
  label: string;
  min?: number | null;
  max?: number | null;
  isNegotiable?: boolean;
};

type SalaryFilterConfig = {
  displayUnit: string;
  options: SalaryFilterOption[];
};

const VND_MILLION = 1_000_000;

const BASE_FOREIGN_OPTIONS: SalaryFilterOption[] = [
  { value: "all", label: "All" },
  { value: "negotiable", label: "Agree", isNegotiable: true },
  { value: "under_500", label: "Under 500", max: 500 },
  { value: "500_1000", label: "500 - 1000", min: 500, max: 1000 },
  { value: "1000_1500", label: "1000 - 1500", min: 1000, max: 1500 },
  { value: "1500_2000", label: "1500 - 2000", min: 1500, max: 2000 },
  { value: "2000_3000", label: "2000 - 3000", min: 2000, max: 3000 },
  { value: "3000_5000", label: "3000 - 5000", min: 3000, max: 5000 },
  { value: "above_5000", label: "Over 5000", min: 5000 },
];

export const salaryFilterOptionsByCurrency: Record<CurrencyValue, SalaryFilterConfig> = {
  VND: {
    displayUnit: "million",
    options: [
      { value: "all", label: "All" },
      { value: "negotiable", label: "Agree", isNegotiable: true },
      { value: "under_10m", label: "Under 10 million", max: 10_000_000 },
      { value: "10_15m", label: "10 - 15 million", min: 10_000_000, max: 15_000_000 },
      { value: "15_20m", label: "15 - 20 million", min: 15_000_000, max: 20_000_000 },
      { value: "20_25m", label: "20 - 25 million", min: 20_000_000, max: 25_000_000 },
      { value: "25_30m", label: "25 - 30 million", min: 25_000_000, max: 30_000_000 },
      { value: "30_50m", label: "30 - 50 million", min: 30_000_000, max: 50_000_000 },
      { value: "above_50m", label: "Over 50 million", min: 50_000_000 },
    ],
  },
  USD: {
    displayUnit: "USD",
    options: BASE_FOREIGN_OPTIONS,
  },
  EUR: {
    displayUnit: "EUR",
    options: BASE_FOREIGN_OPTIONS,
  },
  JPY: {
    displayUnit: "JPY",
    options: BASE_FOREIGN_OPTIONS,
  },
  KRW: {
    displayUnit: "KRW",
    options: BASE_FOREIGN_OPTIONS,
  },
  CNY: {
    displayUnit: "CNY",
    options: BASE_FOREIGN_OPTIONS,
  },
  SGD: {
    displayUnit: "SGD",
    options: BASE_FOREIGN_OPTIONS,
  },
  THB: {
    displayUnit: "THB",
    options: BASE_FOREIGN_OPTIONS,
  },
};

const normalizeCurrency = (currency?: string | null) => (currency || "").trim().toUpperCase();

const buildForeignConfig = (currency: string): SalaryFilterConfig => ({
  displayUnit: currency,
  options: BASE_FOREIGN_OPTIONS,
});

export const getCurrencySelectOptions = () => [
  { id: "all", name: "All" },
  ...Currency.map((item) => ({
    id: item.code,
    name: `${item.flag} ${item.name} (${item.code})`,
  })),
];

export const getSalaryFilterConfig = (currency?: string | null) => {
  const normalized = normalizeCurrency(currency);
  if (!normalized || normalized === "ALL") return null;

  return salaryFilterOptionsByCurrency[normalized as CurrencyValue] ?? buildForeignConfig(normalized);
};

export const getSalaryUnitLabel = (currency?: string | null) => {
  const config = getSalaryFilterConfig(currency);
  return config?.displayUnit || "";
};

export const convertCustomSalaryInputToRaw = (value: string, currency?: string | null) => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const numericValue = Number(trimmed);
  if (!Number.isFinite(numericValue) || numericValue < 0) return null;

  return normalizeCurrency(currency) === "VND"
    ? Math.round(numericValue * VND_MILLION)
    : Math.round(numericValue);
};

const overlapRange = (
  jobMin: number | null,
  jobMax: number | null,
  selectedMin: number | null,
  selectedMax: number | null,
) => {
  if (selectedMin === null && selectedMax === null) return true;

  if (selectedMax !== null && jobMin !== null && jobMin > selectedMax) return false;
  if (selectedMin !== null && jobMax !== null && jobMax < selectedMin) return false;

  return true;
};

const getOptionByValue = (currency: string, value: string) => {
  const config = getSalaryFilterConfig(currency);
  return config?.options.find((item) => item.value === value) || null;
};

export const doesJobMatchSalaryFilter = (
  job: IRecruitmentInfor,
  params: {
    selectedCurrency: SalarySelectionCurrency;
    selectedSalaryOption: string;
    appliedCustomSalaryFrom: string;
    appliedCustomSalaryTo: string;
  },
) => {
  const { selectedCurrency, selectedSalaryOption, appliedCustomSalaryFrom, appliedCustomSalaryTo } = params;

  if (selectedCurrency === "all") return true;

  const jobCurrency = normalizeCurrency(job.salary_currency);
  if (jobCurrency !== normalizeCurrency(selectedCurrency)) return false;

  if (selectedSalaryOption === "all") return true;

  if (selectedSalaryOption === "negotiable") {
    return Boolean(job.is_salary_negotiable);
  }

  if (job.is_salary_negotiable) return false;

  const configOption = getOptionByValue(selectedCurrency, selectedSalaryOption);
  const selectedMin =
    selectedSalaryOption === "custom"
      ? convertCustomSalaryInputToRaw(appliedCustomSalaryFrom, selectedCurrency)
      : configOption?.min ?? null;
  const selectedMax =
    selectedSalaryOption === "custom"
      ? convertCustomSalaryInputToRaw(appliedCustomSalaryTo, selectedCurrency)
      : configOption?.max ?? null;

  if (selectedSalaryOption === "custom" && selectedMin === null && selectedMax === null) {
    return false;
  }

  const jobMin = job.salary_from ?? null;
  const jobMax = job.salary_to ?? null;

  return overlapRange(jobMin, jobMax, selectedMin, selectedMax);
};
