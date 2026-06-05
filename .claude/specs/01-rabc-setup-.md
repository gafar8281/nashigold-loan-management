
# Role-Based Access Control (RBAC) and Firestore Database Design

## Requirements

Implement Role-Based Access Control (RBAC) for the application and remove the public account creation flow.

### Authentication Changes

* Remove the **Create Account / Sign Up** page completely.
* Users should only be able to log in using credentials created by the administrator.

### Default Super Admin Account

Create a default Super Admin account with the following credentials:

```text
Username: admin
Password: admin@123
Role: Super Admin
is_admin: true
```

### Super Admin Permissions

The Super Admin should have full access to:

1. Create Branches
2. Update Branches
3. Delete Branches
4. View All Branches
5. Manage Branch Credentials
6. Disable branch for temporarly.

### Branch Information

Each branch should contain the following fields:

```text
branchName
branchEmail
password
role = "branch"
isActive
createdAt
updatedAt
```

### Branch Access

* Branch users can log in using the credentials created by the Super Admin.
* Each branch should only have access to its own data.
* Branch users must not be able to create, update, or delete other branches.
* Branch users should not have access to admin-only features.

---

# Firestore Database Design

## Collection: users

```javascript
users
  └── {userId}
       ├── username
       ├── email
       ├── passwordHash
       ├── role          // "admin" | "branch"
       ├── branchId
       ├── isActive
       ├── createdAt
       └── updatedAt
```

### Admin Example

```javascript
{
  username: "admin",
  email: "admin@nashigold.com",
  passwordHash: "...",
  role: "admin",
  branchId: null,
  isActive: true
}
```

### Branch Example

```javascript
{
  username: "riyadh_branch",
  email: "riyadh@nashigold.com",
  passwordHash: "...",
  role: "branch",
  branchId: "branch_001",
  isActive: true
}
```

---

## Collection: branches

```javascript
branches
  └── {branchId}
       ├── branchName
       ├── branchEmail
       ├── isActive
       ├── createdAt
       └── updatedAt
```

### Example

```javascript
{
  branchName: "Riyadh Branch",
  branchEmail: "riyadh@nashigold.com",
  isActive: true
}
```

---

# Access Control Rules

## Admin

* Full system access.
* Manage branches and users.
* View all application data.

## Branch

* Access only data associated with their branch.
* Manage customers, loans, and transactions belonging to their branch.
* Cannot access admin functionality.
* Cannot view data from other branches.

---

# Implementation Notes

* Add route guards to prevent unauthorized access to admin pages.
* Show or hide menu items based on the logged-in user's role.
* Redirect unauthenticated users to the login page.
