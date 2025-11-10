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
    // Always use production URLs (PayFast requires publicly accessible URLs)
    if (return_url) {
      data.return_url = return_url.includes("localhost")
        ? `${productionBaseUrl}/payment/success`
        : return_url;
    } else {
      data.return_url = `${finalBaseUrl}/payment/success`;
    }
    if (cancel_url) {
      data.cancel_url = cancel_url.includes("localhost")
        ? `${productionBaseUrl}/payment/cancel`
        : cancel_url;
    } else {
      data.cancel_url = `${finalBaseUrl}/payment/cancel`;
    }
    // CRITICAL: Always use /payment/notify (not /api/payments/payfast/notify)
    // The endpoint was moved to /payment/notify for consistency
    if (notify_url) {
      // Fix old path if it's using the old /api/payments/payfast/notify path
      if (notify_url.includes("/api/payments/payfast/notify")) {
        const baseUrl = notify_url.split("/api/payments/payfast/notify")[0];
        data.notify_url = `${baseUrl}/payment/notify`;
      } else if (notify_url.includes("localhost")) {
        data.notify_url = `${productionBaseUrl}/payment/notify`;
      } else {
        data.notify_url = notify_url;
      }
    } else {
      data.notify_url = `${finalBaseUrl}/payment/notify`;
    }

    // 3. FICA ID Number (OPTIONAL)
    if (fica_idnumber) data.fica_idnumber = fica_idnumber.trim();

    // 4. Payment details
    // Generate unique payment ID (m_payment_id) as per PayFast example
    data.m_payment_id = custom_str1 || `payment_${Date.now()}`;
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
  const [signature, setSignature] = useState<string>("");
  const [isLoadingSignature, setIsLoadingSignature] = useState(true);

  // Fetch signature from server-side API (passphrase stays on server)
  useEffect(() => {
    const fetchSignature = async () => {
      try {
        setIsLoadingSignature(true);
        const response = await fetch("/api/payments/payfast/initiate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: paymentData.amount,
            item_name: paymentData.item_name,
            item_description: paymentData.item_description,
            custom_str1: paymentData.custom_str1,
            custom_str2: paymentData.custom_str2,
            name_first: paymentData.name_first,
            name_last: paymentData.name_last,
            email_address: paymentData.email_address,
            cell_number: paymentData.cell_number,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate signature: ${response.statusText}`);
        }

        const data = await response.json();
        // API returns signature in payment_data.signature
        const sig = data.payment_data?.signature || data.signature;
        if (sig) {
          setSignature(sig);
          console.log("✅ Signature fetched from server:", sig);
        } else {
          throw new Error("No signature in response");
        }
      } catch (error) {
        console.error("❌ Failed to fetch signature:", error);
        // Don't set signature - form won't submit without it
      } finally {
        setIsLoadingSignature(false);
      }
    };

    fetchSignature();
  }, [
    paymentData.amount,
    paymentData.item_name,
    paymentData.item_description,
    paymentData.custom_str1,
    paymentData.custom_str2,
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
    // CRITICAL: notify_url MUST always be included for PayFast ITN callbacks
    // Always use /payment/notify (not /api/payments/payfast/notify)
    const productionBaseUrl = "https://www.trevnoctilla.com";
    let finalNotifyUrl =
      paymentData.notify_url || `${productionBaseUrl}/payment/notify`;

    // Fix old path if it's still using the old /api/payments/payfast/notify path
    if (finalNotifyUrl.includes("/api/payments/payfast/notify")) {
      const baseUrl = finalNotifyUrl.split("/api/payments/payfast/notify")[0];
      finalNotifyUrl = `${baseUrl}/payment/notify`;
    }

    inputs.push(
      <input
        key="notify_url"
        type="hidden"
        name="notify_url"
        value={finalNotifyUrl}
      />
    );

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

    // 5. Signature (MUST be last, after all other fields)
    inputs.push(
      <input key="signature" type="hidden" name="signature" value={signature} />
    );

    return inputs;
  };

  // Ensure form is in DOM and log payment data when signature is ready
  useEffect(() => {
    if (formRef.current && signature) {
      console.log("=== PayFastForm Payment Data ===");
      console.log("Form ref:", formRef.current);
      console.log("Full payment data:", paymentData);
      console.log("merchant_id:", paymentData.merchant_id);
      console.log("merchant_key:", paymentData.merchant_key);
      console.log("🔗 notify_url:", paymentData.notify_url);
      console.log("🔗 return_url:", paymentData.return_url);
      console.log("🔗 cancel_url:", paymentData.cancel_url);
      console.log("🔐 signature:", signature);
      console.log("Form action:", formRef.current.action);

      // Verify notify_url is in the form
      const notifyInput = formRef.current.querySelector(
        'input[name="notify_url"]'
      );
      if (notifyInput) {
        console.log(
          "✅ notify_url field found in form:",
          (notifyInput as HTMLInputElement).value
        );
      } else {
        console.error("❌ notify_url field MISSING from form!");
      }

      // Verify signature is in the form
      const signatureInput = formRef.current.querySelector(
        'input[name="signature"]'
      );
      if (signatureInput) {
        console.log(
          "✅ signature field found in form:",
          (signatureInput as HTMLInputElement).value
        );
      } else {
        console.error("❌ signature field MISSING from form!");
      }
    }
  }, [signature, paymentData]);

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
