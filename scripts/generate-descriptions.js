const sqlite3 = require('sqlite3').verbose();

// Configuration
const BATCH_SIZE = 50;

// Initialize DB
const db = new sqlite3.Database('./database/scout.db');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║        AUTO-GENERATING DESCRIPTIONS (RULE-BASED)              ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Helper to update database
function updateContent(id, desc, descAr) {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE content SET description = ?, description_ar = ? WHERE id = ?`,
            [desc, descAr, id],
            function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            }
        );
    });
}

const TYPE_MAPPING = {
    'pdf': { en: 'PDF document', ar: 'ملف PDF' },
    'image': { en: 'image', ar: 'صورة' },
    'video': { en: 'video', ar: 'مقطع فيديو' },
    'presentation': { en: 'presentation', ar: 'عرض تقديمي' },
    'document': { en: 'document', ar: 'مستند' }
};

function generateDescription(item) {
    const typeEn = TYPE_MAPPING[item.type]?.en || 'file';
    const typeAr = TYPE_MAPPING[item.type]?.ar || 'ملف';

    // Use existing Arabic title if valid, otherwise fallback to English title
    const titleAr = (item.title_ar && item.title_ar !== item.title) ? item.title_ar : item.title;
    const categoryEn = item.category_name || 'General';
    const categoryAr = item.category_name_ar || item.category_name || 'عام';

    // English Description
    let descEn = `This ${typeEn}, titled "${item.title}", is part of the ${categoryEn} collection.`;
    if (item.type === 'image') {
        descEn += ` It provides a visual representation related to ${item.title}.`;
    } else if (item.type === 'pdf') {
        descEn += ` It contains detailed information and resources regarding ${item.title}.`;
    }

    // Arabic Description
    let descAr = `هذا ${typeAr} بعنوان "${titleAr}" ويندرج تحت قسم ${categoryAr}.`;
    if (item.type === 'image') {
        descAr += ` توفر هذه الصورة تجسيداً بصرياً متعلقاً بموضوع ${titleAr}.`;
    } else if (item.type === 'pdf') {
        descAr += ` يحتوي هذا الملف على معلومات وموارد تفصيلية حول ${titleAr}.`;
    } else if (item.type === 'video') {
        descAr += ` يقدم هذا الفيديو شرحاً أو عرضاً حول ${titleAr}.`;
    }

    return { en: descEn, ar: descAr };
}

async function run() {
    return new Promise((resolve, reject) => {
        // Fetch items without descriptions
        const sql = `
            SELECT c.id, c.title, c.title_ar, c.type, c.description, c.description_ar, 
                   cat.name as category_name, cat.name_ar as category_name_ar
            FROM content c
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE (c.description IS NULL OR c.description = '' OR c.description_ar IS NULL OR c.description_ar = '')
        `;

        db.all(sql, async (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                reject(err);
                return;
            }

            console.log(`📊 Found ${rows.length} items needing descriptions.`);

            let count = 0;
            for (const row of rows) {
                const descriptions = generateDescription(row);

                // Only update if current description is empty
                const finalDescEn = (row.description && row.description.length > 5) ? row.description : descriptions.en;
                const finalDescAr = (row.description_ar && row.description_ar.length > 5) ? row.description_ar : descriptions.ar;

                await updateContent(row.id, finalDescEn, finalDescAr);
                count++;

                if (count % 50 === 0) {
                    process.stdout.write(`\r✅ Processed ${count}/${rows.length} items...`);
                }
            }

            console.log(`\n\n✅ Successfully updated ${count} content items with generated descriptions.`);
            db.close();
            resolve();
        });
    });
}

// Helper to check and add column if missing
function runMigration() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Check if column exists first
            db.all("PRAGMA table_info(content)", (err, rows) => {
                if (err) {
                    console.error('❌ Error checking table info:', err);
                    reject(err);
                    return;
                }

                const hasDescriptionAr = rows.some(row => row.name === 'description_ar');

                if (hasDescriptionAr) {
                    console.log('✅ Column description_ar already exists.');
                    resolve();
                } else {
                    console.log('➕ Adding description_ar column...');
                    db.run("ALTER TABLE content ADD COLUMN description_ar TEXT", (err) => {
                        if (err) {
                            console.error('❌ Error adding column description_ar:', err);
                            reject(err);
                        } else {
                            console.log('✅ Successfully added description_ar column.');
                            resolve();
                        }
                    });
                }
            });
        });
    });
}

runMigration().then(run).catch(console.error);
