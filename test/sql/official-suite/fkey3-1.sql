-- original: fkey3.test
-- credit:   http://www.sqlite.org/src/tree?ci=trunk&name=test

PRAGMA foreign_keys=ON;
    CREATE TABLE t1(x INTEGER PRIMARY KEY);
    INSERT INTO t1 VALUES(100);
    INSERT INTO t1 VALUES(101);
    CREATE TABLE t2(y INTEGER REFERENCES t1 (x));
    INSERT INTO t2 VALUES(100);
    INSERT INTO t2 VALUES(101);
    SELECT 1, x FROM t1;
    SELECT 2, y FROM t2
;DROP TABLE t2
;DROP TABLE t1
;PRAGMA foreign_keys=ON;
    CREATE TABLE t1(x INTEGER PRIMARY KEY);
    INSERT INTO t1 VALUES(100);
    INSERT INTO t1 VALUES(101);
    CREATE TABLE t2(y INTEGER PRIMARY KEY REFERENCES t1 (x) ON UPDATE SET NULL)
;INSERT INTO t2 VALUES(100);
    INSERT INTO t2 VALUES(101);
    SELECT 1, x FROM t1;
    SELECT 2, y FROM t2
;CREATE TABLE t3(a, b, c, d, 
    UNIQUE(a, b),
    FOREIGN KEY(c, d) REFERENCES t3(a, b)
  );
  INSERT INTO t3 VALUES(1, 2, 1, 2)
;CREATE TABLE t4(a UNIQUE, b REFERENCES t4(a))
;CREATE TABLE t5(a INTEGER PRIMARY KEY, b REFERENCES t5(a));
  INSERT INTO t5 VALUES(NULL, 1)
;CREATE TABLE t6(a INTEGER PRIMARY KEY, b, c, d,
    FOREIGN KEY(c, d) REFERENCES t6(a, b)
  );
  CREATE UNIQUE INDEX t6i ON t6(b, a)
;INSERT INTO t6 VALUES(NULL, 'a', 1, 'a')
;INSERT INTO t6 VALUES(2, 'a', 2, 'a')
;INSERT INTO t6 VALUES(NULL, 'a', 1, 'a')
;INSERT INTO t6 VALUES(5, 'a', 2, 'a')
;INSERT INTO t6 VALUES(100, 'one', 100, 'one');
  DELETE FROM t6 WHERE a = 100
;INSERT INTO t6 VALUES(100, 'one', 100, 'one');
  UPDATE t6 SET c = 1, d = 'a' WHERE a = 100;
  DELETE FROM t6 WHERE a = 100
;CREATE TABLE t7(a, b, c, d INTEGER PRIMARY KEY,
    FOREIGN KEY(c, d) REFERENCES t7(a, b)
  );
  CREATE UNIQUE INDEX t7i ON t7(a, b)
;INSERT INTO t7 VALUES('x', 1, 'x', NULL)
;INSERT INTO t7 VALUES('x', 2, 'x', 2)
;CREATE TABLE t8(a, b, c, d, e, FOREIGN KEY(c, d) REFERENCES t8(a, b));
  CREATE UNIQUE INDEX t8i1 ON t8(a, b);
  CREATE UNIQUE INDEX t8i2 ON t8(c);
  INSERT INTO t8 VALUES(1, 1, 1, 1, 1)
;UPDATE t8 SET d = 1
;UPDATE t8 SET e = 2;