const chartState = {
  utilization: null,
  ready: null,
  storage: null
};

const percentFormat = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const numberFormat = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

window.addEventListener('DOMContentLoaded', () => {
  const importButton = document.getElementById('importButton');
  const clearButton = document.getElementById('clearButton');
  const fileInput = document.getElementById('fileInput');

  if (importButton && fileInput) {
    importButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (event) => {
      const [file] = event.target.files || [];
      if (file) {
        await loadSnapshotFromFile(file);
      }
      event.target.value = '';
    });
  }

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      renderEmpty('Import a JSON export from master capacity planner.ps1 to render the charts.');
    });
  }

  renderEmpty('Import a JSON export from master capacity planner.ps1 to render the charts.');
});

async function loadSnapshotFromFile(file) {
  setStatus('info', `Loading ${file.name}...`);
  try {
    const payload = JSON.parse(await file.text());
    payload._importFileName = file.name;
    renderDashboard(payload);
  }
  catch (error) {
    renderEmpty(`Could not read ${file.name}. ${error.message}`);
  }
}

function renderDashboard(payload) {
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  if (rows.length === 0) {
    renderEmpty(payload.message || 'No exported capacity facts uploaded yet.');
    return;
  }

  const clusterRow = rows.find((row) => row.scope === 'Cluster Total') || rows[0];
  const worstReady = getMax(rows, 'p99CpuReadyPct');
  const worstCpuN1 = getMax(rows, 'p99CpuN1UtilPct');

  setStatus(
    worstReady !== null && worstReady > 5 ? 'warn' : 'ok',
    `Loaded ${payload._importFileName || 'JSON file'} with ${rows.length} scope rows from ${payload.previousWorkingDay || 'the selected export'} for cluster ${payload.cluster || 'unknown'}.`
  );

  renderMeta(payload, rows);
  renderHeadlines(clusterRow, worstCpuN1, worstReady);
  renderUtilizationChart(rows);
  renderReadyChart(rows);
  renderStorageChart(rows);
  renderTable(rows);
}

function renderEmpty(message) {
  destroyCharts();
  setStatus('warn', message);
  document.getElementById('snapshotMeta').innerHTML = `
    <div class="snapshot-card">
      <span>Input source</span>
      <strong>Local JSON file</strong>
    </div>
    <div class="snapshot-card">
      <span>What to do</span>
      <strong>Export JSON from the PowerShell tool, then use Import JSON on this page.</strong>
    </div>
  `;
  document.getElementById('headlineMetrics').innerHTML = '';
  document.getElementById('factsTableBody').innerHTML = `
    <tr>
      <td colspan="11" class="muted-copy">${escapeHtml(message)}</td>
    </tr>
  `;
}

function renderMeta(payload, rows) {
  const metaItems = [
    ['Source file', payload._importFileName || 'N/A'],
    ['Generated', formatDate(payload.generatedAtLocal || payload.generatedAtUtc)],
    ['vCenter', payload.vcenter || 'N/A'],
    ['Cluster', payload.cluster || 'N/A'],
    ['Working day', payload.previousWorkingDay || 'N/A'],
    ['Sites', `${payload.prodSiteCode || 'N/A'} / ${payload.drSiteCode || 'N/A'}`],
    ['Rows', String(rows.length)],
    ['P99 enabled', payload.p99Enabled ? 'Yes' : 'No'],
    ['Simulation', payload.simulation && payload.simulation.enabled ? `+${payload.simulation.addVcpu} vCPU / +${payload.simulation.addVmemGB} GB` : 'Disabled']
  ];

  document.getElementById('snapshotMeta').innerHTML = metaItems.map(([label, value]) => `
    <div class="snapshot-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join('');
}

function renderHeadlines(clusterRow, worstCpuN1, worstReady) {
  const cards = [
    ['Cluster P99 CPU', formatPercent(clusterRow.p99CpuUtilPct)],
    ['Cluster P99 Mem', formatPercent(clusterRow.p99MemUtilPct)],
    ['Worst P99 CPU N+1', formatPercent(worstCpuN1)],
    ['Worst P99 Ready', formatPercent(worstReady)]
  ];

  document.getElementById('headlineMetrics').innerHTML = cards.map(([label, value]) => `
    <div class="spotlight-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join('');
}

function renderUtilizationChart(rows) {
  const ctx = document.getElementById('utilizationChart');
  chartState.utilization = replaceChart(chartState.utilization, ctx, {
    type: 'bar',
    data: {
      labels: rows.map(getScopeLabel),
      datasets: [
        { label: 'P99 CPU Util', data: rows.map((row) => row.p99CpuUtilPct), backgroundColor: '#7cf1c0' },
        { label: 'P99 Mem Util', data: rows.map((row) => row.p99MemUtilPct), backgroundColor: '#4fc3f7' },
        { label: 'P99 CPU N+1 Util', data: rows.map((row) => row.p99CpuN1UtilPct), backgroundColor: '#ffbf70' },
        { label: 'P99 Mem N+1 Util', data: rows.map((row) => row.p99MemN1UtilPct), backgroundColor: '#ff8977' }
      ]
    },
    options: buildChartOptions('Utilisation %')
  });
}

function renderReadyChart(rows) {
  const ctx = document.getElementById('readyChart');
  chartState.ready = replaceChart(chartState.ready, ctx, {
    type: 'bar',
    data: {
      labels: rows.map(getScopeLabel),
      datasets: [{
        label: 'P99 CPU Ready',
        data: rows.map((row) => row.p99CpuReadyPct),
        backgroundColor: rows.map((row) => row.p99CpuReadyPct > 5 ? '#ff8977' : '#7cf1c0')
      }]
    },
    options: buildChartOptions('Ready %')
  });
}

function renderStorageChart(rows) {
  const ctx = document.getElementById('storageChart');
  chartState.storage = replaceChart(chartState.storage, ctx, {
    type: 'bar',
    data: {
      labels: rows.map(getScopeLabel),
      datasets: [
        { label: 'Used Storage', data: rows.map((row) => toTb(row.usedStorageGB)), backgroundColor: '#7cf1c0' },
        { label: 'Provisioned Storage', data: rows.map((row) => toTb(row.provisionedStorageGB)), backgroundColor: '#102f48', borderColor: '#4fc3f7', borderWidth: 1.5 }
      ]
    },
    options: buildChartOptions('Storage (TB)')
  });
}

function renderTable(rows) {
  const body = document.getElementById('factsTableBody');
  body.innerHTML = rows.map((row) => {
    const notes = Array.isArray(row.notes) && row.notes.length > 0
      ? `<ul class="notes-list">${row.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>`
      : '<span class="muted-copy">None</span>';

    return `
      <tr>
        <td>${escapeHtml(row.scope || 'N/A')}</td>
        <td>${escapeHtml(row.site || 'N/A')}</td>
        <td>${escapeHtml(String(row.hosts ?? 'N/A'))}</td>
        <td>${escapeHtml(formatPercent(row.p99CpuUtilPct))}</td>
        <td>${escapeHtml(formatPercent(row.p99MemUtilPct))}</td>
        <td>${escapeHtml(formatPercent(row.p99CpuN1UtilPct))}</td>
        <td>${escapeHtml(formatPercent(row.p99MemN1UtilPct))}</td>
        <td>${escapeHtml(formatPercent(row.p99CpuReadyPct))}</td>
        <td>${escapeHtml(formatCapacity(row.usedStorageGB))}</td>
        <td>${escapeHtml(formatCapacity(row.provisionedStorageGB))}</td>
        <td>${notes}</td>
      </tr>
    `;
  }).join('');
}

function replaceChart(currentChart, canvas, config) {
  if (currentChart) {
    currentChart.destroy();
  }
  return new Chart(canvas, config);
}

function destroyCharts() {
  Object.keys(chartState).forEach((key) => {
    if (chartState[key]) {
      chartState[key].destroy();
      chartState[key] = null;
    }
  });
}

function buildChartOptions(yAxisLabel) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        labels: {
          color: '#f2f7ff'
        }
      },
      tooltip: {
        callbacks: {
          label(context) {
            const value = context.raw;
            if (value === null || value === undefined) {
              return `${context.dataset.label}: N/A`;
            }
            const suffix = yAxisLabel.includes('Storage') ? ' TB' : '%';
            return `${context.dataset.label}: ${numberFormat.format(value)}${suffix}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#f2f7ff'
        },
        grid: {
          color: 'rgba(255,255,255,0.06)'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#f2f7ff'
        },
        title: {
          display: true,
          text: yAxisLabel,
          color: '#8ca0b7'
        },
        grid: {
          color: 'rgba(255,255,255,0.06)'
        }
      }
    }
  };
}

function setStatus(kind, message) {
  const banner = document.getElementById('statusBanner');
  banner.className = `status-banner status-banner--${kind}`;
  banner.textContent = message;
}

function getScopeLabel(row) {
  if (row.scope === 'Cluster Total') {
    return 'Cluster';
  }
  return row.site || row.scope || 'Scope';
}

function getMax(rows, key) {
  const values = rows
    .map((row) => row[key])
    .filter((value) => value !== null && value !== undefined && !Number.isNaN(value));

  if (values.length === 0) {
    return null;
  }

  return Math.max(...values);
}

function formatPercent(value) {
  return value === null || value === undefined ? 'N/A' : `${percentFormat.format(value)}%`;
}

function formatCapacity(valueInGb) {
  if (valueInGb === null || valueInGb === undefined) {
    return 'N/A';
  }
  if (valueInGb >= 1024) {
    return `${numberFormat.format(valueInGb / 1024)} TB`;
  }
  return `${numberFormat.format(valueInGb)} GB`;
}

function toTb(valueInGb) {
  return valueInGb === null || valueInGb === undefined ? null : Number((valueInGb / 1024).toFixed(2));
}

function formatDate(isoValue) {
  if (!isoValue) {
    return 'N/A';
  }

  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) {
    return isoValue;
  }

  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
