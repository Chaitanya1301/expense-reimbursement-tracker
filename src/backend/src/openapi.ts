/**
 * Hand-maintained OpenAPI 3.0 spec for the Expense & Reimbursement Tracker
 * API. Served as JSON at /api/docs.json and as a browsable UI at /api/docs.
 */
export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Expense & Reimbursement Tracker API",
    version: "1.0.0",
    description:
      "REST API for submitting, reviewing, and tracking reimbursement requests. " +
      "Authentication uses an httpOnly JWT cookie set by POST /api/auth/login.",
  },
  servers: [{ url: "http://localhost:4000", description: "Local development" }],
  tags: [
    { name: "Auth" },
    { name: "Requests" },
    { name: "Receipts" },
    { name: "Dashboard" },
    { name: "Notifications" },
    { name: "Admin" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "token" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: { code: { type: "string" }, message: { type: "string" } },
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          role: { type: "string", enum: ["REQUESTER", "REVIEWER", "ADMIN"] },
        },
      },
      AdminUser: {
        allOf: [
          { $ref: "#/components/schemas/User" },
          {
            type: "object",
            properties: {
              status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        ],
      },
      ReimbursementRequest: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          amount: { type: "string", description: "Decimal amount, e.g. \"42.50\"" },
          expenseDate: { type: "string", format: "date-time" },
          category: {
            type: "string",
            enum: [
              "TRAVEL",
              "MEALS",
              "OFFICE_SUPPLIES",
              "SOFTWARE_SUBSCRIPTIONS",
              "EVENT_EXPENSES",
              "TRAINING",
              "OTHER",
            ],
          },
          description: { type: "string" },
          status: {
            type: "string",
            enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "PAID"],
          },
          rejectReason: { type: "string", nullable: true },
          requesterId: { type: "string", format: "uuid" },
          reviewerId: { type: "string", format: "uuid", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Receipt: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          fileName: { type: "string" },
          mimeType: { type: "string", enum: ["image/jpeg", "image/png", "application/pdf"] },
          sizeBytes: { type: "integer" },
          uploadedAt: { type: "string", format: "date-time" },
          requestId: { type: "string", format: "uuid" },
        },
      },
      HistoryEntry: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          action: { type: "string" },
          previousStatus: { type: "string", nullable: true },
          newStatus: { type: "string", nullable: true },
          comment: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          actor: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              role: { type: "string" },
            },
          },
        },
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          message: { type: "string" },
          isRead: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          relatedRequestId: { type: "string", format: "uuid", nullable: true },
        },
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer" },
          pageSize: { type: "integer" },
          total: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "No valid session cookie.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      Forbidden: {
        description: "Authenticated, but not allowed to perform this action.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NotFound: {
        description: "Resource not found.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      ValidationError: {
        description: "Invalid request body or query parameters.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
  },
  security: [{ cookieAuth: [] }],
  paths: {
    "/api/health": {
      get: {
        tags: ["Auth"],
        summary: "Health check",
        security: [],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in and receive a session cookie",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: { email: { type: "string" }, password: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Logged in",
            content: {
              "application/json": {
                schema: { type: "object", properties: { user: { $ref: "#/components/schemas/User" } } },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out and clear the session cookie",
        responses: { "204": { description: "Logged out" } },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the current authenticated user",
        responses: {
          "200": {
            description: "Current user",
            content: {
              "application/json": {
                schema: { type: "object", properties: { user: { $ref: "#/components/schemas/User" } } },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/requests": {
      get: {
        tags: ["Requests"],
        summary: "List reimbursement requests (own, if Requester; all, if Reviewer)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20, maximum: 50 } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "requesterId", in: "query", schema: { type: "string" }, description: "Reviewer only" },
          { name: "keyword", in: "query", schema: { type: "string" } },
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" } },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" } },
          { name: "amountMin", in: "query", schema: { type: "number" } },
          { name: "amountMax", in: "query", schema: { type: "number" } },
        ],
        responses: {
          "200": {
            description: "Paginated list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/ReimbursementRequest" } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Requests"],
        summary: "Create a reimbursement request (Requester only)",
        description: "Creates as Draft. Pass submit: true to immediately transition to Submitted.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "amount", "expenseDate", "category", "description"],
                properties: {
                  title: { type: "string" },
                  amount: { type: "number", minimum: 0.01 },
                  expenseDate: { type: "string", format: "date" },
                  category: { type: "string" },
                  description: { type: "string" },
                  submit: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: { type: "object", properties: { request: { $ref: "#/components/schemas/ReimbursementRequest" } } },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/requests/{id}": {
      get: {
        tags: ["Requests"],
        summary: "Get one reimbursement request (owner or any reviewer)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "object", properties: { request: { $ref: "#/components/schemas/ReimbursementRequest" } } },
              },
            },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Requests"],
        summary: "Edit a draft request (owner only, while status is Draft)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  amount: { type: "number" },
                  expenseDate: { type: "string", format: "date" },
                  category: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated" },
          "400": { $ref: "#/components/responses/ValidationError" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/requests/{id}/submit": {
      post: {
        tags: ["Requests"],
        summary: "Submit a draft request for review (owner only)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Submitted" },
          "400": { description: "Invalid status transition" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/requests/{id}/history": {
      get: {
        tags: ["Requests"],
        summary: "Get the audit history for a request",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { history: { type: "array", items: { $ref: "#/components/schemas/HistoryEntry" } } },
                },
              },
            },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/requests/{id}/start-review": {
      post: {
        tags: ["Requests"],
        summary: "Start reviewing a submitted request (Reviewer only)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Now Under Review" },
          "400": { description: "Invalid status transition" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/requests/{id}/approve": {
      post: {
        tags: ["Requests"],
        summary: "Approve a request under review (Reviewer only, not own request)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object", properties: { comment: { type: "string" } } },
            },
          },
        },
        responses: {
          "200": { description: "Approved" },
          "400": { description: "Invalid status transition" },
          "403": { description: "Wrong role, or reviewer is the request's own owner" },
        },
      },
    },
    "/api/requests/{id}/reject": {
      post: {
        tags: ["Requests"],
        summary: "Reject a request under review (Reviewer only, not own request)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reason"],
                properties: { reason: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Rejected" },
          "400": { description: "Missing reason, or invalid status transition" },
          "403": { description: "Wrong role, or reviewer is the request's own owner" },
        },
      },
    },
    "/api/requests/{id}/pay": {
      post: {
        tags: ["Requests"],
        summary: "Mark an approved request as Paid (Reviewer only, not own request)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Paid" },
          "400": { description: "Invalid status transition" },
          "403": { description: "Wrong role, or reviewer is the request's own owner" },
        },
      },
    },
    "/api/requests/{id}/receipts": {
      post: {
        tags: ["Receipts"],
        summary: "Upload a receipt for a request (owner only)",
        description:
          "multipart/form-data with a 'file' field. Actual file bytes are validated " +
          "server-side (magic-byte signature) regardless of the claimed content-type — " +
          "only JPEG, PNG, and PDF are accepted.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { type: "object", properties: { file: { type: "string", format: "binary" } } },
            },
          },
        },
        responses: {
          "201": {
            description: "Uploaded",
            content: {
              "application/json": {
                schema: { type: "object", properties: { receipt: { $ref: "#/components/schemas/Receipt" } } },
              },
            },
          },
          "400": { description: "Unsupported file type, or request is already closed out" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/requests/{id}/receipts/{receiptId}": {
      get: {
        tags: ["Receipts"],
        summary: "Download a receipt (owner or any reviewer only — never a public URL)",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "receiptId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "The file bytes, with the detected content-type" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Financial summary (own totals for Requester, all for Reviewer)",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    totalRequested: { type: "number" },
                    totalApproved: { type: "number" },
                    totalPending: { type: "number" },
                    totalPaid: { type: "number" },
                    countsByStatus: { type: "object" },
                  },
                },
              },
            },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "List the current user's notifications",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    notifications: { type: "array", items: { $ref: "#/components/schemas/Notification" } },
                    unreadCount: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/notifications/{id}/read": {
      patch: {
        tags: ["Notifications"],
        summary: "Mark one of the current user's notifications as read",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Updated" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List all users (Admin only)",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { users: { type: "array", items: { $ref: "#/components/schemas/AdminUser" } } },
                },
              },
            },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/admin/users/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Update a user's role and/or account status (Admin only)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  role: { type: "string", enum: ["REQUESTER", "REVIEWER", "ADMIN"] },
                  status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated" },
          "400": { $ref: "#/components/responses/ValidationError" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/admin/users/{id}/history": {
      get: {
        tags: ["Admin"],
        summary: "View a user's role/account-status change history (Admin only)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "OK" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
};
