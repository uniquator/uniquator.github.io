(function () {
  const tools = {
    merge: {
      title: "Merge PDF",
      category: "PDF Tool",
      description: "Combine multiple PDF files into one document.",
      icon: "merge_type",
      accept: ".pdf,application/pdf",
      multiple: true,
      hint: "Add two or more PDF files",
      settings: []
    },
    split: {
      title: "Split PDF",
      category: "PDF Tool",
      description: "Split by selected thumbnails or every page.",
      icon: "call_split",
      accept: ".pdf,application/pdf",
      multiple: false,
      hint: "Add one PDF file",
      settings: [
        { type: "select", id: "splitMode", label: "Split mode", options: [["visual", "Selected thumbnails"], ["each", "Every page"]] }
      ]
    },
    "compress-pdf": {
      title: "Compress PDF",
      category: "PDF Tool",
      description: "Render pages as compressed images, then rebuild a smaller PDF.",
      icon: "compress",
      accept: ".pdf,application/pdf",
      multiple: false,
      hint: "Add one PDF file",
      settings: [
        { type: "range", id: "pdfQuality", label: "Image quality", value: "0.68", min: "0.25", max: "0.95", step: "0.05" },
        { type: "number", id: "pdfScale", label: "Render scale", value: "1.4", min: "0.8", max: "2.5", step: "0.1" }
      ]
    },
    "image-to-pdf": {
      title: "Image to PDF",
      category: "PDF Tool",
      description: "Convert images into a single PDF document.",
      icon: "image",
      accept: "image/jpeg,image/png,image/webp",
      multiple: true,
      hint: "Add JPG, PNG, or WebP images",
      settings: [
        { type: "select", id: "pageSize", label: "Page size", options: [["fit", "Fit to image"], ["a4", "A4 portrait"], ["letter", "Letter portrait"]] }
      ]
    },
    "pdf-to-image": {
      title: "PDF to Image",
      category: "PDF Tool",
      description: "Render PDF pages as downloadable image files.",
      icon: "perm_media",
      accept: ".pdf,application/pdf",
      multiple: false,
      hint: "Add one PDF file",
      settings: [
        { type: "select", id: "imageFormat", label: "Image format", options: [["image/png", "PNG"], ["image/jpeg", "JPG"]] },
        { type: "number", id: "scale", label: "Render scale", value: "2", min: "1", max: "4", step: "0.5" }
      ]
    },
    rearrange: {
      title: "Rearrange PDF",
      category: "PDF Tool",
      description: "Drag thumbnails into the order you want.",
      icon: "dashboard_customize",
      accept: ".pdf,application/pdf",
      multiple: false,
      hint: "Add one PDF file",
      settings: []
    },
    trim: {
      title: "Trim PDF",
      category: "PDF Tool",
      description: "Keep only selected pages and download a trimmed PDF.",
      icon: "content_cut",
      accept: ".pdf,application/pdf",
      multiple: false,
      hint: "Add one PDF file",
      settings: []
    },
    "compress-image": {
      title: "Compress Image",
      category: "Image Tool",
      description: "Reduce image size with quality and width controls.",
      icon: "photo_size_select_small",
      accept: "image/jpeg,image/png,image/webp",
      multiple: true,
      hint: "Add one or more images",
      settings: [
        { type: "range", id: "quality", label: "Quality", value: "0.75", min: "0.1", max: "1", step: "0.05" },
        { type: "number", id: "maxWidth", label: "Max width", value: "1600", min: "200", max: "6000", step: "100" },
        { type: "select", id: "outputFormat", label: "Output format", options: [["image/jpeg", "JPG"], ["image/webp", "WebP"], ["image/png", "PNG"]] }
      ]
    },
    "convert-image": {
      title: "Convert Image Format",
      category: "Image Tool",
      description: "Export images as JPG, PNG, or WebP.",
      icon: "change_circle",
      accept: "image/jpeg,image/png,image/webp",
      multiple: true,
      hint: "Add one or more images",
      settings: [
        { type: "select", id: "outputFormat", label: "Output format", options: [["image/png", "PNG"], ["image/jpeg", "JPG"], ["image/webp", "WebP"]] },
        { type: "range", id: "quality", label: "Quality", value: "0.9", min: "0.1", max: "1", step: "0.05" }
      ]
    }
  };

  const state = {
    activeTool: null,
    files: [],
    libraries: {},
    pageItems: [],
    pdfSignature: "",
    draggedPageIndex: null,
    downloadUrls: []
  };

  const organizerTools = new Set(["split", "rearrange", "trim"]);

  const elements = {
    tabs: document.querySelectorAll(".tab-button"),
    menuToggle: document.getElementById("menuToggle"),
    menuClose: document.getElementById("menuClose"),
    mobileMenu: document.getElementById("mobileToolMenu"),
    mobileToolList: document.getElementById("mobileToolList"),
    androidModal: document.getElementById("androidAppModal"),
    androidHeaderDownload: document.getElementById("androidHeaderDownload"),
    androidModalClose: document.getElementById("androidModalClose"),
    androidModalLater: document.getElementById("androidModalLater"),
    downloadModal: document.getElementById("downloadModal"),
    downloadModalClose: document.getElementById("downloadModalClose"),
    downloadModalTitle: document.getElementById("downloadModalTitle"),
    downloadModalMeta: document.getElementById("downloadModalMeta"),
    downloadModalActions: document.getElementById("downloadModalActions"),
    title: document.getElementById("toolTitle"),
    category: document.getElementById("toolCategory"),
    description: document.getElementById("toolDescription"),
    icon: document.getElementById("toolIcon"),
    input: document.getElementById("fileInput"),
    hint: document.getElementById("fileHint"),
    fileList: document.getElementById("fileList"),
    settings: document.getElementById("settingsPanel"),
    organizer: document.getElementById("pageOrganizer"),
    form: document.getElementById("toolForm"),
    dropZone: document.getElementById("dropZone"),
    status: document.getElementById("statusText"),
    runButton: document.getElementById("runButton"),
    result: document.getElementById("resultPanel"),
    resultTitle: document.getElementById("resultTitle"),
    resultMeta: document.getElementById("resultMeta"),
    resultActions: document.getElementById("resultActions")
  };

  function setTool(toolId) {
    state.activeTool = toolId;
    state.files = [];
    const tool = tools[toolId];
    document.body.classList.remove("no-tool-selected");
    elements.form.hidden = false;
    elements.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tool === toolId));
    syncMobileToolButtons();
    elements.title.textContent = tool.title;
    elements.category.textContent = tool.category;
    elements.description.textContent = tool.description;
    elements.icon.textContent = tool.icon;
    elements.input.accept = tool.accept;
    elements.input.multiple = tool.multiple;
    elements.input.value = "";
    elements.hint.textContent = tool.hint;
    elements.status.textContent = "Ready.";
    clearResult();
    resetOrganizer();
    renderSettings(tool);
    renderFiles();
  }

  function showChooseToolState() {
    state.activeTool = null;
    state.files = [];
    document.body.classList.add("no-tool-selected");
    elements.tabs.forEach((tab) => tab.classList.remove("active"));
    syncMobileToolButtons();
    elements.title.textContent = "Please choose a tool";
    elements.category.textContent = "Filenest";
    elements.description.textContent = "Tap the menu button at the top to select your desired tool.";
    elements.icon.textContent = "arrow_upward";
    elements.input.value = "";
    elements.form.hidden = true;
    elements.status.textContent = "Ready.";
    clearResult();
    resetOrganizer();
    renderFiles();
  }

  function shouldStartWithToolPicker() {
    return window.matchMedia("(max-width: 680px)").matches;
  }

  function isSmallScreen() {
    return window.matchMedia("(max-width: 680px)").matches;
  }

  function buildMobileToolMenu() {
    if (!elements.mobileToolList) return;
    elements.mobileToolList.innerHTML = "";
    elements.tabs.forEach((tab) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mobile-tool-button";
      button.dataset.tool = tab.dataset.tool;
      button.innerHTML = tab.innerHTML;
      button.addEventListener("click", () => {
        setTool(tab.dataset.tool);
        closeMobileMenu();
      });
      elements.mobileToolList.appendChild(button);
    });
    syncMobileToolButtons();
  }

  function syncMobileToolButtons() {
    if (!elements.mobileToolList) return;
    elements.mobileToolList.querySelectorAll(".mobile-tool-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.tool === state.activeTool);
    });
  }

  function openMobileMenu() {
    if (!elements.mobileMenu) return;
    elements.mobileMenu.hidden = false;
    elements.menuToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
  }

  function closeMobileMenu() {
    if (!elements.mobileMenu) return;
    elements.mobileMenu.hidden = true;
    elements.menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }

  function maybeShowAndroidModal() {
    if (!elements.androidModal) return;
    const isAndroid = /Android/i.test(navigator.userAgent || "");
    document.body.classList.toggle("android-device", isAndroid);
    const dismissed = localStorage.getItem("filenestAndroidPromptDismissed") === "true";
    if (!isAndroid || dismissed) return;
    elements.androidModal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeAndroidModal() {
    if (!elements.androidModal) return;
    localStorage.setItem("filenestAndroidPromptDismissed", "true");
    elements.androidModal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function closeDownloadModal() {
    if (!elements.downloadModal) return;
    elements.downloadModal.hidden = true;
    if (!elements.androidModal || elements.androidModal.hidden) {
      document.body.classList.remove("modal-open");
    }
  }

  function renderSettings(tool) {
    elements.settings.innerHTML = "";
    tool.settings.forEach((setting) => {
      const field = document.createElement("div");
      field.className = "field";

      const label = document.createElement("label");
      label.htmlFor = setting.id;
      label.textContent = setting.label;
      field.appendChild(label);

      let input;
      if (setting.type === "select") {
        input = document.createElement("select");
        setting.options.forEach(([value, text]) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = text;
          input.appendChild(option);
        });
      } else {
        input = document.createElement("input");
        input.type = setting.type;
        ["value", "min", "max", "step"].forEach((key) => {
          if (setting[key]) input.setAttribute(key, setting[key]);
        });
      }

      input.id = setting.id;
      field.appendChild(input);

      if (setting.help) {
        const help = document.createElement("small");
        help.textContent = setting.help;
        field.appendChild(help);
      }

      elements.settings.appendChild(field);
    });

  }

  function renderFiles() {
    elements.fileList.innerHTML = "";
    state.files.forEach((file, index) => {
      const item = document.createElement("div");
      item.className = "file-item";
      item.innerHTML = `
        <span class="material-symbols-rounded" aria-hidden="true">${file.type.startsWith("image/") ? "image" : "picture_as_pdf"}</span>
        <span><strong>${escapeHtml(file.name)}</strong><small>${formatBytes(file.size)}</small></span>
      `;

      const remove = document.createElement("button");
      remove.className = "remove-file material-symbols-rounded";
      remove.type = "button";
      remove.title = "Remove file";
      remove.textContent = "close";
      remove.addEventListener("click", () => {
        state.files.splice(index, 1);
        renderFiles();
      });
      item.appendChild(remove);
      elements.fileList.appendChild(item);
    });
    prepareOrganizerIfNeeded();
  }

  function getSetting(id) {
    const input = document.getElementById(id);
    return input ? input.value : "";
  }

  async function requirePdfLib() {
    if (!window.PDFLib) {
      elements.status.textContent = "Loading PDF engine...";
      await loadLibrary("pdfLib", [
        "libs/pdf-lib.min.js",
        "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js",
        "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"
      ], () => window.PDFLib);
    }
    return window.PDFLib;
  }

  async function requirePdfJs() {
    if (!window.pdfjsLib) {
      elements.status.textContent = "Loading PDF renderer...";
      await loadLibrary("pdfjs", [
        "libs/pdf.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js"
      ], () => window.pdfjsLib);
    }
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    return window.pdfjsLib;
  }

  async function loadLibrary(key, sources, readyCheck) {
    if (readyCheck()) return;
    if (!state.libraries[key]) {
      state.libraries[key] = tryScriptSources(sources, readyCheck);
    }
    await state.libraries[key];
    if (!readyCheck()) {
      throw new Error("Could not load the required library. Check your internet connection and try again.");
    }
  }

  async function tryScriptSources(sources, readyCheck) {
    let lastError;
    for (const source of sources) {
      try {
        await loadScript(source);
        if (readyCheck()) return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("Library failed to load.");
  }

  function loadScript(source) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${source}"]`);
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = source;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${source}`));
      document.head.appendChild(script);
    });
  }

  async function runTool(event) {
    event.preventDefault();
    elements.result.hidden = true;
    try {
      if (!state.files.length) throw new Error("Add files first.");
      elements.runButton.disabled = true;
      elements.status.textContent = "Working...";
      const tool = state.activeTool;
      if (tool === "merge") await mergePdf();
      if (tool === "split") await splitPdf();
      if (tool === "compress-pdf") await compressPdf();
      if (tool === "image-to-pdf") await imageToPdf();
      if (tool === "pdf-to-image") await pdfToImage();
      if (tool === "rearrange") await rearrangePdf();
      if (tool === "trim") await trimPdf();
      if (tool === "compress-image") await processImages(true);
      if (tool === "convert-image") await processImages(false);
      elements.status.textContent = "Done.";
    } catch (error) {
      elements.status.textContent = error.message || "Something went wrong.";
    } finally {
      elements.runButton.disabled = false;
    }
  }

  async function mergePdf() {
    if (state.files.length < 2) throw new Error("Add at least two PDFs.");
    const { PDFDocument } = await requirePdfLib();
    const merged = await PDFDocument.create();
    for (const file of state.files) {
      const source = await PDFDocument.load(await file.arrayBuffer());
      const pages = await merged.copyPages(source, source.getPageIndices());
      pages.forEach((page) => merged.addPage(page));
    }
    const bytes = await merged.save({ useObjectStreams: true });
    showDownloads([{ name: "filenest-merged.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }]);
  }

  async function splitPdf() {
    const { PDFDocument } = await requirePdfLib();
    const source = await PDFDocument.load(await state.files[0].arrayBuffer());
    const splitMode = getSetting("splitMode");
    const groups = splitMode === "each"
      ? getOrganizerOrder(false, source.getPageCount()).map((index) => [index])
      : getOrganizerOrder(true, source.getPageCount()).map((index) => [index]);

    const outputs = [];
    for (let index = 0; index < groups.length; index += 1) {
      const doc = await PDFDocument.create();
      const pages = await doc.copyPages(source, groups[index]);
      pages.forEach((page) => doc.addPage(page));
      const bytes = await doc.save({ useObjectStreams: true });
      outputs.push({ name: `filenest-split-${index + 1}.pdf`, blob: new Blob([bytes], { type: "application/pdf" }) });
    }
    showDownloads(outputs);
  }

  async function compressPdf() {
    const { PDFDocument } = await requirePdfLib();
    const pdfjsLib = await requirePdfJs();
    const quality = Math.min(0.95, Math.max(0.25, Number(getSetting("pdfQuality")) || 0.68));
    const scale = Math.min(2.5, Math.max(0.8, Number(getSetting("pdfScale")) || 1.4));
    const inputBytes = await state.files[0].arrayBuffer();
    const source = await pdfjsLib.getDocument({ data: inputBytes }).promise;
    const output = await PDFDocument.create();

    stripPdfMetadata(output);

    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
      elements.status.textContent = `Compressing page ${pageNumber} of ${source.numPages}...`;
      const page = await source.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

      const imageBlob = await canvasToBlob(canvas, "image/jpeg", quality);
      const jpgBytes = new Uint8Array(await imageBlob.arrayBuffer());
      const image = await output.embedJpg(jpgBytes);
      const pdfPage = output.addPage([viewport.width, viewport.height]);
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height
      });
    }

    stripPdfMetadata(output);
    const bytes = await output.save({ useObjectStreams: true, addDefaultPage: false });
    showDownloads([{ name: "filenest-compressed.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }], state.files[0].size);
  }

  async function imageToPdf() {
    const { PDFDocument } = await requirePdfLib();
    const pdf = await PDFDocument.create();
    for (const file of state.files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const image = file.type === "image/png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(await normalizeJpegBytes(file));
      const pageSize = getSetting("pageSize");
      const size = pageSize === "a4" ? [595.28, 841.89] : pageSize === "letter" ? [612, 792] : [image.width, image.height];
      const page = pdf.addPage(size);
      const fit = scaleToFit(image.width, image.height, size[0], size[1]);
      page.drawImage(image, {
        x: (size[0] - fit.width) / 2,
        y: (size[1] - fit.height) / 2,
        width: fit.width,
        height: fit.height
      });
    }
    const bytes = await pdf.save({ useObjectStreams: true });
    showDownloads([{ name: "filenest-images.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }]);
  }

  async function pdfToImage() {
    const pdfjsLib = await requirePdfJs();
    const data = await state.files[0].arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const format = getSetting("imageFormat");
    const scale = Number(getSetting("scale")) || 2;
    const outputs = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
      const blob = await canvasToBlob(canvas, format, 0.92);
      outputs.push({ name: `filenest-page-${pageNumber}.${extensionFor(format)}`, blob });
    }
    showDownloads(outputs);
  }

  async function rearrangePdf() {
    const { PDFDocument } = await requirePdfLib();
    const source = await PDFDocument.load(await state.files[0].arrayBuffer());
    const order = getOrganizerOrder(false, source.getPageCount());
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, order);
    pages.forEach((page) => output.addPage(page));
    const bytes = await output.save({ useObjectStreams: true });
    showDownloads([{ name: "filenest-rearranged.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }]);
  }

  async function trimPdf() {
    const { PDFDocument } = await requirePdfLib();
    const source = await PDFDocument.load(await state.files[0].arrayBuffer());
    const order = getOrganizerOrder(true, source.getPageCount());
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, order);
    pages.forEach((page) => output.addPage(page));
    const bytes = await output.save({ useObjectStreams: true });
    showDownloads([{ name: "filenest-trimmed.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }], state.files[0].size);
  }

  async function prepareOrganizerIfNeeded() {
    if (!elements.organizer) return;
    if (!organizerTools.has(state.activeTool) || state.files.length !== 1 || !isPdfFile(state.files[0])) {
      resetOrganizer();
      return;
    }

    const signature = `${state.activeTool}:${state.files[0].name}:${state.files[0].size}:${state.files[0].lastModified}`;
    if (state.pdfSignature === signature && state.pageItems.length) {
      renderOrganizer();
      return;
    }

    state.pdfSignature = signature;
    state.pageItems = [];
    elements.organizer.hidden = false;
    elements.organizer.innerHTML = `
      <div class="organizer-head">
        <div>
          <p class="eyebrow">Pages</p>
          <h3>Loading thumbnails...</h3>
          <p>Pages will appear here as they are ready.</p>
        </div>
      </div>
      <div class="thumbnail-grid"></div>
    `;

    try {
      const pdfjsLib = await requirePdfJs();
      const data = await state.files[0].arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      state.pageItems = [];
      renderOrganizer("Loading thumbnails...");
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        elements.status.textContent = `Rendering page ${pageNumber} of ${pdf.numPages}...`;
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 0.28 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        state.pageItems.push({
          pageNumber,
          selected: true,
          thumbnail: canvas.toDataURL("image/jpeg", 0.82)
        });
        renderOrganizer(`Loading ${state.pageItems.length} of ${pdf.numPages}...`);
      }
      elements.status.textContent = "Ready.";
      renderOrganizer();
    } catch (error) {
      elements.status.textContent = error.message || "Could not render page thumbnails.";
      elements.organizer.innerHTML = `
        <div class="organizer-head">
          <div>
            <p class="eyebrow">Pages</p>
            <h3>Thumbnail preview unavailable</h3>
            <p>Refresh the page and try loading the PDF again.</p>
          </div>
        </div>
      `;
    }
  }

  function renderOrganizer(loadingLabel) {
    if (!elements.organizer || !organizerTools.has(state.activeTool)) return;
    if (!state.pageItems.length) {
      elements.organizer.hidden = false;
      elements.organizer.innerHTML = `
        <div class="organizer-head">
          <div>
            <p class="eyebrow">Pages</p>
            <h3>${loadingLabel || "Loading thumbnails..."}</h3>
            <p>Pages will appear here as they are ready.</p>
          </div>
        </div>
        <div class="thumbnail-grid"></div>
      `;
      return;
    }
    const isRearrange = state.activeTool === "rearrange";
    const selectedCount = state.pageItems.filter((item) => item.selected).length;
    const heading = loadingLabel || (isRearrange ? `${state.pageItems.length} pages ready` : `${selectedCount} of ${state.pageItems.length} selected`);
    const hint = isRearrange
      ? "Drag pages to reorder the output."
      : "Drag pages to reorder. Select pages to keep or split.";
    const actions = isRearrange ? "" : `
      <div class="organizer-actions">
        <button type="button" class="mini-button" data-action="select-all" title="Select all pages">
          <span class="material-symbols-rounded" aria-hidden="true">select_all</span>
        </button>
        <button type="button" class="mini-button" data-action="clear" title="Clear selection">
          <span class="material-symbols-rounded" aria-hidden="true">disabled_by_default</span>
        </button>
      </div>
    `;

    elements.organizer.hidden = false;
    elements.organizer.innerHTML = `
      <div class="organizer-head">
        <div>
          <p class="eyebrow">Pages</p>
          <h3>${heading}</h3>
          <p>${hint}</p>
        </div>
        ${actions}
      </div>
      <div class="thumbnail-grid"></div>
    `;

    const grid = elements.organizer.querySelector(".thumbnail-grid");
    state.pageItems.forEach((item, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = `page-thumb${item.selected ? " selected" : ""}`;
      card.draggable = true;
      card.dataset.index = String(index);
      card.innerHTML = `
        <img src="${item.thumbnail}" alt="Page ${item.pageNumber}">
        <span>Page ${item.pageNumber}</span>
        <strong class="material-symbols-rounded" aria-hidden="true">${item.selected ? "check_circle" : "radio_button_unchecked"}</strong>
      `;
      card.addEventListener("click", () => {
        if (state.activeTool !== "rearrange") {
          item.selected = !item.selected;
          renderOrganizer();
        }
      });
      card.addEventListener("dragstart", () => {
        state.draggedPageIndex = index;
        card.classList.add("dragging");
      });
      card.addEventListener("dragend", () => {
        state.draggedPageIndex = null;
        card.classList.remove("dragging");
      });
      card.addEventListener("dragover", (event) => event.preventDefault());
      card.addEventListener("drop", (event) => {
        event.preventDefault();
        movePage(state.draggedPageIndex, index);
      });
      grid.appendChild(card);
    });

    const selectAll = elements.organizer.querySelector('[data-action="select-all"]');
    const clear = elements.organizer.querySelector('[data-action="clear"]');
    if (selectAll) {
      selectAll.addEventListener("click", () => {
        state.pageItems.forEach((item) => item.selected = true);
        renderOrganizer();
      });
    }
    if (clear) {
      clear.addEventListener("click", () => {
        state.pageItems.forEach((item) => item.selected = false);
        renderOrganizer();
      });
    }
  }

  function movePage(fromIndex, toIndex) {
    if (fromIndex === null || fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const [item] = state.pageItems.splice(fromIndex, 1);
    state.pageItems.splice(toIndex, 0, item);
    renderOrganizer();
  }

  function resetOrganizer() {
    state.pageItems = [];
    state.pdfSignature = "";
    state.draggedPageIndex = null;
    if (elements.organizer) {
      elements.organizer.hidden = true;
      elements.organizer.innerHTML = "";
    }
  }

  function getOrganizerOrder(selectedOnly, pageCount) {
    const pages = state.pageItems.length
      ? state.pageItems.filter((item) => !selectedOnly || item.selected).map((item) => item.pageNumber - 1)
      : Array.from({ length: pageCount }, (_, index) => index);
    if (!pages.length) throw new Error("Select at least one page.");
    return pages;
  }

  async function processImages(shouldResize) {
    const format = getSetting("outputFormat");
    const quality = Number(getSetting("quality")) || 0.85;
    const maxWidth = Number(getSetting("maxWidth")) || 1600;
    const outputs = [];

    for (const file of state.files) {
      const bitmap = await loadImage(file);
      const ratio = shouldResize ? Math.min(1, maxWidth / bitmap.width) : 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * ratio);
      canvas.height = Math.round(bitmap.height * ratio);
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await canvasToBlob(canvas, format, quality);
      outputs.push({ name: `${nameWithoutExtension(file.name)}.${extensionFor(format)}`, blob });
    }

    showDownloads(outputs, state.files.reduce((sum, file) => sum + file.size, 0));
  }

  function showDownloads(outputs, originalSize) {
    clearResult();
    elements.result.hidden = false;
    elements.resultActions.innerHTML = "";
    const outputSize = outputs.reduce((sum, item) => sum + item.blob.size, 0);
    const title = outputs.length === 1 ? "Your file is ready" : `${outputs.length} files are ready`;
    const meta = originalSize
      ? `${formatBytes(originalSize)} to ${formatBytes(outputSize)}`
      : `Output size ${formatBytes(outputSize)}`;
    elements.resultTitle.textContent = title;
    elements.resultMeta.textContent = meta;

    outputs.forEach((item) => {
      const url = URL.createObjectURL(item.blob);
      state.downloadUrls.push(url);
      elements.resultActions.appendChild(createDownloadLink(url, item.name));
    });

    if (isSmallScreen()) {
      showDownloadModal(title, meta, outputs);
    }
  }

  function showDownloadModal(title, meta, outputs) {
    if (!elements.downloadModal) return;
    elements.downloadModalTitle.textContent = title;
    elements.downloadModalMeta.textContent = meta;
    elements.downloadModalActions.innerHTML = "";
    outputs.forEach((item, index) => {
      const url = state.downloadUrls[state.downloadUrls.length - outputs.length + index];
      elements.downloadModalActions.appendChild(createDownloadLink(url, item.name));
    });
    elements.downloadModal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function createDownloadLink(url, name) {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.className = "download-link";
    link.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">download</span>${escapeHtml(name)}`;
    return link;
  }

  function clearResult() {
    closeDownloadModal();
    state.downloadUrls.forEach((url) => URL.revokeObjectURL(url));
    state.downloadUrls = [];
    elements.result.hidden = true;
    elements.resultActions.innerHTML = "";
    elements.resultTitle.textContent = "Your file is ready";
    elements.resultMeta.textContent = "";
    if (elements.downloadModalActions) elements.downloadModalActions.innerHTML = "";
  }

  function validatePage(page, pageCount) {
    if (!Number.isInteger(page) || page < 1 || page > pageCount) {
      throw new Error(`Use page numbers from 1 to ${pageCount}.`);
    }
  }

  function stripPdfMetadata(pdf) {
    const empty = "";
    pdf.setTitle(empty);
    pdf.setAuthor(empty);
    pdf.setSubject(empty);
    pdf.setKeywords([]);
    pdf.setProducer("Filenest");
    pdf.setCreator("Filenest");
    pdf.setCreationDate(new Date(0));
    pdf.setModificationDate(new Date(0));
  }

  function isPdfFile(file) {
    return file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
  }

  async function normalizeJpegBytes(file) {
    if (file.type === "image/jpeg") return new Uint8Array(await file.arrayBuffer());
    const bitmap = await loadImage(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d").drawImage(bitmap, 0, 0);
    return new Uint8Array(await (await canvasToBlob(canvas, "image/jpeg", 0.92)).arrayBuffer());
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      image.src = URL.createObjectURL(file);
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not create image output.")), type, quality);
    });
  }

  function scaleToFit(width, height, maxWidth, maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    return { width: width * ratio, height: height * ratio };
  }

  function nameWithoutExtension(name) {
    return name.replace(/\.[^.]+$/, "") || "filenest-image";
  }

  function extensionFor(type) {
    if (type === "image/jpeg") return "jpg";
    if (type === "image/webp") return "webp";
    return "png";
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${units[index]}`;
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  elements.tabs.forEach((tab) => tab.addEventListener("click", () => setTool(tab.dataset.tool)));
  buildMobileToolMenu();
  if (elements.menuToggle) elements.menuToggle.addEventListener("click", openMobileMenu);
  if (elements.menuClose) elements.menuClose.addEventListener("click", closeMobileMenu);
  if (elements.mobileMenu) {
    elements.mobileMenu.addEventListener("click", (event) => {
      if (event.target === elements.mobileMenu) closeMobileMenu();
    });
  }
  if (elements.androidModalClose) elements.androidModalClose.addEventListener("click", closeAndroidModal);
  if (elements.androidModalLater) elements.androidModalLater.addEventListener("click", closeAndroidModal);
  if (elements.androidModal) {
    elements.androidModal.addEventListener("click", (event) => {
      if (event.target === elements.androidModal) closeAndroidModal();
    });
  }
  if (elements.downloadModalClose) elements.downloadModalClose.addEventListener("click", closeDownloadModal);
  if (elements.downloadModal) {
    elements.downloadModal.addEventListener("click", (event) => {
      if (event.target === elements.downloadModal) closeDownloadModal();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
      closeAndroidModal();
      closeDownloadModal();
    }
  });
  elements.input.addEventListener("change", () => {
    const tool = tools[state.activeTool];
    clearResult();
    state.files = tool.multiple ? Array.from(elements.input.files) : Array.from(elements.input.files).slice(0, 1);
    renderFiles();
  });
  elements.form.addEventListener("submit", runTool);

  ["dragenter", "dragover"].forEach((eventName) => {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropZone.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropZone.classList.remove("drag-over");
    });
  });

  elements.dropZone.addEventListener("drop", (event) => {
    const tool = tools[state.activeTool];
    const files = Array.from(event.dataTransfer.files || []);
    clearResult();
    state.files = tool.multiple ? files : files.slice(0, 1);
    renderFiles();
  });

  if (shouldStartWithToolPicker()) {
    showChooseToolState();
  } else {
    setTool("merge");
  }

  window.addEventListener("resize", () => {
    if (!shouldStartWithToolPicker() && !state.activeTool) {
      setTool("merge");
    }
  });
  maybeShowAndroidModal();
})();
