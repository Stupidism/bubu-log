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

// Custom hook for managing paired activity states
export function usePairedActivityStates() {
  const sleepQuery = useLatestActivity("SLEEP_START,SLEEP_END");
  const breastfeedQuery = useLatestActivity("BREASTFEED_START,BREASTFEED_END");
  const bottleQuery = useLatestActivity("BOTTLE_START,BOTTLE_END");
  
  const isLoading = sleepQuery.isLoading || breastfeedQuery.isLoading || bottleQuery.isLoading;
  
  const pairedState = {
    sleep: sleepQuery.data?.type === "SLEEP_START" ? "end" : "start",
    breastfeed: breastfeedQuery.data?.type === "BREASTFEED_START" ? "end" : "start",
    bottle: bottleQuery.data?.type === "BOTTLE_START" ? "end" : "start",
  } as const;
  
  // Get the start activity for a paired end activity
  const getStartActivity = useCallback((type: "sleep" | "breastfeed" | "bottle") => {
    switch (type) {
      case "sleep":
        return sleepQuery.data?.type === "SLEEP_START" ? sleepQuery.data : null;
      case "breastfeed":
        return breastfeedQuery.data?.type === "BREASTFEED_START" ? breastfeedQuery.data : null;
      case "bottle":
        return bottleQuery.data?.type === "BOTTLE_START" ? bottleQuery.data : null;
    }
  }, [sleepQuery.data, breastfeedQuery.data, bottleQuery.data]);
  
  return {
    pairedState,
    isLoading,
    getStartActivity,
    sleepData: sleepQuery.data,
    breastfeedData: breastfeedQuery.data,
    bottleData: bottleQuery.data,
  };
}

