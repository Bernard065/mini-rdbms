import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Customer, Order } from '@/lib/types/api';
import { QueryResult } from '@/lib/types/query';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Customer', 'Order'],
  endpoints: (builder) => ({
    getCustomers: builder.query<Customer[], void>({
      query: () => 'customers',
      providesTags: () => [{ type: 'Customer' }],
    }),
    getOrders: builder.query<Order[], void>({
      query: () => 'orders',
      providesTags: () => [{ type: 'Order' }],
    }),
    addCustomer: builder.mutation<Customer, { name: string; email: string }>({
      query: (body) => ({
        url: 'customers',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Customer' }],
    }),
    updateCustomer: builder.mutation<
      Customer,
      { id: number; name: string; email: string }
    >({
      query: (body) => ({
        url: 'customers',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Customer' }],
    }),
    deleteCustomer: builder.mutation<{ success: boolean }, { id: number }>({
      query: (body) => ({
        url: 'customers',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: [{ type: 'Customer' }, { type: 'Order' }],
    }),
    addOrder: builder.mutation<
      Order,
      { customerId: number; product: string; amount: number }
    >({
      query: (body) => ({
        url: 'orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Order' }],
    }),
    updateOrder: builder.mutation<
      Order,
      { id: number; customerId: number; product: string; amount: number }
    >({
      query: (body) => ({
        url: 'orders',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Order' }],
    }),
    deleteOrder: builder.mutation<{ success: boolean }, { id: number }>({
      query: (body) => ({
        url: 'orders',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: [{ type: 'Order' }],
    }),
    executeSQL: builder.mutation<QueryResult, { sql: string }>({
      query: (body) => ({
        url: 'execute',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetOrdersQuery,
  useAddCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useAddOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  useExecuteSQLMutation,
} = api;
