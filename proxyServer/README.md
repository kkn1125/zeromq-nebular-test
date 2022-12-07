```javascript
/* lookup 예시 */
query
  .type("TAG")
  .lookup("space")
  .properties("test")
  .exec()
  .then((result) => {
    dev.alias("test good?").log(result.data.test);
  });

/* create index 예시 */
query
  .type("EDGE")
  .create()
  .index()
  .ifNotExists()
  .target("socket")
  .exec()
  .then((result) => {
    dev.alias("test create index good?").log(result);
  });

/* insert 예시 */
query
  .type("TAG")
  .insert()
  .ifNotExists()
  .target("channel")
  .keys(["name"])
  .values("channel2", ["wow"])
  .exec()
  .then((result) => {
    dev.alias("test insert tag good?").log(result);
  });

/* delte 예시 */
query
  .type("TAG")
  .delete("channel", "channel2")
  .exec()
  .then((result) => {
    dev.alias("test delete tag good?").log(result);
  });

// query
  .type("EDGE")
  .show(true)
  .exec()
  .then((result) => {
    dev.alias("test show good?").log(result.data);
  });
```
