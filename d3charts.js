// d3charts.js - Full D3.js chart rendering support for Bar, Scatter, and Line Charts

const d3Colors = ['#a6cee3', '#b2df8a', '#fb9a99', '#fdbf6f', '#cab2d6',
                  '#ffff99', '#1f78b4', '#33a02c', '#e31a1c', '#ff7f00'];

const tooltip = d3.select("body").append("div")
  .attr("class", "d3-tooltip")
  .style("position", "absolute")
  .style("background", "#333")
  .style("color", "#fff")
  .style("padding", "6px")
  .style("border-radius", "4px")
  .style("opacity", 0)
  .style("pointer-events", "none");

function clearContainer(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
}

function addTooltip(selection, color, labelAccessor) {
  selection
    .on("mouseover", function(event, d) {
      tooltip.transition().duration(200).style("opacity", .9);
      tooltip.html(labelAccessor(d))
             .style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 28) + "px");
      d3.select(this).attr("fill", d3.rgb(color).darker(1));
    })
    .on("mouseout", function() {
      tooltip.transition().duration(500).style("opacity", 0);
      d3.select(this).attr("fill", color);
    });
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

    chart.append("g").call(d3.axisLeft(yScale));
    chart.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    yData.forEach((yd, seriesIdx) => {
      const bars = chart.selectAll(`.bar-h-${seriesIdx}`)
        .data(yd.values)
        .enter()
        .append("rect")
        .attr("y", (d, i) => yScale(x[i]) + seriesIdx * (yScale.bandwidth() / yData.length))
        .attr("x", 0)
        .attr("height", yScale.bandwidth() / yData.length)
        .attr("width", d => xScale(d))
        .attr("fill", d3Colors[seriesIdx % d3Colors.length]);

      addTooltip(bars, d3Colors[seriesIdx % d3Colors.length], d => `${yd.name}: ${d}`);
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

  chart.append("g").call(d3.axisLeft(yScale));
  chart.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-90)")
    .attr("dy", "-0.3em")
    .attr("dx", "-0.8em")
    .style("text-anchor", "end");

  if (subtype === 'Stacked') {
    const stackedData = x.map((label, i) => {
      const obj = {};
      yData.forEach(yd => obj[yd.name] = yd.values[i]);
      return obj;
    });

    const stack = d3.stack().keys(yData.map(d => d.name));
    const series = stack(stackedData);

    chart.selectAll(".stack").data(series).enter().append("g")
      .attr("fill", (d, i) => d3Colors[i % d3Colors.length])
      .selectAll("rect")
      .data(d => d)
      .enter().append("rect")
      .attr("x", (_, i) => xScale(x[i]))
      .attr("y", d => yScale(d[1]))
      .attr("height", d => yScale(d[0]) - yScale(d[1]) < 0 ? yScale(d[1]) - yScale(d[0]) : yScale(d[0]) - yScale(d[1]))

      .attr("width", xScale.bandwidth())
      .each(function(d, i, nodes) {
        const seriesIdx = series.findIndex(s => s.includes(d));
        addTooltip(d3.select(this), d3Colors[seriesIdx % d3Colors.length], () => `${yData[seriesIdx].name}: ${d[1] - d[0]}`);
      });
  } else {
    yData.forEach((yd, seriesIdx) => {
      const bars = chart.selectAll(`.bar-${seriesIdx}`)
        .data(yd.values)
        .enter()
        .append("rect")
        .attr("x", (d, i) => xScale(x[i]) + seriesIdx * (xScale.bandwidth() / yData.length))
        .attr("y", d => yScale(d))
        .attr("width", xScale.bandwidth() / yData.length)
        .attr("height", d => height - yScale(d))
        .attr("fill", d3Colors[seriesIdx % d3Colors.length]);

      addTooltip(bars, d3Colors[seriesIdx % d3Colors.length], d => `${yd.name}: ${d}`);
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
        height = svgHeight - margin.top - margin.bottom;

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const flatY = yData.flatMap(d => d.values);
  const isCategorical = isNaN(parseFloat(x[0]));
  const xScale = isCategorical ?
    d3.scalePoint().domain(x).range([0, width]).padding(0.5) :
    d3.scaleLinear().domain(d3.extent(x.map(v => +v))).range([0, width]);

  const yScale = d3.scaleLinear().domain(d3.extent(flatY)).range([height, 0]);

  chart.append("g").call(d3.axisLeft(yScale));
  chart.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-90)")
    .attr("dy", "-0.3em")
    .attr("dx", "-0.8em")
    .style("text-anchor", "end");

  yData.forEach((yd, i) => {
    const circles = chart.selectAll(`circle-${i}`)
      .data(yd.values)
      .enter()
      .append("circle")
      .attr("cx", (_, idx) => xScale(x[idx]))
      .attr("cy", d => yScale(d))
      .attr("r", subtype === 'Bubble' ? d => Math.abs(d) / 4 || 5 : 5)
      .attr("fill", d3Colors[i % d3Colors.length]);

    addTooltip(circles, d3Colors[i % d3Colors.length], d => `${yd.name}: ${d}`);
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
  const isCategorical = isNaN(parseFloat(x[0]));
  const xScale = isCategorical ?
    d3.scalePoint().domain(x).range([0, width]).padding(0.5) :
    d3.scaleLinear().domain(d3.extent(x.map(v => +v))).range([0, width]);

  const yScale = d3.scaleLinear().domain(d3.extent(flatY)).range([height, 0]);

  chart.append("g").call(d3.axisLeft(yScale));
  chart.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-90)")
    .attr("dy", "-0.3em")
    .attr("dx", "-0.8em")
    .style("text-anchor", "end");

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
      .attr("stroke", d3Colors[i % d3Colors.length])
      .attr("stroke-width", 2)
      .attr("d", line);
  });
}