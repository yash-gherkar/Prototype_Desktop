// renderer.js with D3 support integration

let uploadedFilePath = null;
let parsedData = [];
let filteredData = [];
let columns = [];

const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
                '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

document.getElementById('fileInput').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const fileContent = reader.result;

    // Send file to main process and save it
    window.pandasAPI.sendFile(file.name, fileContent);

    // Parse in browser for charting
    if (file.name.endsWith('.csv')) {
      const result = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
      parsedData = result.data;
      filteredData = [...parsedData];
      columns = result.meta.fields;
      createAllControls();
    } else if (file.name.endsWith('.xlsx')) {
      const workbook = XLSX.read(fileContent, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      parsedData = XLSX.utils.sheet_to_json(sheet, { defval: null });
      filteredData = [...parsedData];
      columns = Object.keys(parsedData[0]);
      createAllControls();
    }
  };

  // Choose appropriate reader mode
  if (file.name.endsWith('.csv')) {
    reader.readAsText(file);
  } else if (file.name.endsWith('.xlsx')) {
    reader.readAsBinaryString(file);
  }
}


  const reader = new FileReader();

  if (file.name.endsWith('.csv')) {
    reader.onload = () => {
      const result = Papa.parse(reader.result, { header: true, skipEmptyLines: true });
      parsedData = result.data;
      filteredData = [...parsedData];
      columns = result.meta.fields;
      createAllControls();
    };
    reader.readAsText(file);
  } else if (file.name.endsWith('.xlsx')) {
    reader.onload = () => {
      const workbook = XLSX.read(reader.result, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      parsedData = XLSX.utils.sheet_to_json(sheet, { defval: null });
      filteredData = [...parsedData];
      columns = Object.keys(parsedData[0]);
      createAllControls();
    };
    reader.readAsBinaryString(file);
  }
}

function createAllControls() {
  const config = {
    bar: ['Grouped', 'Stacked', 'Horizontal'],
    scatter: ['Markers Only', 'Lines + Markers', 'Bubble'],
    line: ['Simple Line', 'Multi-Line', 'Stepped']
  };

  ['bar', 'scatter', 'line'].forEach(type => {
    const subtypeOptions = config[type].map(opt => `<option value="${opt}">${opt}</option>`).join('');

    const controlsHTML = `
      <label>Select X:</label>
      <select class="form-select mb-2" id="${type}X">
        ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
      </select>

      <label>Select Y Columns (multi):</label>
      <select class="form-select mb-2" id="${type}Y" multiple size="5">
        ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
      </select>

      <label>Chart Subtype:</label>
      <select class="form-select mb-2" id="${type}Subtype">
        ${subtypeOptions}
      </select>

      <label>Library:</label>
      <select class="form-select mb-2" id="${type}Lib">
        <option value="plotly">Plotly</option>
        <option value="d3">D3</option>
      </select>

      <button class="btn btn-primary" onclick="draw${capitalize(type)}Chart()">Draw Chart</button>
    `;

    document.getElementById(`${type}Controls`).innerHTML = controlsHTML;
  });
}

function getChartInput(chartType) {
  const xCol = document.getElementById(`${chartType}X`).value;
  const yOptions = document.getElementById(`${chartType}Y`).selectedOptions;
  const yCols = Array.from(yOptions).map(o => o.value);
  const subtype = document.getElementById(`${chartType}Subtype`).value;
  const lib = document.getElementById(`${chartType}Lib`).value;

  const x = filteredData.map(row => row[xCol]);
  const yData = yCols.map(col => ({
    name: col,
    values: filteredData.map(row => parseFloat(row[col]))
  }));

  return { x, yData, xCol, yCols, subtype, lib };
}

function drawBarChart() {
  const { x, yData, xCol, yCols, subtype, lib } = getChartInput('bar');
  
  if (lib === 'd3') {
    d3RenderBarChart(x, yData, subtype, 'barChartContainer');
    return;
  }

  if (lib === 'plotly') {
    const traces = yData.map((yd, i) => ({
      x: subtype === 'Horizontal' ? yd.values : x,
      y: subtype === 'Horizontal' ? x : yd.values,
      type: 'bar',
      name: yd.name,
      orientation: subtype === 'Horizontal' ? 'h' : 'v',
      marker: { color: colors[i % colors.length] }
    }));

    const layout = {
      title: `${yCols.join(', ')} vs ${xCol} (${subtype})`,
      barmode: subtype === 'Stacked' ? 'stack' : subtype === 'Grouped' ? 'group' : 'overlay',
      plot_bgcolor: '#1e1e2f',
      paper_bgcolor: '#1e1e2f',
      font: { color: '#f0f0f0' },
      legend: { bgcolor: '#2a2a3d' }
    };

    Plotly.newPlot('barChartContainer', traces, layout);
  }
}

function drawScatterChart() {
  const { x, yData, xCol, yCols, subtype, lib } = getChartInput('scatter');
  if (lib === 'd3') {
    d3RenderScatterChart(x, yData, subtype, 'scatterChartContainer');
    return;
  }

  if (lib === 'plotly') {
    const traces = yData.map((yd, i) => ({
      x: x,
      y: yd.values,
      mode: subtype === 'Lines + Markers' ? 'lines+markers' : 'markers',
      type: 'scatter',
      name: yd.name,
      marker: {
        color: colors[i % colors.length],
        size: subtype === 'Bubble' ? yd.values.map(v => Math.abs(v) / 2 || 5) : 8
      }
    }));

    const layout = {
      title: `${yCols.join(', ')} vs ${xCol} (${subtype})`,
      plot_bgcolor: '#1e1e2f',
      paper_bgcolor: '#1e1e2f',
      font: { color: '#f0f0f0' },
      legend: { bgcolor: '#2a2a3d' }
    };

    Plotly.newPlot('scatterChartContainer', traces, layout);
  }
}

function drawLineChart() {
  const { x, yData, xCol, yCols, subtype, lib } = getChartInput('line');
  if (lib === 'd3') {
    d3RenderLineChart(x, yData, subtype, 'lineChartContainer');
    return;
  }

  if (lib === 'plotly') {
    const traces = yData.map((yd, i) => ({
      x: x,
      y: yd.values,
      type: 'scatter',
      mode: 'lines+markers',
      name: yd.name,
      line: subtype === 'Stepped' ? { shape: 'hv' } : {},
      marker: { color: colors[i % colors.length] }
    }));

    const layout = {
      title: `${yCols.join(', ')} vs ${xCol} (${subtype})`,
      plot_bgcolor: '#1e1e2f',
      paper_bgcolor: '#1e1e2f',
      font: { color: '#f0f0f0' },
      legend: { bgcolor: '#2a2a3d' }
    };

    Plotly.newPlot('lineChartContainer', traces, layout);
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


async function runPandas(command) {
  const output = document.getElementById('pandasOutput');
  output.innerHTML = '<em>Loading...</em>';

  try {
    const result = await window.pandasAPI.runCommand(command, {});
    output.innerHTML = '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
  } catch (err) {
    output.innerHTML = '<span class="text-danger">Error: ' + err.message + '</span>';
  }
}
