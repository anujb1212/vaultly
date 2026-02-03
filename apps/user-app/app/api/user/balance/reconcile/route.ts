import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@repo/db/client";
import { authOptions } from "../../../../lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const { searchParams } = new URL(req.url);
    const currency = searchParams.get("currency") ?? "INR";

    const cashAccount = await prisma.ledgerAccount.upsert({
        where: { userId_accountType_currency: { userId, accountType: "USER_CASH", currency } },
        update: {},
        create: { userId, accountType: "USER_CASH", currency },
    });

    const balanceRow = await prisma.balance.upsert({
        where: { userId },
        update: {},
        create: { userId, amount: 0, locked: 0 },
    });

    const rows = await prisma.$queryRaw<Array<{ net: string }>>`
    SELECT
      COALESCE(
        SUM(
          CASE
            WHEN "direction" = 'CREDIT' THEN "amount"
            ELSE - "amount"
          END
        ),
        0
      )::text AS net
    FROM "LedgerEntry"
    WHERE "accountId" = ${cashAccount.id}
      AND "currency" = ${currency};
  `;

    const ledgerNet = Number(rows?.[0]?.net ?? "0");
    const drift = balanceRow.amount - ledgerNet;

    return NextResponse.json({
        currency,
        userId,
        balanceTable: { amount: balanceRow.amount, locked: balanceRow.locked },
        ledger: { cashAccountId: cashAccount.id, net: ledgerNet },
        drift,
        ok: drift === 0,
    });
}
