# @bitclaw/result

Rust-inspired `Result<T>` type for explicit, type-safe error handling across service boundaries.

## Features

- **Discriminated union** `Ok<T>` and `Err` with `.ok` boolean discriminator
- **Serializable** All fields are plain data (works across TanStack Start server/client boundary)
- **Composable** `map`, `chain` (flatMap), `combine` for result pipelines
- **Zero dependencies** Pure TypeScript, no runtime overhead

## Installation

```bash
bun add @bitclaw/result
```

## Quick Start

```typescript
import { ok, err, type Result } from '@bitclaw/result'

async function getUser(id: string): Promise<Result<User>> {
  const user = await db.findUser(id)
  if (!user) return err('USER_NOT_FOUND', `User ${id} not found`)
  return ok(user)
}

const result = await getUser('123')
if (result.ok) {
  console.log(result.data.name) // typed as User
} else {
  console.error(result.code, result.message) // typed as Err
}
```

## API

### Types

```typescript
type Ok<T> = { readonly ok: true; readonly data: T }

type Err = {
  readonly ok: false
  readonly code: string
  readonly message: string
  readonly cause?: ErrorCause
  readonly context?: Record<string, string | number | boolean>
}

type Result<T> = Ok<T> | Err
```

### Constructors

```typescript
ok(data)                          // Ok<T>
err(code, message)                // Err
err(code, message, cause)         // Err with serialized Error cause
err(code, message, cause, ctx)    // Err with additional context
```

### Type Guards

```typescript
isOk(result)   // result is Ok<T>
isErr(result)  // result is Err
```

### Utilities

```typescript
// Unwrap or throw
const user = unwrap(result) // throws if Err

// Unwrap with fallback
const user = unwrapOr(result, defaultUser)

// Transform the success value
const name = map(result, user => user.name) // Result<string>

// Chain result-returning operations (flatMap)
const profile = chain(result, user => getProfile(user.id)) // Result<Profile>

// Combine multiple results into a single result
const [user, org] = unwrap(combine([getUser(id), getOrg(orgId)]))
```

### safeCatch

Wraps an async function to catch unhandled rejections with an optional error callback:

```typescript
import { safeCatch } from '@bitclaw/result'

const getUser = safeCatch(
  async (id: string) => {
    const user = await db.findUser(id)
    if (!user) throw new Error('Not found')
    return user
  },
  (error) => console.error('getUser failed:', error)
)
```

## Patterns

### Service functions return Result, never throw

```typescript
// Service layer returns Result<T>
const createServer = async (name: string): Promise<Result<Server>> => {
  if (await exists(name)) return err('DUPLICATE_NAME', 'Server name taken')
  const server = await db.insert(name)
  return ok(server)
}

// Consumer check .ok
const result = await createServer('web-1')
if (!result.ok) {
  setError(result.message)
  return
}
// result.data is typed as Server
```

### Error codes are machine-readable

```typescript
err('SERVER_NOT_FOUND', 'Server web-1 does not exist')
err('SSH_FAILED', `Connection to ${ip} timed out`, error)
err('PLAN_LIMIT_REACHED', 'Upgrade to add more servers', undefined, {
  current: 3,
  limit: 3
})
```

## Testing

```bash
bun test
```

40 tests across 2 files.
