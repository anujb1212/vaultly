import { NextResponse } from "next/server"
import prisma from "@repo/db/client";

export const GET = async () => {
    await prisma.merchant.create({
        data: {
            email: "asd",
            name: "adsads",
            auth_type: "Google"
        }
    })
    return NextResponse.json({
        message: "hi there"
    })
}