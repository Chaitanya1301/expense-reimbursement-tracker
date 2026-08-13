# CDF SDE Hackathon - Submission Guide

## Build a Simple Expense & Reimbursement Tracker

**Dates:** August 13, 11:00 AM – August 18, 5:00 PM EST
**Domain:** Software Development
**Format:** Individual
**Duration:** 5 Days

---

## Challenge Overview

This is a **Software Development hackathon**.

Participants will build a **Simple Expense & Reimbursement Tracker**: a secure, user-friendly full-stack web application where users can submit reimbursement requests and authorized reviewers can review, approve, reject, and manage those requests through completion.

Small organizations, nonprofit teams, volunteer groups, and growing businesses often manage reimbursement requests through:

* Emails
* Chat messages
* Paper receipts
* Shared spreadsheets
* Informal approval processes

When requests are spread across multiple systems, it becomes difficult to determine:

* Whether a request was submitted correctly
* Whether the required receipt was included
* Who is responsible for reviewing it
* Whether it was approved or rejected
* Whether reimbursement has been completed
* How much money is currently pending or approved
* Why a request is delayed

Your goal is to replace that fragmented process with **one clear reimbursement workflow**.

The application should make it easy to answer three questions:

1. **What reimbursement requests have been submitted?**
2. **What is the current status of each request?**
3. **What action must the requester or reviewer take next?**

Use only **fictional or synthetic information** when building, testing, and demonstrating your solution.

---

## Level

This challenge is designed to be completed by an individual participant over **5 days**.

The core requirements are intentionally achievable within that period. Stronger participants have room to demonstrate additional engineering depth through the Tier 2 stretch goals.

Focus first on building a complete and reliable Tier 1 solution.

The primary workflow is:

**Create → Submit → Review → Approve / Reject → Paid**

A smaller, dependable application with a complete workflow should score higher than a feature-heavy application whose core functionality is incomplete.

How you design and build the solution is up to you.

---

# Tier 1 - Core Requirements

Tier 1 represents the functionality every complete submission should prioritize.

## 1. User Roles

The application should support the following roles.

### Requester

A requester is a person seeking reimbursement for an eligible expense.

A requester should be able to:

* Create a reimbursement request
* Enter expense information
* Attach a receipt
* Save or submit the request
* View previously submitted requests
* Track the current status
* View reviewer comments
* View rejection reasons
* View relevant request history

### Reviewer

A reviewer is an authorized user responsible for evaluating reimbursement requests.

A reviewer should be able to:

* View submitted requests
* Open full request details
* Review expense information and receipts
* Approve requests
* Reject requests
* Provide comments
* Provide a reason when rejecting a request
* Request additional information where implemented
* Mark an approved request as **Paid**
* Search and filter requests
* View pending work and financial summaries

### Administrator

The minimum reimbursement workflow centers on Requesters and Reviewers, but this hackathon also includes an **Administrator** role as part of the additional technical requirements.

An administrator should be able to:

* View users
* View fictional email addresses
* View assigned roles
* View account status
* View account creation dates
* Assign or update user roles
* Activate user accounts
* Deactivate user accounts
* View relevant role and account-status history

---

## 2. Reimbursement Workflow

A typical reimbursement workflow should operate as follows:

1. A requester creates a reimbursement request.
2. The requester enters the required expense information.
3. The requester attaches or references a receipt.
4. The application validates the information.
5. The requester submits the request.
6. A reviewer views the submitted request.
7. The reviewer evaluates the expense and receipt.
8. The reviewer approves or rejects the request.
9. If rejected, the requester can see the reason.
10. If approved, the request can later be marked as **Paid**.
11. Both users can view the current status and relevant history.

### Recommended Statuses

Use a clear status model such as:

* Draft
* Submitted
* Under Review
* Approved
* Rejected
* Paid

For a simplified implementation, **Submitted** and **Under Review** may be combined if your workflow is clearly explained.

Status transitions should be intentional and enforced by the application.

For example:

* A Draft can become Submitted.
* A Submitted request can become Under Review.
* An Under Review request can become Approved or Rejected.
* An Approved request can become Paid.
* A Rejected request should not accidentally become Paid.

---

## 3. Create a Reimbursement Request

The application must provide a reimbursement request form.

At minimum, collect:

* Expense title or purpose
* Amount
* Expense date
* Category
* Description or business justification
* Receipt or receipt reference

Suggested categories include:

* Travel
* Meals
* Office supplies
* Software or subscriptions
* Event expenses
* Training
* Other

Participants may add additional categories where appropriate.

---

## 4. Validation and Error Handling

The application must provide clear validation and useful error messages.

Examples include:

* Amount must be greater than zero
* Expense date cannot be empty
* Category must be selected
* Required fields cannot be blank
* Unsupported receipt types should not be accepted
* Invalid files should be rejected
* Requests should not accidentally be submitted twice
* Invalid workflow actions should be prevented
* Unauthorized actions should return appropriate errors

Validation should not exist only in the frontend.

Where a backend is used, important business rules and permissions must also be validated by the backend.

The application should handle invalid or unexpected input gracefully rather than displaying:

* Internal stack traces
* Database errors
* Secret values
* Raw server exceptions

---

## 5. View Submitted Requests

Requesters should be able to view their current and previous reimbursement requests.

Each request should clearly display useful information such as:

* Request title
* Amount
* Submission date
* Category
* Current status
* Reviewer comments, when applicable

Users should be able to determine the state of a request without having to contact another user for clarification.

---

## 6. Reviewer Dashboard

Reviewers should have a dedicated area for managing reimbursement requests.

The dashboard should display:

* Requests assigned to or available for review
* Pending request count
* Total pending amount
* Relevant workflow actions

Useful filters should include:

* Status
* Requester
* Category
* Date
* Amount

Reviewers should be able to:

* Open a request
* Review its details
* View its receipt
* Approve it
* Reject it
* Provide a rejection reason
* Request additional information where implemented
* Mark an approved request as Paid

The application should also make it clear how long a request has been waiting for review.

---

## 7. Search and Filtering

Users should be able to search or filter requests.

At minimum, support useful filtering across the workflow.

Possible filters include:

* Status
* Category
* Date
* Requester
* Amount
* Keyword

Filters should behave consistently and should work correctly with pagination where pagination is implemented.

---

## 8. Dashboard and Financial Summary

The application should provide a basic financial summary.

At minimum, display:

* Total amount requested
* Total amount approved
* Total amount pending
* Total amount paid
* Number of requests by status

Dashboard calculations should be accurate and based on persisted application data.

---

## 9. Persistent Data Storage

Information must remain available after the application is refreshed or restarted.

Use an appropriate persistent database such as:

* SQLite
* PostgreSQL
* MySQL
* MongoDB
* Supabase
* Firebase
* Another suitable database

A database-backed solution is strongly preferred over browser-only local storage.

The data model should reasonably represent entities such as:

* Users
* Roles
* Reimbursement requests
* Receipts
* Statuses
* Reviewer decisions
* Notifications
* Request history
* Relevant timestamps

---

## 10. Role-Based Access Control

Permissions must be associated with authenticated users.

At minimum:

* Requesters must not perform reviewer-only actions.
* Requesters must not approve their own requests.
* Requesters must not mark their own requests as Paid.
* Reviewers should only access information they are authorized to view.
* Administrator functionality must be restricted to administrators.

Permissions must be enforced by the **backend**, not only by hiding buttons in the frontend.

Protected APIs should return appropriate responses such as:

* `401 Unauthorized`
* `403 Forbidden`

when access is invalid.

---

## 11. Authentication

Authentication may remain relatively simple for the hackathon.

Possible approaches include:

* A standard login system
* Preconfigured demonstration accounts
* An authentication provider
* Another clearly documented authentication mechanism

A production-scale enterprise identity platform is not required.

However, your implementation must clearly associate application roles with authenticated users.

---

## 12. Responsive Frontend

Major workflows should work across:

* Desktop
* Tablet
* Mobile

Your application should:

* Avoid unnecessary horizontal scrolling
* Keep forms usable on smaller screens
* Keep workflow actions accessible
* Keep navigation usable
* Keep filters usable
* Use responsive tables or mobile card layouts where appropriate

Test major workflows at multiple viewport sizes.

---

## 13. API Design

If your application uses backend APIs, they should be designed consistently.

Provide APIs where appropriate for:

* Users
* Reimbursement requests
* Reviews
* Notifications
* Request history

Use:

* Consistent endpoint naming
* Appropriate HTTP methods
* Appropriate status codes
* Consistent error-response formats

Where list endpoints are used, support appropriate:

* Filtering
* Sorting
* Pagination

API documentation should be available using:

* OpenAPI
* Swagger
* Or an equivalent approach

---

## 14. Pagination

Use server-side pagination where appropriate for resources such as:

* Reimbursement requests
* Users
* Notifications
* History records

Paginated responses should provide useful metadata such as:

* Page number
* Page size
* Total records
* Total pages

The UI should provide:

* Previous-page navigation
* Next-page navigation

Filters and sorting should remain active when changing pages.

Use a reasonable maximum page size to avoid unnecessarily large requests.

---

## 15. Receipt Attachment Handling

Support common receipt formats:

* JPEG
* PNG
* PDF

Allow at least one receipt attachment for a reimbursement request.

Implement a reasonable upload limit such as:

* 5 MB
* or 10 MB

Validate the **actual file type on the backend** rather than trusting only the filename extension.

Reject:

* Unsupported files
* Executable files
* Invalid uploads

Where object storage is used, receipts should be stored in a **private bucket** rather than being publicly accessible.

Receipt access should only be provided after confirming that the authenticated user is authorized to view the related reimbursement request.

Short-lived signed URLs are recommended when using object storage.

---

## 16. Notifications

Generate an in-application notification when important request statuses change.

A notification should contain appropriate information such as:

* Recipient
* Message
* Timestamp
* Related reimbursement request
* Read/unread status

Users should be able to:

* View their notifications
* Mark notifications as read

---

## 17. Request History and Auditability

Each reimbursement request should provide a chronological history.

For relevant workflow updates, record information such as:

* User
* Action
* Timestamp
* Previous status
* New status
* Reason or comment

Administrator role or account-status changes should also be recorded where applicable.

---

## 18. Application Security

This is not expected to be a production financial system, but basic security practices are required.

Your solution should:

* Require authentication for protected functionality
* Perform authorization on the backend
* Perform backend input validation
* Prevent unauthorized request access
* Prevent unauthorized modification
* Store secrets using environment variables
* Protect database credentials
* Protect API keys
* Avoid exposing internal application errors
* Avoid exposing stack traces
* Avoid exposing secret values
* Validate uploaded files
* Restrict receipt access
* Use fictional or synthetic data only

Never commit secrets to the repository.

---

## 19. Setup and Developer Experience

Another developer or judge should be able to run your application using the provided documentation.

Your repository should include:

* Clear installation instructions
* Clear run instructions
* Required dependency information
* Database setup instructions
* Demonstration credentials where applicable
* A sample environment configuration such as `.env.example`

A Dockerized local setup is strongly encouraged.

A strong setup should allow a reviewer to start the major application components without manually discovering undocumented dependencies.

---

# Tier 2 - Stretch Goals

Tier 1 proves that you can build a complete and dependable reimbursement-management system.

Tier 2 allows strong submissions to demonstrate additional engineering depth.

**Do not attempt Tier 2 at the expense of an incomplete Tier 1 solution.**

You do not need to implement every stretch goal.

Pick areas that meaningfully strengthen your application and go deep rather than adding many unfinished features.

---

## Workflow and Product Depth

Possible enhancements include:

* Editable reimbursement drafts
* Resubmission after rejection
* More detailed approval history
* Multiple approval levels
* Advanced workflow rules
* More detailed notifications
* Email notifications
* Request reminders
* Budget-limit warnings
* Duplicate-request detection

---

## Receipt and Document Intelligence

Possible enhancements include:

* Receipt image preview
* Receipt metadata extraction
* Automated receipt data extraction
* Suggested amount extraction
* Suggested date extraction
* Suggested merchant extraction
* Receipt/request consistency checks

Any automated extraction should assist the user rather than silently override submitted information.

---

## Reporting and Analytics

Possible enhancements include:

* Monthly expense charts
* Spending trends
* Spending by category
* Spending by requester
* Approval-time analytics
* Reviewer workload metrics
* CSV export
* PDF export
* Additional useful financial summaries

---

## Backend and API Depth

Possible enhancements include:

* Advanced query optimization
* More sophisticated server-side filtering
* Flexible sorting
* Cursor-based pagination
* API versioning
* Rate limiting
* Improved API observability
* Database indexing
* Database migrations
* Seed-data tooling
* Background jobs where appropriate

---

## Testing and Reliability

Possible enhancements include:

* Extensive unit tests
* API integration tests
* End-to-end tests
* Role and permission tests
* Workflow-state tests
* Database persistence tests
* Receipt-upload security tests
* Automated acceptance tests
* CI-based test execution
* Automated linting and formatting
* Deployment validation

---

## Accessibility and User Experience

Possible enhancements include:

* Improved keyboard navigation
* Screen-reader support
* Accessible labels and form errors
* Strong focus management
* Improved empty states
* Improved loading states
* Improved confirmation states
* Better mobile layouts
* Responsive data visualizations
* More advanced search and filtering

---

## Deployment and Developer Experience

Possible enhancements include:

* Docker Compose setup
* Automated database migrations
* Automated seed-data generation
* Continuous integration
* Continuous deployment
* Cloud deployment
* Health checks
* Application logging
* Monitoring
* Structured error reporting

---

## Stretch Goal Guidance

Stretch features are evidence of engineering depth, not simply feature count.

A participant who builds one or two thoughtful, secure, tested enhancements on top of a complete core workflow should be viewed more favorably than someone who attempts many advanced features without finishing the basic application.

The priority remains:

**Create → Submit → Review → Approve / Reject → Paid**

Build that reliably first.

Then use Tier 2 to demonstrate additional engineering depth.

---

# What You Are Not Expected to Build

To keep the challenge achievable within five days, participants are **not required** to:

* Process real reimbursements
* Transfer real money
* Connect to banks
* Connect to credit cards
* Integrate with PayPal
* Integrate with Stripe
* Integrate with Razorpay
* Perform tax compliance
* Perform accounting compliance
* Build payroll functionality
* Use real organizational financial records
* Develop a native mobile application
* Build enterprise-scale security infrastructure
* Build highly complex approval systems
* Integrate with enterprise accounting platforms
* Deliver a production-ready financial system

Do not allow these areas to distract from completing the required workflow.

---

# Technology

Participants may choose an appropriate technology stack.

Examples include:

### Frontend

* React
* Angular
* Vue
* HTML / CSS / JavaScript
* Other suitable frameworks

### Backend

* Node.js / Express
* Django
* Flask
* FastAPI
* Spring Boot
* .NET
* Ruby on Rails
* Other suitable backend frameworks

### Database

* PostgreSQL
* MySQL
* SQLite
* MongoDB
* Supabase
* Firebase
* Other appropriate databases

Participants may use:

* Open-source libraries
* UI component libraries
* Free hosting platforms
* Free database services
* Appropriate development tools

Participants should **not receive additional credit merely for choosing a more complicated technology stack**.

Judges should evaluate how effectively technical decisions support the application requirements.

---

# Minimum Demonstration Scenario

During the final demonstration, participants should show the following common workflow:

1. Log in or demonstrate the relevant user roles.
2. Create a new reimbursement request.
3. Show at least one validation error.
4. Submit a valid request.
5. View the request as a reviewer.
6. Review its details and receipt.
7. Approve one request.
8. Reject another request and provide a reason.
9. Show the requester seeing the updated status or rejection reason.
10. Mark an approved request as **Paid**.
11. Filter or search reimbursement requests.
12. Show dashboard totals.
13. Demonstrate role restrictions.
14. Explain how application data is stored.
15. Explain how receipts and sensitive configuration are protected.

This common workflow allows judges to compare submissions consistently.

---

# Grading Rubric

| Evaluation Category               |   Weight |
| --------------------------------- | -------: |
| Core functionality and workflow   |  **30%** |
| Code quality and organization     |  **15%** |
| User experience and accessibility |  **15%** |
| Validation and error handling     |  **10%** |
| Data design and persistence       |  **10%** |
| Security and role management      |  **10%** |
| Testing, documentation, and setup |  **10%** |
| **Total**                         | **100%** |

---

## Core Functionality and Workflow - 30%

Judges should verify whether the primary reimbursement workflow works correctly from end to end:

**Create → Submit → Review → Approve / Reject → Paid**

The workflow should be connected rather than implemented as isolated screens.

---

## Code Quality and Organization - 15%

Judges should consider:

* Readability
* Organization
* Maintainability
* Naming
* Modularity
* Separation of responsibilities
* Appropriate technical decisions

---

## User Experience and Accessibility - 15%

The application should be understandable without extensive instructions.

Consider:

* Clear navigation
* Clear status indicators
* Clear workflow actions
* Responsive design
* Accessible forms
* Useful feedback
* Consistent interaction patterns

---

## Validation and Error Handling - 10%

The solution should respond appropriately to:

* Missing data
* Invalid data
* Invalid amounts
* Unsupported files
* Unauthorized actions
* Invalid workflow transitions
* Duplicate submissions
* Unexpected application errors

---

## Data Design and Persistence - 10%

The database should reasonably represent:

* Users
* Roles
* Reimbursement requests
* Statuses
* Receipts
* Reviewer actions
* History
* Other relevant application entities

Application state should persist correctly.

---

## Security and Role Management - 10%

Judges should evaluate whether:

* Requester and reviewer permissions differ correctly
* Administrator permissions are protected
* Backend authorization is enforced
* Users cannot approve their own requests
* Sensitive configuration is protected
* Receipt access is appropriately restricted
* Secrets are not committed to the repository

---

## Testing, Documentation, and Setup - 10%

Another developer or judge should be able to:

* Understand the application
* Install it
* Configure it
* Run it
* Access demonstration accounts
* Understand major design decisions
* Review evidence that the solution was tested

---

# Judging Principles

Judges should prioritize:

* A working core solution over a visually impressive but incomplete solution
* Correct workflows over feature count
* Reliability over unnecessary complexity
* Thoughtful technical decisions
* Clear documentation
* Appropriate security practices
* Correct role enforcement
* The participant's understanding of their own system

Tier 2 functionality should strengthen a complete Tier 1 implementation.

It should not compensate for missing core requirements.

---

# Testing Expectations

Participants should provide evidence that important application behavior was tested.

Useful scenarios include:

* Valid reimbursement submission
* Missing required information
* Missing receipt
* Invalid amount
* Invalid category
* Unsupported receipt format
* Duplicate submission prevention
* Reviewer approval
* Reviewer rejection
* Required rejection reason
* Approved request marked as Paid
* Unauthorized reviewer action
* Requester attempting reviewer functionality
* Requester attempting to approve their own request
* Search and filtering
* Pagination
* Dashboard calculations
* Receipt access permissions
* Data persistence

Automated testing is encouraged.

The quality and relevance of tests matter more than simply having a large number of test files.

---

# Sample Data

Use only fictional or synthetic data.

A useful sample dataset should include:

* A valid office-supply reimbursement
* A travel request missing a receipt
* A meal request with an invalid amount
* An approved request awaiting payment
* A rejected request with a reason
* A paid request
* Requests from different fictional users
* Requests from different categories
* Requests in different workflow states

CDF may also provide standard acceptance-test scenarios to help judges evaluate submissions consistently.

Never use real:

* Personal information
* Financial information
* Employee information
* Volunteer information
* CDF information
* Organizational confidential information

---

# Submission Requirements

Each participant must submit:

1. A working application or functional prototype
2. An accessible source-code repository
3. Complete source code
4. A README containing:

   * Problem overview
   * Features implemented
   * Technology stack
   * Setup instructions
   * Run instructions
   * Demonstration credentials
   * Known limitations
   * Future improvements
5. A **3-5 minute walkthrough video**
6. A live application URL or appropriate screenshots
7. Test cases or evidence of testing
8. Sample fictional data
9. Disclosure of:

   * Existing code
   * Templates
   * Libraries
   * Tutorials
   * External resources
   * AI tools used according to the announced CDF AI-use policy
10. A brief architecture or data-flow explanation

Only work submitted or committed before the official deadline should be considered during judging.

---

# Video Requirements

Your **3-5 minute walkthrough video** should demonstrate and explain:

* What you built
* Your technology stack
* Your application architecture
* The requester workflow
* The reviewer workflow
* Creating a reimbursement request
* A validation error
* Submitting a valid request
* Viewing and reviewing the request
* Approving a request
* Rejecting a request with a reason
* Marking an approved request as Paid
* Searching or filtering requests
* Dashboard totals
* Role-based access control
* How data is persisted
* How receipts are protected
* Important tests performed
* Known limitations
* What you would improve next

Link your video from `docs/walkthrough.md`.

---

# AI Usage

AI-assisted development tools may be used according to the **CDF AI-use policy announced for the hackathon**.

If you use AI tools, you are still responsible for:

* Driving the design of your solution
* Understanding the code you submit
* Reviewing generated changes
* Testing generated code
* Making technical decisions
* Explaining those decisions
* Verifying security-sensitive logic
* Ensuring your implementation satisfies the requirements

Do not treat generated code as automatically correct.

Disclose AI tools and other external resources used during development in:

`docs/reflection.md`

You should be able to explain:

**"Why did you build it this way?"**

without relying on an AI system to answer for you.

---

# Commit History

Your Git history should show how the application evolved during the hackathon.

Commit regularly for meaningful units of work.

Good examples include:

* `Add reimbursement request data model`
* `Implement requester submission API`
* `Add request form validation`
* `Implement reviewer approval workflow`
* `Add role-based access control`
* `Add receipt upload validation`
* `Implement dashboard summaries`
* `Add request filtering and pagination`
* `Add workflow integration tests`

Avoid meaningless commit messages such as:

* `fix`
* `stuff`
* `update`
* `changes`
* `asdf`

Do not:

* Commit `.env` files
* Commit API keys
* Commit database credentials
* Commit secret tokens
* Commit unnecessary generated dependencies
* Squash the entire project into one final commit

Your commit history should make it possible to follow how you designed and built the solution.

---

# Eligibility and Submission Integrity

A submission may be considered incomplete or flagged for review when:

* The repository cannot be accessed
* The application cannot be run and no usable demonstration is provided
* Required source code is missing
* The solution was substantially completed before the event and was not disclosed
* Another project was copied without attribution
* Real confidential or financial information was used
* Application functionality was misrepresented
* The announced AI-use policy was violated
* The submission was made after the deadline

Potential violations should be reviewed by the organizing committee.

---

# Final Reminder

Build the **core workflow first**:

**Create → Submit → Review → Approve / Reject → Paid**

A strong Tier 1 submission should provide:

* Clear authentication
* Requester access
* Reviewer access
* Administrator access where required
* A usable reimbursement form
* Receipt handling
* Proper validation
* Persistent storage
* Request history
* Reviewer dashboard
* Approval functionality
* Rejection functionality
* Required rejection reasons
* Correct status transitions
* Paid status
* Search and filtering
* Pagination
* Accurate dashboard totals
* Role-based access control
* Secure configuration
* Clear success and error messages
* Responsive design
* API documentation
* Useful project documentation
* Demonstrated testing

Once those requirements work reliably, use **Tier 2** to demonstrate additional engineering depth.

A complete, secure, tested, understandable solution is more valuable than a larger application full of unfinished features.

**Use fictional or synthetic data only.**
