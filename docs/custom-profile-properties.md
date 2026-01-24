# Custom Profile Properties — API Contract Proposal

## Status

Proposal (no implementation)

## Scope

Custom profile properties for Student and Teacher profiles with:

- Tenant-specific definitions
- Versioned global templates
- Tenant overrides (add/edit/disable)
- Current-only values
- Queryable filtering and export
- File fields stored in MinIO (max 5 MB)

Student and Teacher fields are **separate systems** with no shared definitions.

---

## Core Concepts

### Roles

- **Admin Staff**: configure templates, fields, and apply upgrades
- **Other roles**: fill data only

### Field Types

- `text`, `number`, `date`, `boolean`
- `select`, `multiSelect`
- `file`

### Validation Rules

- `required` (boolean)
- `min` / `max` (length or numeric)
- `regex` (pattern)
- `dateRange` (min/max date)
- `fileConstraints` (maxSizeBytes, allowedMimeTypes)

### Templates

- Global templates are **versioned**
- Tenant can **apply** and later **upgrade** (explicit action)
- Upgrades are **non-destructive** (tenant overrides win)

---

## Data Contracts (Types)

### Template

```ts
export type ProfileRole = "student" | "teacher";

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "multiSelect"
  | "file";

export type FieldValidation = {
  required?: boolean;
  min?: number;
  max?: number;
  regex?: string;
  dateRange?: { min?: string; max?: string }; // ISO date
  fileConstraints?: {
    maxSizeBytes?: number;
    allowedMimeTypes?: string[];
  };
};

export type FieldOption = {
  label: string;
  value: string;
  order?: number;
};

export type TemplateField = {
  key: string; // unique within template
  label: string;
  type: FieldType;
  helpText?: string;
  options?: FieldOption[]; // select/multiSelect
  validation?: FieldValidation;
  order?: number;
};

export type ProfileTemplate = {
  id: string;
  role: ProfileRole;
  name: string;
  version: string; // e.g., "1.0.0"
  isActive: boolean;
  fields: TemplateField[];
  createdAt: string;
  updatedAt: string;
};
```

### Tenant Field Definition

```ts
export type TenantField = {
  id: string;
  tenantId: string;
  role: ProfileRole;
  key: string; // unique per tenant + role
  label: string;
  type: FieldType;
  helpText?: string;
  options?: FieldOption[];
  validation?: FieldValidation;
  order?: number;
  isEnabled: boolean;
  sourceTemplateId?: string;
  sourceTemplateVersion?: string;
  createdAt: string;
  updatedAt: string;
};
```

### Field Value (Current Only)

```ts
export type FieldValue = {
  id: string;
  tenantId: string;
  role: ProfileRole;
  profileId: string; // studentId or teacherId
  fieldId: string;
  valueText?: string;
  valueNumber?: number;
  valueDate?: string; // ISO date
  valueBoolean?: boolean;
  valueSelect?: string; // single select value
  valueMultiSelect?: string[]; // multi-select values
  valueFile?: {
    fileId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    url: string;
  };
  updatedAt: string;
};
```

---

## API Endpoints

### 1) Global Templates (Admin Only)

#### List templates

- `GET /api/profile-templates?role=student|teacher`
- Returns list of versioned templates.

**Response**

```json
{
  "data": [ProfileTemplate]
}
```

#### Get template detail

- `GET /api/profile-templates/:templateId`

**Response**

```json
{
  "data": ProfileTemplate
}
```

### 2) Tenant Template Application (Admin Only)

#### Apply template version

- `POST /api/tenants/:tenantId/profile-templates/apply`

**Body**

```json
{
  "role": "student",
  "templateId": "tmpl_123",
  "templateVersion": "1.0.0"
}
```

**Behavior**

- Creates tenant fields if not exists
- Does not overwrite existing tenant overrides

**Response**

```json
{ "data": { "applied": true } }
```

#### Upgrade template version

- `POST /api/tenants/:tenantId/profile-templates/upgrade`

**Body**

```json
{
  "role": "student",
  "templateId": "tmpl_123",
  "fromVersion": "1.0.0",
  "toVersion": "1.1.0"
}
```

**Behavior**

- Adds new fields
- Keeps tenant overrides for existing keys

**Response**

```json
{ "data": { "upgraded": true } }
```

### 3) Tenant Field Management (Admin Only)

#### List tenant fields

- `GET /api/tenants/:tenantId/profile-fields?role=student|teacher`

**Response**

```json
{
  "data": [TenantField]
}
```

#### Create tenant field

- `POST /api/tenants/:tenantId/profile-fields`

**Body**

```json
{
  "role": "student",
  "key": "religion",
  "label": "Agama",
  "type": "select",
  "options": [
    { "label": "Islam", "value": "islam" },
    { "label": "Kristen", "value": "kristen" }
  ],
  "validation": { "required": true }
}
```

#### Update tenant field

- `PATCH /api/tenants/:tenantId/profile-fields/:fieldId`

**Body (partial)**

```json
{
  "label": "Agama",
  "isEnabled": true,
  "validation": { "required": true }
}
```

#### Disable tenant field

- `POST /api/tenants/:tenantId/profile-fields/:fieldId/disable`

#### Enable tenant field

- `POST /api/tenants/:tenantId/profile-fields/:fieldId/enable`

---

### 4) Profile Values (Student/Teacher)

#### Get profile fields + values

- `GET /api/tenants/:tenantId/profiles/:profileId/custom-fields?role=student|teacher`

**Response**

```json
{
  "data": {
    "fields": [TenantField],
    "values": [FieldValue]
  }
}
```

#### Upsert field values

- `PUT /api/tenants/:tenantId/profiles/:profileId/custom-fields?role=student|teacher`

**Body**

```json
{
  "values": [
    {
      "fieldId": "fld_1",
      "valueSelect": "islam"
    },
    {
      "fieldId": "fld_2",
      "valueText": "Jl. Mawar 5"
    }
  ]
}
```

**Response**

```json
{ "data": { "updated": true } }
```

---

### 5) Filtering & Export

#### Filter profiles by custom fields

- `POST /api/tenants/:tenantId/profiles/filter?role=student|teacher`

**Body**

```json
{
  "filters": [
    { "fieldKey": "religion", "op": "eq", "value": "islam" },
    { "fieldKey": "disability", "op": "eq", "value": true }
  ],
  "pagination": { "page": 1, "pageSize": 20 }
}
```

**Response**

```json
{
  "data": {
    "items": [
      {
        "profileId": "stu_1",
        "name": "Andi"
      }
    ],
    "pagination": { "page": 1, "pageSize": 20, "total": 1 }
  }
}
```

#### Export profiles with custom fields

- `POST /api/tenants/:tenantId/profiles/export?role=student|teacher`

**Body**

```json
{
  "filters": [{ "fieldKey": "religion", "op": "eq", "value": "islam" }],
  "format": "xlsx"
}
```

**Response**

```json
{
  "data": {
    "downloadUrl": "https://..."
  }
}
```

---

## Validation Rules (Server-Side)

- Ensure unique `key` per tenant + role.
- Enforce field type and value consistency.
- File uploads: reject if > 5MB or MIME not allowed.
- Disabling a field does not delete values.

---

## Security & Permissions

- Admin Staff only: template application, upgrades, field configuration
- All authenticated roles: read/write their own custom fields
- Tenant isolation enforced on every endpoint

---

## Open Questions (if needed)

- Export format priority: CSV vs XLSX
- Which MIME types allowed for file fields
- Localization for field labels and help text

---

## Non-Goals

- Historical field values
- Shared fields across Student/Teacher
- Cross-tenant templates customization

---

## UI Architecture Proposal (Routes + Screens)

This section proposes the **routes, screens, and key UI modules** to support custom profile properties. It is **design-only** (no implementation).

### A) Admin Configuration (Tenant)

**Entry:** Settings → Profile Customization

#### 1. Profile Customization Home

- **Route:** `/settings/profile-customization`
- **Purpose:** Hub to switch between Student and Teacher configurations
- **Content:**
  - Summary cards (Student / Teacher)
  - Last applied template version
  - Quick actions: Apply template, Upgrade template, Manage fields

#### 2. Student Fields Configuration

- **Route:** `/settings/profile-customization/student`
- **Purpose:** Manage tenant fields for Student
- **Key UI Blocks:**
  - Template info + version status
  - Field list (sortable), status badges (Enabled/Disabled)
  - Actions: Add field, Edit field, Disable/Enable

#### 3. Teacher Fields Configuration

- **Route:** `/settings/profile-customization/teacher`
- Same layout as Student, separate data

#### 4. Apply Template (Modal or Screen)

- **Route:** `/settings/profile-customization/:role/apply-template`
- **Purpose:** Choose template + version to apply
- **Behavior:** Applies initial fields or merges if already configured

#### 5. Upgrade Template (Modal or Screen)

- **Route:** `/settings/profile-customization/:role/upgrade-template`
- **Purpose:** Upgrade to a newer version
- **Behavior:** Shows diff summary (new fields only)

#### 6. Field Editor (Create/Edit)

- **Route:** `/settings/profile-customization/:role/fields/new`
- **Route:** `/settings/profile-customization/:role/fields/:fieldId`
- **Fields:**
  - Key, Label, Type
  - Validation config
  - Options (select/multiSelect)
  - Status: Enabled/Disabled
  - File constraints (if type = file)

---

### B) Profile Data Entry (Teacher / Student)

#### 1. Student Profile Detail

- **Route:** `/students/:studentId`
- **Tab:** “Custom Data” or “Additional Data”
- **Form:** Dynamic fields rendered from tenant definitions

#### 2. Teacher Profile Detail

- **Route:** `/teachers/:teacherId`
- **Tab:** “Custom Data” or “Additional Data”
- **Form:** Dynamic fields rendered from tenant definitions

---

### C) Filtering & Export (Phase 1)

#### 1. Student List with Filters

- **Route:** `/students`
- **Block:** “Advanced Filters”
  - Default filters (name, class, etc.)
  - Dynamic custom field filters (e.g., religion)

#### 2. Teacher List with Filters

- **Route:** `/teachers`
- Same behavior as Students

#### 3. Export Action

- **Location:** Student/Teacher list page
- **Behavior:** Export current filtered result set

---

## Filtering Strategy Proposal (Query Builder)

This defines how to build filter queries for custom fields in a structured and scalable way.

### Query Model

Filters are submitted as a list of condition objects:

```json
{
  "filters": [
    { "fieldKey": "religion", "op": "eq", "value": "islam" },
    { "fieldKey": "disability", "op": "eq", "value": true }
  ],
  "pagination": { "page": 1, "pageSize": 20 }
}
```

### Supported Operators

| Field Type  | Operators                                               |
| ----------- | ------------------------------------------------------- |
| text        | `eq`, `neq`, `contains`, `startsWith`, `endsWith`, `in` |
| number      | `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `between`, `in`  |
| date        | `eq`, `before`, `after`, `between`                      |
| boolean     | `eq`                                                    |
| select      | `eq`, `neq`, `in`                                       |
| multiSelect | `hasAny`, `hasAll`                                      |

### Filter Builder UI (Client)

- **Step 1:** Select field (dynamic from tenant definitions)
- **Step 2:** Operator list filtered by field type
- **Step 3:** Value input component matching field type
- **Step 4:** Add multiple filters (AND by default)

Optional future: group filters with OR/AND logic.

### Backend Querying Rules

- Resolve `fieldKey` to tenant field ID
- Apply operator based on field type
- Use typed storage columns for performance
- Ensure tenant and role scoping

### Export Strategy

- Export respects active filter set
- Export includes:
  - Core profile attributes
  - Custom fields as dynamic columns (per tenant role)

---

## UI Notes

- Use clear labels in Indonesian (e.g., “Data Tambahan” for tab)
- Show disabled fields in admin with muted state
- Provide field key uniqueness validation in admin form
- For file fields, show uploaded file size and validation errors
