function _1(md){return(
md`# World Happiness Report
The World Happiness Report is a landmark survey of global happiness, providing insights into the factors that contribute to the well-being of nations. This project aims to analyze and visualize the World Happiness Report data from 2013-2016, exploring various factors that influence happiness across different countries. By leveraging interactive visualizations, we can uncover patterns and trends that help explain variations in happiness levels worldwide.

### Objectives
1. <b>Identify Top and Bottom Countries by Happiness Score:</b> Determine which countries rank highest and lowest in overall happiness.
2. <b>Analyze Factors Contributing to Happiness:</b> Explore how different factors like economic production, social support, life expectancy, freedom, absence of corruption, and generosity contribute to happiness scores.
3. <b>Compare Changes Over Time:</b> Examine how happiness scores and rankings have changed between different years.
4. <b>Understand Dystopia and Residuals:</b> Explain the concept of Dystopia and analyze the residuals that account for unexplained variations in happiness scores.

### Data Source
The dataset used in this project is the World Happiness Report data from Kaggle, which includes happiness scores and rankings for various countries from 2013-2016.`
)}

function _data(FileAttachment){return(
(async () => {
  const files = await Promise.all([
    FileAttachment("2015.csv").csv(),
    FileAttachment("2016.csv").csv(),
    FileAttachment("2017.csv").csv(),
    FileAttachment("2018.csv").csv(),
    FileAttachment("2019.csv").csv(),
  ]);

  const years = ["2015", "2016", "2017", "2018", "2019"];

  // Standardize column names and add year column as string
  const standardizedFiles = files.map((file, index) => {
    const year = years[index];
    return file.map(row => ({
      country: row["Country"] || row["Country or region"], // Adjust based on actual column names in your files
      score: row["Happiness Score"] || row["Score"] || row["Happiness.Score"], // Adjust based on actual column names in your files
      rank: row["Happiness Rank"] || row["Overall rank"] || row["Happiness.Rank"],
      gdp: row["Economy (GDP per Capita)"] || row["GDP per capita"] || row["Economy..GDP.per.Capita."],
      health: row["Health (Life Expectancy)"] || row["Health..Life.Expectancy"] || row["Healthy life expectancy"] || row["Health..Life.Expectancy."],
      freedom: row["Freedom"] || row["Freedom to make life choices"],
      generosity: row["Generosity"],
      year: year // Ensure year is a string
    }));
  });

  // Find countries present in all years
  const countriesPerYear = standardizedFiles.map(file => new Set(file.map(d => d.country)));
  const commonCountries = countriesPerYear.reduce((a, b) => new Set([...a].filter(c => b.has(c))));

  // Filter each year's data to only include common countries
  const filteredFiles = standardizedFiles.map(file => file.filter(d => commonCountries.has(d.country)));

  // Combine the filtered files into a single array
  return filteredFiles.flat();
})()
)}

function _sparkbar(htl){return(
function sparkbar(max) {
  return x => htl.html`<div style="
    background: lightblue;
    width: ${100 * x / max}%;
    float: right;
    padding-right: 3px;
    box-sizing: border-box;
    overflow: visible;
    display: flex;
    justify-content: end;">${x.toLocaleString("en")}`
}
)}

function _years(){return(
["All Years", "2015", "2016", "2017", "2018", "2019"]
)}

function _yearFilter(Inputs,years){return(
Inputs.select(years, {label: "Select Year", value: years[0]})
)}

function _countryFilter(Inputs){return(
Inputs.text({label: "Filter by Country Name", placeholder: "Type country name..."})
)}

function _filteredDataByYearAndCountry(data,yearFilter,countryFilter){return(
(async () => {
  const allData = await data;
  const selectedYear = yearFilter; // Year is a string
  const countryName = countryFilter.toLowerCase();
  
  return allData.filter(d => 
    (selectedYear === "All Years" || d.year === selectedYear) &&
    (!countryName || d.country.toLowerCase().includes(countryName))
  );
})()
)}

async function _tableData(filteredDataByYearAndCountry,Inputs)
{
  const filteredData = await filteredDataByYearAndCountry;
  return Inputs.table(filteredData, {
    columns: [
      "country",
      "rank",
      "score",
      "gdp",
      "health",
      "freedom",
      "generosity",
      "year"
    ]
  });
}


async function _world(d3){return(
await d3.json("https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson")
)}

function _map_years(){return(
["2015", "2016", "2017", "2018", "2019"]
)}

function _mapyearFilter(Inputs,map_years,years){return(
Inputs.select(map_years, {label: "Select Year", value: years[0]})
)}

function _mapfilters(data,mapyearFilter){return(
(async () => {
  const allData = await data;
  const selectedYear = mapyearFilter; // Year is a string
  
  return allData.filter(d => 
    (selectedYear === "All Years" || d.year === selectedYear)
  );
})()
)}

function _14(world){return(
world
)}

function _createMap(d3,DOM,world){return(
async (filteredData) => {
  const scoreData = filteredData.map(d => ({
    country: d.country,
    rank: d.rank,
    score: d.score,
    gdp: d.gdp
  }));

  const colorScale = d3.scaleSequential()
    .domain([0, Math.max(...scoreData.map(d => d.gdp))])
    .interpolator(d3.interpolateRdYlGn);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "4px")
    .style("display", "none");

  const width = 960;
  const height = 600;
  
  const projection = d3.geoMercator().scale(150).translate([width / 2, height / 1.5]);
  const path = d3.geoPath().projection(projection);

  const svg = d3.select(DOM.svg(width, height));

  svg.selectAll("path")
    .data(world.features)
    .enter().append("path")
    .attr("d", path)
    .attr("fill", d => {
      const countryName = d.properties.name ? d.properties.name.toLowerCase() : null;
      const countryData = scoreData.find(c => c.country.toLowerCase() === countryName);
      return countryData ? colorScale(countryData.gdp) : "#ccc";
    })
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .on("mouseover", (event, d) => {
      const countryName = d.properties.name ? d.properties.name.toLowerCase() : null;
      const countryData = scoreData.find(c => c.country.toLowerCase() === countryName);
      if (countryData) {
        tooltip.style("display", "block");
        tooltip.html(`${d.properties.name}: Rank ${countryData.rank}`);
      }
    })
    .on("mousemove", event => {
      tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY}px`);
    })
    .on("mouseout", () => {
      tooltip.style("display", "none");
    });

  return svg.node();
}
)}

function _16(mapfilters){return(
mapfilters
)}

function _map(mapfilters,createMap){return(
(async () => {
  const filteredData = await mapfilters;
  return createMap(filteredData);
})()
)}

function _chartcountryFilter(Inputs,data){return(
Inputs.select(data.map(d => d.country).filter((v, i, a) => a.indexOf(v) === i), {label: "Select Country"})
)}

function _19(chartcountryFilter){return(
chartcountryFilter
)}

function _filteredData(data,chartcountryFilter){return(
data.filter(d => d.country === chartcountryFilter)
)}

function _21(filteredData){return(
filteredData
)}

function _22(Plot,filteredData){return(
Plot.plot({
  marginLeft: 50,
  width: 928,
  height: 500,
  x: {
    label: "Year",
    tickFormat: d => d.toString()
  },
  y: {
    grid: true,
    label: "Country Info"
  },
  marks: [
    Plot.areaY(filteredData, {x: "year", y: "score", fill: "blue", title: "Score"}),
    Plot.areaY(filteredData, {x: "year", y: "rank", fill: "red", title: "Rank"}),
    Plot.areaY(filteredData, {x: "year", y: "gdp", fill: "green", title: "GDP per capita"}),
    Plot.areaY(filteredData, {x: "year", y: "health", fill: "purple", title: "Healthy Life Expectancy"}),
    Plot.areaY(filteredData, {x: "year", y: "freedom", fill: "brown", title: "Freedom to Make Life Choices"}),
    Plot.areaY(filteredData, {x: "year", y: "generosity", fill: "pink", title: "Generosity"}),
    Plot.ruleY([0])
  ]
})
)}

function _23(Plot,filteredData){return(
Plot.plot({
  marginLeft: 50,
  width: 928,
  y: {
    grid: true,
    label: "↑ Unemployed (thousands)"
  },
  marks: [
    Plot.line(filteredData, {x: "gdp", y: "rank", title: "industry"}),
    Plot.ruleY([0])
  ]
})
)}

function _24(data){return(
data
)}

function _25(Plot,filteredData){return(
Plot.plot({
  marginLeft: 50,
  width: 928,
  y: {
    grid: true,
    label: "Happiness Prameters"
  },
  marks: [
    Plot.areaY(filteredData, {x: "year", y: "score", fill: "blue", title: "country"}),
    Plot.areaY(filteredData, {x: "year", y: "rank", fill: "red", title: "country"}),
    Plot.areaY(filteredData, {x: "year", y: "health", fill: "green", title: "country"}),
     Plot.areaY(filteredData, {x: "year", y: "gdp", fill: "purple", title: "country"}),
    Plot.areaY(filteredData, {x: "year", y: "freedom", fill: "brown", title: "country"}),
    Plot.areaY(filteredData, {x: "year", y: "generosity", fill: "pink", title: "country"}),
    Plot.ruleY([0])
  ]
})
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["2018.csv", {url: new URL("./files/90f382512c7ec57f06bc379d4af2a8c3d5cdd1c7c1542b8a147eb54bbaf4826a225dae44ada9db827aff0a55c0ae7247787c517eb1fba361a7b2e2701605d9df.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["2016.csv", {url: new URL("./files/4d3b41c2dc6b30a0864b200fad575df9b4e9850a2c8fa241685c644a7fba60d47813f80c78913f1017577faacf9a53a5b0e665c81642976c855a5ede4a33b911.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["2017.csv", {url: new URL("./files/1972e254fef8b44f6a4863cd9de0aabcff11f49543a11db1e60454c833db99e5e4a50dd7a9fd2695f7a9278d30cbb89b82d6692b1baad32d8e3104e7337ca9bc.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["2019.csv", {url: new URL("./files/1840e9ba7df5a304c78a1054fc1a804e81c2c8b944b4fc7703a5861e12dc57e1f66313a7f87e84f0c65d1e31ab4625de5f53bc0c353c2feddcdd266203cb17ba.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["2015.csv", {url: new URL("./files/562fc38bf78da15130ce371296e5035d15821855fc0c356b881ad12c6401dfebdcf9cfdccc84b068a61d5b3287ed561633bc246a96f073914e91d27cfb505816.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  main.variable(observer("sparkbar")).define("sparkbar", ["htl"], _sparkbar);
  main.variable(observer("years")).define("years", _years);
  main.variable(observer("viewof yearFilter")).define("viewof yearFilter", ["Inputs","years"], _yearFilter);
  main.variable(observer("yearFilter")).define("yearFilter", ["Generators", "viewof yearFilter"], (G, _) => G.input(_));
  main.variable(observer("viewof countryFilter")).define("viewof countryFilter", ["Inputs"], _countryFilter);
  main.variable(observer("countryFilter")).define("countryFilter", ["Generators", "viewof countryFilter"], (G, _) => G.input(_));
  main.variable(observer("filteredDataByYearAndCountry")).define("filteredDataByYearAndCountry", ["data","yearFilter","countryFilter"], _filteredDataByYearAndCountry);
  main.variable(observer("tableData")).define("tableData", ["filteredDataByYearAndCountry","Inputs"], _tableData);
  main.variable(observer("world")).define("world", ["d3"], _world);
  main.variable(observer("map_years")).define("map_years", _map_years);
  main.variable(observer("viewof mapyearFilter")).define("viewof mapyearFilter", ["Inputs","map_years","years"], _mapyearFilter);
  main.variable(observer("mapyearFilter")).define("mapyearFilter", ["Generators", "viewof mapyearFilter"], (G, _) => G.input(_));
  main.variable(observer("mapfilters")).define("mapfilters", ["data","mapyearFilter"], _mapfilters);
  main.variable(observer()).define(["world"], _14);
  main.variable(observer("createMap")).define("createMap", ["d3","DOM","world"], _createMap);
  main.variable(observer()).define(["mapfilters"], _16);
  main.variable(observer("map")).define("map", ["mapfilters","createMap"], _map);
  main.variable(observer("viewof chartcountryFilter")).define("viewof chartcountryFilter", ["Inputs","data"], _chartcountryFilter);
  main.variable(observer("chartcountryFilter")).define("chartcountryFilter", ["Generators", "viewof chartcountryFilter"], (G, _) => G.input(_));
  main.variable(observer()).define(["chartcountryFilter"], _19);
  main.variable(observer("filteredData")).define("filteredData", ["data","chartcountryFilter"], _filteredData);
  main.variable(observer()).define(["filteredData"], _21);
  main.variable(observer()).define(["Plot","filteredData"], _22);
  main.variable(observer()).define(["Plot","filteredData"], _23);
  main.variable(observer()).define(["data"], _24);
  main.variable(observer()).define(["Plot","filteredData"], _25);
  return main;
}
