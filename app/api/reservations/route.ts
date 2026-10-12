
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: { resource: true },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Fetch reservations error:", error);

    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const userName = String(body.userName ?? "").trim();
    const userEmail = String(body.userEmail ?? "").trim();
    const resourceId = Number(body.resourceId);
    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);

    if (
      !title ||
      !userName ||
      !userEmail ||
      !Number.isInteger(resourceId) ||
      resourceId < 1
    ) {
      return NextResponse.json(
        { error: "Please enter all required fields." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (
      !body.startTime ||
      !body.endTime ||
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime()) ||
      endTime <= startTime
    ) {
      return NextResponse.json(
        { error: "Enter a valid start and end time." },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found." },
        { status: 404 }
      );
    }

    const conflict = await prisma.reservation.findFirst({
      where: {
        resourceId,
        status: { not: "CANCELLED" },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "This resource is already reserved for that time." },
        { status: 409 }
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        title,
        userName,
        userEmail,
        startTime,
        endTime,
        resourceId,
      },
      include: { resource: true },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error("Create reservation error:", error);

    return NextResponse.json(
      { error: "Failed to create reservation." },
      { status: 500 }
    );
  }
}

