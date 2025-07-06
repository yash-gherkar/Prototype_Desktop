
const d3Colors = d3.schemeSet3;

function clearChart(containerId) {
  d3.select(`#${containerId}`).selectAll("*").remove();
}

function createTooltip(containerId) {
  return d3.select(`#${containerId}`)
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#333")
    .style("color", "#fff")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("font-size", "13px")
    .style("pointer-events", "none")
    .style("opacity", 0);
}

function addZoom(svgRoot, contentGroup, xScale, yScale, xAxisG, yAxisG, drawCallback) {
  svgRoot.call(
    d3.zoom()
      .scaleExtent([1, 8])
      .translateExtent([[0, 0], [svgRoot.attr("width"), svgRoot.attr("height")]])
      .on("zoom", (event) => {
        const t = event.transform;
        const zx = t.rescaleX(xScale);
        const zy = t.rescaleY(yScale);
        xAxisG.call(d3.axisBottom(zx)).selectAll("text").attr("fill", "#fff");
        yAxisG.call(d3.axisLeft(zy)).selectAll("text").attr("fill", "#fff");
        drawCallback(zx, zy);
      })
  );
}

// BAR CHART
function d3RenderBarChart(x, yData, subtype, containerId) {
  clearChart(containerId);
  const tooltip = createTooltip(containerId);

  const margin = { top: 40, right: 30, bottom: 60, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svgRoot = d3.select(`#${containerId}`)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background", "#1e1e2f");

  const svg = svgRoot.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const content = svg.append("g");

  const x0 = d3.scaleBand().domain(x).range([0, width]).padding(0.1);
  const y = d3.scaleLinear().domain([0, d3.max(yData.flatMap(d => d.values))]).nice().range([height, 0]);
  const color = d3.scaleOrdinal(d3Colors);

  const xAxisG = svg.append("g").attr("transform", `translate(0,${height})`);
  const yAxisG = svg.append("g");

  function drawBars(zx, zy) {
    content.selectAll("g").remove();

    const group = content.selectAll("g")
      .data(yData)
      .join("g")
      .attr("fill", (_, i) => color(i));

    group.selectAll("rect")
      .data((d, i) => d.values.map((v, j) => ({ key: x[j], value: v, i, label: d.name })))
      .join("rect")
      .attr("x", d => zx(d.key) + zx.bandwidth() / yData.length * d.i)
      .attr("width", zx.bandwidth() / yData.length)
      .attr("y", d => zy(d.value))
      .attr("height", d => height - zy(d.value))
      .on("mousemove", (e, d) => {
        tooltip.style("opacity", 1)
          .html(`<b>${d.label}</b><br>${d.key}: ${d.value}`)
          .style("left", `${e.pageX + 10}px`)
          .style("top", `${e.pageY - 30}px`);
      })
      .on("mouseleave", () => tooltip.style("opacity", 0));
  }

  xAxisG.call(d3.axisBottom(x0)).selectAll("text").attr("fill", "#fff");
  yAxisG.call(d3.axisLeft(y)).selectAll("text").attr("fill", "#fff");

  svg.append("text")
    .attr("x", width / 2).attr("y", -10)
    .attr("text-anchor", "middle")
    .style("fill", "#fff").style("font-size", "16px")
    .text(`Bar Chart (${subtype})`);

  drawBars(x0, y);
  addZoom(svgRoot, content, x0, y, xAxisG, yAxisG, drawBars);
}

// SCATTER CHART
function d3RenderScatterChart(x, yData, subtype, containerId) {
  clearChart(containerId);
  const tooltip = createTooltip(containerId);

  const margin = { top: 40, right: 30, bottom: 60, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svgRoot = d3.select(`#${containerId}`)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background", "#1e1e2f");

  const svg = svgRoot.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const content = svg.append("g");

  const xScale = d3.scalePoint().domain(x).range([0, width]);
  const yScale = d3.scaleLinear().domain([0, d3.max(yData.flatMap(d => d.values))]).nice().range([height, 0]);
  const color = d3.scaleOrdinal(d3Colors);

  const xAxisG = svg.append("g").attr("transform", `translate(0,${height})`);
  const yAxisG = svg.append("g");

  function drawPoints(zx, zy) {
    content.selectAll("g").remove();

    const group = content.selectAll("g")
      .data(yData)
      .join("g")
      .attr("fill", (_, i) => color(i));

    group.selectAll("circle")
      .data((d, i) => d.values.map((v, j) => ({ x: x[j], y: v, label: d.name })))
      .join("circle")
      .attr("cx", d => zx(d.x))
      .attr("cy", d => zy(d.y))
      .attr("r", 5)
      .on("mousemove", (e, d) => {
        tooltip.style("opacity", 1)
          .html(`<b>${d.label}</b><br>${d.x}: ${d.y}`)
          .style("left", `${e.pageX + 10}px`)
          .style("top", `${e.pageY - 30}px`);
      })
      .on("mouseleave", () => tooltip.style("opacity", 0));
  }

  xAxisG.call(d3.axisBottom(xScale)).selectAll("text").attr("fill", "#fff");
  yAxisG.call(d3.axisLeft(yScale)).selectAll("text").attr("fill", "#fff");

  svg.append("text")
    .attr("x", width / 2).attr("y", -10)
    .attr("text-anchor", "middle")
    .style("fill", "#fff").style("font-size", "16px")
    .text(`Scatter Plot (${subtype})`);

  drawPoints(xScale, yScale);
  addZoom(svgRoot, content, xScale, yScale, xAxisG, yAxisG, drawPoints);
}

// LINE CHART
function d3RenderLineChart(x, yData, subtype, containerId) {
  clearChart(containerId);
  const tooltip = createTooltip(containerId);

  const margin = { top: 40, right: 30, bottom: 60, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svgRoot = d3.select(`#${containerId}`)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background", "#1e1e2f");

  const svg = svgRoot.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const content = svg.append("g");

  const xScale = d3.scalePoint().domain(x).range([0, width]);
  const yScale = d3.scaleLinear().domain([0, d3.max(yData.flatMap(d => d.values))]).nice().range([height, 0]);
  const color = d3.scaleOrdinal(d3Colors);

  const xAxisG = svg.append("g").attr("transform", `translate(0,${height})`);
  const yAxisG = svg.append("g");

  function drawLines(zx, zy) {
    content.selectAll("*").remove();

    yData.forEach((series, i) => {
      const line = d3.line()
        .x((_, j) => zx(x[j]))
        .y(d => zy(d));

      if (subtype === 'Stepped') line.curve(d3.curveStepAfter);

      content.append("path")
        .datum(series.values)
        .attr("fill", "none")
        .attr("stroke", color(i))
        .attr("stroke-width", 2)
        .attr("d", line);

      content.selectAll(`.point-${i}`)
        .data(series.values.map((v, j) => ({ x: x[j], y: v, label: series.name })))
        .join("circle")
        .attr("cx", d => zx(d.x))
        .attr("cy", d => zy(d.y))
        .attr("r", 4)
        .style("fill", color(i))
        .on("mousemove", (e, d) => {
          tooltip.style("opacity", 1)
            .html(`<b>${d.label}</b><br>${d.x}: ${d.y}`)
            .style("left", `${e.pageX + 10}px`)
            .style("top", `${e.pageY - 30}px`);
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));
    });
  }

  xAxisG.call(d3.axisBottom(xScale)).selectAll("text").attr("fill", "#fff");
  yAxisG.call(d3.axisLeft(yScale)).selectAll("text").attr("fill", "#fff");

  svg.append("text")
    .attr("x", width / 2).attr("y", -10)
    .attr("text-anchor", "middle")
    .style("fill", "#fff").style("font-size", "16px")
    .text(`Line Chart (${subtype})`);

  drawLines(xScale, yScale);
  addZoom(svgRoot, content, xScale, yScale, xAxisG, yAxisG, drawLines);
}
