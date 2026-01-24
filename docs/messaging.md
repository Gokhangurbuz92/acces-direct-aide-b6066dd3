# Messaging System Documentation

## Overview
The messaging system allows secure communication between Professionals (Pro) and Beneficiaries (Public) within the context of an Appointment. It supports threaded messages, read receipts, and secure file attachments.

## Architecture

### Data Model
*   **Message**: Linked to an `Appointment`. Contains `content_encrypted`, `sender` ('PRO' or 'BENEFICIARY'), `read_at` timestamp.
*   **Attachment**: Linked to a `Message`. Contains metadata and `storage_key`. Content is encrypted at rest.

### Authentication
*   **Pro**: Authenticated via Bearer token (JWT) verifying ownership of the Structure.
*   **Beneficiary**: Authenticated via `access_token` (hashed and matched against `Appointment.access_token_hash`).

### Security
*   **Encryption**:
    *   Message content is encrypted using AES-256-GCM.
    *   Attachments are encrypted using AES-256-GCM before storage.
    *   Filenames are encrypted.
*   **Access Control**:
    *   Strict ownership checks: `Appointment.structureId` matches Pro's structure.
    *   Beneficiary token hash validation.
    *   Attachments are only accessible via signed tokens with short expiration.

## API Endpoints

### Pro Endpoints (`/api/pro/messages`)

*   **GET** `?appointmentId=...&page=1&pageSize=50`
    *   Returns paginated messages with `downloadUrl` for attachments.
    *   Response includes `pagination` metadata.
*   **POST**
    *   Body: `{ content: "..." }`
    *   Sends a message as 'PRO'.
*   **PATCH**
    *   Body: `{ action: "read_all" }`
    *   Marks all beneficiary messages as read.
*   **DELETE**
    *   Body: `{ messageId: "..." }`
    *   Deletes a message and cleans up associated attachments from storage.

### Public Endpoints (`/api/public/messages`)

*   **GET** `?token=...&page=1&pageSize=50`
    *   Returns paginated messages with `downloadUrl` for attachments.
*   **POST**
    *   Body: `{ content: "..." }`
    *   Sends a message as 'BENEFICIARY'.
*   **PATCH**
    *   Body: `{ action: "read_all" }`
    *   Marks all pro messages as read.

### Upload (`/api/upload`)

*   **POST** (Multipart)
    *   Fields: `appointmentId`, `access_token` (optional if Pro).
    *   Headers: `Authorization` (optional if Beneficiary).
    *   File: `file`.
    *   Creates a new message with attachment.
    *   Validates sender identity (Pro vs Beneficiary) and sets `sender` field accordingly.

### Download (`/api/download`)

*   **GET** `?token=...`
    *   Token is a signed JWT-like structure (HMAC-SHA256) containing `attachmentId` and `exp`.
    *   Validates token signature and expiration.
    *   Decrypts and streams the file.

## Testing & Verification
A verification script `scripts/verify_messaging.js` is available to test the end-to-end flow, including:
1.  Message creation (Pro & Beneficiary).
2.  File upload and encryption.
3.  Secure download (token validation).
4.  Unauthorized access rejection.
5.  Read status updates.

## Retention
Attachments are deleted from storage when the parent message is deleted via the API.
