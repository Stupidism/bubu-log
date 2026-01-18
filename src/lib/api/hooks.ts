import { $api } from "./client";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { components } from "./openapi-types";

// Re-export types for convenience
export type Activity = components["schemas"]["Activity"];
export type ActivityType = components["schemas"]["ActivityType"];
export type BabyProfile = components["schemas"]["BabyProfile"];
export type CreateActivityInput = components["schemas"]["CreateActivityInput"];
export type UpdateActivityInput = components["schemas"]["UpdateActivityInput"];

// Activities hooks
export function useActivities(params?: {
  limit?: number;
  type?: ActivityType;
  types?: string;
  date?: string;
}) {
  return $api.useQuery("get", "/activities", {
    params: { query: params },
  });
}

export function useLatestActivity(types: string) {
  return $api.useQuery("get", "/activities/latest", {
    params: { query: { types } },
  });
}

export function useActivity(id: string) {
  return $api.useQuery("get", "/activities/{id}", {
    params: { path: { id } },
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  
  return $api.useMutation("post", "/activities", {
    onSuccess: () => {
      // Invalidate activities queries to refetch
      queryClient.invalidateQueries({ queryKey: ["get", "/activities"] });
      queryClient.invalidateQueries({ queryKey: ["get", "/activities/latest"] });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  
  return $api.useMutation("patch", "/activities/{id}", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", "/activities"] });
      queryClient.invalidateQueries({ queryKey: ["get", "/activities/latest"] });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  
  return $api.useMutation("delete", "/activities/{id}", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", "/activities"] });
      queryClient.invalidateQueries({ queryKey: ["get", "/activities/latest"] });
    },
  });
}

// Baby profile hooks
export function useBabyProfile() {
  return $api.useQuery("get", "/baby-profile");
}

export function useUpdateBabyProfile() {
  const queryClient = useQueryClient();
  
  return $api.useMutation("patch", "/baby-profile", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", "/baby-profile"] });
    },
  });
}

// Photo upload hook
export function useUploadActivityPhoto() {
  return $api.useMutation("post", "/activities/upload-photo");
}

// Sleep state hook - tracks if baby is currently sleeping
export function useSleepState() {
  // 查询最近的 SLEEP 记录（新类型）和旧的 SLEEP_START/SLEEP_END（向后兼容）
  const sleepQuery = useLatestActivity("SLEEP,SLEEP_START,SLEEP_END");
  
  // 判断宝宝是否正在睡觉：
  // - 新类型：SLEEP 记录的 duration 为 null 表示正在睡
  // - 旧类型（向后兼容）：最近是 SLEEP_START 表示正在睡
  const isSleeping = sleepQuery.data?.type === "SLEEP" 
    ? sleepQuery.data?.duration === null 
    : sleepQuery.data?.type === "SLEEP_START";
  
  const sleepState = isSleeping ? "end" : "start";
  
  // 获取当前睡眠记录（用于更新）
  const getCurrentSleepActivity = useCallback(() => {
    if (sleepQuery.data?.type === "SLEEP" && sleepQuery.data?.duration === null) {
      return sleepQuery.data;
    }
    // 旧类型向后兼容
    if (sleepQuery.data?.type === "SLEEP_START") {
      return sleepQuery.data;
    }
    return null;
  }, [sleepQuery.data]);
  
  return {
    sleepState,
    isSleeping,
    isLoading: sleepQuery.isLoading,
    isFetching: sleepQuery.isFetching,
    getCurrentSleepActivity,
    sleepData: sleepQuery.data,
  };
}
