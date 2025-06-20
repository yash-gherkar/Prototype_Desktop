// d3charts.js - Full D3.js chart rendering support for Bar, Scatter, and Line

function clearContainer(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
}

function d3RenderBarChart(x, yData, subtype, containerId) {
  clearContainer(containerId);
  const container = document.getElementById(containerId);
  const svgWidth = container.clientWidth || 800;
  const svgHeight = 400;

  const svg = d3.select(container)
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const margin = { top: 20, right: 30, bottom: 50, left: 60 },
        width = svgWidth - margin.left - margin.right,
        height = svgHeight - margin.top - margin.bottom;

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  if (subtype === 'Horizontal') {
    const yScale = d3.scaleBand()
      .domain(x)
      .range([0, height])
      .padding(0.2);

    const maxX = d3.max(yData.flatMap(d => d.values));
    const xScale = d3.scaleLinear()
      .domain([0, maxX])
      .range([0, width]);

    chart.append("g")
      .call(d3.axisLeft(yScale).tickFormat(d => d.length > 10 ? d.slice(0, 10) + '…' : d))
      .attr("color", "#aaa");

    chart.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(6))
      .attr("color", "#aaa");

    yData.forEach((yd, seriesIdx) => {
      chart.selectAll(`.bar-h-${seriesIdx}`)
        .data(yd.values)
        .enter()
        .append("rect")
        .attr("y", (d, i) => yScale(x[i]) + seriesIdx * (yScale.bandwidth() / yData.length))
        .attr("x", 0)
        .attr("height", yScale.bandwidth() / yData.length)
        .attr("width", d => xScale(d))
        .attr("fill", colors[seriesIdx % colors.length])
        .append("title")
        .text(d => `${yd.name}: ${d}`);
    });
    return;
  }

  const xScale = d3.scaleBand()
    .domain(x)
    .range([0, width])
    .padding(0.2);

  const maxY = d3.max(yData.flatMap(d => d.values));
  const yScale = d3.scaleLinear()
    .domain([0, maxY])
    .range([height, 0]);

  chart.append("g")
    .call(d3.axisLeft(yScale).ticks(6).tickSize(-width).tickPadding(10))
    .attr("color", "#aaa");

  chart.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).tickFormat(d => d.length > 10 ? d.slice(0, 10) + '…' : d))
    .selectAll("text")
    .attr("transform", "rotate(-90)")
    .attr("dy", "-0.3em")
    .attr("dx", "-0.8em")
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
  const container = document.getElementById(containerId);
  const svgWidth = container.clientWidth || 800;
  const svgHeight = 400;

  const svg = d3.select(container)
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const margin = { top: 20, right: 30, bottom: 50, left: 60 },
        width = svgWidth - margin.left - margin.right,
        height = svgHeight - margin.top - margin.bottom + 10;

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const flatY = yData.flatMap(d => d.values);

  let xScale;
  const isCategorical = isNaN(parseFloat(x[0]));
  if (isCategorical) {
    xScale = d3.scalePoint()
      .domain(x)
      .range([0, width])
      .padding(0.5);
  } else {
    const xNumeric = x.map(v => parseFloat(v));
    xScale = d3.scaleLinear()
      .domain([d3.min(xNumeric), d3.max(xNumeric)])
      .range([0, width]);
  }

  const yScale = d3.scaleLinear()
    .domain([d3.min(flatY), d3.max(flatY)])
    .range([height, 0]);

  chart.append("g")
    .call(d3.axisLeft(yScale).ticks(6))
    .attr("color", "#aaa");

  chart.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks ? d3.axisBottom(xScale).ticks(6) : d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-90)")
    .attr("dy", "-0.3em")
    .attr("dx", "-0.8em")
    .style("text-anchor", "end")
    .style("fill", "#ccc");

  yData.forEach((yd, i) => {
    chart.selectAll(`circle-${i}`)
      .data(yd.values)
      .enter()
      .append("circle")
      .attr("cx", (_, idx) => xScale(x[idx]))
      .attr("cy", d => yScale(d))
      .attr("r", subtype === 'Bubble' ? d => Math.abs(d) / 4 || 5 : 5)
      .attr("fill", colors[i % colors.length]);
  });
}


function d3RenderLineChart(x, yData, subtype, containerId) {
  clearContainer(containerId);
  const container = document.getElementById(containerId);
  const svgWidth = container.clientWidth || 800;
  const svgHeight = 400;

  const svg = d3.select(container)
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const margin = { top: 20, right: 30, bottom: 50, left: 60 },
        width = svgWidth - margin.left - margin.right,
        height = svgHeight - margin.top - margin.bottom;

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const flatY = yData.flatMap(d => d.values);

  let xScale;
  const isCategorical = isNaN(parseFloat(x[0]));
  if (isCategorical) {
    xScale = d3.scalePoint()
      .domain(x)
      .range([0, width])
      .padding(0.5);
  } else {
    const xNumeric = x.map(v => parseFloat(v));
    xScale = d3.scaleLinear()
      .domain([d3.min(xNumeric), d3.max(xNumeric)])
      .range([0, width]);
  }

  const yScale = d3.scaleLinear()
    .domain([d3.min(flatY), d3.max(flatY)])
    .range([height, 0]);

  chart.append("g")
    .call(d3.axisLeft(yScale).ticks(6))
    .attr("color", "#aaa");

  chart.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks ? d3.axisBottom(xScale).ticks(6) : d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-90)")
    .attr("dy", "-0.3em")
    .attr("dx", "-0.8em")
    .style("text-anchor", "end")
    .style("fill", "#ccc");

  yData.forEach((yd, i) => {
    const line = d3.line()
      .x((_, idx) => xScale(x[idx]))
      .y(d => yScale(d));

    if (subtype === 'Stepped') {
      line.curve(d3.curveStep);
    }

    chart.append("path")
      .datum(yd.values)
      .attr("fill", "none")
      .attr("stroke", colors[i % colors.length])
      .attr("stroke-width", 2)
      .attr("d", line);
  });
}