import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Create a new customer
export async function POST(req: NextRequest) {
  const data = await req.json();
  try {
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        email: data.email,
      },
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create customer', details: error },
      { status: 400 }
    );
  }
}

// GET: List all customers
export async function GET() {
  try {
    const customers = await prisma.customer.findMany();
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch customers', details: error },
      { status: 500 }
    );
  }
}

// PATCH: Update a customer
export async function PATCH(req: NextRequest) {
  const data = await req.json();
  try {
    const customer = await prisma.customer.update({
      where: { id: data.id },
      data: {
        name: data.name,
        email: data.email,
      },
    });
    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update customer', details: error },
      { status: 400 }
    );
  }
}

// DELETE: Delete a customer (and their orders)
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  try {
    // Delete orders for this customer first
    await prisma.order.deleteMany({ where: { customerId: id } });
    // Then delete the customer
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete customer', details: error },
      { status: 400 }
    );
  }
}
