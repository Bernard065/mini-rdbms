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
