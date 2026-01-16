'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Card, Table } from '@/components/ui';
import { ColumnValue } from '@/lib/types';
import { Plus, Trash2, Users, ShoppingCart, Edit } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  email: string;
}

interface Order {
  id: number;
  customerId: number;
  product: string;
  amount: number;
  customer?: Customer;
}

interface JoinedOrder extends Record<string, ColumnValue> {
  order_id: number;
  product: string;
  amount: number;
  customer_name: string | null;
  customer_email: string | null;
}

const DemoApp = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [joinedData, setJoinedData] = useState<JoinedOrder[]>([]);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [orderCustomerId, setOrderCustomerId] = useState('');
  const [orderProduct, setOrderProduct] = useState('');
  const [orderAmount, setOrderAmount] = useState('');

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Fetch customers from API
  const fetchCustomers = async (): Promise<Customer[]> => {
    const res = await fetch('/api/customers');
    const data = await res.json();
    return data;
  };

  // Fetch orders from API
  const fetchOrders = async (): Promise<Order[]> => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    return data;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const customersData = await fetchCustomers();
        setCustomers(customersData);
        const ordersData = await fetchOrders();
        setOrders(ordersData);
        setJoinedData(
          ordersData.map((order: Order) => ({
            order_id: order.id,
            product: order.product,
            amount: order.amount,
            customer_name: order.customer?.name ?? null,
            customer_email: order.customer?.email ?? null,
          }))
        );
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const addCustomer = async () => {
    if (!customerName || !customerEmail) return;
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: customerName, email: customerEmail }),
    });
    if (res.ok) {
      setCustomerName('');
      setCustomerEmail('');
      try {
        const customersData = await fetchCustomers();
        setCustomers(customersData);
      } catch (error) {
        console.error('Error refreshing customers:', error);
      }
    } else {
      const error = await res.json();
      alert(error.error || 'Error adding customer');
    }
  };

  const deleteCustomer = async (id: number) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this customer and all their orders?'
      )
    )
      return;
    const res = await fetch('/api/customers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setCustomers(customers.filter((c) => c.id !== id));
      setOrders(orders.filter((o) => o.customerId !== id));
      setJoinedData(
        joinedData.filter(
          (j) => j.customer_name !== customers.find((c) => c.id === id)?.name
        )
      );
    } else {
      const error = await res.json();
      alert(error.error || 'Error deleting customer');
    }
  };

  const addOrder = async () => {
    if (!orderCustomerId || !orderProduct || !orderAmount) return;
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: Number(orderCustomerId),
        product: orderProduct,
        amount: Number(orderAmount),
      }),
    });
    if (res.ok) {
      setOrderCustomerId('');
      setOrderProduct('');
      setOrderAmount('');
      try {
        const ordersData = await fetchOrders();
        setOrders(ordersData);
        setJoinedData(
          ordersData.map((order: Order) => ({
            order_id: order.id,
            product: order.product,
            amount: order.amount,
            customer_name: order.customer?.name ?? null,
            customer_email: order.customer?.email ?? null,
          }))
        );
      } catch (error) {
        console.error('Error refreshing orders:', error);
      }
    } else {
      const error = await res.json();
      alert(error.error || 'Error adding order');
    }
  };

  const deleteOrder = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    const res = await fetch('/api/orders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setOrders(orders.filter((o) => o.id !== id));
      setJoinedData(joinedData.filter((j) => j.order_id !== id));
    } else {
      const error = await res.json();
      alert(error.error || 'Error deleting order');
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

  const updateCustomer = async () => {
    if (!editingCustomer || !customerName || !customerEmail) return;
    const res = await fetch('/api/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingCustomer.id,
        name: customerName,
        email: customerEmail,
      }),
    });
    if (res.ok) {
      setEditingCustomer(null);
      setCustomerName('');
      setCustomerEmail('');
      const customersData = await fetchCustomers();
      setCustomers(customersData);
    } else {
      const error = await res.json();
      alert(error.error || 'Error updating customer');
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

  const updateOrder = async () => {
    if (!editingOrder || !orderCustomerId || !orderProduct || !orderAmount)
      return;
    const res = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingOrder.id,
        customerId: Number(orderCustomerId),
        product: orderProduct,
        amount: Number(orderAmount),
      }),
    });
    if (res.ok) {
      setEditingOrder(null);
      setOrderCustomerId('');
      setOrderProduct('');
      setOrderAmount('');
      const ordersData = await fetchOrders();
      setOrders(ordersData);
      setJoinedData(
        ordersData.map((order: Order) => ({
          order_id: order.id,
          product: order.product,
          amount: order.amount,
          customer_name: order.customer?.name ?? null,
          customer_email: order.customer?.email ?? null,
        }))
      );
    } else {
      const error = await res.json();
      alert(error.error || 'Error updating order');
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
                  .reduce((sum, order) => sum + order.amount, 0)
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
                  {customers.map((customer) => (
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
                {customers.map((customer) => (
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
                {customers.map((customer) => (
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
                  {orders.map((order) => (
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
