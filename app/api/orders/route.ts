import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Create a new order
export async function POST(req: NextRequest) {
  const data = await req.json();
  try {
    const order = await prisma.order.create({
      data: {
        customerId: data.customerId,
        product: data.product,
        amount: data.amount,
      },
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create order', details: error },
      { status: 400 }
    );
  }
}

// GET: List all orders
export async function GET() {
  try {
    const orders = await prisma.order.findMany({ include: { customer: true } });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error },
      { status: 500 }
    );
  }
}

// PATCH: Update an order
export async function PATCH(req: NextRequest) {
  const data = await req.json();
  try {
    const order = await prisma.order.update({
      where: { id: data.id },
      data: {
        customerId: data.customerId,
        product: data.product,
        amount: data.amount,
      },
    });
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update order', details: error },
      { status: 400 }
    );
  }
}

// DELETE: Delete an order
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  try {
    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete order', details: error },
      { status: 400 }
    );
  }
}
