const dev = function () {};
Object.assign(
  dev,
  Object.fromEntries(
    Object.entries(console).map(([key, value]) => {
      const wrap = function (...arg) {
        value.call(
          console,
          "[Client DEV] ::>",
          ...arg,
          `<:: (${new Date().toLocaleDateString("ko")})`
        );
      };
      if (key === "memory") {
        return [key, value];
      } else {
        return [key, wrap.bind(console)];
      }
    })
  )
);

module.exports.dev = dev;
