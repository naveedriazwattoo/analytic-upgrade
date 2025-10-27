import axios, { AxiosInstance } from "axios";
import { useQuery, useMutation, UseMutationResult, UseQueryResult } from "react-query";
import { useDispatch } from "react-redux";
import { setToken } from "store/slices";
import { ApiClient } from "type/clientType";

const useApiClient = (): ApiClient => {
  const token = import.meta.env.VITE_REACT_APPLICATION_KRESUS_TOKEN;
  const dispatch = useDispatch();

  const axiosClient: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_REACT_APPLICATION_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "X-API-KEY": import.meta.env.VITE_REACT_APPLICATION_KRESUS_TOKEN,
      "Content-Type": "application/json",
      accept: "application/json",
    },
  });

  let isSessionExpired = false;

  // Token Expiry Interceptor
  axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (
        error.response &&
        (error.response.status === 401 || error.response.status === 403)
      ) {
        if (!isSessionExpired) {
          isSessionExpired = true;
          dispatch(setToken(""));
        }
        return Promise.reject(new Error("Session Expired"));
      }
      return Promise.reject(error);
    }
  );

  // -----------------------------------
  // ✅ React Query GET Hook
  // -----------------------------------`
  const useGetRequest = <T>(
    url: string,
    key?: string,
    options: object = {}
  ): UseQueryResult<T, any> => {
    return useQuery<T>(
      [key ?? url],
      async () => {
        const { data } = await axiosClient.get<T>(url);
        return data;
      },
      options
    );
  };

  // -----------------------------------
  // ✅ React Query POST Hook
  // -----------------------------------
  const usePostRequest = <T, P = any>(
    url: string,
    options: object = {}
  ): UseMutationResult<T, any, P> => {
    return useMutation<T, any, P>(
      async (payload: P) => {
        const { data } = await axiosClient.post<T>(url, payload);
        return data;
      },
      options
    );
  };

  // -----------------------------------
  // ✅ React Query PUT Hook
  // -----------------------------------
  const usePutRequest = <T, P = any>(
    url: string,
    options: object = {}
  ): UseMutationResult<T, any, P> => {
    return useMutation<T, any, P>(
      async (payload: P) => {
        const { data } = await axiosClient.put<T>(url, payload);
        return data;
      },
      options
    );
  };

  // -----------------------------------
  // ✅ React Query PATCH Hook
  // -----------------------------------
  const usePatchRequest = <T, P = any>(
    url: string,
    options: object = {}
  ): UseMutationResult<T, any, P> => {
    return useMutation<T, any, P>(
      async (payload: P) => {
        const { data } = await axiosClient.patch<T>(url, payload);
        return data;
      },
      options
    );
  };

  // -----------------------------------
  // ✅ React Query DELETE Hook
  // -----------------------------------
  const useDeleteRequest = <T>(
    url: string,
    options: object = {}
  ): UseMutationResult<T, any, void> => {
    return useMutation<T>(
      async () => {
        const { data } = await axiosClient.delete<T>(url);
        return data;
      },
      options
    );
  };

  return {
    useGetRequest,
    usePostRequest,
    usePutRequest,
    usePatchRequest,
    useDeleteRequest,
  };
};

export default useApiClient;
