const dev = function () {};
const preffix = "Client";
Object.assign(
  dev,
  Object.fromEntries(
    Object.entries(console).map(([key, value]) => {
      const wrap = function (...arg) {
        value.call(
          console,
          `🚀 [${dev.preffix || preffix} DEV] ::>\n`,
          ...arg,
          "\n",
          `<:: (${new Date().toLocaleDateString("ko")})`
        );
        dev.preffix = "";
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
