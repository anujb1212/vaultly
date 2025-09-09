import { NextResponse } from "next/server";
import prisma from "@repo/db/client";
import { Prisma } from "@prisma/client";

export const GET = async () => {
    try {
        await prisma.merchant.create({
            data: {
                email: "asd",
                name: "adsads",
                auth_type: "Google",
            },
        });

        return NextResponse.json({
            message: "hi there",
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002" // unique constraint violation code
        ) {
            return NextResponse.json(
                { error: "Email already exists" },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
};
