// d3charts.js - Full D3.js chart rendering support for Bar, Scatter, and Line

function clearContainer(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
}

function d3RenderBarChart(x, yData, subtype, containerId) {
  clearContainer(containerId);
  const svg = d3.select(`#${containerId}`)
    .append("svg")
    .attr("width", 800)
    .attr("height", 400);

  const margin = { top: 20, right: 30, bottom: 50, left: 60 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleBand()
    .domain(x)
    .range([0, width])
    .padding(0.2);

  const maxY = d3.max(yData.flatMap(d => d.values));
  const yScale = d3.scaleLinear()
    .domain([0, maxY])
    .range([height, 0]);

  chart.append("g")
    .call(d3.axisLeft(yScale).tickSize(-width).tickPadding(10))
    .attr("color", "#aaa");

  chart.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
    .style("fill", "#ccc");

  if (subtype === 'Stacked') {
    const stack = d3.stack().keys(yData.map(d => d.name))
      .value((d, key) => d[key]);

    const dataByX = x.map((label, i) => {
      const obj = { x: label };
      yData.forEach(yd => obj[yd.name] = yd.values[i]);
      return obj;
    });

    const series = stack(dataByX);

    chart.selectAll(".stack").data(series).enter().append("g")
      .attr("fill", (d, i) => colors[i % colors.length])
      .selectAll("rect")
      .data(d => d)
      .enter().append("rect")
      .attr("x", d => xScale(d.data.x))
      .attr("y", d => yScale(d[1]))
      .attr("height", d => yScale(d[0]) - yScale(d[1]))
      .attr("width", xScale.bandwidth());

  } else {
    yData.forEach((yd, seriesIdx) => {
      chart.selectAll(`.bar-${seriesIdx}`)
        .data(yd.values)
        .enter()
        .append("rect")
        .attr("x", (d, i) => xScale(x[i]) + seriesIdx * (xScale.bandwidth() / yData.length))
        .attr("y", d => yScale(d))
        .attr("width", xScale.bandwidth() / yData.length)
        .attr("height", d => height - yScale(d))
        .attr("fill", colors[seriesIdx % colors.length])
        .append("title")
        .text(d => `${yd.name}: ${d}`);
    });
  }
}

function d3RenderScatterChart(x, yData, subtype, containerId) {
  clearContainer(containerId);
  const svg = d3.select(`#${containerId}`)
    .append("svg")
    .attr("width", 800)
    .attr("height", 400);

  const margin = { top: 20, right: 30, bottom: 50, left: 60 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const xNumeric = x.map(v => parseFloat(v));
  const flatY = yData.flatMap(d => d.values);

  const xScale = d3.scaleLinear()
    .domain([d3.min(xNumeric), d3.max(xNumeric)])
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([d3.min(flatY), d3.max(flatY)])
    .range([height, 0]);

  chart.append("g")
    .call(d3.axisLeft(yScale))
    .attr("color", "#aaa");

  chart.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .attr("color", "#aaa");

  yData.forEach((yd, i) => {
    chart.selectAll(`circle-${i}`)
      .data(yd.values)
      .enter()
      .append("circle")
      .attr("cx", (d, idx) => xScale(xNumeric[idx]))
      .attr("cy", d => yScale(d))
      .attr("r", subtype === 'Bubble' ? d => Math.abs(d) / 4 || 5 : 5)
      .attr("fill", colors[i % colors.length]);
  });
}

function d3RenderLineChart(x, yData, subtype, containerId) {
  clearContainer(containerId);
  const svg = d3.select(`#${containerId}`)
    .append("svg")
    .attr("width", 800)
    .attr("height", 400);

  const margin = { top: 20, right: 30, bottom: 50, left: 60 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const xNumeric = x.map(v => parseFloat(v));
  const flatY = yData.flatMap(d => d.values);

  const xScale = d3.scaleLinear()
    .domain([d3.min(xNumeric), d3.max(xNumeric)])
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([d3.min(flatY), d3.max(flatY)])
    .range([height, 0]);

  chart.append("g")
    .call(d3.axisLeft(yScale))
    .attr("color", "#aaa");

  chart.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .attr("color", "#aaa");

  yData.forEach((yd, i) => {
    const line = d3.line()
      .x((_, idx) => xScale(xNumeric[idx]))
      .y(d => yScale(d));

    chart.append("path")
      .datum(yd.values)
      .attr("fill", "none")
      .attr("stroke", colors[i % colors.length])
      .attr("stroke-width", 2)
      .attr("d", line);
  });
}
