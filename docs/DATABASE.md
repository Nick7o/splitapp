# Database

SplitApp uses PostgreSQL with EF Core code-first migrations.

The current public schema starts from one baseline migration:

```text
backend/SplitApp.Infrastructure/Migrations/20260428100405_InitialCreate.cs
```

That migration was created before the public release to keep the repository easy to read. From this release onward, schema changes should be added as forward EF Core migrations instead of rewriting the existing migration history.

## Source Of Truth

The database shape is defined by:

- domain entities in `backend/SplitApp.Domain`
- EF Core mapping in `backend/SplitApp.Infrastructure/Data/AppDbContext.cs`
- migration files in `backend/SplitApp.Infrastructure/Migrations`

When the schema changes, update the entity/model mapping, add a migration, and keep this document aligned with the public schema.

## Migration Policy

- Do not edit or remove committed migrations after publication.
- Add a new migration for every schema change.
- Keep destructive changes explicit and document the data impact.
- Local development databases can be reset freely when local data is disposable.
- Production or shared databases should be migrated forward and backed up before risky changes.

## Local Database

`docker-compose.yml` starts PostgreSQL:

```bash
docker compose up -d db
```

Default local connection:

```text
Host=localhost;Port=5432;Database=splitapp_db;Username=splitapp_user;Password=splitapp_dev_password
```

These are local Docker credentials only. Use environment-specific credentials for any deployed instance.

The API applies pending EF Core migrations on startup for relational databases:

```csharp
db.Database.Migrate();
```

The test host uses EF Core's in-memory provider and creates that transient database with `EnsureCreated()`.

You can also apply migrations manually:

```bash
dotnet ef database update \
  --project backend/SplitApp.Infrastructure \
  --startup-project backend/SplitApp.Api
```

## Resetting Local Data

For local development, reset PostgreSQL when local data can be lost:

```bash
docker compose down -v
docker compose up -d db
dotnet run --project backend/SplitApp.Api
```

`down -v` deletes the PostgreSQL volume. Do not use it against shared or production data.

## Tables

### `Users`

Stores application users for password auth and optional Google sign-in.

Important columns:

- `Id` UUID primary key
- `Email` max 320, required
- `Name` max 80, required
- `GoogleId` nullable
- `PasswordHash` nullable
- `AvatarKey` max 64, nullable
- `Bio` max 280, nullable

Indexes:

- unique index on `Email`
- filtered unique index on `GoogleId` where `GoogleId IS NOT NULL`

### `Groups`

Stores group profile data.

Important columns:

- `Id` UUID primary key
- `Name` max 80, required
- `Description` max 280, nullable
- `AvatarKey` max 64, nullable
- `DefaultCurrency` max 3, required

There is no `OwnerId` column. Ownership is represented through `GroupMembers.Role`.

### `GroupMembers`

Join table for users and groups.

Columns:

- `GroupId` UUID, required
- `UserId` UUID, required
- `Role` integer, required

Primary key:

```text
(GroupId, UserId)
```

Roles:

- `0` - Member
- `1` - Admin
- `2` - Owner

Indexes and relationships:

- filtered unique index on `GroupId` where `Role = 2`, so each group has at most one owner
- deleting a group deletes its memberships
- deleting a user deletes their memberships

### `Expenses`

Stores shared expenses.

Important columns:

- `Id` UUID primary key
- `GroupId` UUID, required
- `PayerId` UUID, required
- `Title` max 160, required
- `TotalAmount` numeric, required
- `Currency` max 3, required
- `CreatedAt` timestamp with time zone, required
- `SplitMethod` max 32, required

Constraints and relationships:

- `TotalAmount > 0`
- deleting a group deletes its expenses
- deleting the payer is restricted while their expenses reference them

`IsSettlement` does not exist. Settlements are modeled as payments.

### `ExpenseSplits`

Stores how much each user owes for an expense.

Columns:

- `ExpenseId` UUID, required
- `UserId` UUID, required
- `OwedAmount` numeric, required

Primary key:

```text
(ExpenseId, UserId)
```

Constraints and relationships:

- `OwedAmount > 0`
- deleting an expense deletes its splits
- deleting a user is restricted while expense splits reference them

### `Payments`

Stores real-world settlements between users.

Important columns:

- `Id` UUID primary key
- `GroupId` UUID, required
- `FromUserId` UUID, required
- `ToUserId` UUID, required
- `Amount` numeric, required
- `Currency` max 3, required
- `Note` max 280, nullable
- `Status` integer, required
- `RecordedAt` timestamp with time zone, required
- `RecordedByUserId` UUID, required
- `VoidedAt` timestamp with time zone, nullable
- `VoidedByUserId` UUID, nullable

Statuses:

- `0` - Recorded
- `1` - Voided

Constraints and relationships:

- `Amount > 0`
- deleting a group deletes its payments
- deleting users referenced by payment participants, recorder, or voider is restricted

Only `Recorded` payments affect balances.

### `ActivityLogs`

Stores activity facts, not rendered UI copy.

Important columns:

- `Id` UUID primary key
- `GroupId` UUID, nullable
- `UserId` UUID, required
- `ActivityType` max 64, required
- `MetadataJson` JSONB, nullable
- `CreatedAt` timestamp with time zone, required

Relationships:

- deleting a user deletes their activity logs
- `GroupId` is optional and does not cascade-delete from groups

The frontend translates activity based on `ActivityType` and `MetadataJson`.

## Balance Source Of Truth

There is no balance table. Balances are calculated from:

1. Expenses
2. Expense splits
3. Recorded payments

Voided payments and activity logs do not affect balances. This avoids stale financial state and keeps balance behavior testable.
