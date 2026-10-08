import { Gender } from "@/types/models";

export const genderOptions = [
  { value: Gender.Female, label: "Nữ" },
  { value: Gender.Male, label: "Nam" },
  { value: Gender.Other, label: "Khác" },
] as const;
