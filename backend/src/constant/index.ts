export const APPLICATION_STATUS = {
  APPLIED: 'Applied',
  CONTACTED: 'Contacted',
  INTERVIEWING: 'Interviewing',
  WAITING_RESPONSE: 'Waiting Response',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  CLOSED: 'Closed',
} as const;

// TYPE KIỂM TRA: dành riêng cho DEV, nếu viết sai chuỗi thì báo đỏ khi code

// Dùng để kiểm tra kiểu dữ liệu ở compile time.
export type ApplicationStatusType =
  (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

// MẢNG VALIDATE: Dùng để validate dữ liệu ở runtime.
export const APPLICATION_STATUS_VALUES = Object.values(APPLICATION_STATUS);

export const APPLICATION_STATUS_ORDER = [
  APPLICATION_STATUS.APPLIED,
  APPLICATION_STATUS.CONTACTED,
  APPLICATION_STATUS.INTERVIEWING,
  APPLICATION_STATUS.WAITING_RESPONSE,
  APPLICATION_STATUS.ACCEPTED,
  APPLICATION_STATUS.REJECTED,
  APPLICATION_STATUS.CLOSED,
] as const;

// nơi chứa các giá trị cố định
export const JOB_STATUS = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
} as const;

export type JobStatusType = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const JOB_STATUS_VALUES = Object.values(JOB_STATUS);

export const POSITION_POST_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
} as const;

export type PositionPostStatusType =
  (typeof POSITION_POST_STATUS)[keyof typeof POSITION_POST_STATUS];

export const POSITION_POST_STATUS_VALUES = Object.values(POSITION_POST_STATUS);

export const RANK_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
} as const;

export type RankStatusType = (typeof RANK_STATUS)[keyof typeof RANK_STATUS];

export const RANK_STATUS_VALUES = Object.values(RANK_STATUS);

export const NOTIFICATION_TYPE = {
  SYSTEM: 'SYSTEM',
  NEW_APPLICATION: 'NEW_APPLICATION',
  APPLICATION_STATUS: 'APPLICATION_STATUS',
  APPLICATION_REMINDER: 'APPLICATION_REMINDER',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  JOB_RECOMMENDATION: 'JOB_RECOMMENDATION',
  JOB_DEADLINE: 'JOB_DEADLINE',
} as const;

export const NOTIFICATION_RELATED_TYPE = {
  RECRUITMENT_INFOR: 'RECRUITMENT_INFOR',
  APPLICATION: 'APPLICATION',
  CHAT_CONVERSATION: 'CHAT_CONVERSATION',
  SYSTEM: 'SYSTEM',
  CANDIDATE: 'CANDIDATE',
} as const;

export const NOTIFICATION_RECEIVER_ROLE = {
  CANDIDATE: 'CANDIDATE',
  EMPLOYER: 'EMPLOYER',
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export type NotificationReceiverRole =
  (typeof NOTIFICATION_RECEIVER_ROLE)[keyof typeof NOTIFICATION_RECEIVER_ROLE];

export type NotificationRelatedType =
  (typeof NOTIFICATION_RELATED_TYPE)[keyof typeof NOTIFICATION_RELATED_TYPE];
