'use client';

import { useState, useMemo } from 'react';
import {
  useGetCustomersQuery,
  useGetOrdersQuery,
  useAddCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useAddOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} from '@/app/services/api';
import { Button, Input, Card, Table } from '@/components/ui';
import { Plus, Trash2, Users, ShoppingCart, Edit } from 'lucide-react';
import { Customer, Order } from '@/lib/types/api';

import type { JoinedOrder } from '@/lib/types/joined-order';

const DemoApp = () => {
  const { data: customers = [] } = useGetCustomersQuery();
  const { data: orders = [] } = useGetOrdersQuery();
  const joinedData: JoinedOrder[] = useMemo(
    () =>
      (orders || []).map((order) => {
        const customer = customers.find((c) => c.id === order.customerId);
        return {
          order_id: order.id,
          product: order.product,
          amount: order.amount,
          customer_name: customer?.name ?? null,
          customer_email: customer?.email ?? null,
        };
      }),
    [orders, customers]
  );

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [orderCustomerId, setOrderCustomerId] = useState('');
  const [orderProduct, setOrderProduct] = useState('');
  const [orderAmount, setOrderAmount] = useState('');

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [addCustomerMutation] = useAddCustomerMutation();
  const addCustomer = async () => {
    if (!customerName || !customerEmail) return;
    try {
      await addCustomerMutation({
        name: customerName,
        email: customerEmail,
      }).unwrap();
      setCustomerName('');
      setCustomerEmail('');
    } catch (error: unknown) {
      const err = error as { data?: { error?: string } };
      alert(err?.data?.error || 'Error adding customer');
    }
  };

  const [deleteCustomerMutation] = useDeleteCustomerMutation();
  const deleteCustomer = async (id: number) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this customer and all their orders?'
      )
    )
      return;
    try {
      await deleteCustomerMutation({ id }).unwrap();
    } catch (error: unknown) {
      const err = error as { data?: { error?: string } };
      alert(err?.data?.error || 'Error deleting customer');
    }
  };

  const [addOrderMutation] = useAddOrderMutation();
  const addOrder = async () => {
    if (!orderCustomerId || !orderProduct || !orderAmount) return;
    try {
      await addOrderMutation({
        customerId: Number(orderCustomerId),
        product: orderProduct,
        amount: Number(orderAmount),
      }).unwrap();
      setOrderCustomerId('');
      setOrderProduct('');
      setOrderAmount('');
    } catch (error: unknown) {
      const err = error as { data?: { error?: string } };
      alert(err?.data?.error || 'Error adding order');
    }
  };

  const [deleteOrderMutation] = useDeleteOrderMutation();
  const deleteOrder = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await deleteOrderMutation({ id }).unwrap();
    } catch (error: unknown) {
      const err = error as { data?: { error?: string } };
      alert(err?.data?.error || 'Error deleting order');
    }
  };

  const startEditCustomer = (customer: Customer): void => {
    setEditingCustomer(customer);
    setCustomerName(customer.name);
    setCustomerEmail(customer.email);
  };

  const cancelEditCustomer = (): void => {
    setEditingCustomer(null);
    setCustomerName('');
    setCustomerEmail('');
  };

  const [updateCustomerMutation] = useUpdateCustomerMutation();
  const updateCustomer = async () => {
    if (!editingCustomer || !customerName || !customerEmail) return;
    try {
      await updateCustomerMutation({
        id: editingCustomer.id,
        name: customerName,
        email: customerEmail,
      }).unwrap();
      setEditingCustomer(null);
      setCustomerName('');
      setCustomerEmail('');
    } catch (error: unknown) {
      const err = error as { data?: { error?: string } };
      alert(err?.data?.error || 'Error updating customer');
    }
  };

  const startEditOrder = (order: Order): void => {
    setEditingOrder(order);
    setOrderCustomerId(order.customerId.toString());
    setOrderProduct(order.product);
    setOrderAmount(order.amount.toString());
  };

  const cancelEditOrder = (): void => {
    setEditingOrder(null);
    setOrderCustomerId('');
    setOrderProduct('');
    setOrderAmount('');
  };

  const [updateOrderMutation] = useUpdateOrderMutation();
  const updateOrder = async () => {
    if (!editingOrder || !orderCustomerId || !orderProduct || !orderAmount)
      return;
    try {
      await updateOrderMutation({
        id: editingOrder.id,
        customerId: Number(orderCustomerId),
        product: orderProduct,
        amount: Number(orderAmount),
      }).unwrap();
      setEditingOrder(null);
      setOrderCustomerId('');
      setOrderProduct('');
      setOrderAmount('');
    } catch (error: unknown) {
      const err = error as { data?: { error?: string } };
      alert(err?.data?.error || 'Error updating order');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold">{orders.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold">
                $
                {orders
                  .reduce((sum: number, order: Order) => sum + order.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Customers">
        <div className="space-y-4">
          {editingCustomer ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
              <Button onClick={updateCustomer}>Update Customer</Button>
              <Button onClick={cancelEditCustomer} variant="secondary">
                Cancel
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
              <Button onClick={addCustomer}>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </div>
          )}

          {customers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                      colSpan={2}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer: Customer) => (
                    <tr key={customer.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {customer.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {customer.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          onClick={() => startEditCustomer(customer)}
                          variant="secondary"
                          size="sm"
                          className="mr-2"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => deleteCustomer(customer.id)}
                          variant="danger"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No customers yet. Add one above!
            </p>
          )}
        </div>
      </Card>

      <Card title="Orders">
        <div className="space-y-4">
          {editingOrder ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select
                className="px-3 py-2 border border-gray-300 rounded-md"
                value={orderCustomerId}
                onChange={(e) => setOrderCustomerId(e.target.value)}
              >
                <option value="">Select Customer</option>
                {customers.map((customer: Customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Product"
                value={orderProduct}
                onChange={(e) => setOrderProduct(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Amount"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
              />
              <Button onClick={updateOrder}>Update Order</Button>
              <Button onClick={cancelEditOrder} variant="secondary">
                Cancel
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                className="px-3 py-2 border border-gray-300 rounded-md"
                value={orderCustomerId}
                onChange={(e) => setOrderCustomerId(e.target.value)}
              >
                <option value="">Select Customer</option>
                {customers.map((customer: Customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Product"
                value={orderProduct}
                onChange={(e) => setOrderProduct(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Amount"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
              />
              <Button onClick={addOrder} disabled={customers.length === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Add Order
              </Button>
            </div>
          )}

          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                      colSpan={2}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order: Order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {order.customerId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {order.product}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        ${order.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          onClick={() => startEditOrder(order)}
                          variant="secondary"
                          size="sm"
                          className="mr-2"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => deleteOrder(order.id)}
                          variant="danger"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No orders yet. Add one above!
            </p>
          )}
        </div>
      </Card>

      <Card title="Order Details (JOIN Query)">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This table demonstrates an INNER JOIN between orders and customers:
          </p>
          <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
            SELECT orders.id, orders.product, orders.amount, customers.name,
            customers.email FROM orders INNER JOIN customers ON
            orders.customer_id = customers.id
          </pre>

          {joinedData.length > 0 ? (
            <Table data={joinedData} />
          ) : (
            <p className="text-center text-gray-500 py-8">
              No orders to display. Create customers and orders to see joined
              data!
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DemoApp;
