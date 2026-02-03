"use server";

import prisma from "@repo/db/client";

export async function searchUsers(query: string) {
    if (!query || query.length < 3) return [];

    const cleanQuery = query.replace(/\D/g, "");
    const isNumberSearch = cleanQuery.length >= 3;

    const users = await prisma.user.findMany({
        where: {
            OR: [
                ...(isNumberSearch ? [{ number: { contains: cleanQuery } }] : []),
                { name: { contains: query, mode: "insensitive" } },
            ],
        },
        select: {
            id: true,
            name: true,
            number: true,
        },
        take: 5,
    });

    return users;
}
