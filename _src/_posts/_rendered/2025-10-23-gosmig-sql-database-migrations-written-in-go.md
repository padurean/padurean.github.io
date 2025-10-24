---
{
  "date": "2025-10-23T23:07:19+03:00",
  "title": "GoSMig: a tiny, type-safe way to build your own SQL database migration CLI in Go",
  "description": "Write SQL database migrations in Go with strong typing, zero non-stdlib dependencies, and build your own migration CLI with minimal boilerplate. database/sql and sqlx supported out of the box.",
  "tags": ["Go", "CLI", "database", "SQL", "migrations"],
  "thumbnail": "",
  "cover": "https://raw.githubusercontent.com/padurean/gosmig/e52c9cc1e4a04ee418aef7936966c06e621ee265/graphics/gosmig-banner.png"
}
---

---

If you’ve ever wanted a migration tool that feels like Go — small, explicit, type-safe, and database-agnostic — [**GoSMig**](https://github.com/padurean/gosmig) hits a sweet spot. It doesn’t ship a full-featured binary. Instead, it gives you a minimal, well-typed core you can embed to build your own migration CLI with almost no boilerplate.

- Zero non-stdlib deps (only [golang.org/x/term](https://pkg.go.dev/golang.org/x/term) for pager support in status)
- Works with [database/sql](https://pkg.go.dev/database/sql) or [sqlx](https://github.com/jmoiron/sqlx) (and anything that implements a tiny interface)
- Transactional and non-transactional migrations
- Built-in commands: **`up`**, **`up-one`**, **`down`**, **`status`**, **`version`**
- Strong validation, timeouts, and clean error messages
- [PostgreSQL](https://www.postgresql.org) integration tests and 100% test coverage

Repo: <https://github.com/padurean/gosmig>

Note: [**GoSMig**](https://github.com/padurean/gosmig) is a library, not a binary. You write a 30–60 line `main()` to define migrations and wire in your DB connection, and [**GoSMig**](https://github.com/padurean/gosmig) handles the CLI parsing and command behavior for you.

## Why another migrations tool?

I wanted something that:

- Keeps migrations in Go, with first-class generics for strong typing.
- Doesn’t force a file layout, code-gen step, or a vendor-specific driver.
- Lets me choose transactional or non-transactional migrations per step.
- Gives me a small, composable core I can embed in any service.

[**GoSMig**](https://github.com/padurean/gosmig) is basically “bring your own CLI wrapper,” with a dead-simple API that stays out of your way.

## TL;DR install

```console
go get github.com/padurean/gosmig
```

Go 1.25+ recommended.

## A 60-second example ([database/sql](https://pkg.go.dev/database/sql))

Create a tiny `main.go` that defines migrations and a DB connector. You’ll end up with a custom binary like `./migrate`.

```go
package main

import (
  "context"
  "database/sql"
  "fmt"
  "log"
  "time"

  _ "github.com/jackc/pgx/v5/stdlib"
  "github.com/padurean/gosmig"
)

func main() {
  // Define migrations (mix transactional and non-transactional as needed)
  migs := []gosmig.MigrationSQL{
    {
      Version: 1,
      UpDown: &gosmig.UpDownSQL{ // runs inside a transaction
        Up: func(ctx context.Context, tx *sql.Tx) error {
          _, err := tx.ExecContext(ctx, `
            CREATE TABLE teams (
             id SERIAL PRIMARY KEY,
             name TEXT NOT NULL UNIQUE,
             created_at TIMESTAMPTZ DEFAULT NOW()
            )`)
          return err
        },
        Down: func(ctx context.Context, tx *sql.Tx) error {
          _, err := tx.ExecContext(ctx, `DROP TABLE teams`)
          return err
        },
      },
    },
    {
      Version: 2,
      UpDownNoTX: &gosmig.UpDownNoTXSQL{ // runs without a transaction
        Up: func(ctx context.Context, db *sql.DB) error {
          _, err := db.ExecContext(ctx, `
            CREATE INDEX CONCURRENTLY idx_teams_created_at ON teams (created_at)`)
          return err
        },
        Down: func(ctx context.Context, db *sql.DB) error {
          _, err := db.ExecContext(ctx, `
            DROP INDEX CONCURRENTLY IF EXISTS idx_teams_created_at`)
          return err
        },
      },
    },
  }

  // Build a runner that parses args and executes commands
  run, err := gosmig.New(migs, connect, &gosmig.Config{Timeout: 30 * time.Second})
  if err != nil {
    log.Fatalf("failed to build migrator: %v", err)
  }
  run() // handles: <db_url> <up|up-one|down|status|version>
}

func connect(url string, timeout time.Duration) (*sql.DB, error) {
  db, err := sql.Open("pgx", url)
  if err != nil {
    return nil, fmt.Errorf("open DB: %w", err)
  }
  ctx, cancel := context.WithTimeout(context.Background(), timeout)
  defer cancel()
  if err := db.PingContext(ctx); err != nil {
    return nil, fmt.Errorf("ping DB: %w", err)
  }
  return db, nil
}
```

Run it:

```console
go run . postgres://user:pass@localhost:5432/dbname?sslmode=disable up
```

## Using [sqlx](https://github.com/jmoiron/sqlx) (optional)

Prefer [sqlx](https://github.com/jmoiron/sqlx)? Swap the DB type and define aliases to keep signatures tidy:

```go
package main

import (
  "context"
  "database/sql"
  "log"
  "time"

  _ "github.com/jackc/pgx/v5/stdlib"
  "github.com/jmoiron/sqlx"
  "github.com/padurean/gosmig"
)

type (
  MigrationSQLX  = gosmig.Migration[*sql.Row, sql.Result, *sql.Tx, *sql.TxOptions, *sqlx.DB]
  UpDownNoTXSQLX = gosmig.UpDown[*sql.Row, sql.Result, *sqlx.DB]
)

func main() {
  migs := []MigrationSQLX{
    {
      Version: 1,
      UpDown: &gosmig.UpDownSQL{ /* ...same as stdlib example... */ },
    },
    {
      Version: 2,
      UpDownNoTX: &UpDownNoTXSQLX{
        Up:   func(ctx context.Context, db *sqlx.DB) error { /* ... */ return nil },
        Down: func(ctx context.Context, db *sqlx.DB) error { /* ... */ return nil },
      },
    },
  }

  run, err := gosmig.New(migs, connectSQLX, nil)
  if err != nil {
    log.Fatal(err)
  }
  run()
}

func connectSQLX(url string, timeout time.Duration) (*sqlx.DB, error) {
  db, err := sqlx.Open("pgx", url)
  if err != nil {
    return nil, err
  }
  ctx, cancel := context.WithTimeout(context.Background(), timeout)
  defer cancel()
  return db, db.PingContext(ctx)
}
```

Tip: The provided `gosmig.UpDownSQL` works for both [database/sql](https://pkg.go.dev/database/sql) and [sqlx](https://github.com/jmoiron/sqlx) because it operates on `*sql.Tx`.

## CLI commands you get “for free”

Once you wire up `main()`, [**GoSMig**](https://github.com/padurean/gosmig) handles argument parsing and runs the command:

- **`up`** — apply all pending migrations
- **`up-one`** — apply only the next migration
- **`down`** — roll back the most recent applied migration
- **`status`** — show all versions and whether they’re applied or pending (uses a pager when writing to stdout)
- **`version`** — print the current database version

Examples:

- Apply all pending migrations:

    `./migrate "postgres://user:pass@localhost:5432/db?sslmode=disable"` **`up`**

    ```console
    [x] Applied migration version 1
    [x] Applied migration version 2
    2 migration(s) applied
    ```

- Apply only the next migration:

  `./migrate "postgres://user:pass@localhost:5432/db?sslmode=disable"` **`up-one`**

  ```console
  [x] Applied migration version 3
  1 migration(s) applied
  ```

- Roll back the latest migration:

  `./migrate "postgres://user:pass@localhost:5432/db?sslmode=disable"` **`down`**

  ```bash
  [x]-->[ ] Rolled back migration version 3
  ```

- Show status of all migrations:

  `./migrate "postgres://user:pass@localhost:5432/db?sslmode=disable"` **`status`**

  ```console
  VERSION     STATUS
  3           [ ] PENDING
  2           [x] APPLIED
  1           [x] APPLIED
  ```

- Show current DB version:

  `./migrate "postgres://user:pass@localhost:5432/db?sslmode=disable"` **`version`**

  ```console
  Current database version:
  2
  ```

## Internals in a nutshell

[**GoSMig**](https://github.com/padurean/gosmig) uses tiny, generic interfaces so anything that looks like [database/sql](https://pkg.go.dev/database/sql) can plug in:

- `DBRow`, `DBResult` mirror stdlib shapes
- `DB` and `TX` allow `QueryRowContext`/`ExecContext`/`BeginTx`/`Commit`/`Rollback`
- Generics tie it together without reflection or magic

There are two migration styles:

- Transactional (`UpDown` with `*sql.Tx`) — best default; runs inside a transaction
- Non-transactional (`UpDownNoTX` with `*sql.DB` or your DB type) — for things like [PostgreSQL](https://www.postgresql.org)’s `CREATE INDEX CONCURRENTLY`

Migrations are validated at startup (unique, positive versions; both `Up` and `Down` present). A lightweight `gosmig` table tracks applied versions:

```sql
CREATE TABLE gosmig (
  version INTEGER PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Operations use a timeout (default `10s`; configurable via `&gosmig.Config{Timeout: ...}`), and [**GoSMig**](https://github.com/padurean/gosmig) defends against concurrent version jumps during a migration with clear error messages.

## Concurrency: keep it single-writer

Like any migration system, don’t run multiple writers at once. Use your DB’s advisory lock (or equivalent):

- [PostgreSQL](https://www.postgresql.org): `pg_try_advisory_lock` / `pg_advisory_unlock`
- [MySQL](https://www.mysql.com)/[MariaDB](https://mariadb.org): `GET_LOCK` / `RELEASE_LOCK`
- [SQL Server](https://www.microsoft.com/en-us/sql-server): `sp_getapplock` / `sp_releaseapplock`
- [SQLite](https://www.sqlite.org): file lock or a serialized `BEGIN EXCLUSIVE` strategy

There’s a [PostgreSQL](https://www.postgresql.org) example linked from the repo’s examples branch.

## Tested: CI, coverage, and Docker

- [PostgreSQL](https://www.postgresql.org) integration tests
- 100% coverage
- Makefile for local workflows

Some handy commands:

```console
# run tests locally
make test

# spin up Dockerized Postgres and run tests
make test-docker

# lint and vulnerability checks
make lint
make vulncheck

# build (with checks) or build only
make build
make build-only
```

## When to use [**GoSMig**](https://github.com/padurean/gosmig)

Use it if you:

- Want your migrations in Go with strong typing and editor support
- Prefer embedding a simple migration runner into your service/binary
- Need explicit control over transactions vs. no-TX operations
- Like small tools you can reason about quickly

If you want a standalone, batteries-included CLI, you can still build one easily with GoSMig—but you’ll own the wrapper (which is usually a small and healthy amount of code).

## Links

- Repo: <https://github.com/padurean/gosmig>
- Examples: <https://github.com/padurean/gosmig/tree/examples>

If you try [**GoSMig**](https://github.com/padurean/gosmig), I’d love your feedback — PRs and issues are welcome.
