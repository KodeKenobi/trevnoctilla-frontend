# PayFast Signature Mismatch - Root Cause Analysis

## The Problem

PayFast is returning: **"Generated signature does not match submitted signature"**

This means PayFast calculates the signature on their end and it doesn't match what we're sending.

## Current Implementation

Our signature calculation:

1. ✅ Filter out empty values and signature field
2. ✅ Sort keys alphabetically
3. ✅ Format as `key=value` pairs
4. ✅ Join with `&`
5. ✅ Append `&passphrase=value` (if passphrase exists)
6. ✅ MD5 hash (lowercase hex)

## PayFast Documentation Requirements

According to PayFast developer documentation:

- Parameters must be sorted alphabetically
- Empty values must be excluded
- Signature field must be excluded
- Values should be trimmed
- **Signature is calculated on RAW values (before URL encoding)**
- Passphrase is appended as-is (not URL encoded)
- MD5 hash the entire string

## Possible Issues

### 1. Passphrase Mismatch

- Check that passphrase in `.env.local` exactly matches PayFast dashboard
- No extra spaces, correct case
- Current passphrase: `Trevnoctilla_PayFast_Test`

### 2. Value Trimming

- All values must be trimmed consistently
- No leading/trailing whitespace

### 3. Parameter Order

- Must be strictly alphabetical
- Current order looks correct

### 4. Special Characters

- URLs in values might need special handling
- But PayFast says use RAW values, so URLs should be as-is

## Testing

Run the test page at `/test-payfast` and check:

1. Server console logs show the exact signature string
2. Compare with PayFast's expected format
3. Verify passphrase matches exactly

## Next Steps

1. Verify passphrase in PayFast dashboard matches `.env.local` exactly
2. Check server logs for the exact signature string being generated
3. Compare with PayFast's signature calculation examples
4. Test with a simple payment to isolate the issue

## The Problem

PayFast is returning: **"Generated signature does not match submitted signature"**

This means PayFast calculates the signature on their end and it doesn't match what we're sending.

## Current Implementation

Our signature calculation:

1. ✅ Filter out empty values and signature field
2. ✅ Sort keys alphabetically
3. ✅ Format as `key=value` pairs
4. ✅ Join with `&`
5. ✅ Append `&passphrase=value` (if passphrase exists)
6. ✅ MD5 hash (lowercase hex)

## PayFast Documentation Requirements

According to PayFast developer documentation:

- Parameters must be sorted alphabetically
- Empty values must be excluded
- Signature field must be excluded
- Values should be trimmed
- **Signature is calculated on RAW values (before URL encoding)**
- Passphrase is appended as-is (not URL encoded)
- MD5 hash the entire string

## Possible Issues

### 1. Passphrase Mismatch

- Check that passphrase in `.env.local` exactly matches PayFast dashboard
- No extra spaces, correct case
- Current passphrase: `Trevnoctilla_PayFast_Test`

### 2. Value Trimming

- All values must be trimmed consistently
- No leading/trailing whitespace

### 3. Parameter Order

- Must be strictly alphabetical
- Current order looks correct

### 4. Special Characters

- URLs in values might need special handling
- But PayFast says use RAW values, so URLs should be as-is

## Testing

Run the test page at `/test-payfast` and check:

1. Server console logs show the exact signature string
2. Compare with PayFast's expected format
3. Verify passphrase matches exactly

## Next Steps

1. Verify passphrase in PayFast dashboard matches `.env.local` exactly
2. Check server logs for the exact signature string being generated
3. Compare with PayFast's signature calculation examples
4. Test with a simple payment to isolate the issue
