import type { AuthProvider } from "@refinedev/core";
import axios from "axios";

export const API_URL = "http://localhost:8080/api/v1";

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.accessToken) {
        // Decode the token locally to check role (a basic base64 payload decode)
        const token = response.data.accessToken;


        // Expect something like payload.roles or payload.role depending on backend
        // Actually, the simplest check is to fetch the user profile if role isn't in token.
        // Let's store token first and test role by hitting an admin endpoint
        localStorage.setItem("scholarlink_admin_token", token);
        
        try {
            // Verify admin access by hitting a simple admin endpoint
            await axios.get(`${API_URL}/admin/users?page=0&size=1`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // If it succeeds, user is admin
            return {
                success: true,
                redirectTo: "/",
            };
        } catch (adminErr) {
            localStorage.removeItem("scholarlink_admin_token");
            return {
                success: false,
                error: {
                    name: "Access Denied",
                    message: "You must be an administrator to access this dashboard.",
                },
            };
        }
      }
      
      return {
        success: false,
        error: {
          name: "LoginError",
          message: "Invalid email or password",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          name: "LoginError",
          message: error.response?.data?.message || "Login failed",
        },
      };
    }
  },
  logout: async () => {
    localStorage.removeItem("scholarlink_admin_token");
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: async () => {
    const token = localStorage.getItem("scholarlink_admin_token");
    if (token) {
      return {
        authenticated: true,
      };
    }
    return {
      authenticated: false,
      redirectTo: "/login",
    };
  },
  getPermissions: async () => null,
  getIdentity: async () => {
    const token = localStorage.getItem("scholarlink_admin_token");
    if (token) {
      try {
        const payloadStr = atob(token.split('.')[1]);
        const payload = JSON.parse(payloadStr);
        return {
          id: payload.sub,
          name: payload.sub,
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  },
  onError: async (error) => {
    console.error(error);
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        logout: true,
      };
    }
    return { error };
  },
};
