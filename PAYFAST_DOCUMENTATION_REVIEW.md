# PayFast Developer Documentation Review - Complete Analysis

## Overview

Thorough review of PayFast integration based on developers.payfast.co.za documentation requirements.

## PayFast Signature Requirements (Official Documentation)

### Step-by-Step Process:

1. **Collect Parameters**: Gather all payment parameters (excluding signature field)
2. **Filter Empty Values**: Remove any empty, null, or undefined values
3. **Sort Alphabetically**: Sort all parameter keys alphabetically
4. **Trim Values**: Remove leading/trailing whitespace from all values
5. **Format String**: Create `key=value` pairs joined with `&`
6. **Append Passphrase**: Add `&passphrase=value` at the end (if passphrase is set)
7. **Use RAW Values**: Signature is calculated on RAW values (NOT URL encoded)
8. **MD5 Hash**: Generate MD5 hash of the entire string (lowercase hex)

### Critical Points:

- ✅ **RAW Values**: Signature uses raw values, browser URL-encodes during form submission
- ✅ **Passphrase**: Must match exactly with PayFast dashboard (case-sensitive, no extra spaces)
- ✅ **Alphabetical Order**: Parameters must be sorted strictly alphabetically
- ✅ **No Empty Values**: Empty values must be excluded from signature calculation

## Required PayFast Parameters

### Minimum Required:

- `merchant_id` - Your PayFast merchant ID
- `merchant_key` - Your PayFast merchant key
- `amount` - Payment amount (formatted as "X.XX")
- `item_name` - Name of the item/service
- `signature` - MD5 hash signature

### Recommended:

- `return_url` - Where to redirect after successful payment
- `cancel_url` - Where to redirect if user cancels
- `notify_url` - ITN callback URL (for server-side payment confirmation)
- `m_payment_id` - Unique payment ID (max 80 chars, alphanumeric + underscores)

### Optional:

- `item_description` - Description of item/service
- `email_address` - Customer email (PayFast will collect if not provided)
- `name_first` - Customer first name
- `name_last` - Customer last name
- `cell_number` - Customer phone number
- `custom_str1`, `custom_str2` - Custom data fields

## Current Implementation Status

### ✅ Fixed Issues:

1. **Signature Calculation**: Now uses RAW values (not URL encoded) - matches PayFast standard
2. **Passphrase Handling**: Correctly appended as RAW value
3. **Parameter Sorting**: Alphabetical sorting implemented
4. **Value Trimming**: All values are trimmed before signature calculation
5. **Empty Value Filtering**: Empty values excluded from signature

### ✅ Code Quality:

- Comprehensive logging for debugging
- Proper error handling
- Environment variable validation
- Sandbox vs Production URL detection

## Testing Tools Created

1. **verify-payfast-signature.js**: Standalone signature verification tool
2. **test-payfast.js**: Comprehensive API endpoint testing
3. **app/test-payfast/page.tsx**: Browser-based test page with persistent logs
4. **test-payfast-full.js**: Full payment flow simulation

## PayFast URLs

### Sandbox (Testing):

- **Process URL**: `https://sandbox.payfast.co.za/eng/process`
- **Dashboard**: PayFast sandbox account dashboard

### Production (Live):

- **Process URL**: `https://www.payfast.co.za/eng/process`
- **Dashboard**: PayFast production account dashboard

## Common Issues & Solutions

### Issue 1: Signature Mismatch

**Symptoms**: PayFast returns "Generated signature does not match submitted signature"
**Solutions**:

- Verify passphrase matches PayFast dashboard exactly
- Check that values are trimmed (no extra spaces)
- Ensure parameters are sorted alphabetically
- Confirm using RAW values (not URL encoded) for signature

### Issue 2: 400 Bad Request

**Symptoms**: PayFast returns 400 error
**Solutions**:

- Verify all required parameters are present
- Check merchant_id and merchant_key are correct
- Ensure using correct URL (sandbox vs production)
- Verify amount format is "X.XX" (two decimal places)

### Issue 3: 404 After Submission

**Symptoms**: Redirected to 404 page after form submission
**Solutions**:

- Check return_url and cancel_url are valid and accessible
- Verify notify_url is publicly accessible (for ITN)
- Ensure PayFast can reach your notify_url endpoint
- Check server logs for PayFast ITN requests

### Issue 4: Wrong Environment

**Symptoms**: Redirected to production instead of sandbox
**Solutions**:

- Verify `.env.local` has `NEXT_PUBLIC_PAYFAST_URL=https://sandbox.payfast.co.za/eng/process`
- Restart dev server after changing environment variables
- Clear browser cache
- Check server console logs for URL being used

## Verification Checklist

Before testing, verify:

- [ ] `.env.local` has correct PayFast credentials
- [ ] Passphrase matches PayFast dashboard exactly
- [ ] Using sandbox URL for testing
- [ ] All required parameters are included
- [ ] Signature calculation uses RAW values
- [ ] Parameters are sorted alphabetically
- [ ] Empty values are excluded
- [ ] Dev server restarted after env changes

## Next Steps

1. **Test Payment Flow**:

   - Visit `/test-payfast` page
   - Click "Test Payment" button
   - Check logs for signature string
   - Verify PayFast accepts the payment

2. **Check Server Logs**:

   - Look for "EXACT SIGNATURE STRING" in console
   - Verify signature matches expected format
   - Check for any error messages

3. **Verify Passphrase**:

   - Log into PayFast dashboard
   - Check Developer Settings > Passphrase
   - Ensure it matches `.env.local` exactly

4. **Test ITN Endpoint**:
   - Ensure `/api/payments/payfast/notify` is accessible
   - PayFast will call this after payment
   - Must return HTTP 200 to PayFast

## Files Modified

1. `app/api/payments/payfast/initiate/route.ts`:

   - Updated signature calculation to use RAW values
   - Enhanced documentation comments
   - Improved logging

2. `app/api/payments/payfast/notify/route.ts`:

   - Updated signature verification to use RAW values
   - Enhanced documentation comments

3. `verify-payfast-signature.js` (new):

   - Standalone signature verification tool
   - Tests both RAW and encoded methods
   - Confirms correct implementation

4. `PAYFAST_SIGNATURE_FIX.md` (new):
   - Root cause analysis
   - Troubleshooting guide

## Conclusion

The PayFast integration has been thoroughly reviewed and updated to match PayFast's official documentation requirements. The signature calculation now uses RAW values (not URL encoded), which is the PayFast standard.

**Key Takeaway**: PayFast calculates signatures on RAW values before URL encoding. The browser URL-encodes during form submission, but PayFast decodes them back to raw values before signature verification.

## Overview

Thorough review of PayFast integration based on developers.payfast.co.za documentation requirements.

## PayFast Signature Requirements (Official Documentation)

### Step-by-Step Process:

1. **Collect Parameters**: Gather all payment parameters (excluding signature field)
2. **Filter Empty Values**: Remove any empty, null, or undefined values
3. **Sort Alphabetically**: Sort all parameter keys alphabetically
4. **Trim Values**: Remove leading/trailing whitespace from all values
5. **Format String**: Create `key=value` pairs joined with `&`
6. **Append Passphrase**: Add `&passphrase=value` at the end (if passphrase is set)
7. **Use RAW Values**: Signature is calculated on RAW values (NOT URL encoded)
8. **MD5 Hash**: Generate MD5 hash of the entire string (lowercase hex)

### Critical Points:

- ✅ **RAW Values**: Signature uses raw values, browser URL-encodes during form submission
- ✅ **Passphrase**: Must match exactly with PayFast dashboard (case-sensitive, no extra spaces)
- ✅ **Alphabetical Order**: Parameters must be sorted strictly alphabetically
- ✅ **No Empty Values**: Empty values must be excluded from signature calculation

## Required PayFast Parameters

### Minimum Required:

- `merchant_id` - Your PayFast merchant ID
- `merchant_key` - Your PayFast merchant key
- `amount` - Payment amount (formatted as "X.XX")
- `item_name` - Name of the item/service
- `signature` - MD5 hash signature

### Recommended:

- `return_url` - Where to redirect after successful payment
- `cancel_url` - Where to redirect if user cancels
- `notify_url` - ITN callback URL (for server-side payment confirmation)
- `m_payment_id` - Unique payment ID (max 80 chars, alphanumeric + underscores)

### Optional:

- `item_description` - Description of item/service
- `email_address` - Customer email (PayFast will collect if not provided)
- `name_first` - Customer first name
- `name_last` - Customer last name
- `cell_number` - Customer phone number
- `custom_str1`, `custom_str2` - Custom data fields

## Current Implementation Status

### ✅ Fixed Issues:

1. **Signature Calculation**: Now uses RAW values (not URL encoded) - matches PayFast standard
2. **Passphrase Handling**: Correctly appended as RAW value
3. **Parameter Sorting**: Alphabetical sorting implemented
4. **Value Trimming**: All values are trimmed before signature calculation
5. **Empty Value Filtering**: Empty values excluded from signature

### ✅ Code Quality:

- Comprehensive logging for debugging
- Proper error handling
- Environment variable validation
- Sandbox vs Production URL detection

## Testing Tools Created

1. **verify-payfast-signature.js**: Standalone signature verification tool
2. **test-payfast.js**: Comprehensive API endpoint testing
3. **app/test-payfast/page.tsx**: Browser-based test page with persistent logs
4. **test-payfast-full.js**: Full payment flow simulation

## PayFast URLs

### Sandbox (Testing):

- **Process URL**: `https://sandbox.payfast.co.za/eng/process`
- **Dashboard**: PayFast sandbox account dashboard

### Production (Live):

- **Process URL**: `https://www.payfast.co.za/eng/process`
- **Dashboard**: PayFast production account dashboard

## Common Issues & Solutions

### Issue 1: Signature Mismatch

**Symptoms**: PayFast returns "Generated signature does not match submitted signature"
**Solutions**:

- Verify passphrase matches PayFast dashboard exactly
- Check that values are trimmed (no extra spaces)
- Ensure parameters are sorted alphabetically
- Confirm using RAW values (not URL encoded) for signature

### Issue 2: 400 Bad Request

**Symptoms**: PayFast returns 400 error
**Solutions**:

- Verify all required parameters are present
- Check merchant_id and merchant_key are correct
- Ensure using correct URL (sandbox vs production)
- Verify amount format is "X.XX" (two decimal places)

### Issue 3: 404 After Submission

**Symptoms**: Redirected to 404 page after form submission
**Solutions**:

- Check return_url and cancel_url are valid and accessible
- Verify notify_url is publicly accessible (for ITN)
- Ensure PayFast can reach your notify_url endpoint
- Check server logs for PayFast ITN requests

### Issue 4: Wrong Environment

**Symptoms**: Redirected to production instead of sandbox
**Solutions**:

- Verify `.env.local` has `NEXT_PUBLIC_PAYFAST_URL=https://sandbox.payfast.co.za/eng/process`
- Restart dev server after changing environment variables
- Clear browser cache
- Check server console logs for URL being used

## Verification Checklist

Before testing, verify:

- [ ] `.env.local` has correct PayFast credentials
- [ ] Passphrase matches PayFast dashboard exactly
- [ ] Using sandbox URL for testing
- [ ] All required parameters are included
- [ ] Signature calculation uses RAW values
- [ ] Parameters are sorted alphabetically
- [ ] Empty values are excluded
- [ ] Dev server restarted after env changes

## Next Steps

1. **Test Payment Flow**:

   - Visit `/test-payfast` page
   - Click "Test Payment" button
   - Check logs for signature string
   - Verify PayFast accepts the payment

2. **Check Server Logs**:

   - Look for "EXACT SIGNATURE STRING" in console
   - Verify signature matches expected format
   - Check for any error messages

3. **Verify Passphrase**:

   - Log into PayFast dashboard
   - Check Developer Settings > Passphrase
   - Ensure it matches `.env.local` exactly

4. **Test ITN Endpoint**:
   - Ensure `/api/payments/payfast/notify` is accessible
   - PayFast will call this after payment
   - Must return HTTP 200 to PayFast

## Files Modified

1. `app/api/payments/payfast/initiate/route.ts`:

   - Updated signature calculation to use RAW values
   - Enhanced documentation comments
   - Improved logging

2. `app/api/payments/payfast/notify/route.ts`:

   - Updated signature verification to use RAW values
   - Enhanced documentation comments

3. `verify-payfast-signature.js` (new):

   - Standalone signature verification tool
   - Tests both RAW and encoded methods
   - Confirms correct implementation

4. `PAYFAST_SIGNATURE_FIX.md` (new):
   - Root cause analysis
   - Troubleshooting guide

## Conclusion

The PayFast integration has been thoroughly reviewed and updated to match PayFast's official documentation requirements. The signature calculation now uses RAW values (not URL encoded), which is the PayFast standard.

**Key Takeaway**: PayFast calculates signatures on RAW values before URL encoding. The browser URL-encodes during form submission, but PayFast decodes them back to raw values before signature verification.
