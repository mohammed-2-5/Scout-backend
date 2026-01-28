// ========================================
// Scout Admin Dashboard - JavaScript
// ========================================

const API_BASE = '/api/v1';

// State
let currentPage = 1;
let totalPages = 1;
let selectedItems = new Set();
let categories = [];
let currentSection = 'dashboard';
let uploadQueue = [];

// ========================================
// Initialization
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initMobileNavigation();
    initNavigation();
    initUpload();
    initModals();
    initFilters();
    initStatCardClicks();
    initPreviewModal();
    loadStats();
    loadCategories();
    loadRecentContent();
});

// ========================================
// Mobile Navigation
// ========================================
function initMobileNavigation() {
    const hamburger = document.getElementById('hamburger-menu');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');

    if (!hamburger || !sidebar || !overlay) return;

    // Toggle sidebar on hamburger click
    hamburger.addEventListener('click', () => {
        toggleMobileMenu();
    });

    // Close sidebar on overlay click
    overlay.addEventListener('click', () => {
        closeMobileMenu();
    });

    // Close sidebar when clicking nav items on mobile
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
    });

    // Handle resize events to reset mobile menu state
    window.addEventListener('resize', debounce(() => {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    }, 100));
}

function toggleMobileMenu() {
    const hamburger = document.getElementById('hamburger-menu');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');

    hamburger.classList.toggle('active');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');

    // Prevent body scroll when menu is open
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
}

function closeMobileMenu() {
    const hamburger = document.getElementById('hamburger-menu');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');

    hamburger.classList.remove('active');
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ========================================
// Navigation
// ========================================
function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
        });
    });

    // Quick upload button
    document.getElementById('quick-upload-btn').addEventListener('click', () => {
        switchSection('upload');
    });
}

function switchSection(section) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });

    // Update sections
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');

    // Update title
    const titles = {
        dashboard: 'لوحة التحكم',
        content: 'إدارة المحتوى',
        upload: 'رفع ملفات',
        categories: 'التصنيفات'
    };
    document.getElementById('page-title').textContent = titles[section];

    currentSection = section;

    // Load section-specific data
    if (section === 'content') {
        loadContent();
    } else if (section === 'categories') {
        loadCategoriesGrid();
    }
}

// ========================================
// Stats
// ========================================
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/content/stats`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('stat-pdf').textContent = formatNumber(data.data.total_pdf || 0);
            document.getElementById('stat-images').textContent = formatNumber(data.data.total_images || 0);
            document.getElementById('stat-videos').textContent = formatNumber(data.data.total_videos || 0);
            document.getElementById('stat-presentations').textContent = formatNumber(data.data.total_presentations || 0);
            document.getElementById('stat-views').textContent = formatNumber(data.data.total_views || 0);
            document.getElementById('stat-downloads').textContent = formatNumber(data.data.total_downloads || 0);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        showToast('فشل تحميل الإحصائيات', 'error');
    }
}

// ========================================
// Categories
// ========================================
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        const data = await response.json();

        if (data.success) {
            categories = data.data;
            populateCategorySelects();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function populateCategorySelects() {
    const selects = [
        'category-filter',
        'upload-category',
        'edit-category',
        'category-parent'
    ];

    selects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        const currentValue = select.value;

        // Keep first option
        while (select.options.length > 1) {
            select.remove(1);
        }

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name_ar || cat.name;
            select.appendChild(option);
        });

        select.value = currentValue;
    });
}

async function loadCategoriesGrid() {
    const grid = document.getElementById('categories-grid');
    grid.innerHTML = '<div class="loading">جاري التحميل...</div>';

    try {
        const response = await fetch(`${API_BASE}/categories`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            grid.innerHTML = data.data.map(cat => `
        <div class="category-card" data-id="${cat.id}">
          <div class="category-card-header">
            <div class="category-icon">${cat.icon || '📁'}</div>
            <div class="category-info">
              <h3>${cat.name_ar || cat.name}</h3>
              <p>${cat.description || 'بدون وصف'}</p>
            </div>
          </div>
          <div class="category-stats">
            <div class="category-stat">
              <div class="category-stat-value">${cat.content_count || 0}</div>
              <div class="category-stat-label">محتوى</div>
            </div>
          </div>
          <div class="category-actions">
            <button class="btn btn-sm btn-secondary btn-edit-category" data-id="${cat.id}">✏️ تعديل</button>
            <button class="btn btn-sm btn-danger btn-delete-category" data-id="${cat.id}">🗑️ حذف</button>
          </div>
        </div>
      `).join('');

            // Attach event listeners for category buttons
            document.querySelectorAll('.btn-edit-category').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.dataset.id);
                    editCategory(id);
                });
            });
            document.querySelectorAll('.btn-delete-category').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.dataset.id);
                    deleteCategory(id);
                });
            });
        } else {
            grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <h3>لا توجد تصنيفات</h3>
          <p>أضف تصنيفاً جديداً للبدء</p>
        </div>
      `;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        grid.innerHTML = '<div class="empty-state">فشل تحميل التصنيفات</div>';
    }
}

// ========================================
// Content
// ========================================
async function loadContent() {
    const tbody = document.getElementById('content-table-body');
    tbody.innerHTML = '<tr><td colspan="8" class="loading">جاري التحميل...</td></tr>';

    const typeFilter = document.getElementById('type-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;
    const search = document.getElementById('search-input').value;

    try {
        let url = `${API_BASE}/content?limit=20&offset=${(currentPage - 1) * 20}`;
        if (typeFilter) url += `&type=${typeFilter}`;
        if (categoryFilter) url += `&category_id=${categoryFilter}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            totalPages = data.pagination.pages;
            updatePagination();

            tbody.innerHTML = data.data.map(item => {
                // Use Cloudinary thumbnail URL directly if available
                const thumbnailUrl = (item.thumbnail_url && item.thumbnail_url.startsWith('http'))
                    ? item.thumbnail_url
                    : `${API_BASE}/content/${item.id}/thumbnail`;

                return `
        <tr data-id="${item.id}">
          <td><input type="checkbox" class="row-checkbox" data-item-id="${item.id}"></td>
          <td><img src="${thumbnailUrl}" class="table-thumbnail" alt="${item.title}"></td>
          <td>${item.title}</td>
          <td>
            <span class="content-type-badge ${item.type}">${getTypeLabel(item.type)}</span>
            <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">${getFileExtension(item.file_path, item.mime_type)}</div>
          </td>
          <td>${item.category_name_ar || item.category_name || '-'}</td>
          <td>${formatFileSize(item.file_size)}</td>
          <td>${formatDate(item.created_at)}</td>
          <td class="table-actions">
            <button class="action-btn btn-view" data-id="${item.id}" title="عرض">👁️</button>
            <button class="action-btn btn-edit" data-id="${item.id}" title="تعديل">✏️</button>
            <button class="action-btn btn-delete delete" data-id="${item.id}" title="حذف">🗑️</button>
          </td>
        </tr>
      `;
            }).join('');

            // Attach error handlers to images
            document.querySelectorAll('.table-thumbnail').forEach(img => {
                img.addEventListener('error', function () {
                    this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect fill="%23334155" width="50" height="50"/></svg>';
                });
            });

            // Attach event listeners
            attachContentEventListeners();
        } else {
            tbody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <div class="empty-state-icon">📭</div>
              <h3>لا يوجد محتوى</h3>
              <p>ابدأ برفع ملفات جديدة</p>
            </div>
          </td>
        </tr>
      `;
        }
    } catch (error) {
        console.error('Error loading content:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">فشل تحميل المحتوى</td></tr>';
    }
}

async function loadRecentContent() {
    const grid = document.getElementById('recent-content-grid');
    grid.innerHTML = '<div class="loading">جاري التحميل...</div>';

    try {
        const response = await fetch(`${API_BASE}/content?limit=8`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            grid.innerHTML = data.data.map(item => {
                // Use Cloudinary thumbnail URL directly if available
                const thumbnailUrl = (item.thumbnail_url && item.thumbnail_url.startsWith('http'))
                    ? item.thumbnail_url
                    : `${API_BASE}/content/${item.id}/thumbnail`;

                return `
        <div class="content-card" data-id="${item.id}">
          <img src="${thumbnailUrl}" class="content-card-image" alt="${item.title}">
          <div class="content-card-body">
            <div class="content-card-title">${item.title}</div>
            <div class="content-card-meta">
              <span class="content-type-badge ${item.type}">${getTypeLabel(item.type)}</span>
              <span>${formatDate(item.created_at)}</span>
            </div>
          </div>
        </div>
      `;
            }).join('');

            // Attach error handlers to images
            document.querySelectorAll('.content-card-image').forEach(img => {
                img.addEventListener('error', function () {
                    this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="280" height="160"><rect fill="%23334155" width="280" height="160"/></svg>';
                });
            });

            // Attach event listeners to content cards
            document.querySelectorAll('.content-card').forEach(card => {
                card.addEventListener('click', () => {
                    const id = parseInt(card.dataset.id);
                    viewContent(id);
                });
            });
        } else {
            grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3>لا يوجد محتوى</h3>
          <p>ابدأ برفع ملفات جديدة</p>
        </div>
      `;
        }
    } catch (error) {
        console.error('Error loading recent content:', error);
        grid.innerHTML = '<div class="empty-state">فشل تحميل المحتوى</div>';
    }
}

function viewContent(id) {
    console.log('viewContent called with id:', id);
    showPreview(id);
}

async function editContent(id) {
    try {
        const response = await fetch(`${API_BASE}/content/${id}`);
        const data = await response.json();

        if (data.success) {
            const item = data.data;
            document.getElementById('edit-id').value = item.id;
            document.getElementById('edit-title').value = item.title;
            document.getElementById('edit-description').value = item.description || '';
            document.getElementById('edit-category').value = item.category_id || '';
            document.getElementById('edit-featured').checked = item.is_featured === 1;

            document.getElementById('edit-modal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading content:', error);
        showToast('فشل تحميل بيانات المحتوى', 'error');
    }
}

async function saveEdit() {
    const id = document.getElementById('edit-id').value;
    const data = {
        title: document.getElementById('edit-title').value,
        description: document.getElementById('edit-description').value,
        category_id: document.getElementById('edit-category').value || null,
        is_featured: document.getElementById('edit-featured').checked
    };

    try {
        const response = await fetch(`${API_BASE}/content/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showToast('تم تحديث المحتوى بنجاح', 'success');
            document.getElementById('edit-modal').classList.remove('active');
            loadContent();
            loadRecentContent();
        } else {
            showToast('فشل تحديث المحتوى', 'error');
        }
    } catch (error) {
        console.error('Error updating content:', error);
        showToast('فشل تحديث المحتوى', 'error');
    }
}

async function deleteContent(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المحتوى؟')) return;

    try {
        const response = await fetch(`${API_BASE}/content/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showToast('تم حذف المحتوى بنجاح', 'success');
            loadContent();
            loadRecentContent();
            loadStats();
        } else {
            showToast('فشل حذف المحتوى', 'error');
        }
    } catch (error) {
        console.error('Error deleting content:', error);
        showToast('فشل حذف المحتوى', 'error');
    }
}

// ========================================
// Upload
// ========================================
function initUpload() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const uploadForm = document.getElementById('upload-form');

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Cancel upload
    document.getElementById('cancel-upload').addEventListener('click', () => {
        resetUploadForm();
    });

    // Submit upload
    document.getElementById('submit-upload').addEventListener('click', submitUpload);
}

function handleFiles(files) {
    if (files.length === 0) return;

    const uploadForm = document.getElementById('upload-form');
    const uploadQueue = document.getElementById('upload-queue');

    if (files.length === 1) {
        // Single file - show form
        const file = files[0];
        uploadForm.style.display = 'block';

        // Set default title from filename
        const title = file.name.replace(/\.[^/.]+$/, '');
        document.getElementById('upload-title').value = title;
        document.getElementById('upload-title-ar').value = title;

        // Store file for upload
        uploadForm.dataset.file = URL.createObjectURL(file);
        uploadForm._file = file;
    } else {
        // Multiple files - add to queue and upload
        uploadQueue.innerHTML = '';
        for (const file of files) {
            addToQueue(file);
        }
        uploadMultiple(files);
    }
}

function addToQueue(file) {
    const queue = document.getElementById('upload-queue');
    const item = document.createElement('div');
    item.className = 'queue-item';
    item.dataset.filename = file.name;
    item.innerHTML = `
    <span class="queue-item-icon">${getFileIcon(file.name)}</span>
    <div class="queue-item-info">
      <div class="queue-item-name">${file.name}</div>
      <div class="queue-item-size">${formatFileSize(file.size)}</div>
    </div>
    <span class="queue-item-status pending">في الانتظار</span>
  `;
    queue.appendChild(item);
}

function updateQueueItem(filename, status, statusClass) {
    const item = document.querySelector(`.queue-item[data-filename="${filename}"]`);
    if (item) {
        const statusEl = item.querySelector('.queue-item-status');
        statusEl.textContent = status;
        statusEl.className = `queue-item-status ${statusClass}`;
    }
}

async function submitUpload() {
    const uploadForm = document.getElementById('upload-form');
    const file = uploadForm._file;

    if (!file) {
        showToast('الرجاء اختيار ملف', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', document.getElementById('upload-title').value);
    formData.append('title_ar', document.getElementById('upload-title-ar').value);
    formData.append('description', document.getElementById('upload-description').value);
    formData.append('category_id', document.getElementById('upload-category').value);
    formData.append('tags', document.getElementById('upload-tags').value);
    formData.append('is_featured', document.getElementById('upload-featured').checked);

    const progressContainer = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    progressContainer.style.display = 'block';
    uploadForm.style.display = 'none';

    try {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progressFill.style.width = `${percent}%`;
                progressText.textContent = `${percent}%`;
            }
        });

        xhr.onload = function () {
            if (xhr.status === 201) {
                showToast('تم رفع الملف بنجاح', 'success');
                resetUploadForm();
                loadStats();
                loadRecentContent();
            } else {
                showToast('فشل رفع الملف', 'error');
                progressContainer.style.display = 'none';
                uploadForm.style.display = 'block';
            }
        };

        xhr.onerror = function () {
            showToast('فشل رفع الملف', 'error');
            progressContainer.style.display = 'none';
            uploadForm.style.display = 'block';
        };

        xhr.open('POST', `${API_BASE}/content`);
        xhr.send(formData);
    } catch (error) {
        console.error('Error uploading file:', error);
        showToast('فشل رفع الملف', 'error');
        progressContainer.style.display = 'none';
        uploadForm.style.display = 'block';
    }
}

async function uploadMultiple(files) {
    const categoryId = document.getElementById('upload-category').value;

    for (const file of files) {
        updateQueueItem(file.name, 'جاري الرفع...', 'uploading');

        const formData = new FormData();
        formData.append('file', file);
        if (categoryId) formData.append('category_id', categoryId);

        try {
            const response = await fetch(`${API_BASE}/content`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                updateQueueItem(file.name, 'تم الرفع', 'complete');
            } else {
                updateQueueItem(file.name, 'فشل الرفع', 'error');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            updateQueueItem(file.name, 'فشل الرفع', 'error');
        }
    }

    showToast('تم رفع الملفات', 'success');
    loadStats();
    loadRecentContent();
}

function resetUploadForm() {
    document.getElementById('upload-form').style.display = 'none';
    document.getElementById('upload-progress').style.display = 'none';
    document.getElementById('progress-fill').style.width = '0%';
    document.getElementById('progress-text').textContent = '0%';
    document.getElementById('upload-title').value = '';
    document.getElementById('upload-title-ar').value = '';
    document.getElementById('upload-description').value = '';
    document.getElementById('upload-category').value = '';
    document.getElementById('upload-tags').value = '';
    document.getElementById('upload-featured').checked = false;
    document.getElementById('file-input').value = '';
    document.getElementById('upload-queue').innerHTML = '';

    const uploadForm = document.getElementById('upload-form');
    delete uploadForm._file;
}

// ========================================
// Categories CRUD
// ========================================
document.getElementById('add-category-btn').addEventListener('click', () => {
    document.getElementById('category-modal-title').textContent = 'إضافة تصنيف';
    document.getElementById('category-id').value = '';
    document.getElementById('category-name').value = '';
    document.getElementById('category-name-ar').value = '';
    document.getElementById('category-slug').value = '';
    document.getElementById('category-description').value = '';
    document.getElementById('category-parent').value = '';
    document.getElementById('category-icon').value = '📁';
    document.getElementById('category-modal').classList.add('active');
});

async function editCategory(id) {
    const category = categories.find(c => c.id === id);
    if (!category) return;

    document.getElementById('category-modal-title').textContent = 'تعديل التصنيف';
    document.getElementById('category-id').value = category.id;
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-name-ar').value = category.name_ar;
    document.getElementById('category-slug').value = category.slug;
    document.getElementById('category-description').value = category.description || '';
    document.getElementById('category-parent').value = category.parent_id || '';
    document.getElementById('category-icon').value = category.icon || '📁';
    document.getElementById('category-modal').classList.add('active');
}

async function saveCategory() {
    const id = document.getElementById('category-id').value;
    const data = {
        name: document.getElementById('category-name').value,
        name_ar: document.getElementById('category-name-ar').value,
        slug: document.getElementById('category-slug').value || document.getElementById('category-name').value.toLowerCase().replace(/\s+/g, '-'),
        description: document.getElementById('category-description').value,
        parent_id: document.getElementById('category-parent').value || null,
        icon: document.getElementById('category-icon').value
    };

    if (!data.name || !data.slug) {
        showToast('الرجاء إدخال الاسم والرابط', 'error');
        return;
    }

    try {
        const url = id ? `${API_BASE}/categories/${id}` : `${API_BASE}/categories`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showToast(id ? 'تم تحديث التصنيف' : 'تم إضافة التصنيف', 'success');
            document.getElementById('category-modal').classList.remove('active');
            loadCategories();
            loadCategoriesGrid();
        } else {
            showToast('فشلت العملية', 'error');
        }
    } catch (error) {
        console.error('Error saving category:', error);
        showToast('فشلت العملية', 'error');
    }
}

async function deleteCategory(id) {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;

    try {
        const response = await fetch(`${API_BASE}/categories/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showToast('تم حذف التصنيف', 'success');
            loadCategories();
            loadCategoriesGrid();
        } else {
            showToast('فشل حذف التصنيف', 'error');
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        showToast('فشل حذف التصنيف', 'error');
    }
}

// ========================================
// Modals
// ========================================
function initModals() {
    // Edit modal
    document.getElementById('close-edit-modal').addEventListener('click', () => {
        document.getElementById('edit-modal').classList.remove('active');
    });
    document.getElementById('cancel-edit').addEventListener('click', () => {
        document.getElementById('edit-modal').classList.remove('active');
    });
    document.getElementById('save-edit').addEventListener('click', saveEdit);

    // Category modal
    document.getElementById('close-category-modal').addEventListener('click', () => {
        document.getElementById('category-modal').classList.remove('active');
    });
    document.getElementById('cancel-category').addEventListener('click', () => {
        document.getElementById('category-modal').classList.remove('active');
    });
    document.getElementById('save-category').addEventListener('click', saveCategory);

    // Close on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// ========================================
// Filters
// ========================================
function initFilters() {
    document.getElementById('type-filter').addEventListener('change', () => {
        currentPage = 1;
        loadContent();
    });

    document.getElementById('category-filter').addEventListener('change', () => {
        currentPage = 1;
        loadContent();
    });

    document.getElementById('search-input').addEventListener('keyup', debounce(() => {
        currentPage = 1;
        loadContent();
    }, 300));

    document.querySelector('.search-btn').addEventListener('click', () => {
        currentPage = 1;
        loadContent();
    });

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadContent();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadContent();
        }
    });

    // Select all
    document.getElementById('select-all').addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            const id = parseInt(cb.closest('tr').dataset.id);
            if (e.target.checked) {
                selectedItems.add(id);
            } else {
                selectedItems.delete(id);
            }
        });
        updateBulkActions();
    });

    // Bulk delete
    document.getElementById('bulk-delete').addEventListener('click', async () => {
        if (selectedItems.size === 0) return;
        if (!confirm(`هل أنت متأكد من حذف ${selectedItems.size} عنصر؟`)) return;

        for (const id of selectedItems) {
            await fetch(`${API_BASE}/content/${id}`, { method: 'DELETE' });
        }

        selectedItems.clear();
        updateBulkActions();
        loadContent();
        loadStats();
        showToast('تم حذف العناصر المحددة', 'success');
    });
}

function toggleSelection(id) {
    if (selectedItems.has(id)) {
        selectedItems.delete(id);
    } else {
        selectedItems.add(id);
    }
    updateBulkActions();
}

function updateBulkActions() {
    const bulkActions = document.getElementById('bulk-actions');
    const selectedCount = document.getElementById('selected-count');

    if (selectedItems.size > 0) {
        bulkActions.style.display = 'flex';
        selectedCount.textContent = `${selectedItems.size} عنصر محدد`;
    } else {
        bulkActions.style.display = 'none';
    }
}

function updatePagination() {
    document.getElementById('page-info').textContent = `صفحة ${currentPage} من ${totalPages}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
}

// ========================================
// Utilities
// ========================================
function formatNumber(num) {
    return new Intl.NumberFormat('ar-EG').format(num);
}

function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getTypeLabel(type) {
    const labels = {
        pdf: 'PDF',
        image: 'صورة',
        video: 'فيديو',
        presentation: 'عرض'
    };
    return labels[type] || type;
}

function getFileExtension(filePath, mimeType) {
    if (!filePath && !mimeType) return '';

    // Try to get extension from file path
    if (filePath) {
        const match = filePath.match(/\.([^.]+)$/);
        if (match) return match[1].toUpperCase();
    }

    // Fallback to mime type
    if (mimeType) {
        const mimeMap = {
            'application/pdf': 'PDF',
            'image/jpeg': 'JPG',
            'image/jpg': 'JPG',
            'image/png': 'PNG',
            'image/gif': 'GIF',
            'image/webp': 'WEBP',
            'video/mp4': 'MP4',
            'video/x-ms-wmv': 'WMV',
            'video/webm': 'WEBM',
            'video/ogg': 'OGG',
            'video/quicktime': 'MOV',
            'video/x-msvideo': 'AVI',
            'video/x-flv': 'FLV',
            'application/vnd.ms-powerpoint': 'PPT',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX'
        };
        return mimeMap[mimeType] || mimeType.split('/')[1]?.toUpperCase() || '';
    }

    return '';
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        pdf: '📄',
        jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
        mp4: '🎬', wmv: '🎬', flv: '🎬', avi: '🎬',
        ppt: '📊', pptx: '📊'
    };
    return icons[ext] || '📁';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('.toast-icon');
    const text = toast.querySelector('.toast-message');

    icon.textContent = type === 'success' ? '✓' : '✕';
    text.textContent = message;

    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========================================
// Stat Card Clicks
// ========================================
function initStatCardClicks() {
    console.log('initStatCardClicks called');
    const cards = document.querySelectorAll('.stat-card.clickable');
    console.log('Found clickable cards:', cards.length);
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            console.log('Stat card clicked, type:', type);
            if (type) {
                filterByType(type);
            }
        });
    });
}

function filterByType(type) {
    console.log('filterByType called with type:', type);
    // Switch to content section
    switchSection('content');

    // Set the filter
    document.getElementById('type-filter').value = type;

    // Load content with filter
    currentPage = 1;
    loadContent();

    showToast(`عرض ${getTypeLabel(type)}`, 'success');
}

// ========================================
// Attach Event Listeners to Content Buttons
// ========================================
function attachContentEventListeners() {
    // View buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            viewContent(id);
        });
    });

    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            editContent(id);
        });
    });

    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            deleteContent(id);
        });
    });

    // Checkbox toggles
    document.querySelectorAll('.row-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const id = parseInt(cb.dataset.itemId);
            toggleSelection(id);
        });
    });
}

// ========================================
// Preview Modal
// ========================================
let currentPreviewId = null;

function initPreviewModal() {
    const closeBtn = document.getElementById('close-preview-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closePreview);
    }

    const modal = document.getElementById('preview-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePreview();
            }
        });
    }

    // Keyboard shortcut to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('preview-modal').classList.contains('active')) {
            closePreview();
        }
    });
}

async function showPreview(id) {
    console.log('showPreview called with id:', id);
    currentPreviewId = id;

    try {
        console.log('Fetching content from:', `${API_BASE}/content/${id}`);
        const response = await fetch(`${API_BASE}/content/${id}`);
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!data.success) {
            console.error('API returned error:', data);
            showToast('فشل تحميل المحتوى', 'error');
            return;
        }

        const item = data.data;
        console.log('Content item:', item);

        const modal = document.getElementById('preview-modal');
        const title = document.getElementById('preview-title');
        const body = document.getElementById('preview-body');
        const downloadBtn = document.getElementById('preview-download');

        console.log('Modal element:', modal);
        console.log('Title element:', title);
        console.log('Body element:', body);

        if (!modal || !title || !body) {
            console.error('Missing modal elements!');
            showToast('خطأ في عرض المعاينة', 'error');
            return;
        }

        title.textContent = item.title;
        downloadBtn.href = `${API_BASE}/content/${id}/file`;

        // Generate preview content based on type
        let previewContent = '';
        console.log('Content type:', item.type);

        // Use Cloudinary URL directly if available, otherwise fall back to API
        const fileUrl = (item.file_url && item.file_url.startsWith('http'))
            ? item.file_url
            : `${API_BASE}/content/${id}/file`;

        switch (item.type) {
            case 'image':
                previewContent = `<img src="${fileUrl}" alt="${item.title}" />`;
                break;

            case 'video':
                // Check if it's a browser-supported video format
                const supportedFormats = ['video/mp4', 'video/webm', 'video/ogg'];
                const isSupported = supportedFormats.includes(item.mime_type);

                if (isSupported) {
                    previewContent = `
                        <video controls preload="auto" style="max-width: 100%; max-height: 70vh;">
                            <source src="${fileUrl}" type="${item.mime_type || 'video/mp4'}">
                            متصفحك لا يدعم تشغيل الفيديو
                        </video>
                    `;
                } else {
                    previewContent = `
                        <div class="preview-placeholder">
                            <div class="preview-placeholder-icon">🎬</div>
                            <h3>${item.title}</h3>
                            <p>نوع الفيديو: ${item.mime_type || 'غير معروف'}</p>
                            <p>هذا التنسيق (${item.mime_type?.split('/')[1]?.toUpperCase()}) لا يدعمه المتصفح مباشرة</p>
                            <p>الحجم: ${formatFileSize(item.file_size)}</p>
                            <a href="${fileUrl}" class="btn btn-primary" download>
                                ⬇️ تحميل الفيديو لمشاهدته
                            </a>
                        </div>
                    `;
                }
                break;

            case 'pdf':
                previewContent = `
                    <iframe src="${fileUrl}#toolbar=1&navpanes=0" 
                            title="${item.title}"></iframe>
                `;
                break;

            case 'presentation':
                previewContent = `
                    <div class="preview-placeholder">
                        <div class="preview-placeholder-icon">📊</div>
                        <h3>${item.title}</h3>
                        <p>لا يمكن عرض العروض التقديمية مباشرة في المتصفح</p>
                        <a href="${fileUrl}" class="btn btn-primary" download>
                            ⬇️ تحميل العرض
                        </a>
                    </div>
                `;
                break;

            default:
                previewContent = `
                    <div class="preview-placeholder">
                        <div class="preview-placeholder-icon">📁</div>
                        <h3>${item.title}</h3>
                        <p>نوع الملف: ${item.mime_type || 'غير معروف'}</p>
                        <a href="${fileUrl}" class="btn btn-primary" download>
                            ⬇️ تحميل الملف
                        </a>
                    </div>
                `;
        }

        console.log('Setting preview content');
        body.innerHTML = previewContent;

        console.log('Adding active class to modal');
        modal.classList.add('active');
        console.log('Modal classes after:', modal.className);

        // If it's a video, try to load and play it
        if (item.type === 'video') {
            setTimeout(() => {
                const videoEl = body.querySelector('video');
                if (videoEl) {
                    console.log('Video element found:', videoEl);
                    console.log('Video src:', videoEl.querySelector('source')?.src);
                    videoEl.load();
                    videoEl.play().catch(err => {
                        console.log('Video autoplay prevented:', err);
                    });
                } else {
                    console.error('Video element not found in DOM');
                }
            }, 100);
        }

    } catch (error) {
        console.error('Error in showPreview:', error);
        showToast('فشل تحميل المعاينة', 'error');
    }
}

function closePreview() {
    const modal = document.getElementById('preview-modal');
    const body = document.getElementById('preview-body');

    modal.classList.remove('active');

    // Stop any playing media
    const video = body.querySelector('video');
    if (video) {
        video.pause();
    }

    // Clear content after animation
    setTimeout(() => {
        body.innerHTML = '';
    }, 300);

    currentPreviewId = null;
}

// ========================================
// Open in new tab function (alternative)
// ========================================
function openInNewTab(id) {
    window.open(`${API_BASE}/content/${id}/file`, '_blank');
}

// Ensure functions are globally available for inline onclick handlers
window.viewContent = viewContent;
window.editContent = editContent;
window.deleteContent = deleteContent;
window.toggleSelection = toggleSelection;
window.saveEdit = saveEdit;
window.editCategory = editCategory;
window.saveCategory = saveCategory;
window.deleteCategory = deleteCategory;
window.submitUpload = submitUpload;
