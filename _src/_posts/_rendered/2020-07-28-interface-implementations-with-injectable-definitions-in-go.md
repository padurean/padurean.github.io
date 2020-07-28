---
{
  "date": "2020-07-28T15:00:34+03:00",
  "title": "Interface implementations with injectable definitions in Go",
  "description": "Make use of Go's structural typing and support for first-class functions to mock dependencies in unit tests with custom behaviour injectable when needed only for what is needed, without writing an entire mock implementation",
  "tags": [ "Go" ],
  "thumbnail": "images/gopher-purecore.svg",
  "cover": "images/posts/2020-07-28-interface-implementations-with-injectable-definitions-in-go/cover.svg"
}
---

# <span class="orange">&#9729;</span> Problem

Writing unit tests for your code is not simple, especially if code coverage as
close to 100% as possible is aimed for.

# <span class="yelloworange">&#9873;</span> Goal

- [x] easily writing unit tests for your code
- [x] getting up to 100% code coverage
- [x] without using a 3rd party library
- [x] without resorting to ["monkey patching"](https://bou.ke/blog/monkey-patching-in-go/)
- [x] without writing complete mock implementations
- [x] overriding (injecting) only the needed behaviours
- [x] by using plain Go functions

# <span class="green">&#9730;</span> Solution

Abstracting function(alitie)s away through interfaces who's implementations have
exported fields of type `func`

that are counterparts for each function exposed by the interface,

so that all that the definitions of the interface methods have
to do is to delegate to these fields of type `func`.

This provides a way for each piece of code that uses the interface to directly
inject (into it's implementation) different definitions for any of it's methods.

# <span class="violet">&#9781;</span> Example

A books library that allows saving author's books in a Redis database.

## Boilerplate

Create a folder named `injectable-method-definitions`, `cd` into it and initialize
it as a Go module by running `go mod init injectable-method-definitions`.

Then create the following tree of folders and files:

```
internal
   - books
      - library.go
      - library_test.go
   - db
      - db.go
      - db_test.go
main.go
```

## Code

### <u><i>`internal/db/db.go`</i></u>

```go
package db

import (
  "time"

  "github.com/go-redis/redis"
)

type DB interface {
  Ping() error
  Set(string, interface{}, time.Duration) error
  Get(string) (string, error)
}

type RedisClient struct {
  *redis.Client
  PingF func() error
  SetF  func(string, interface{}, time.Duration) error
  GetF  func(string) (string, error)
}

func NewRedisClient(c *redis.Client) *RedisClient {
  rc := &RedisClient{Client: c}
  rc.PingF = func() error {
    _, err := rc.Client.Ping().Result()
    return err
  }
  rc.SetF = func(key string, value interface{}, expiration time.Duration) error {
    return rc.Client.Set(key, value, expiration).Err()
  }
  rc.GetF = func(key string) (string, error) {
    return rc.Client.Get(key).Result()
  }
  return rc
}

func (rc *RedisClient) Ping() error {
  return rc.PingF()
}

func (rc *RedisClient) Set(key string, value interface{}, expiration time.Duration) error {
  return rc.SetF(key, value, expiration)
}

func (rc *RedisClient) Get(key string) (string, error) {
  return rc.GetF(key)
}
```

---

### <u><i>`internal/db/db_test.go`</i></u>

```go
package db

import (
  "testing"
  "time"

  "github.com/go-redis/redis"
  "github.com/stretchr/testify/require"
)

func TestRedisClient(t *testing.T) {
  k, v := "k", "v"

  client := NewRedisClient(redis.NewClient(&redis.Options{}))
  require.Error(t, client.Ping())
  require.Error(t, client.Set(k, v, 0))
  _, err := client.Get(k)
  require.Error(t, err)

  client.PingF = func() error {
    return nil
  }
  require.NoError(t, client.Ping())

  client.SetF = func(string, interface{}, time.Duration) error {
    return nil
  }
  require.NoError(t, client.Set(k, v, 0))

  books := "book title 1|book title 2"
  client.GetF = func(string) (string, error) {
    return books, nil
  }
  books2, err := client.Get(k)
  require.NoError(t, err)
  require.Equal(t, books, books2)
}
```

---

### <u><i>`internal/books/library.go`</i></u>

```go
package books

import "injectable-method-definitions/internal/db"

type Library struct {
  DB db.DB
}

func (l *Library) AddBooks(author string, titles string) error {
  return l.DB.Set(author, titles, 0)
}

func (l *Library) GetBooks(author string) (string, error) {
  return l.DB.Get(author)
}
```

---

### <u><i>`internal/books/library_test.go`</i></u>

```go
package books

import (
  "testing"
  "time"

  "injectable-method-definitions/internal/db"

  "github.com/stretchr/testify/require"
)

func TestLibrary(t *testing.T) {
  client := db.NewRedisClient(nil)
  library := Library{client}

  author := "Henry Hazlitt"
  books := "Economics in One Lesson|" +
    "The Failure of the 'New Economics': An Analysis of the Keynesian Fallacies"
  client.SetF = func(string, interface{}, time.Duration) error {
    return nil
  }
  err := library.AddBooks(author, books)
  require.NoError(t, err)

  client.GetF = func(string) (string, error) {
    return books, nil
  }
  books2, err := library.GetBooks(author)
  require.NoError(t, err)
  require.Equal(t, books, books2)
}
```

---

### <u><i>`main.go`</i></u>

```go
package main

import (
  "fmt"
  "os"
  "strings"

  "injectable-method-definitions/internal/books"
  "injectable-method-definitions/internal/db"

  "github.com/go-redis/redis"
)

func main() {
  client := redis.NewClient(&redis.Options{
    Addr:     "localhost:6379",
    Password: "",
    DB:       0,
  })
  redisClient := db.NewRedisClient(client)
  if err := redisClient.Ping(); err != nil {
    fmt.Println(err)
    os.Exit(1)
  }

  library := &books.Library{DB: redisClient}

  author := "Henry Hazlitt"
  err := library.AddBooks(
    author,
    "Economics in One Lesson|"+
      "The Failure of the 'New Economics': An Analysis of the Keynesian Fallacies",
  )
  if err != nil {
    fmt.Println(err)
    os.Exit(1)
  }

  books, err := library.GetBooks(author)
  if err != nil {
    fmt.Println(err)
    os.Exit(1)
  }
  fmt.Printf("%s's books:\n%s\n", author, strings.ReplaceAll(books, "|", "\n"))
}
```

### Reading the code above one can notice the following:

- `main.go` code uses the "real" `go-redis` client
- `db_test.go` and `library_test.go` code injects "mock" behaviour for the `DB`
interface by setting custom functions as values for the `PingF`, `SetF` and
`GetF` fields of the `RedisClient` implementation

### Running the tests and checking their code coverage:

```console
    ➤ go test ./internal/... -count=1 -coverprofile=coverage.txt -covermode=atomic
    ok      injectable-method-definitions/internal/books    0.099s  coverage: 100.0% of statements
    ok      injectable-method-definitions/internal/db       0.200s  coverage: 100.0% of statements

    ➤ go tool cover -func=coverage.txt
    injectable-method-definitions/internal/books/library.go:11:     AddBooks        100.0%
    injectable-method-definitions/internal/books/library.go:16:     GetBooks        100.0%
    injectable-method-definitions/internal/db/db.go:25:             NewRedisClient  100.0%
    injectable-method-definitions/internal/db/db.go:41:             Ping            100.0%
    injectable-method-definitions/internal/db/db.go:46:             Set             100.0%
    injectable-method-definitions/internal/db/db.go:51:             Get             100.0%
    total:                                                          (statements)    100.0%
```

### Running the main code:

1. Install Redis on your machine - e.g. on macOS: `brew install redis`
2. Start the Redis server - e.g. on macOS: `redis-server /usr/local/etc/redis.conf`
3. Run the main code:

```console
    ➤ go run main.go
    Henry Hazlitt's books:
    Economics in One Lesson
    The Failure of the 'New Economics': An Analysis of the Keynesian Fallacies
```

<br><br>

### <span class="green">Thanks for reading this! &#9786;</span>
