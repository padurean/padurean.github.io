---
{
  "date": "2020-08-12T19:52:15+03:00",
  "title": "Display tables in the CLI using just the Go standard library",
  "description": "Print data as minimalist plain-text tables using just the text/tabwriter package, without any third-party library",
  "tags": [ "Go", "CLI" ],
  "thumbnail": "images/gopher-side_color-head-only.png",
  "cover": "images/posts/2020-08-12-display-tables-in-CLI-using-Go-standard-library/cover.png"
}
---

# <span class="orange">&#9729;</span> Problem

Printing some data to the CLI, as a table, usually requires one of the following

- [ ] fiddling with spaces and tabs to evenly align data and dealing with various edge
cases, long strings etc.
- [ ] using a [third-party library](https://github.com/olekukonko/tablewriter), which can have the benefit of nice-looking results, but at the cost of bringing in an extra-dependency just for that

# <span class="yelloworange">&#9873;</span> Goal

- [x] Printing tables to the CLI without fiddling with spaces, tabs etc. AND without using a third-party library.

# <span class="green">&#9730;</span> Solution

Use the [`test/tabwriter` package](https://golang.org/pkg/text/tabwriter/) provided by [the Go standard library](https://golang.org/pkg/#stdlib) and create a custom function around it that suits almost any scenario that doesn't require sophisticated output.

# <span class="violet">&#9781;</span> Example

## Boilerplate

Create a folder named `print-cli-tables`, `cd` into it and initialize it as a Go module by running `go mod init print-cli-tables`.

Then create the following tree of folders and files:

```
printer
   - table_printer.go
main.go
```

## Code

### <u><i>`printer/table_printer.go`</i></u>

```go
package printer

import (
  "fmt"
  "io"
  "strconv"
  "strings"
  "text/tabwriter"
)

// PrintTable ...
func PrintTable(
  w io.Writer,
  caption string,
  cols []string,
  getNextRows func() (bool, [][]string),
) {
  nbCols := len(cols)
  if nbCols == 0 {
    return
  }
  if len(caption) > 0 {
    fmt.Fprintf(w, "%s:\n\n", caption)
  }
  tw := tabwriter.NewWriter(w, 0, 0, 2, ' ', 0)
  colSep := "\t"
  header := append([]string{"#"}, cols...)
  fmt.Fprintf(tw, "%s%s\n", strings.Join(header, colSep), colSep)
  var sb strings.Builder
  i := 1
  hasMore, rows := getNextRows()
  for hasMore {
    for iRow, row := range rows {
      nbRowCols := len(row)
      for j := 0; j < nbCols; j++ {
        if j < nbRowCols {
          sb.WriteString(row[j])
        }
        sb.WriteString(colSep)
      }
      iRowStr := ""
      if iRow == 0 {
        iRowStr = strconv.Itoa(i)
      }
      fmt.Fprintf(tw, "%s%s%s\n", iRowStr, colSep, sb.String())
      sb.Reset()
    }
    i++
    hasMore, rows = getNextRows()
  }
  _ = tw.Flush()
}
```

---

### <u><i>`main.go`</i></u>

```go
package main

import (
  "fmt"
  "print-cli-tables/printer"
  "strings"
)

type permission struct {
  database         string
  permission       string
  tablePermissions map[string]string
}

type user struct {
  username    string
  email       string
  permissions []*permission
}

var users = []*user{
  &user{
    username: "user1",
    email:    "user1@domain.com",
    permissions: []*permission{
      &permission{
        database: "db1",
        tablePermissions: map[string]string{
          "table1": "RW",
          "table2": "R",
        },
      },
      &permission{
        database:   "db2",
        permission: "admin",
      },
    },
  },
  &user{
    username: "user2",
    email:    "user2@domain.com",
    permissions: []*permission{
      &permission{
        database:   "db2",
        permission: "RW",
      },
      &permission{
        database: "db3",
        tablePermissions: map[string]string{
          "table3": "R",
        },
      },
    },
  },
  &user{
    username: "superadmin",
    email:    "superadmin@domain.com",
    permissions: []*permission{
      &permission{
        database:   "*",
        permission: "admin",
      },
    },
  },
  &user{
    username: "inactiveuser",
    email:    "inactiveuser@domain.com",
  },
}

func main() {
  cols := []string{"User", "Email", "Database", "Table", "Permissions"}
  i := 0
  strBuilder := &strings.Builder{}
  printer.PrintTable(
    strBuilder, // or just pass os.Stdout
    fmt.Sprintf("%d user(s)", len(users)),
    cols,
    func() (bool, [][]string) {
      if len(users)-1 < i {
        return false, nil
      }
      u := users[i]
      i++
      return true, userToRows(u)
    })
  fmt.Print(strBuilder.String())
}

func userToRows(u *user) [][]string {
  var rows [][]string
  if len(u.permissions) == 0 {
    return [][]string{[]string{u.username, u.email, "-", "-", "-"}}
  }
  rows = make([][]string, 0, len(u.permissions))
  for _, ps := range u.permissions {
    if len(ps.tablePermissions) == 0 {
      rows = append(rows, []string{"", "", ps.database, "*", ps.permission})
      continue
    }
    first := false
    for t, p := range ps.tablePermissions {
      row := []string{"", "", "", t, p}
      if first == false {
        row[2] = ps.database
        first = true
      }
      rows = append(rows, row)
    }
  }
  rows[0][0] = u.username
  rows[0][1] = u.email
  return rows
}
```

### Reading and running the code

In the code above one can observe that the `PrintTable` function is designed so
that it takes the following params:

- An `io.Writer` which can be, for example, `os.Stdout` if one wishes to print directly
to the CLI or `strings.Builder` if one wants to do something else with the output.
- A caption for the table
- The table heading (i.e. column names)
- A callback function which returns a `bool` indicating whether there are more rows or not,
a two-dimensional `array` of `string`s which holds the next(s) rows. The reason for the
two-dimensionality of it is that one might need to print multiple rows for a single data item,
as can be seen in the example code and data from `main.go` where the `userToRows` function returns
more than one row for one user (i.e. multiple permissions for databases and tables).

&#128161; Basically the `PrintTable` function only deals with arrays of `string`s delegating
to the caller the responsibility of converting any data it has and also the one of deciding
when the table ends (e.g. by keeping a counter while feeding the data through the callback).

Running the code will show the following output:

```
➤ go run main.go
4 user(s):

#  User          Email                    Database  Table   Permissions
1  user1         user1@domain.com         db1       table1  RW
                                                    table2  R
                                          db2       *       admin
2  user2         user2@domain.com         db2       *       RW
                                          db3       table3  R
3  superadmin    superadmin@domain.com    *         *       admin
4  inactiveuser  inactiveuser@domain.com  -         -       -
```

<br><br>

### <span class="green">Thanks for reading this! &#9786;</span>