const convertRegionName = (locale) => {
  const regionNameInEnglish = new Intl.DisplayNames(["en"], { type: "region" });
  const nationName = regionNameInEnglish.of(locale.split("-")[1].toUpperCase());
  return nationName
    .split(" ")
    .reduce(
      (acc, region, index) =>
        (acc += index === 0 ? region.toLowerCase() : capitalize(region)),
      ""
    );
};

const capitalize = (words) =>
  words[0].toUpperCase() + words.slice(1).toLowerCase();

module.exports = { convertRegionName, capitalize };
