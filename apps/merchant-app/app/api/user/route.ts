import { NextResponse } from "next/server";
import prisma from "@repo/db/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export const GET = async () => {
    try {
        const merchant = await prisma.merchant.create({
            data: {
                email: "asd",
                name: "adsads",
                auth_type: "Google",
            },
        });

        return NextResponse.json({
            message: "Merchant created successfully",
            merchant,
        });
    } catch (error: unknown) {
        if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json({ error: "Email already exists" }, { status: 409 });
        }

        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
};
