import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useLocations(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    type?: "store" | "warehouse" | "central_warehouse";
  } = {},
) {
  return useQuery({
    queryKey: ["locations", "list", params],
    queryFn: async () => {
      const res = await api.locations.list.get({
        query: {
          ...params,
          isActive: params.isActive !== undefined ? (String(params.isActive) as any) : undefined,
          page: params.page ?? 1,
          limit: params.limit ?? 10,
        },
      });
      if (res.error) throw res.error;
      return res.data;
    },
  });
}

export function useLocation(id: number) {
  return useQuery({
    queryKey: ["locations", "detail", id],
    queryFn: async () => {
      const res = await api.locations.detail.get({
        query: { id },
      });
      if (res.error) throw res.error;
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      code: string;
      name: string;
      type: "store" | "warehouse" | "central_warehouse";
      description?: string;
    }) => {
      const res = await api.locations.create.post({
        ...body,
        description: body.description ?? null,
      });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", "list"] });
      toast.success("Location created successfully");
    },
    onError: (error: any) => {
      toast.error(error.value?.message || "Failed to create location");
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      id: number;
      code?: string;
      name?: string;
      type?: "store" | "warehouse" | "central_warehouse";
      description?: string;
      isActive?: boolean;
    }) => {
      const res = await api.locations.update.put({
        ...body,
        description: body.description ?? undefined,
      });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["locations", "list"] });
      queryClient.invalidateQueries({
        queryKey: ["locations", "detail", data.data.id],
      });
      toast.success("Location updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.value?.message || "Failed to update location");
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.locations.delete.delete({ id });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", "list"] });
      toast.success("Location deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.value?.message || "Failed to delete location");
    },
  });
}

export function useToggleLocationActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.locations["toggle-active"].patch({ id });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["locations", "list"] });
      queryClient.invalidateQueries({
        queryKey: ["locations", "detail", data.data.id],
      });
      toast.success(`Location ${data.data.isActive ? "activated" : "deactivated"}`);
    },
    onError: (error: any) => {
      toast.error(error.value?.message || "Failed to toggle status");
    },
  });
}
