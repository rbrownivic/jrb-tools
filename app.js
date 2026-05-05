const dom = {
  views: Array.from(document.querySelectorAll("[data-view]")),
  navButtons: Array.from(document.querySelectorAll("[data-open-view]")),
  form: document.getElementById("sizerForm"),
  workloadCores: document.getElementById("workloadCores"),
  workloadMemory: document.getElementById("workloadMemory"),
  drWorkloadCores: document.getElementById("drWorkloadCores"),
  drWorkloadMemory: document.getElementById("drWorkloadMemory"),
  drFieldset: document.getElementById("drFieldset"),
  hasDrInputs: Array.from(document.querySelectorAll("input[name='hasDr']")),
  hostFamily: document.getElementById("hostFamily"),
  hostGeneration: document.getElementById("hostGeneration"),
  cpuOption: document.getElementById("cpuOption"),
  memoryOption: document.getElementById("memoryOption"),
  cpuRatio: document.getElementById("cpuRatio"),
  memoryRatio: document.getElementById("memoryRatio"),
  selectionSummary: document.getElementById("selectionSummary"),
  errorBanner: document.getElementById("errorBanner"),
  resultsSection: document.getElementById("resultsSection"),
  resultsHeadline: document.getElementById("resultsHeadline"),
  resultsGrid: document.getElementById("resultsGrid"),
};

const DEFAULT_SELECTION = {
  hostFamilyId: "dl380",
  generationId: "gen11",
  cpuRatio: 4.0,
  memoryRatio: 2.0,
  preferredMemoryGb: 1024,
};

function initializeApp() {
  populateRatioSelect(dom.cpuRatio, DEFAULT_SELECTION.cpuRatio, 1.0, 8.0, 0.5);
  populateRatioSelect(dom.memoryRatio, DEFAULT_SELECTION.memoryRatio, 1.0, 4.0, 0.5);
  populateHostFamilies(DEFAULT_SELECTION.hostFamilyId);
  bindEvents();
  syncDrState();
  syncViewFromHash();
  renderSelectionSummary();
}

function bindEvents() {
  dom.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextView = button.dataset.openView;
      window.location.hash = nextView === "home" ? "" : nextView;
      syncView(nextView);
    });
  });

  window.addEventListener("hashchange", syncViewFromHash);

  dom.hostFamily.addEventListener("change", () => {
    populateGenerations(null);
    renderSelectionSummary();
  });

  dom.hostGeneration.addEventListener("change", () => {
    populateCpuOptions(null);
    populateMemoryOptions(null);
    renderSelectionSummary();
  });

  dom.cpuOption.addEventListener("change", renderSelectionSummary);
  dom.memoryOption.addEventListener("change", renderSelectionSummary);
  dom.cpuRatio.addEventListener("change", renderSelectionSummary);
  dom.memoryRatio.addEventListener("change", renderSelectionSummary);
  dom.hasDrInputs.forEach((input) => input.addEventListener("change", syncDrState));
  dom.form.addEventListener("submit", handleCalculation);
}

function syncViewFromHash() {
  syncView(window.location.hash.replace("#", "") || "home");
}

function syncView(targetView) {
  dom.views.forEach((view) => {
    view.classList.toggle("view--active", view.dataset.view === targetView);
  });
}

function populateHostFamilies(preferredId) {
  dom.hostFamily.innerHTML = "";
  window.hardwareCatalog.forEach((host) => {
    dom.hostFamily.add(new Option(`${host.name} (${host.formFactor})`, host.id));
  });

  dom.hostFamily.value = preferredId || window.hardwareCatalog[0].id;
  populateGenerations(DEFAULT_SELECTION.generationId);
}

function populateGenerations(preferredId) {
  const host = getSelectedHostFamily();
  dom.hostGeneration.innerHTML = "";

  host.generations.forEach((generation) => {
    dom.hostGeneration.add(new Option(generation.name, generation.id));
  });

  const generationIds = host.generations.map((generation) => generation.id);
  const fallbackId = host.generations[host.generations.length - 1].id;
  dom.hostGeneration.value = generationIds.includes(preferredId) ? preferredId : fallbackId;

  populateCpuOptions(null);
  populateMemoryOptions(DEFAULT_SELECTION.preferredMemoryGb);
}

function populateCpuOptions(preferredId) {
  const generation = getSelectedGeneration();
  dom.cpuOption.innerHTML = "";

  generation.cpuOptions.forEach((cpu) => {
    const label = `${cpu.label} (${formatNumber(cpu.totalCores)} cores total)`;
    dom.cpuOption.add(new Option(label, cpu.id));
  });

  const preferred = preferredId || generation.cpuOptions[Math.min(2, generation.cpuOptions.length - 1)].id;
  dom.cpuOption.value = generation.cpuOptions.some((cpu) => cpu.id === preferred)
    ? preferred
    : generation.cpuOptions[0].id;
}

function populateMemoryOptions(preferredGb) {
  const generation = getSelectedGeneration();
  const options = buildMemoryOptions(generation);
  dom.memoryOption.innerHTML = "";

  options.forEach((option) => {
    const label = `${formatMemory(option.totalGb)} (${option.dimmCount} x ${option.dimmSizeGb} GB)`;
    dom.memoryOption.add(new Option(label, String(option.totalGb)));
  });

  const selected = findClosestMemoryOption(options, preferredGb);
  dom.memoryOption.value = String(selected.totalGb);
}

function populateRatioSelect(select, defaultValue, min, max, step) {
  const values = [];
  for (let value = min; value <= max + 0.001; value += step) {
    values.push(Number(value.toFixed(1)));
  }

  values.forEach((value) => {
    const option = new Option(`${value.toFixed(1)} : 1`, String(value));
    select.add(option);
  });

  select.value = String(defaultValue);
}

function syncDrState() {
  const hasDr = getHasDrEnabled();
  dom.drFieldset.disabled = !hasDr;
}

function handleCalculation(event) {
  event.preventDefault();
  clearError();

  const formValues = collectFormValues();
  if (!formValues.valid) {
    showError(formValues.error);
    return;
  }

  const selectedCpu = getSelectedCpuOption();
  const selectedMemoryGb = Number(dom.memoryOption.value);
  const perHostPhysicalCores = selectedCpu.totalCores;
  const usableCpu = perHostPhysicalCores * formValues.cpuRatio;
  const usableMemory = selectedMemoryGb * formValues.memoryRatio;

  const primarySite = calculateSiteRequirement(
    "Primary Site",
    formValues.workloadCores,
    formValues.workloadMemoryGb,
    usableCpu,
    usableMemory
  );

  const drSite = formValues.hasDr
    ? calculateSiteRequirement(
        "DR Site",
        formValues.drWorkloadCores,
        formValues.drWorkloadMemoryGb,
        usableCpu,
        usableMemory
      )
    : null;

  renderResults({
    host: getSelectedHostFamily(),
    generation: getSelectedGeneration(),
    cpu: selectedCpu,
    memoryGb: selectedMemoryGb,
    cpuRatio: formValues.cpuRatio,
    memoryRatio: formValues.memoryRatio,
    primarySite,
    drSite,
    drInherited:
      formValues.hasDr &&
      !dom.drWorkloadCores.value.trim() &&
      !dom.drWorkloadMemory.value.trim(),
  });
}

function collectFormValues() {
  const workloadCores = Number(dom.workloadCores.value);
  const workloadMemoryGb = Number(dom.workloadMemory.value);
  const hasDr = getHasDrEnabled();
  const drCoresInput = dom.drWorkloadCores.value.trim();
  const drMemoryInput = dom.drWorkloadMemory.value.trim();
  const drWorkloadCores = drCoresInput ? Number(drCoresInput) : workloadCores;
  const drWorkloadMemoryGb = drMemoryInput ? Number(drMemoryInput) : workloadMemoryGb;
  const cpuRatio = Number(dom.cpuRatio.value);
  const memoryRatio = Number(dom.memoryRatio.value);

  if (!Number.isFinite(workloadCores) || workloadCores <= 0) {
    return { valid: false, error: "Total workload cores must be greater than zero." };
  }

  if (!Number.isFinite(workloadMemoryGb) || workloadMemoryGb <= 0) {
    return { valid: false, error: "Total workload memory must be greater than zero." };
  }

  if (hasDr && (!Number.isFinite(drWorkloadCores) || drWorkloadCores <= 0)) {
    return { valid: false, error: "DR workload cores must be greater than zero when provided." };
  }

  if (hasDr && (!Number.isFinite(drWorkloadMemoryGb) || drWorkloadMemoryGb <= 0)) {
    return { valid: false, error: "DR workload memory must be greater than zero when provided." };
  }

  return {
    valid: true,
    workloadCores,
    workloadMemoryGb,
    hasDr,
    drWorkloadCores,
    drWorkloadMemoryGb,
    cpuRatio,
    memoryRatio,
  };
}

function calculateSiteRequirement(siteName, workloadCores, workloadMemoryGb, usableCpu, usableMemory) {
  const runtimeHostsForCpu = Math.max(1, Math.ceil(workloadCores / usableCpu));
  const runtimeHostsForMemory = Math.max(1, Math.ceil(workloadMemoryGb / usableMemory));
  const runtimeHosts = Math.max(runtimeHostsForCpu, runtimeHostsForMemory);
  const nPlusOneHosts = runtimeHosts + 1;
  const postFailureCpuCapacity = runtimeHosts * usableCpu;
  const postFailureMemoryCapacity = runtimeHosts * usableMemory;

  return {
    siteName,
    workloadCores,
    workloadMemoryGb,
    runtimeHostsForCpu,
    runtimeHostsForMemory,
    runtimeHosts,
    nPlusOneHosts,
    postFailureCpuCapacity,
    postFailureMemoryCapacity,
    cpuHeadroom: postFailureCpuCapacity - workloadCores,
    memoryHeadroom: postFailureMemoryCapacity - workloadMemoryGb,
  };
}

function renderSelectionSummary() {
  const host = getSelectedHostFamily();
  const generation = getSelectedGeneration();
  const cpu = getSelectedCpuOption();
  const memoryGb = Number(dom.memoryOption.value);
  const cpuRatio = Number(dom.cpuRatio.value);
  const memoryRatio = Number(dom.memoryRatio.value);
  const usableCpu = cpu.totalCores * cpuRatio;
  const usableMemory = memoryGb * memoryRatio;

  dom.selectionSummary.innerHTML = `
    <div class="summary-stack">
      <div>
        <h4>${host.name} ${generation.name}</h4>
        <p>${host.formFactor} - ${generation.sockets} socket - ${generation.totalDimmSlots} DIMM slots - Max ${formatMemory(generation.maxMemoryGB)}</p>
      </div>
      <div class="summary-badges">
        <span class="summary-badge">${formatNumber(cpu.totalCores)} physical cores</span>
        <span class="summary-badge">${formatMemory(memoryGb)} installed memory</span>
      </div>
      <div class="summary-row">
        <span>CPU selection</span>
        <strong>${cpu.label}</strong>
      </div>
      <div class="summary-row">
        <span>Usable vCPU at target ratio</span>
        <strong>${formatNumber(usableCpu)}</strong>
      </div>
      <div class="summary-row">
        <span>Usable memory at target ratio</span>
        <strong>${formatMemory(usableMemory)}</strong>
      </div>
      <div class="summary-row">
        <span>Platform note</span>
        <strong>${generation.note}</strong>
      </div>
    </div>
  `;
}

function renderResults(result) {
  const totalHosts = result.primarySite.nPlusOneHosts + (result.drSite ? result.drSite.nPlusOneHosts : 0);
  dom.resultsHeadline.textContent = `Combined minimum footprint: ${formatNumber(totalHosts)} host${totalHosts === 1 ? "" : "s"}.`;

  const cards = [
    buildSiteCard(result.primarySite, result.cpuRatio, result.memoryRatio),
    result.drSite ? buildSiteCard(result.drSite, result.cpuRatio, result.memoryRatio, result.drInherited) : "",
    buildSummaryCard(result),
  ].filter(Boolean);

  dom.resultsGrid.innerHTML = cards.join("");
  dom.resultsSection.hidden = false;
  dom.resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildSiteCard(site, cpuRatio, memoryRatio, inherited = false) {
  return `
    <article class="result-card">
      <div class="result-card__title">
        <h4>${site.siteName}</h4>
        <span class="result-accent">${formatNumber(site.nPlusOneHosts)} hosts</span>
      </div>
      <div class="metric-list">
        <div class="metric-card">
          <h4>Runtime hosts needed</h4>
          <strong>${formatNumber(site.runtimeHosts)}</strong>
          <p>Plus one additional host for N+1 coverage.</p>
        </div>
        <div class="metric-card">
          <h4>Post-failure CPU capacity</h4>
          <strong>${formatNumber(site.postFailureCpuCapacity)} vCPU</strong>
          <p>${formatNumber(site.cpuHeadroom)} vCPU headroom at ${cpuRatio.toFixed(1)} : 1.</p>
        </div>
        <div class="metric-card">
          <h4>Post-failure memory capacity</h4>
          <strong>${formatMemory(site.postFailureMemoryCapacity)}</strong>
          <p>${formatMemory(site.memoryHeadroom)} headroom at ${memoryRatio.toFixed(1)} : 1.</p>
        </div>
      </div>
      <ul>
        <li>Target workload: ${formatNumber(site.workloadCores)} vCPU / ${formatMemory(site.workloadMemoryGb)}</li>
        <li>CPU-limited runtime hosts: ${formatNumber(site.runtimeHostsForCpu)}</li>
        <li>Memory-limited runtime hosts: ${formatNumber(site.runtimeHostsForMemory)}</li>
        ${inherited ? "<li>DR demand inherited from the full primary workload.</li>" : ""}
      </ul>
    </article>
  `;
}

function buildSummaryCard(result) {
  const totalHosts = result.primarySite.nPlusOneHosts + (result.drSite ? result.drSite.nPlusOneHosts : 0);
  const siteCount = result.drSite ? 2 : 1;

  return `
    <article class="result-card">
      <div class="result-card__title">
        <h4>Design Summary</h4>
        <span class="result-warm">${siteCount} site${siteCount === 1 ? "" : "s"}</span>
      </div>
      <div class="metric-list">
        <div class="metric-card">
          <h4>Selected build</h4>
          <strong>${result.host.name} ${result.generation.name}</strong>
          <p>${result.cpu.label} with ${formatMemory(result.memoryGb)} installed memory.</p>
        </div>
        <div class="metric-card">
          <h4>Combined host count</h4>
          <strong>${formatNumber(totalHosts)}</strong>
          <p>Primary and DR site totals combined.</p>
        </div>
        <div class="metric-card">
          <h4>Planning ratios</h4>
          <strong>${result.cpuRatio.toFixed(1)} : 1 / ${result.memoryRatio.toFixed(1)} : 1</strong>
          <p>vCPU:pCPU and vMem:pMem targets applied to each host.</p>
        </div>
      </div>
      <ul>
        <li>Primary site N+1 count: ${formatNumber(result.primarySite.nPlusOneHosts)}</li>
        <li>${result.drSite ? `DR site N+1 count: ${formatNumber(result.drSite.nPlusOneHosts)}` : "Dedicated DR site sizing disabled."}</li>
        <li>Catalogue values are intended for estimation, not final bill of materials.</li>
      </ul>
    </article>
  `;
}

function buildMemoryOptions(generation) {
  const optionsByTotal = new Map();

  generation.memoryPopulationCounts.forEach((dimmCount) => {
    generation.dimmSizesGB.forEach((dimmSizeGb) => {
      const totalGb = dimmCount * dimmSizeGb;
      if (totalGb > generation.maxMemoryGB) {
        return;
      }

      const current = optionsByTotal.get(totalGb);
      if (!current || dimmCount < current.dimmCount) {
        optionsByTotal.set(totalGb, { totalGb, dimmCount, dimmSizeGb });
      }
    });
  });

  return Array.from(optionsByTotal.values()).sort((left, right) => left.totalGb - right.totalGb);
}

function findClosestMemoryOption(options, preferredGb) {
  if (!preferredGb) {
    return options[Math.min(4, options.length - 1)];
  }

  return options.reduce((closest, option) => {
    const optionDistance = Math.abs(option.totalGb - preferredGb);
    const closestDistance = Math.abs(closest.totalGb - preferredGb);
    return optionDistance < closestDistance ? option : closest;
  }, options[0]);
}

function getSelectedHostFamily() {
  return window.hardwareCatalog.find((host) => host.id === dom.hostFamily.value) || window.hardwareCatalog[0];
}

function getSelectedGeneration() {
  const host = getSelectedHostFamily();
  return host.generations.find((generation) => generation.id === dom.hostGeneration.value) || host.generations[0];
}

function getSelectedCpuOption() {
  const generation = getSelectedGeneration();
  return generation.cpuOptions.find((cpu) => cpu.id === dom.cpuOption.value) || generation.cpuOptions[0];
}

function getHasDrEnabled() {
  return dom.hasDrInputs.find((input) => input.checked)?.value === "yes";
}

function showError(message) {
  dom.errorBanner.textContent = message;
  dom.errorBanner.hidden = false;
}

function clearError() {
  dom.errorBanner.hidden = true;
  dom.errorBanner.textContent = "";
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
  }).format(value);
}

function formatMemory(valueGb) {
  if (valueGb >= 1024) {
    return `${trimTrailingZero(valueGb / 1024)} TB`;
  }

  return `${formatNumber(valueGb)} GB`;
}

function trimTrailingZero(value) {
  const fixed = value.toFixed(1);
  return fixed.endsWith(".0") ? fixed.slice(0, -2) : fixed;
}

initializeApp();
