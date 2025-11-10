"use client";

import React, { useRef, useEffect, useState } from "react";
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

  // Payment data comes from API response (includes signature)
  // This ensures the signature matches the exact data sent to PayFast
  const [paymentData, setPaymentData] = useState<Record<string, string> | null>(
    null
  );
  const [isLoadingSignature, setIsLoadingSignature] = useState(true);

  // Fetch payment data and signature from server-side API (passphrase stays on server)
  // CRITICAL: Use the payment data returned from API, not client-side built data
  // The signature must match the exact payment data sent to PayFast
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setIsLoadingSignature(true);

        // Build request data from props (what we want to send)
        const requestData: Record<string, string> = {
          amount: parseFloat(amount).toFixed(2),
          item_name: String(item_name).trim(),
        };

        if (item_description)
          requestData.item_description = item_description.trim();
        if (custom_str1) requestData.custom_str1 = custom_str1.trim();
        if (custom_str2) requestData.custom_str2 = custom_str2.trim();
        if (name_first) requestData.name_first = name_first.trim();
        if (name_last) requestData.name_last = name_last.trim();
        if (email_address) requestData.email_address = email_address.trim();
        if (cell_number) requestData.cell_number = cell_number.trim();

        const response = await fetch("/api/payments/payfast/initiate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to generate signature: ${response.statusText}`
          );
        }

        const data = await response.json();
        // CRITICAL: Use the payment_data from API response, not client-side built data
        // The signature is calculated on the server's payment_data, so we must use that
        if (data.payment_data) {
          setPaymentData(data.payment_data);
          console.log("✅ Payment data and signature fetched from server");
          console.log("Payment data:", data.payment_data);
        } else {
          throw new Error("No payment_data in response");
        }
      } catch (error) {
        console.error("❌ Failed to fetch payment data:", error);
      } finally {
        setIsLoadingSignature(false);
      }
    };

    fetchPaymentData();
  }, [
    amount,
    item_name,
    item_description,
    custom_str1,
    custom_str2,
    name_first,
    name_last,
    email_address,
    cell_number,
  ]);

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
  // CRITICAL: Use paymentData from API response (includes signature)
  // Render fields in the EXACT order they appear in paymentData object
  // This ensures the form matches what the signature was calculated on
  const renderInputs = () => {
    if (!paymentData) {
      return null; // Don't render form until payment data is loaded
    }

    const inputs: JSX.Element[] = [];

    // Iterate through paymentData in insertion order (as it appears in the object)
    // This matches the order used for signature calculation
    for (const key in paymentData) {
      const value = paymentData[key];
      if (value !== undefined && value !== null && value !== "") {
        inputs.push(
          <input key={key} type="hidden" name={key} value={String(value)} />
        );
      }
    }

    return inputs;
  };

  // Ensure form is in DOM and log payment data when ready
  useEffect(() => {
    if (formRef.current && paymentData) {
      console.log("=== PayFastForm Payment Data ===");
      console.log("Form ref:", formRef.current);
      console.log("Full payment data from API:", paymentData);
      console.log("Form action:", formRef.current.action);

      // Verify all fields are in the form
      const requiredFields = [
        "merchant_id",
        "merchant_key",
        "amount",
        "item_name",
        "signature",
      ];
      requiredFields.forEach((field) => {
        const input = formRef.current?.querySelector(`input[name="${field}"]`);
        if (input) {
          console.log(`✅ ${field}:`, (input as HTMLInputElement).value);
        } else {
          console.error(`❌ ${field} MISSING from form!`);
        }
      });
    }
  }, [paymentData]);

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
