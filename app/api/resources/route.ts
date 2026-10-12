
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(resources);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const type = String(body.type ?? "").trim();

    if (!name || !type) {
      return NextResponse.json(
        { error: "Resource name and type are required" },
        { status: 400 }
      );
    }

    const capacity =
      body.capacity === "" || body.capacity == null
        ? null
        : Number(body.capacity);

    if (
      capacity !== null &&
      (!Number.isInteger(capacity) || capacity < 1)
    ) {
      return NextResponse.json(
        { error: "Capacity must be a positive whole number" },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.create({
      data: {
        name,
        type,
        description: body.description
          ? String(body.description).trim()
          : null,
        location: body.location
          ? String(body.location).trim()
          : null,
        capacity,
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}
