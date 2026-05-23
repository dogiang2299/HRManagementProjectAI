export const BUSSINESS_TYPE = {
  LLC_ONE_MEMBER: 'LLC_ONE_MEMBER',
  LLC_MULTI_MEMBER: 'LLC_MULTI_MEMBER',
  JOINT_STOCK: 'JOINT_STOCK',
  PRIVATE: 'PRIVATE',
  PARTNERSHIP: 'PARTNERSHIP',
  HOUSEHOLD: 'HOUSEHOLD',
  STATE: 'STATE',
  FDI: 'FDI',
} as const;

export const BUSINESS_TYPE_OPTIONS = [
  { value: BUSSINESS_TYPE.LLC_ONE_MEMBER, label: 'Single-Member LLC' },
  { value: BUSSINESS_TYPE.LLC_MULTI_MEMBER, label: 'Multi-Member LLC' },
  { value: BUSSINESS_TYPE.JOINT_STOCK, label: 'Joint Stock Company' },
  { value: BUSSINESS_TYPE.PRIVATE, label: 'Private Enterprise' },
  { value: BUSSINESS_TYPE.PARTNERSHIP, label: 'Partnership Company' },
  { value: BUSSINESS_TYPE.HOUSEHOLD, label: 'Household Business' },
  { value: BUSSINESS_TYPE.STATE, label: 'State-Owned Enterprise' },
  { value: BUSSINESS_TYPE.FDI, label: 'Foreign-Invested Company' },
];

export const BUSINESS_TYPE_LABEL_MAP: Record<keyof typeof BUSSINESS_TYPE, string> = {
  LLC_ONE_MEMBER: 'Single-Member LLC',
  LLC_MULTI_MEMBER: 'Multi-Member LLC',
  JOINT_STOCK: 'Joint Stock Company',
  PRIVATE: 'Private Enterprise',
  PARTNERSHIP: 'Partnership Company',
  HOUSEHOLD: 'Household Business',
  STATE: 'State-Owned Enterprise',
  FDI: 'Foreign-Invested Company',
};

export const getBusinessTypeLabel = (value?: string | null) => {
  if (!value) return '--';

  const key = value as keyof typeof BUSSINESS_TYPE;
  return BUSINESS_TYPE_LABEL_MAP[key] ?? value;
};