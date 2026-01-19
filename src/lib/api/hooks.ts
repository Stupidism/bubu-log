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

export function useBatchDeleteActivities() {
  const queryClient = useQueryClient();
  
  return $api.useMutation("delete", "/activities", {
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
  const sleepQuery = useLatestActivity("SLEEP");
  
  // 宝宝正在睡觉：SLEEP 记录的 duration 为 null
  const isSleeping = sleepQuery.data?.type === "SLEEP" && sleepQuery.data?.duration === null;
  const sleepState = isSleeping ? "end" : "start";
  
  // 获取当前睡眠记录（用于更新）
  const getCurrentSleepActivity = useCallback(() => {
    if (sleepQuery.data?.type === "SLEEP" && sleepQuery.data?.duration === null) {
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
