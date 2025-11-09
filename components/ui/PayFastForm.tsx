"use client";

import React, { useRef, useEffect } from "react";
import { API_CONFIG } from "@/lib/config";

interface PayFastFormProps {
  amount: string;
  item_name: string;
  item_description?: string;
  return_url?: string;
  cancel_url?: string;
  notify_url?: string;
  fica_idnumber?: string;
  name_first?: string;
  name_last?: string;
  email_address?: string;
  cell_number?: string;
  custom_str1?: string;
  custom_str2?: string;
  autoSubmit?: boolean;
  className?: string;
  formRef?: React.RefObject<HTMLFormElement>;
}

export default function PayFastForm({
  amount,
  item_name,
  item_description,
  return_url,
  cancel_url,
  notify_url,
  fica_idnumber,
  name_first,
  name_last,
  email_address,
  cell_number,
  custom_str1,
  custom_str2,
  autoSubmit = false,
  className = "hidden",
  formRef: externalFormRef,
}: PayFastFormProps) {
  const internalFormRef = useRef<HTMLFormElement>(null);
  const formRef = externalFormRef || internalFormRef;

  // Build payment data in EXACT order as per PayFast documentation
  const buildPaymentData = (): Record<string, string> => {
    const productionBaseUrl = "https://www.trevnoctilla.com";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const finalBaseUrl = baseUrl.includes("localhost")
      ? productionBaseUrl
      : baseUrl;

    // Build data object in EXACT order as per PayFast docs
    const data: Record<string, string> = {};

    // 1. Merchant details (REQUIRED - must be first)
    data.merchant_id = API_CONFIG.PAYFAST.MERCHANT_ID || "10043520";
    data.merchant_key = API_CONFIG.PAYFAST.MERCHANT_KEY || "irqvo1c2j9l08";

    // 2. Return URLs (OPTIONAL - only if provided)
    if (return_url) data.return_url = return_url;
    if (cancel_url) data.cancel_url = cancel_url;
    if (notify_url) data.notify_url = notify_url;

    // 3. FICA ID Number (OPTIONAL)
    if (fica_idnumber) data.fica_idnumber = fica_idnumber.trim();

    // 4. Payment details
    data.amount = parseFloat(amount).toFixed(2);
    data.item_name = String(item_name).trim();

    // 5. Additional optional fields
    if (item_description) data.item_description = item_description.trim();
    if (name_first) data.name_first = name_first.trim();
    if (name_last) data.name_last = name_last.trim();
    if (email_address) data.email_address = email_address.trim();
    if (cell_number) data.cell_number = cell_number.trim();
    if (custom_str1) data.custom_str1 = custom_str1.trim();
    if (custom_str2) data.custom_str2 = custom_str2.trim();

    return data;
  };

  const paymentData = buildPaymentData();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  // Auto-submit if requested
  useEffect(() => {
    if (autoSubmit && formRef.current) {
      setTimeout(() => {
        formRef.current?.submit();
      }, 100);
    }
  }, [autoSubmit]);

  // Render inputs in EXACT order as per PayFast documentation
  const renderInputs = () => {
    const inputs: JSX.Element[] = [];

    // 1. Merchant details (REQUIRED - must be first)
    // Always include these fields (PayFast requires them)
    inputs.push(
      <input
        key="merchant_id"
        type="hidden"
        name="merchant_id"
        value={paymentData.merchant_id || "10043520"}
      />
    );
    inputs.push(
      <input
        key="merchant_key"
        type="hidden"
        name="merchant_key"
        value={paymentData.merchant_key || "irqvo1c2j9l08"}
      />
    );

    // 2. Return URLs (in specific order)
    if (paymentData.return_url) {
      inputs.push(
        <input
          key="return_url"
          type="hidden"
          name="return_url"
          value={paymentData.return_url}
        />
      );
    }
    if (paymentData.cancel_url) {
      inputs.push(
        <input
          key="cancel_url"
          type="hidden"
          name="cancel_url"
          value={paymentData.cancel_url}
        />
      );
    }
    if (paymentData.notify_url) {
      inputs.push(
        <input
          key="notify_url"
          type="hidden"
          name="notify_url"
          value={paymentData.notify_url}
        />
      );
    }

    // 3. FICA ID Number
    if (paymentData.fica_idnumber) {
      inputs.push(
        <input
          key="fica_idnumber"
          type="hidden"
          name="fica_idnumber"
          value={paymentData.fica_idnumber}
        />
      );
    }

    // 4. Payment details and other fields (in order they appear in data)
    const otherFields = [
      "amount",
      "item_name",
      "item_description",
      "name_first",
      "name_last",
      "email_address",
      "cell_number",
      "custom_str1",
      "custom_str2",
    ];

    otherFields.forEach((key) => {
      if (paymentData[key]) {
        inputs.push(
          <input key={key} type="hidden" name={key} value={paymentData[key]} />
        );
      }
    });

    return inputs;
  };

  // Ensure form is in DOM and log payment data
  useEffect(() => {
    if (formRef.current) {
      console.log("PayFastForm mounted, form ref:", formRef.current);
      console.log("Payment data:", paymentData);
      console.log("merchant_id:", paymentData.merchant_id);
      console.log("merchant_key:", paymentData.merchant_key);
    }
  }, []);

  return (
    <form
      ref={formRef as React.RefObject<HTMLFormElement>}
      action={API_CONFIG.PAYFAST.PAYFAST_URL}
      method="post"
      onSubmit={handleSubmit}
      className={className}
    >
      {renderInputs()}
    </form>
  );
}
