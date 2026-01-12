# Backend API (Bruno Workspace)

This folder contains the Bruno workspace and collections for the backend API.

## Base URL

Default local URL: http://localhost:5000

## Authentication

Most endpoints require a Bearer token. Use the Login request to obtain an access token, then set accessToken in the environment.

## Standard Responses

Successful responses are wrapped using the standard format:

- success: boolean
- statusCode: number
- message: string
- data: object or array

Paginated responses also include a meta object with offset, limit, sort, and order.

Error responses are standardized:

- statusCode: number
- message: string
- error: string

## Pagination Query Params

Most list endpoints accept these query parameters:

- offset (default 0)
- limit (default 10)
- sort (default createdAt)
- order (asc or desc)

## Workspace Structure

- docs/api/backend/workspace.yml
- docs/api/backend/collections/backend/collection.bru
- docs/api/backend/collections/backend/environments/local.bru
- Request files grouped by domain: app, auth, users, profiles, tenants, examples
