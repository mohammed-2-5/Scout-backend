const fs = require('fs').promises;
const path = require('path');
const db = require('../src/utils/database');
const Content = require('../src/models/Content');
const Category = require('../src/models/Category');
const thumbnailGenerator = require('../src/utils/thumbnailGenerator');
const fileHelper = require('../src/utils/fileHelper');

// Configuration
const SOURCE_DIR = path.resolve(__dirname, '../../'); // Parent directory with all content
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

// Predefined categories based on your folder structure
const PREDEFINED_CATEGORIES = [
  { name: 'Kada', name_ar: 'القادة', slug: 'kada', description: 'Leadership and scout leaders content' },
  { name: 'Marahel', name_ar: 'المراحل', slug: 'marahel', description: 'Scout stages and levels' },
  { name: 'Mharat', name_ar: 'المهارات', slug: 'mharat', description: 'Scout skills and abilities' },
  { name: 'Mosabkat', name_ar: 'المسابقات', slug: 'mosabkat', description: 'Scout competitions' },
  { name: 'Tarekh', name_ar: 'التاريخ', slug: 'tarekh', description: 'Scout history' },
  { name: 'Aviation Culture', name_ar: 'الثقافة الجوية', slug: 'aviation', description: 'Aviation and aerospace education' },
  { name: 'Rope Work', name_ar: 'أشغال الحبال', slug: 'rope-work', description: 'Knots and rope techniques' },
  { name: 'Badges', name_ar: 'الأوسمة', slug: 'badges', description: 'Scout badges and awards' },
  { name: 'Leader Training', name_ar: 'تدريب القادة', slug: 'leader-training', description: 'Training materials for scout leaders' },
  { name: 'Skills Learning', name_ar: 'تعلم مهارة', slug: 'skills-learning', description: 'Learning various scout skills' },
  { name: 'General', name_ar: 'عام', slug: 'general', description: 'General scout content' }
];

// Directory to category mapping
const DIR_CATEGORY_MAP = {
  'kada': 'kada',
  'marahel': 'marahel',
  'mharat': 'mharat',
  'mosabkat': 'mosabkat',
  'tarekh': 'tarekh',
  'الثقافة الجوية': 'aviation',
  'اشغال الحبال': 'rope-work',
  'اوسمة': 'badges',
  'تدريب القادة': 'leader-training',
  'تعلم مهارة': 'skills-learning',
  'المراحل الكشفية': 'marahel',
  'شارات': 'badges',
  'كتب': 'general',
  'تدريب': 'leader-training',
  'تقاليد': 'general',
  'مهارات': 'skills-learning',
  'فيديوهات': 'general',
  'عام': 'general',
  'مهارات كشفية': 'skills-learning',
  'ملاحه': 'skills-learning',
  'بور': 'general',
  'قصة بادن بول': 'tarekh',
  'صور نادرة للحركة الكشفية المصرية منذ نشأتها': 'tarekh'
};

class MigrationScript {
  constructor() {
    this.stats = {
      totalFiles: 0,
      imported: 0,
      skipped: 0,
      errors: 0
    };
    this.categoryMap = new Map();
  }

  async run() {
    console.log('🚀 Starting migration...\n');

    try {
      // Connect to database
      await db.connect();
      console.log('✅ Database connected\n');

      // Create upload directories
      await this.createUploadDirectories();

      // Create categories
      await this.createCategories();

      // Scan and import files
      await this.scanAndImportFiles(SOURCE_DIR);

      // Print statistics
      this.printStats();

      console.log('\n✅ Migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    } finally {
      await db.close();
    }
  }

  async createUploadDirectories() {
    const dirs = ['pdf', 'images', 'videos', 'thumbnails'];
    for (const dir of dirs) {
      const dirPath = path.join(UPLOADS_DIR, dir);
      await fs.mkdir(dirPath, { recursive: true });
    }
    console.log('✅ Upload directories created\n');
  }

  async createCategories() {
    console.log('📁 Creating categories...');

    for (const cat of PREDEFINED_CATEGORIES) {
      try {
        // Check if category exists
        const existing = await Category.findBySlug(cat.slug);
        if (!existing) {
          const result = await Category.create(cat);
          this.categoryMap.set(cat.slug, result.id);
          console.log(`  ✓ Created category: ${cat.name_ar} (${cat.name})`);
        } else {
          this.categoryMap.set(cat.slug, existing.id);
          console.log(`  ⊙ Category exists: ${cat.name_ar} (${cat.name})`);
        }
      } catch (error) {
        console.error(`  ✗ Error creating category ${cat.name}:`, error.message);
      }
    }

    console.log('\n');
  }

  async scanAndImportFiles(dir, depth = 0) {
    if (depth > 5) return; // Prevent too deep recursion

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip the scout-backend directory itself
        if (entry.name === 'scout-backend') continue;

        if (entry.isDirectory()) {
          await this.scanAndImportFiles(fullPath, depth + 1);
        } else if (entry.isFile()) {
          await this.importFile(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error.message);
    }
  }

  async importFile(filePath) {
    this.stats.totalFiles++;

    try {
      // Check if file is supported
      if (!fileHelper.isSupported(filePath)) {
        this.stats.skipped++;
        return;
      }

      const fileInfo = fileHelper.getFileInfo(filePath);
      const fileName = path.basename(filePath);
      const title = fileHelper.extractTitle(filePath);

      // Determine category
      const categorySlug = this.determineCategoryFromPath(filePath);
      const categoryId = this.categoryMap.get(categorySlug) || this.categoryMap.get('general');

      // Copy file to uploads directory
      const targetDir = path.join(UPLOADS_DIR, fileInfo.type === 'image' ? 'images' :
                                                fileInfo.type === 'video' ? 'videos' : 'pdf');
      const sanitizedName = fileHelper.sanitizeFileName(fileName);
      const targetPath = path.join(targetDir, sanitizedName);

      // Check if already imported by checking file path
      const existing = await db.get('SELECT id FROM content WHERE file_path = ?', [targetPath]);
      if (existing) {
        this.stats.skipped++;
        return;
      }

      // Copy file
      await fs.copyFile(filePath, targetPath);

      // Get file size
      const stats = await fs.stat(targetPath);

      // Generate thumbnail
      const thumbnailName = `${path.parse(sanitizedName).name}_thumb.jpg`;
      const thumbnailPath = path.join(UPLOADS_DIR, 'thumbnails', thumbnailName);
      await thumbnailGenerator.generate(targetPath, thumbnailPath, fileInfo.type);

      // Create content record
      const contentData = {
        title,
        title_ar: title,
        description: `${title} - Imported from ${path.dirname(filePath)}`,
        category_id: categoryId,
        type: fileInfo.type,
        file_path: targetPath,
        file_url: `/uploads/${fileInfo.type === 'image' ? 'images' :
                                fileInfo.type === 'video' ? 'videos' : 'pdf'}/${sanitizedName}`,
        thumbnail_path: thumbnailPath,
        thumbnail_url: `/uploads/thumbnails/${thumbnailName}`,
        file_size: stats.size,
        mime_type: fileInfo.mime,
        tags: [categorySlug, fileInfo.type],
        is_featured: 0
      };

      await Content.create(contentData);
      this.stats.imported++;

      console.log(`✓ Imported: ${title.substring(0, 50)}... (${fileInfo.type})`);
    } catch (error) {
      this.stats.errors++;
      console.error(`✗ Error importing ${filePath}:`, error.message);
    }
  }

  determineCategoryFromPath(filePath) {
    const relativePath = path.relative(SOURCE_DIR, filePath);
    const parts = relativePath.split(path.sep);

    // Check each part against category mapping
    for (const part of parts) {
      const normalized = part.toLowerCase();
      if (DIR_CATEGORY_MAP[part]) {
        return DIR_CATEGORY_MAP[part];
      }
      // Check if any category slug matches
      for (const [key, slug] of Object.entries(DIR_CATEGORY_MAP)) {
        if (normalized.includes(key.toLowerCase())) {
          return slug;
        }
      }
    }

    return 'general';
  }

  printStats() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Statistics:');
    console.log('='.repeat(50));
    console.log(`Total files scanned:    ${this.stats.totalFiles}`);
    console.log(`Successfully imported:  ${this.stats.imported}`);
    console.log(`Skipped:                ${this.stats.skipped}`);
    console.log(`Errors:                 ${this.stats.errors}`);
    console.log('='.repeat(50));
  }
}

// Run migration
const migration = new MigrationScript();
migration.run();
