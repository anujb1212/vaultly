"use client";

import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { Select } from "@repo/ui/select";
import { useState } from "react";
import { TextInput } from "@repo/ui/textinput";
import { createOnRampTxn } from "../app/lib/actions/createOnRampTxn";

const SUPPORTED_BANKS = [
    { name: "HDFC Bank", redirectUrl: "https://netbanking.hdfcbank.com" },
    { name: "Axis Bank", redirectUrl: "https://www.axisbank.com/" },
    { name: "ICICI Bank", redirectUrl: "https://www.icicibank.com/" },
    { name: "SBI", redirectUrl: "https://retail.onlinesbi.sbi/" },
    { name: "Kotak Mahindra Bank", redirectUrl: "https://netbanking.kotak.com/" },
];

export const AddMoney = () => {
    const [redirectUrl, setRedirectUrl] = useState(SUPPORTED_BANKS[0]?.redirectUrl);
    const [provider, setProvider] = useState(SUPPORTED_BANKS[0]?.name || "");
    const [amount, setAmount] = useState(0);

    return (
        <Card title="Add Money">
            <div className="w-full">
                <TextInput
                    label="Amount"
                    placeholder="Amount"
                    onChange={(value) => {
                        setAmount(Number(value));
                    }}
                />
                <div className="py-4 text-left font-medium">Bank</div>
                <Select
                    onSelect={(value) => {
                        setRedirectUrl(SUPPORTED_BANKS.find((x) => x.name === value)?.redirectUrl || "");
                        setProvider(SUPPORTED_BANKS.find((x) => x.name === value)?.name || "");
                    }}
                    options={SUPPORTED_BANKS.map((x) => ({
                        key: x.name,
                        value: x.name,
                    }))}
                />
                <div className="flex justify-center pt-4">
                    <Button
                        onClick={async () => {
                            if (amount > 0) {
                                await createOnRampTxn(amount * 100, provider);
                                window.location.href = redirectUrl || "";
                            } else {
                                alert("Please enter a valid amount.");
                            }
                        }}
                        className="px-6 py-2 rounded-lg font-semibold"
                    >
                        Add Money
                    </Button>
                </div>
            </div>
        </Card>
    );
};
