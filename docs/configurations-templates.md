# Configuration Templates (JSON)

Default configuration templates are stored as individual JSON files under:

- apps/backend/src/configurations/templates/\*.json

## Schema (per file)

```
{
  "id": "default",
  "name": "Default",
  "description": "Optional description",
  "isActive": true,
  "profile": {
    "customFields": {
      "student": [
        {
          "key": "religion",
          "label": "Agama",
          "type": "select",
          "helpText": "Optional",
          "options": [
            { "label": "Islam", "value": "islam", "order": 1 }
          ],
          "validation": { "required": false },
          "order": 1,
          "isEnabled": true
        }
      ],
      "teacher": []
    }
  }
}
```

Notes:

- File name does not have to match the template `id`.
- If `isActive` is omitted, it defaults to `true` in the template list.

## Usage

- **Default template apply:** send `templateId` to the apply endpoint.
- **Custom configuration apply:** send a `config` payload with the same schema.

## Tenant Configuration State

Profile template usage is tracked per-tenant in `TenantConfiguration` (type `PROFILE`).
Retrieve the current state via:

- `GET /configurations/tenants/:tenantId/profile-configuration`

Response fields include:

- `templateId` (nullable)
- `isCustomized` (boolean)
- `appliedAt` (nullable)

UI behavior:

- Show template name when `templateId` is set and `isCustomized=false`.
- Show “Kustom” when `templateId` is null or `isCustomized=true`.
