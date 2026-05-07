const reviewState = {
  inventory: null,
  activeDomain: null,
  filterText: ""
};

window.addEventListener("DOMContentLoaded", () => {
  const importButton = document.getElementById("importButton");
  const clearButton = document.getElementById("clearButton");
  const folderInput = document.getElementById("folderInput");
  const filterInput = document.getElementById("filterInput");
  const gpoTableBody = document.getElementById("gpoTableBody");

  if (importButton && folderInput) {
    importButton.addEventListener("click", () => folderInput.click());
    folderInput.addEventListener("change", async (event) => {
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        await loadInventoryFromFolder(files);
      }
      event.target.value = "";
    });
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      reviewState.inventory = null;
      reviewState.activeDomain = null;
      reviewState.filterText = "";
      filterInput.value = "";
      renderEmpty("Select an exported gpo-inventory folder to begin the review.");
    });
  }

  if (filterInput) {
    filterInput.addEventListener("input", () => {
      reviewState.filterText = filterInput.value.trim().toLowerCase();
      renderDomainTable();
    });
  }

  if (gpoTableBody) {
    gpoTableBody.addEventListener("toggle", async (event) => {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement) || !details.open || details.dataset.loaded === "true") {
        return;
      }

      try {
        await hydrateGpoDetail(details);
        details.dataset.loaded = "true";
      }
      catch (error) {
        const detailBody = details.querySelector("[data-role='detailBody']");
        if (detailBody) {
          detailBody.innerHTML = `<div class="detail-card"><p class="empty-state">${escapeHtml(error.message)}</p></div>`;
        }
      }
    }, true);
  }

  renderEmpty("Select an exported gpo-inventory folder to begin the review.");
});

async function loadInventoryFromFolder(fileList) {
  setStatus("info", `Loading ${fileList.length} files from the selected inventory folder...`);

  try {
    const inventory = await buildInventory(fileList);
    reviewState.inventory = inventory;
    reviewState.activeDomain = inventory.domainOrder[0] || null;
    reviewState.filterText = "";
    document.getElementById("filterInput").value = "";
    renderInventory();
  }
  catch (error) {
    reviewState.inventory = null;
    reviewState.activeDomain = null;
    renderEmpty(error.message, "warn");
  }
}

async function buildInventory(fileList) {
  const rootNames = Array.from(new Set(fileList.map((file) => getRootFolderName(file.webkitRelativePath))));
  if (rootNames.length !== 1) {
    throw new Error("Please select a single exported inventory folder, not multiple roots.");
  }

  const rootFolderName = rootNames[0];
  if (!rootFolderName || !rootFolderName.toLowerCase().includes("gpo-inventory")) {
    throw new Error(`The selected folder "${rootFolderName || "unknown"}" does not contain "gpo-inventory" in its name.`);
  }

  const fileMap = new Map();
  fileList.forEach((file) => {
    fileMap.set(getRelativePath(file.webkitRelativePath), file);
  });

  const forestSummaryFile = fileMap.get("forest-summary.json");
  if (!forestSummaryFile) {
    throw new Error("The selected folder is missing forest-summary.json.");
  }

  const forestSummary = JSON.parse(await forestSummaryFile.text());
  const errors = await parseOptionalCsv(fileMap.get("errors.csv"));

  const metadataEntries = [];
  for (const [relativePath, file] of fileMap.entries()) {
    if (!relativePath.endsWith("/metadata.json")) {
      continue;
    }

    const pathParts = relativePath.split("/");
    if (pathParts.length !== 3) {
      continue;
    }

    const [domainFolderName, gpoFolderName] = pathParts;
    const metadata = JSON.parse(await file.text());
    const basePath = `${domainFolderName}/${gpoFolderName}`;

    metadataEntries.push({
      key: buildGpoKey(metadata.Domain || domainFolderName, metadata.Id || gpoFolderName),
      domainName: metadata.Domain || domainFolderName,
      domainFolderName,
      gpoFolderName,
      metadata,
      files: {
        settings: fileMap.get(`${basePath}/settings.txt`) || null,
        permissions: fileMap.get(`${basePath}/permissions.csv`) || null,
        report: fileMap.get(`${basePath}/report.xml`) || null
      },
      cache: {
        settingsText: null,
        permissionsRows: null,
        reportXml: null
      }
    });
  }

  if (metadataEntries.length === 0) {
    throw new Error("No metadata.json files were found under the selected inventory folder.");
  }

  const domains = new Map();
  metadataEntries.forEach((entry) => {
    if (!domains.has(entry.domainName)) {
      domains.set(entry.domainName, {
        name: entry.domainName,
        folderName: entry.domainFolderName,
        gpos: [],
        errors: []
      });
    }

    domains.get(entry.domainName).gpos.push(entry);
  });

  errors.forEach((errorRow) => {
    const domainName = errorRow.Domain || "Unknown";
    if (!domains.has(domainName)) {
      domains.set(domainName, {
        name: domainName,
        folderName: domainName,
        gpos: [],
        errors: []
      });
    }

    domains.get(domainName).errors.push(errorRow);
  });

  const domainOrder = Array.from(domains.keys()).sort((left, right) => left.localeCompare(right));
  domainOrder.forEach((domainName) => {
    domains.get(domainName).gpos.sort((left, right) => {
      const leftName = left.metadata.DisplayName || "";
      const rightName = right.metadata.DisplayName || "";
      return leftName.localeCompare(rightName);
    });
  });

  return {
    rootFolderName,
    forestSummary,
    errors,
    domains,
    domainOrder,
    totalGpos: metadataEntries.length,
    gpoLookup: new Map(metadataEntries.map((entry) => [entry.key, entry]))
  };
}

function renderInventory() {
  const inventory = reviewState.inventory;
  if (!inventory) {
    renderEmpty("Select an exported gpo-inventory folder to begin the review.");
    return;
  }

  const errorCount = inventory.errors.length;
  const domainCount = inventory.domainOrder.length;
  const permissionsEnabled = inventory.forestSummary.PermissionsExported ? "Yes" : "No";
  const permissionsAvailable = inventory.domainOrder.reduce((count, domainName) => {
    const domain = inventory.domains.get(domainName);
    return count + domain.gpos.filter((gpo) => gpo.files.permissions).length;
  }, 0);

  setStatus(
    errorCount > 0 ? "warn" : "ok",
    `Loaded ${inventory.rootFolderName} with ${inventory.totalGpos} GPOs across ${domainCount} domain${domainCount === 1 ? "" : "s"}.`
  );

  renderMeta([
    ["Imported folder", inventory.rootFolderName],
    ["Forest", inventory.forestSummary.Forest || "N/A"],
    ["Started", formatDate(inventory.forestSummary.StartedAt)],
    ["Finished", formatDate(inventory.forestSummary.FinishedAt)],
    ["Output root", inventory.forestSummary.OutputRoot || "N/A"],
    ["Permissions exported", permissionsEnabled]
  ]);

  renderHeadlines([
    ["Domains", String(domainCount)],
    ["GPOs", String(inventory.totalGpos)],
    ["Permission files", String(permissionsAvailable)],
    ["Errors", String(errorCount)]
  ]);

  renderDomainTabs();
  renderDomainContext();
  renderDomainTable();
  renderErrorsTable();
}

function renderMeta(items) {
  document.getElementById("inventoryMeta").innerHTML = items.map(([label, value]) => `
    <div class="snapshot-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(formatScalar(value))}</strong>
    </div>
  `).join("");
}

function renderHeadlines(items) {
  document.getElementById("inventoryHeadlines").innerHTML = items.map(([label, value]) => `
    <div class="spotlight-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(formatScalar(value))}</strong>
    </div>
  `).join("");
}

function renderDomainTabs() {
  const inventory = reviewState.inventory;
  const tabs = document.getElementById("domainTabs");

  tabs.innerHTML = inventory.domainOrder.map((domainName) => {
    const domain = inventory.domains.get(domainName);
    const isActive = domainName === reviewState.activeDomain;
    return `
      <button type="button" class="domain-tab ${isActive ? "domain-tab--active" : ""}" data-domain-name="${escapeAttribute(domainName)}">
        <span>${escapeHtml(domainName)}</span>
        <span class="domain-tab__count">${domain.gpos.length}</span>
      </button>
    `;
  }).join("");

  Array.from(tabs.querySelectorAll("[data-domain-name]")).forEach((button) => {
    button.addEventListener("click", () => {
      reviewState.activeDomain = button.dataset.domainName;
      renderDomainTabs();
      renderDomainContext();
      renderDomainTable();
    });
  });
}

function renderDomainContext() {
  const domain = getActiveDomain();
  const context = document.getElementById("domainContext");

  if (!domain) {
    context.innerHTML = `
      <div class="domain-stat">
        <span>Domain</span>
        <strong>No data loaded</strong>
      </div>
    `;
    return;
  }

  const statusCounts = summarizeDomainStatuses(domain.gpos);
  const withDescriptions = domain.gpos.filter((gpo) => Boolean(gpo.metadata.Description)).length;
  const withPermissions = domain.gpos.filter((gpo) => Boolean(gpo.files.permissions)).length;

  context.innerHTML = `
    <div class="domain-stat">
      <span>Selected domain</span>
      <strong>${escapeHtml(domain.name)}</strong>
    </div>
    <div class="domain-stat">
      <span>GPO count</span>
      <strong>${domain.gpos.length}</strong>
    </div>
    <div class="domain-stat">
      <span>Statuses</span>
      <strong>${escapeHtml(statusCounts || "N/A")}</strong>
    </div>
    <div class="domain-stat">
      <span>Descriptions present</span>
      <strong>${withDescriptions}</strong>
    </div>
    <div class="domain-stat">
      <span>Permissions files</span>
      <strong>${withPermissions}</strong>
    </div>
    <div class="domain-stat">
      <span>Exporter errors</span>
      <strong>${domain.errors.length}</strong>
    </div>
  `;
}

function renderDomainTable() {
  const body = document.getElementById("gpoTableBody");
  const domain = getActiveDomain();

  if (!domain) {
    body.innerHTML = `
      <tr>
        <td colspan="11" class="muted-copy">Import a GPO inventory folder to render the review table.</td>
      </tr>
    `;
    return;
  }

  const rows = domain.gpos.filter(matchesFilter);
  if (rows.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="11" class="muted-copy">No GPOs match the current filter in ${escapeHtml(domain.name)}.</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = rows.map((gpo) => {
    const key = buildGpoKey(gpo.domainName, gpo.metadata.Id || gpo.gpoFolderName);
    const permissionLabel = gpo.files.permissions
      ? '<span class="permission-pill permission-pill--ok">Exported</span>'
      : '<span class="permission-pill permission-pill--warn">Missing</span>';

    return `
      <tr>
        <td class="cell-wrap"><strong>${escapeHtml(gpo.metadata.DisplayName || "Unnamed GPO")}</strong></td>
        <td>${escapeHtml(formatScalar(gpo.metadata.GpoStatus))}</td>
        <td class="cell-wrap">${escapeHtml(formatScalar(gpo.metadata.Owner))}</td>
        <td class="cell-compact">${escapeHtml(formatDate(gpo.metadata.CreationTime))}</td>
        <td class="cell-compact">${escapeHtml(formatDate(gpo.metadata.ModificationTime))}</td>
        <td>${escapeHtml(formatScalar(gpo.metadata.UserVersion))}</td>
        <td>${escapeHtml(formatScalar(gpo.metadata.ComputerVersion))}</td>
        <td class="cell-wrap">${escapeHtml(formatScalar(gpo.metadata.WmiFilter))}</td>
        <td class="cell-wrap">${escapeHtml(formatScalar(gpo.metadata.Description))}</td>
        <td>${permissionLabel}</td>
        <td>
          <details class="gpo-detail" data-gpo-key="${escapeAttribute(key)}">
            <summary>Open details</summary>
            <div class="detail-stack" data-role="detailBody">
              <div class="detail-card">
                <p class="empty-state">Expand to load metadata, settings, permissions, and raw XML for this GPO.</p>
              </div>
            </div>
          </details>
        </td>
      </tr>
    `;
  }).join("");
}

async function hydrateGpoDetail(detailsElement) {
  const gpo = reviewState.inventory.gpoLookup.get(detailsElement.dataset.gpoKey);
  if (!gpo) {
    throw new Error("Could not find the selected GPO details in memory.");
  }

  if (!gpo.cache.settingsText && gpo.files.settings) {
    gpo.cache.settingsText = await gpo.files.settings.text();
  }

  if (!gpo.cache.permissionsRows && gpo.files.permissions) {
    gpo.cache.permissionsRows = await parseCsv(await gpo.files.permissions.text());
  }

  if (!gpo.cache.reportXml && gpo.files.report) {
    gpo.cache.reportXml = await gpo.files.report.text();
  }

  const detailBody = detailsElement.querySelector("[data-role='detailBody']");
  const metadataPairs = [
    ["Domain", gpo.domainName],
    ["Output folder", `${gpo.domainFolderName}/${gpo.gpoFolderName}`],
    ["Metadata file", "metadata.json"],
    ["Settings file", gpo.files.settings ? "settings.txt" : "Missing"],
    ["Permissions file", gpo.files.permissions ? "permissions.csv" : "Missing"],
    ["XML report", gpo.files.report ? "report.xml" : "Missing"]
  ];

  detailBody.innerHTML = `
    <div class="detail-card">
      <h4>Import Metadata</h4>
      <dl class="detail-meta-list">
        ${metadataPairs.map(([label, value]) => `
          <div>
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(formatScalar(value))}</dd>
          </div>
        `).join("")}
      </dl>
    </div>
    <div class="detail-card">
      <h4>Flattened Settings</h4>
      <pre>${escapeHtml(gpo.cache.settingsText || "No settings.txt file was available for this GPO.")}</pre>
    </div>
    <div class="detail-card">
      <h4>Permissions</h4>
      ${renderPermissionsTable(gpo.cache.permissionsRows)}
    </div>
    <div class="detail-card">
      <h4>Raw XML Report</h4>
      <pre>${escapeHtml(gpo.cache.reportXml || "No report.xml file was available for this GPO.")}</pre>
    </div>
  `;
}

function renderPermissionsTable(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '<p class="empty-state">No permissions.csv rows were available for this GPO.</p>';
  }

  return `
    <table class="permissions-table">
      <thead>
        <tr>
          <th>Trustee</th>
          <th>Type</th>
          <th>Permission</th>
          <th>Inherited</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            <td>${escapeHtml(formatScalar(row.Trustee))}</td>
            <td>${escapeHtml(formatScalar(row.TrusteeType))}</td>
            <td>${escapeHtml(formatScalar(row.Permission))}</td>
            <td>${escapeHtml(formatScalar(row.Inherited))}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderErrorsTable() {
  const panel = document.getElementById("errorsPanel");
  const body = document.getElementById("errorsTableBody");
  const errors = reviewState.inventory?.errors || [];

  if (errors.length === 0) {
    panel.hidden = true;
    body.innerHTML = "";
    return;
  }

  panel.hidden = false;
  body.innerHTML = errors.map((row) => `
    <tr>
      <td class="cell-compact">${escapeHtml(formatDate(row.Timestamp))}</td>
      <td>${escapeHtml(formatScalar(row.Scope))}</td>
      <td>${escapeHtml(formatScalar(row.Domain))}</td>
      <td class="cell-compact">${escapeHtml(formatScalar(row.GpoId))}</td>
      <td>${escapeHtml(formatScalar(row.Operation))}</td>
      <td class="cell-wrap">${escapeHtml(formatScalar(row.Error))}</td>
    </tr>
  `).join("");
}

function renderEmpty(message, statusKind = "info") {
  setStatus(statusKind, message);
  document.getElementById("inventoryMeta").innerHTML = `
    <div class="snapshot-card">
      <span>Expected folder</span>
      <strong>gpo-inventory-*</strong>
    </div>
    <div class="snapshot-card">
      <span>Expected files</span>
      <strong>forest-summary.json and metadata.json per GPO</strong>
    </div>
    <div class="snapshot-card">
      <span>Import mode</span>
      <strong>Local browser session only</strong>
    </div>
    <div class="snapshot-card">
      <span>Browser note</span>
      <strong>Chromium-based browsers support directory picking best.</strong>
    </div>
  `;
  document.getElementById("inventoryHeadlines").innerHTML = "";
  document.getElementById("domainTabs").innerHTML = "";
  document.getElementById("domainContext").innerHTML = `
    <div class="domain-stat">
      <span>Selected domain</span>
      <strong>No inventory loaded</strong>
    </div>
  `;
  document.getElementById("gpoTableBody").innerHTML = `
    <tr>
      <td colspan="11" class="muted-copy">${escapeHtml(message)}</td>
    </tr>
  `;
  document.getElementById("errorsPanel").hidden = true;
  document.getElementById("errorsTableBody").innerHTML = "";
}

function getActiveDomain() {
  if (!reviewState.inventory || !reviewState.activeDomain) {
    return null;
  }

  return reviewState.inventory.domains.get(reviewState.activeDomain) || null;
}

function matchesFilter(gpo) {
  if (!reviewState.filterText) {
    return true;
  }

  const haystack = [
    gpo.metadata.DisplayName,
    gpo.metadata.Id,
    gpo.metadata.Owner,
    gpo.metadata.GpoStatus,
    gpo.metadata.Description,
    gpo.metadata.WmiFilter,
    gpo.metadata.UserVersion,
    gpo.metadata.ComputerVersion
  ].map((value) => formatScalar(value).toLowerCase()).join(" ");

  return haystack.includes(reviewState.filterText);
}

async function parseOptionalCsv(file) {
  if (!file) {
    return [];
  }

  return parseCsv(await file.text());
}

function parseCsv(text) {
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          currentValue += '"';
          index += 1;
        }
        else {
          inQuotes = false;
        }
      }
      else {
        currentValue += character;
      }
      continue;
    }

    if (character === '"') {
      inQuotes = true;
    }
    else if (character === ",") {
      currentRow.push(currentValue);
      currentValue = "";
    }
    else if (character === "\n") {
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
    }
    else if (character !== "\r") {
      currentValue += character;
    }
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0];
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => cell !== ""))
    .map((row) => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = row[index] ?? "";
      });
      return entry;
    });
}

function summarizeDomainStatuses(gpos) {
  const counts = new Map();
  gpos.forEach((gpo) => {
    const status = formatScalar(gpo.metadata.GpoStatus);
    counts.set(status, (counts.get(status) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([status, count]) => `${status}: ${count}`)
    .join(" | ");
}

function getRootFolderName(relativePath) {
  return relativePath.split("/")[0] || "";
}

function getRelativePath(relativePath) {
  const parts = relativePath.split("/");
  return parts.slice(1).join("/");
}

function buildGpoKey(domainName, gpoId) {
  return `${domainName}::${gpoId}`;
}

function setStatus(kind, message) {
  const banner = document.getElementById("statusBanner");
  banner.className = `status-banner status-banner--${kind}`;
  banner.textContent = message;
}

function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  const date = parseDateValue(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function parseDateValue(value) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    return new Date(value);
  }

  if (typeof value === "string") {
    const microsoftDateMatch = value.match(/^\/Date\(([-+]?\d+)([-+]\d{4})?\)\/$/);
    if (microsoftDateMatch) {
      return new Date(Number(microsoftDateMatch[1]));
    }
  }

  return new Date(value);
}

function formatScalar(value) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
