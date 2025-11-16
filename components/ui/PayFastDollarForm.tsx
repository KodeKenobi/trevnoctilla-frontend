"use client";

import React, { useRef, useEffect, useState } from "react";
import { API_CONFIG } from "@/lib/config";

interface PayFastDollarFormProps {
  amount: string;
  item_name: string;
  item_description?: string;
  return_url?: string;
  cancel_url?: string;
  notify_url?: string; // Optional - API will exclude for $1 payments
  custom_str1?: string;
  custom_str2?: string;
  autoSubmit?: boolean;
  className?: string;
  formRef?: React.RefObject<HTMLFormElement>;
  onPaymentDataLoaded?: () => void;
}

/**
 * PayFastDollarForm - Simplified form for $1 payments
 * Only sends minimal required fields:
 * - merchant_id
 * - merchant_key
 * - return_url
 * - cancel_url
 * - amount
 * - item_name
 * - signature
 *
 * notify_url is excluded for $1 payments (handled by API)
 */
export default function PayFastDollarForm({
  amount,
  item_name,
  item_description,
  return_url,
  cancel_url,
  notify_url,
  custom_str1,
  custom_str2,
  autoSubmit = false,
  className = "hidden",
  formRef: externalFormRef,
  onPaymentDataLoaded,
}: PayFastDollarFormProps) {
  const internalFormRef = useRef<HTMLFormElement>(null);
  const formRef = externalFormRef || internalFormRef;
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);

  // Payment data comes from API response (includes signature)
  const [paymentData, setPaymentData] = useState<Record<string, string> | null>(
    null
  );
  const [isLoadingSignature, setIsLoadingSignature] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment data and signature from server-side API
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setIsLoadingSignature(true);

        // Build request data - minimal fields only for $1 payments
        const requestData: Record<string, any> = {
          amount: parseFloat(amount).toFixed(2),
          item_name: String(item_name).trim(),
        };

        if (item_description)
          requestData.item_description = item_description.trim();
        if (custom_str1) requestData.custom_str1 = custom_str1.trim();
        if (custom_str2) requestData.custom_str2 = custom_str2.trim();

        // Add return URLs
        if (return_url) requestData.return_url = return_url.trim();
        if (cancel_url) requestData.cancel_url = cancel_url.trim();

        // NOTE: notify_url is intentionally NOT sent for $1 payments
        // The API will exclude it automatically for simple payments (amount <= 20 ZAR)
        // Only include if explicitly provided and amount is larger
        if (notify_url && parseFloat(amount) > 20) {
          requestData.notify_url = notify_url.trim();
        }

        // DO NOT send subscription fields - this is for simple $1 payments only

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
        if (data.payment_data) {
          setPaymentData(data.payment_data);
          console.log(
            "✅ PayFastDollarForm: Payment data and signature fetched from server"
          );
          console.log("Payment data:", data.payment_data);
          if (onPaymentDataLoaded) {
            onPaymentDataLoaded();
          }
        } else {
          console.error(
            "❌ PayFastDollarForm: No payment_data in response:",
            data
          );
          throw new Error("No payment_data in response");
        }
      } catch (error) {
        console.error("❌ Failed to fetch payment data:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setError(errorMessage);
      } finally {
        setIsLoadingSignature(false);
      }
    };

    fetchPaymentData();
  }, [
    amount,
    item_name,
    item_description,
    return_url,
    cancel_url,
    notify_url,
    custom_str1,
    custom_str2,
    onPaymentDataLoaded,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  // Auto-submit if requested - but only after payment data is loaded
  useEffect(() => {
    if (
      autoSubmit &&
      !hasAutoSubmitted &&
      formRef.current &&
      paymentData &&
      !isLoadingSignature
    ) {
      setTimeout(() => {
        if (formRef.current && paymentData && !hasAutoSubmitted) {
          const requiredFields = [
            "merchant_id",
            "merchant_key",
            "amount",
            "item_name",
            "signature",
          ];
          const allFieldsPresent = requiredFields.every((field) => {
            const input = formRef.current?.querySelector(
              `input[name="${field}"]`
            );
            return input && (input as HTMLInputElement).value;
          });

          if (allFieldsPresent) {
            console.log(
              "🚀 Auto-submitting PayFastDollarForm with payment data:",
              paymentData
            );
            setHasAutoSubmitted(true);
            formRef.current.submit();
          } else {
            console.error(
              "❌ Cannot auto-submit: Missing required fields in form"
            );
          }
        }
      }, 500);
    }
  }, [autoSubmit, paymentData, isLoadingSignature, hasAutoSubmitted]);

  // Render inputs in EXACT order as per PayFast documentation
  const renderInputs = () => {
    if (!paymentData) {
      console.log(
        "⚠️ PayFastDollarForm: paymentData is null, not rendering inputs"
      );
      return null;
    }

    const inputs: JSX.Element[] = [];

    // Iterate through paymentData in insertion order
    for (const key in paymentData) {
      const value = paymentData[key];
      if (value !== undefined && value !== null && value !== "") {
        inputs.push(
          <input key={key} type="hidden" name={key} value={String(value)} />
        );
      }
    }

    console.log(`✅ PayFastDollarForm: Rendered ${inputs.length} form inputs`);
    return inputs;
  };

  // Log payment data when ready
  useEffect(() => {
    if (formRef.current && paymentData) {
      console.log("=== PayFastDollarForm Payment Data ===");
      console.log("Full payment data from API:", paymentData);
      console.log("Form action:", formRef.current.action);

      // Verify all fields are in the form
      const requiredFields = [
        "merchant_id",
        "merchant_key",
        "return_url",
        "cancel_url",
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

      // Verify notify_url is NOT present for $1 payments
      const notifyInput = formRef.current?.querySelector(
        'input[name="notify_url"]'
      );
      if (notifyInput && parseFloat(amount) <= 20) {
        console.warn(
          "⚠️ notify_url is present but should be excluded for $1 payments"
        );
      } else if (!notifyInput && parseFloat(amount) <= 20) {
        console.log("✅ notify_url correctly excluded for $1 payment");
      }
    }
  }, [paymentData, amount]);

  return (
    <form
      ref={formRef as React.RefObject<HTMLFormElement>}
      action={API_CONFIG.PAYFAST.PAYFAST_URL}
      method="post"
      encType="application/x-www-form-urlencoded"
      acceptCharset="UTF-8"
      onSubmit={handleSubmit}
      className={className}
    >
      {renderInputs()}
    </form>
  );
}
