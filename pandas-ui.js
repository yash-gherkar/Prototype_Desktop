async function runPandasOp(operation) {
  console.log("[UI] Operation:", operation);
  if (!parsedData || parsedData.length === 0) {
    console.error("[UI] No parsedData available");
    return;
  }

  const csv = Papa.unparse(parsedData);
  console.log("[UI] Sending CSV:", csv.slice(0, 100) + "...");

  try {
    const result = await window.myAPI.runPython(csv, operation);
    console.log("[UI] Received:", result);
    document.getElementById('pandasOutput').textContent = result;
  } catch (err) {
    console.error("[UI] runPython failed:", err);
  }
}
