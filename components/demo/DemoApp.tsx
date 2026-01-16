'use client';

import { useState, useEffect, useCallback } from 'react';
import { RDBMS } from '@/lib';
import { Row } from '@/lib/types';
import { Button, Input, Card, Table } from '@/components/ui';
import { Plus, Trash2, Users, ShoppingCart, Edit } from 'lucide-react';

interface DemoAppProps {
  db: RDBMS;
}

export function DemoApp({ db }: DemoAppProps) {
  const [customers, setCustomers] = useState<Row[]>([]);
  const [orders, setOrders] = useState<Row[]>([]);
  const [joinedData, setJoinedData] = useState<Row[]>([]);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [orderCustomerId, setOrderCustomerId] = useState('');
  const [orderProduct, setOrderProduct] = useState('');
  const [orderAmount, setOrderAmount] = useState('');

  const [editingCustomer, setEditingCustomer] = useState<Row | null>(null);
  const [editingOrder, setEditingOrder] = useState<Row | null>(null);

  const loadData = useCallback((): void => {
    const customersResult = db.execute('SELECT * FROM customers');
    if (customersResult.success && customersResult.type === 'SELECT') {
      setCustomers(customersResult.rows as Row[]);
    }

    const ordersResult = db.execute('SELECT * FROM orders');
    if (ordersResult.success && ordersResult.type === 'SELECT') {
      setOrders(ordersResult.rows as Row[]);
    }

    const joinResult = db.execute(`
      SELECT
        orders.id as order_id,
        orders.product,
        orders.amount,
        customers.name as customer_name,
        customers.email as customer_email
      FROM orders
      INNER JOIN customers ON orders.customer_id = customers.id
    `);

    if (joinResult.success && joinResult.type === 'SELECT') {
      setJoinedData(joinResult.rows as Row[]);
    }
  }, [db]);

  const initializeDatabase = useCallback((): void => {
    db.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      )
    `);

    db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        customer_id INTEGER NOT NULL,
        product TEXT NOT NULL,
        amount REAL NOT NULL
      )
    `);
  }, [db]);

  useEffect(() => {
    initializeDatabase();
    setTimeout(() => loadData(), 1);
  }, [db, initializeDatabase, loadData]);

  const addCustomer = (): void => {
    if (!customerName || !customerEmail) return;

    const result = db.execute(`
      INSERT INTO customers (name, email)
      VALUES ('${customerName}', '${customerEmail}')
    `);

    if (result.success) {
      setCustomerName('');
      setCustomerEmail('');
      loadData();
    } else {
      let errorMessage = 'Error adding customer';
      if (result.error.type === 'CONSTRAINT_VIOLATION') {
        if (
          result.error.violation.message.includes('already exists in column') &&
          result.error.violation.message.includes('id')
        ) {
          errorMessage =
            'A customer with this ID already exists. Please try again or reset the database.';
        } else if (
          result.error.violation.message.includes('already exists in column') &&
          result.error.violation.message.includes('email')
        ) {
          errorMessage =
            'A customer with this email already exists. Please use a different email.';
        } else {
          errorMessage = result.error.violation.message;
        }
      } else if ('message' in result.error) {
        errorMessage = `Error adding customer: ${result.error.message}`;
      } else if (result.error.type === 'TABLE_NOT_FOUND') {
        errorMessage = `Table '${result.error.tableName}' not found`;
      } else if (result.error.type === 'TABLE_ALREADY_EXISTS') {
        errorMessage = `Table '${result.error.tableName}' already exists`;
      } else if (result.error.type === 'COLUMN_NOT_FOUND') {
        errorMessage = `Column '${result.error.columnName}' not found`;
      }
      alert(errorMessage);
    }
  };

  const deleteCustomer = (id: number): void => {
    db.execute(`DELETE FROM orders WHERE customer_id = ${id}`);

    db.execute(`DELETE FROM customers WHERE id = ${id}`);

    loadData();
  };

  const addOrder = (): void => {
    if (!orderCustomerId || !orderProduct || !orderAmount) return;

    const result = db.execute(`
      INSERT INTO orders (customer_id, product, amount)
      VALUES (${orderCustomerId}, '${orderProduct}', ${orderAmount})
    `);

    if (result.success) {
      setOrderCustomerId('');
      setOrderProduct('');
      setOrderAmount('');
      loadData();
    } else {
      let errorMessage = 'Error adding order';
      if (result.error.type === 'CONSTRAINT_VIOLATION') {
        errorMessage = result.error.violation.message;
      } else if ('message' in result.error) {
        errorMessage = `Error adding order: ${result.error.message}`;
      }
      alert(errorMessage);
    }
  };

  const deleteOrder = (id: number): void => {
    db.execute(`DELETE FROM orders WHERE id = ${id}`);
    loadData();
  };

  const startEditCustomer = (customer: Row): void => {
    setEditingCustomer(customer);
    setCustomerName(customer.name as string);
    setCustomerEmail(customer.email as string);
  };

  const cancelEditCustomer = (): void => {
    setEditingCustomer(null);
    setCustomerName('');
    setCustomerEmail('');
  };

  const updateCustomer = (): void => {
    if (!editingCustomer || !customerName || !customerEmail) return;

    const result = db.execute(`
      UPDATE customers
      SET name = '${customerName}', email = '${customerEmail}'
      WHERE id = ${editingCustomer.id}
    `);

    if (result.success) {
      cancelEditCustomer();
      loadData();
    } else {
      let errorMessage = 'Error updating customer';
      if (result.error.type === 'CONSTRAINT_VIOLATION') {
        errorMessage = result.error.violation.message;
      } else if ('message' in result.error) {
        errorMessage = `Error updating customer: ${result.error.message}`;
      }
      alert(errorMessage);
    }
  };

  const startEditOrder = (order: Row): void => {
    setEditingOrder(order);
    setOrderCustomerId((order.customer_id as number).toString());
    setOrderProduct(order.product as string);
    setOrderAmount((order.amount as number).toString());
  };

  const cancelEditOrder = (): void => {
    setEditingOrder(null);
    setOrderCustomerId('');
    setOrderProduct('');
    setOrderAmount('');
  };

  const updateOrder = (): void => {
    if (!editingOrder || !orderCustomerId || !orderProduct || !orderAmount)
      return;

    const result = db.execute(`
      UPDATE orders
      SET customer_id = ${orderCustomerId}, product = '${orderProduct}', amount = ${orderAmount}
      WHERE id = ${editingOrder.id}
    `);

    if (result.success) {
      cancelEditOrder();
      loadData();
    } else {
      let errorMessage = 'Error updating order';
      if (result.error.type === 'CONSTRAINT_VIOLATION') {
        errorMessage = result.error.violation.message;
      } else if ('message' in result.error) {
        errorMessage = `Error updating order: ${result.error.message}`;
      }
      alert(errorMessage);
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
                  .reduce((sum, order) => sum + Number(order.amount || 0), 0)
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
                    <tr key={customer.id as number}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {customer.id as number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {customer.name as string}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {customer.email as string}
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
                          onClick={() => deleteCustomer(customer.id as number)}
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
                  <option
                    key={customer.id as number}
                    value={customer.id as number}
                  >
                    {customer.name as string}
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
                  <option
                    key={customer.id as number}
                    value={customer.id as number}
                  >
                    {customer.name as string}
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
                    <tr key={order.id as number}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {order.id as number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {order.customer_id as number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {order.product as string}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        ${Number(order.amount).toFixed(2)}
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
                          onClick={() => deleteOrder(order.id as number)}
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
}
