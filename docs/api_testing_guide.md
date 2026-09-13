# ServiceOS API Testing Guide (Postman)

**Base URL:** `https://servicesos-api.duckdns.org`

The correct testing order is critical: Register → Login → Create Tenant → then everything else.

---

## Step 1: Register a User (Public — No Token Needed)
- **Method:** `POST`
- **URL:** `{{BASE_URL}}/auth/register`
- **Body:**
```json
{
  "email": "owner@sunshinesolar.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```
> **Note:** This creates a user with NO tenant yet. Save the `id` from the response as `USER_ID`.

---

## Step 2: Login (Public — No Token Needed)
- **Method:** `POST`
- **URL:** `{{BASE_URL}}/auth/login`
- **Body:**
```json
{
  "email": "owner@sunshinesolar.com",
  "password": "SecurePassword123!"
}
```
> Save the `accessToken` from the response. For ALL requests below (unless marked Public), add this Header:
> `Authorization: Bearer <accessToken>`

---

## Step 3: Create a Tenant (Requires Token)
- **Method:** `POST`
- **URL:** `{{BASE_URL}}/tenants`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Body:**
```json
{
  "name": "Sunshine Solar",
  "slug": "sunshine-solar"
}
```
> This creates the tenant and assigns your user as `TENANT_OWNER`. **Important:** You must log out and log back in after this step to get a fresh token that contains your new `tenantId` and `role`.

---

## Step 4: Re-Login (To Get Updated Token with tenantId)
- **Method:** `POST`
- **URL:** `{{BASE_URL}}/auth/login`
- **Body:**
```json
{
  "email": "owner@sunshinesolar.com",
  "password": "SecurePassword123!"
}
```
> Save this NEW `accessToken`. It now contains your `tenantId` and `role: TENANT_OWNER`. Use this token for everything below.

---

## Step 5: Create a Customer (Requires Token)
- **Method:** `POST`
- **URL:** `{{BASE_URL}}/customers`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Body:**
```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "phone": "+2348012345678",
  "address": "123 Solar Way",
  "city": "Austin"
}
```
> Save the `id` from the response as `CUSTOMER_ID`.

---

## Step 6: Create an Asset (Requires Token)
- **Method:** `POST`
- **URL:** `{{BASE_URL}}/assets`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Body:**
```json
{
  "name": "5kW Deye Inverter",
  "manufacturer": "Deye",
  "modelNumber": "DEYE-5K-PRO",
  "serialNumber": "SN-987654321",
  "customerRecordId": "<INSERT_CUSTOMER_ID>"
}
```

---

## Step 7: Create a Quote (Requires Token)
- **Method:** `POST`
- **URL:** `{{BASE_URL}}/quotes`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Body:**
```json
{
  "title": "Solar Installation Package",
  "amount": 15000,
  "customerRecordId": "<INSERT_CUSTOMER_ID>"
}
```
> Save the `id` from the response as `QUOTE_ID`.

---

## Step 8: Send the Quote (Requires Token)
- **Method:** `POST`
- **URL:** `{{BASE_URL}}/quotes/<INSERT_QUOTE_ID>/send`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Body:** `{}` (empty JSON)

---

## Step 9: View Quote via Portal (Public — No Token Needed)
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/portal/sunshine-solar/quotes/<INSERT_QUOTE_ID>`

---

## Step 10: Accept Quote via Portal (Public — No Token Needed)
This simulates a homeowner clicking "Accept" on their quote link.
- **Method:** `PATCH`
- **URL:** `{{BASE_URL}}/portal/sunshine-solar/quotes/<INSERT_QUOTE_ID>/accept`
- **Body:** `{}` (empty JSON)
> This also triggers a real-time WebSocket notification to all tenant staff!

---

## Step 11: Check Tenant Notifications (Requires Token)
Verify that the quote acceptance notification was saved.
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/notifications/tenant`
- **Headers:** `Authorization: Bearer <accessToken>`

---

## Step 12: Customer Portal — Request OTP (Public)
- **Method:** `POST`
- **URL:** `{{BASE_URL}}/portal/sunshine-solar/auth/request-otp`
- **Body:**
```json
{
  "phone": "+2348012345678"
}
```
> Check your PM2 logs on the server (`pm2 logs serviceos-api`) to find the 6-digit OTP code printed in the console.

---

## Step 13: Customer Portal — Verify OTP (Public)
- **Method:** `POST`
- **URL:** `{{BASE_URL}}/portal/sunshine-solar/auth/verify-otp`
- **Body:**
```json
{
  "phone": "+2348012345678",
  "code": "<6_DIGIT_CODE_FROM_LOGS>"
}
```
> Save this `accessToken` as `PORTAL_TOKEN`. This is the customer's JWT.

---

## Step 14: Customer Dashboard (Requires Portal Token)
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/portal/sunshine-solar/dashboard`
- **Headers:** `Authorization: Bearer <PORTAL_TOKEN>`

---

## Step 15: Customer Opens a Service Request (Requires Portal Token)
- **Method:** `POST`
- **URL:** `{{BASE_URL}}/portal/sunshine-solar/service-requests`
- **Headers:** `Authorization: Bearer <PORTAL_TOKEN>`
- **Body:**
```json
{
  "description": "My inverter is making a clicking noise."
}
```

---

## Step 16: Create a Maintenance Schedule (Requires Staff Token)
Switch back to your STAFF `accessToken`.
- **Method:** `POST`
- **URL:** `{{BASE_URL}}/maintenance/customers/<INSERT_CUSTOMER_ID>`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Body:**
```json
{
  "title": "Annual HVAC Checkup",
  "intervalMonths": 12,
  "firstDueDate": "2026-10-01T00:00:00Z"
}
```

---

## Step 17: View Upcoming Maintenance (Requires Staff Token)
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/maintenance/upcoming`
- **Headers:** `Authorization: Bearer <accessToken>`

---

## Step 18: CSV Import — Preview (Requires Staff Token)
- **Method:** `POST`
- **URL:** `{{BASE_URL}}/import/preview`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Body:**
```json
{
  "rows": [
    { "Full Name": "Test User", "Phone Num": "+2348099998888" }
  ],
  "mapping": {
    "Full Name": "name",
    "Phone Num": "phone"
  }
}
```
