// static/js/post.js (단일 이미지 업로드 버전)
(() => {
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => {
    const parent = el || document;
    if (!parent || !parent.querySelectorAll) {
      return [];
    }
    return Array.from(parent.querySelectorAll(sel));
  };

  // Elements
  const form = $("#recipeForm");
  const draftBtn = $("#draftBtn");
  const previewBtn = $("#previewBtn");
  const resetBtn = $("#resetBtn");
  const submitBtn = $("#submitBtn");

  const titleEl = $("#title");
  const servingsEl = $("#servings");
  const timeEl = $("#time");
  const levelEl = $("#level");
  const categoryEl = $("#category");
  const descEl = $("#desc");

  const tagInput = $("#tagInput");
  const tagList = $("#tagList");
  const addTagBtn = $("#addTag");

  const ingInput = $("#ingInput");
  const ingList = $("#ingList");
  const addIngBtn = $("#addIng");

  const stepInput = $("#stepInput");
  const stepMin = $("#stepMin");
  const stepList = $("#stepList");
  const addStepBtn = $("#addStep");

  const previewSec = $("#preview");
  const pvTitle = $("#pvTitle");
  const pvMeta = $("#pvMeta");
  const pvTags = $("#pvTags");
  const pvIngs = $("#pvIngs");
  const pvSteps = $("#pvSteps");

  // 단일 이미지 관련 요소들
  const imageInput = $("#image");
  const imagePreviewSection = $("#imagePreviewSection");
  const imagePreview = $("#imagePreview");

  // 이미지 관리 변수
  let selectedImage = null;

  // ---------- 이미지 업로드 관련 함수들 ----------
  imageInput?.addEventListener('change', handleImageSelection);

  function handleImageSelection(event) {
    const file = event.target.files[0];
    
    if (!file) {
      hideImagePreview();
      return;
    }
    
    // 이미지 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      event.target.value = '';
      hideImagePreview();
      return;
    }
    
    selectedImage = file;
    showImagePreview(file);
  }

  function showImagePreview(file) {
    if (imagePreviewSection && imagePreview) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreviewSection.style.display = 'block';
      };
      
      reader.readAsDataURL(file);
    }
  }

  function hideImagePreview() {
    if (imagePreviewSection) {
      imagePreviewSection.style.display = 'none';
    }
    if (imagePreview) {
      imagePreview.src = '';
    }
    selectedImage = null;
  }

  // ---------- Tag helpers ----------
  function addTag(value) {
    const v = String(value || "").trim();
    if (!v) return;
    // 중복 방지
    const exists = $$(".token", tagList).some(t => t.dataset.value === v);
    if (exists) return;

    const token = document.createElement("div");
    token.className = "token";
    token.dataset.value = v;
    token.innerHTML = `
      <span># ${escapeHtml(v)}</span>
      <button type="button" aria-label="태그 삭제">&times;</button>
    `;
    token.querySelector("button").addEventListener("click", () => {
      token.remove();
      renderPreview();
    });
    tagList.appendChild(token);
    renderPreview();
  }

  function parseAndAddTags(text) {
    const raw = (text || "").replace(/\r\n/g, "\n");
    const list = raw.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    list.forEach(addTag);
  }

  addTagBtn?.addEventListener("click", () => {
    parseAndAddTags(tagInput.value);
    tagInput.value = "";
    tagInput.focus();
  });

  tagInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      parseAndAddTags(tagInput.value);
      tagInput.value = "";
    }
  });

  // ---------- Ingredient helpers ----------
  function addIngredient(text) {
    const v = String(text || "").trim();
    if (!v) return;
    const item = document.createElement("div");
    item.className = "item";
    item.dataset.text = v;
    item.innerHTML = `
      <div>${escapeHtml(v)}</div>
      <div class="controls">
        <button type="button" class="btn small">삭제</button>
      </div>
    `;
    item.querySelector(".btn").addEventListener("click", () => {
      item.remove();
      renderPreview();
    });
    ingList.appendChild(item);
    renderPreview();
  }

  addIngBtn?.addEventListener("click", () => {
    addIngredient(ingInput.value);
    ingInput.value = "";
    ingInput.focus();
  });

  ingInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addIngredient(ingInput.value);
      ingInput.value = "";
    }
  });

  // ---------- Step helpers ----------
  function addStep(text, min) {
    const t = String(text || "").trim();
    if (!t) return;
    const m = Number(min || 0);
    const item = document.createElement("div");
    item.className = "item";
    item.dataset.text = t;
    item.dataset.min = String(isFinite)
  }
})
  
