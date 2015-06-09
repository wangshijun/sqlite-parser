# sql-query-parser

This library takes SQL queries, provided as a string, and generates an
AST. An error will be generated describing what is malformed in the source query
code if the AST cannot be generated.

**This parser is written against the [SQLite 3 spec](https://www.sqlite.org/lang.html).**

Note: this project is work-in-progress and is **not fully spec-compliant**.

The parser implements the basic components of the SQLite 3 spec, such as:
- Basic query types `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `DROP`, `CREATE`, etc...
- Sub-queries `SELECT FROM (SELECT * FROM b)`
- Aliases `SELECT * FROM apples AS a`
- `JOIN` types `INNER`, `OUTER`, `LEFT`
- Query modifiers `WHERE`, `GROUP BY`, `HAVING`

## Install

```
npm install sql-query-parser
```

## Usage

The library exposes a function that accepts a single argument: a string
containing SQL to parse. The method returns a promise that resolves to the
AST object generated from the source string.

``` javascript
var sqlQueryParser  = require('sql-query-parser'),
    sampleSQL       = "SELECT type, quantity FROM apples WHERE amount > 1";

sqlQueryParser(sampleSQL)
.then(function (tree) {
  // AST generated
  console.log(tree);
}, function (err) {
  // Parse error thrown
  console.log(err);
});
```

## AST

**NOTE: The SQLite AST is a work-in-progress and subject to change.**

### Example

You can provide one or more SQL statements at a time. The resulting AST object
has, at the highest level, a `statement` key that consists of an array containing
the parsed statements.

#### Input SQL

``` sql
SELECT
 MIN(salary) AS "MinSalary",
 MAX(salary) AS "MaxSalary"
FROM
 Actors
```

#### Result AST

```
statement:
 -
  type:     statement
  variant:  select
  from:
    -
      type:    identifier
      variant: table
      name:    Actors
      alias:   null
      index:   null
  where:    null
  group:    null
  result:
    -
      type:     function
      name:     MIN
      distinct: false
      args:
        -
          type:    identifier
          variant: column
          name:    salary
      alias:    MinSalary
    -
      type:     function
      name:     MAX
      distinct: false
      args:
        -
          type:    identifier
          variant: column
          name:    salary
      alias:    MaxSalary
  distinct: false
  all:      false
  order:    null
  limit:    null
```

## Contributing

Once the dependencies are installed, start development with the following command:

`grunt test`

which will automatically compile the parser and run the tests in `test/index-spec.js`.

Optionally, run `grunt debug` to get extended output and start a file watcher.

### Writing tests

Tests refer to a SQL test file in `test/sql/` and the test name is a
reference to the filename of the test file. For example `super test 2`
as a test name points to the file `test/sql/superTest2.sql`.

There are three options for the test helpers exposed by `tree`:
- `tree.ok(this, done)` to assert that the test file successfully generates an AST
- `tree.equals(ast, this, done)` to assert that the test file generates an AST that exactly matches `ast`
- `tree.error()` to assert that a test throws an error
  - `tree.error("This is the error message", this, done)` assert an error `message`
  - `tree.error({'line': 2}, this, done)` assert an object of properties that each exist in the error

``` javascript
// uses: test/sql/basicSelect.sql
it('basic select', function(done) {
  var resultTree = '{"statement":[{"type":"statement","variant":"select","from":[{"type":"identifier","variant":"table","name":"bananas","alias":null,"index":null}],"where":[{"type":"expression","format":"binary","variant":"operation","operation":"=","left":{"type":"identifier","variant":"column","name":"color"},"right":{"type":"literal","variant":"string","value":"red"},"modifier":null}],"group":null,"result":[{"type":"identifier","variant":"star","value":"*"}],"distinct":false,"all":false,"order":null,"limit":null}]}';
  tree.equals(resultTree, this, done);
});

// uses: test/sql/invalidUpdate2.sql
it('invalid update 2', function(done) {
  tree.error({
    'message': 'Unexpected FROM keyword found',
    'line': 5
  }, this, done);
});
```
