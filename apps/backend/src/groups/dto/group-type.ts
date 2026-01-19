export const GROUP_TYPES = ["GRADE", "STREAM", "PROGRAM", "CUSTOM"] as const;

export type GroupTypeValue = (typeof GROUP_TYPES)[number];

export const USER_MANAGED_GROUP_TYPES = [
  "STREAM",
  "PROGRAM",
  "CUSTOM",
] as const;

export type UserManagedGroupType = (typeof USER_MANAGED_GROUP_TYPES)[number];
