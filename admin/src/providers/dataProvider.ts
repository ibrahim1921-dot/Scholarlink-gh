import type { DataProvider } from "@refinedev/core";
import axios from "axios";
import { API_URL } from "./authProvider";

const axiosInstance = axios.create();

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("scholarlink_admin_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export const dataProvider = (): DataProvider => ({
  getList: async ({ resource, pagination, filters }) => {
    const { current = 1, pageSize = 10 } = pagination ?? {};
    
    // Convert to Spring Boot zero-indexed pages
    const page = current - 1;
    const size = pageSize;
    
    // Extract search query and other filters
    let search = "";
    const filterParams: Record<string, string> = {};
    if (filters && filters.length > 0) {
      filters.forEach((f: any) => {
        if (f.field === "q" || f.field === "search") {
          search = f.value;
        } else {
          filterParams[f.field] = f.value;
        }
      });
    }

    let url = `${API_URL}/admin/${resource}`;
    if (resource === "jobs") {
      url = `${API_URL}/jobs/admin/all`;
    } else if (resource === "scholarships") {
      url = `${API_URL}/scholarships/admin/all`;
    } else if (resource === "pending-scholarships") {
      url = `${API_URL}/scholarships/admin/pending`;
    } else if (resource === "suspicious-documents") {
      url = `${API_URL}/documents/admin/suspicious`;
    } else if (resource === "scholarship-applications") {
      url = `${API_URL}/admin/applications/scholarship-applications`;
    } else if (resource === "admin-documents") {
      url = `${API_URL}/documents/admin/documents`;
    }

    const response = await axiosInstance.get(url, {
      params: {
        page,
        size,
        ...(search ? { search } : {}),
        ...filterParams,
      },
    });

    const isArray = Array.isArray(response.data);
    return {
      data: isArray ? response.data : response.data.content,
      total: isArray ? response.data.length : response.data.totalElements,
    };
  },
  
  getOne: async ({ resource, id }) => {
    let url = `${API_URL}/admin/${resource}/${id}`;
    if (resource === "jobs") {
      url = `${API_URL}/jobs/${id}`;
    } else if (resource === "scholarships") {
      url = `${API_URL}/scholarships/${id}`;
    }
    const response = await axiosInstance.get(url);
    return { data: response.data };
  },
  
  create: async ({ resource, variables }) => {
    let url = `${API_URL}/admin/${resource}`;
    if (resource === "jobs") {
      url = `${API_URL}/jobs`;
    } else if (resource === "scholarships") {
      url = `${API_URL}/scholarships`;
    }
    const response = await axiosInstance.post(url, variables);
    return { data: response.data };
  },
  
  update: async ({ resource, id, variables }) => {
    let url = `${API_URL}/admin/${resource}/${id}`;
    if (resource === "jobs") {
      url = `${API_URL}/jobs/${id}`;
    } else if (resource === "scholarships") {
      url = `${API_URL}/scholarships/${id}`;
    }
    const response = await axiosInstance.put(url, variables);
    return { data: response.data };
  },
  
  deleteOne: async ({ resource, id }) => {
    let url = `${API_URL}/admin/${resource}/${id}`;
    if (resource === "jobs") {
      url = `${API_URL}/jobs/${id}`;
    } else if (resource === "scholarships") {
      url = `${API_URL}/scholarships/${id}`;
    }
    const response = await axiosInstance.delete(url);
    return { data: response.data };
  },
  
  custom: async ({ url, method, payload, query, headers }) => {
    const response = await axiosInstance.request({
      url: `${API_URL}${url}`,
      method,
      data: payload,
      params: query,
      headers
    });
    return { data: response.data };
  },

  getApiUrl: () => API_URL,
});
