const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// مسارات الملفات
const dataDir = path.join(__dirname, 'data');
const studentsFile = path.join(dataDir, 'student-results.json');
const professorsFile = path.join(dataDir, 'professor-results.json');
const analysisFile = path.join(dataDir, 'combined-analysis.json');

// تأكد من وجود المجلدات
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// تهيئة الملفات إذا لم تكن موجودة
const initFile = (filePath, initialData) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf8');
    }
};

initFile(studentsFile, []);
initFile(professorsFile, []);
initFile(analysisFile, {
    summary: {},
    charts: {},
    lastUpdated: new Date().toISOString()
});

// ==================== Routes ====================

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// صفحات الاستبيان
app.get('/student-survey', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student-survey.html'));
});

app.get('/professor-survey', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'professor-survey.html'));
});

// صفحة النتائج
app.get('/results', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

// صفحة الداشبورد
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// صفحة التقرير
app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'research-report.html'));
});

// ==================== APIs ====================

// حفظ استبيان الطالب
app.post('/api/survey/student', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(studentsFile, 'utf8'));
        const surveyData = {
            id: Date.now(),
            ...req.body,
            timestamp: new Date().toLocaleString('ar-SA'),
            ip: req.ip,
            completionTime: req.body.completionTime || 'غير محدد'
        };

        data.push(surveyData);
        fs.writeFileSync(studentsFile, JSON.stringify(data, null, 2), 'utf8');

        // تحديث التحليل
        updateAnalysis();

        res.json({
            success: true,
            message: 'تم حفظ استبيان الطالب بنجاح',
            id: surveyData.id
        });
    } catch (error) {
        console.error('Error saving student survey:', error);
        res.status(500).json({ success: false, message: 'خطأ في حفظ البيانات' });
    }
});

// حفظ استبيان الهيئة التدريسية
app.post('/api/survey/professor', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(professorsFile, 'utf8'));
        const surveyData = {
            id: Date.now(),
            ...req.body,
            timestamp: new Date().toLocaleString('ar-SA'),
            ip: req.ip,
            completionTime: req.body.completionTime || 'غير محدد'
        };

        data.push(surveyData);
        fs.writeFileSync(professorsFile, JSON.stringify(data, null, 2), 'utf8');

        // تحديث التحليل
        updateAnalysis();

        res.json({
            success: true,
            message: 'تم حفظ استبيان الهيئة التدريسية بنجاح',
            id: surveyData.id
        });
    } catch (error) {
        console.error('Error saving professor survey:', error);
        res.status(500).json({ success: false, message: 'خطأ في حفظ البيانات' });
    }
});

// الحصول على جميع البيانات
app.get('/api/data/all', (req, res) => {
    try {
        const students = JSON.parse(fs.readFileSync(studentsFile, 'utf8'));
        const professors = JSON.parse(fs.readFileSync(professorsFile, 'utf8'));

        res.json({
            students,
            professors,
            totals: {
                students: students.length,
                professors: professors.length,
                total: students.length + professors.length
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في قراءة البيانات' });
    }
});

// الحصول على التحليلات
app.get('/api/analysis', (req, res) => {
    try {
        const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في قراءة التحليلات' });
    }
});

// تصدير البيانات كـ JSON
app.get('/api/export/json', (req, res) => {
    try {
        const students = JSON.parse(fs.readFileSync(studentsFile, 'utf8'));
        const professors = JSON.parse(fs.readFileSync(professorsFile, 'utf8'));

        const exportData = {
            exportDate: new Date().toISOString(),
            project: "LMS Research Survey",
            students,
            professors
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="lms-research-data.json"');
        res.send(JSON.stringify(exportData, null, 2));
    } catch (error) {
        res.status(500).json({ error: 'خطأ في التصدير' });
    }
});

// ==================== Helper Functions ====================

function updateAnalysis() {
    try {
        const students = JSON.parse(fs.readFileSync(studentsFile, 'utf8'));
        const professors = JSON.parse(fs.readFileSync(professorsFile, 'utf8'));
        const allResponses = [...students, ...professors];

        const analysis = {
            summary: {
                totalParticipants: allResponses.length,
                studentCount: students.length,
                professorCount: professors.length,
                completionRate: calculateCompletionRate(allResponses),
                averageTime: calculateAverageTime(allResponses)
            },
            charts: {
                byGender: groupBy(allResponses, 'gender'),
                byAge: groupBy(allResponses, 'age'),
                byEducation: groupBy(allResponses, 'educationLevel'),
                byExperience: groupBy(allResponses, 'experience'),
                featureRankings: rankFeatures(allResponses),
                satisfactionLevels: calculateSatisfaction(allResponses)
            },
            insights: generateInsights(students, professors),
            lastUpdated: new Date().toISOString()
        };

        fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2), 'utf8');
    } catch (error) {
        console.error('Error updating analysis:', error);
    }
}

function groupBy(array, key) {
    return array.reduce((acc, item) => {
        const value = item[key] || 'غير محدد';
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
}

function calculateCompletionRate(responses) {
    const completed = responses.filter(r => r.completed === true).length;
    return responses.length ? ((completed / responses.length) * 100).toFixed(1) : 0;
}

function calculateAverageTime(responses) {
    const times = responses.map(r => parseInt(r.completionTime) || 0);
    const validTimes = times.filter(t => t > 0);
    return validTimes.length ?
        (validTimes.reduce((a, b) => a + b, 0) / validTimes.length).toFixed(1) : 0;
}

function rankFeatures(responses) {
    const featureScores = {};

    responses.forEach(response => {
        if (response.featureRatings) {
            Object.entries(response.featureRatings).forEach(([feature, rating]) => {
                if (!featureScores[feature]) {
                    featureScores[feature] = { total: 0, count: 0 };
                }
                featureScores[feature].total += parseInt(rating) || 0;
                featureScores[feature].count += 1;
            });
        }
    });

    // حساب المتوسطات
    const averages = {};
    Object.entries(featureScores).forEach(([feature, data]) => {
        averages[feature] = data.count ? (data.total / data.count).toFixed(2) : 0;
    });

    // ترتيب تنازلي
    return Object.entries(averages)
        .sort(([, a], [, b]) => b - a)
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
}

function calculateSatisfaction(responses) {
    const levels = { 'مرتفع جداً': 0, 'مرتفع': 0, 'متوسط': 0, 'منخفض': 0, 'منخفض جداً': 0 };

    responses.forEach(response => {
        const satisfaction = response.overallSatisfaction || response.systemUsefulness;
        if (satisfaction && levels.hasOwnProperty(satisfaction)) {
            levels[satisfaction]++;
        }
    });

    return levels;
}

function generateInsights(students, professors) {
    const insights = [];

    // تحليل احتياجات الطلاب
    if (students.length > 0) {
        const topStudentNeed = findTopNeed(students, 'needs');
        if (topStudentNeed) {
            insights.push(`الطلاب يفضلون: ${topStudentNeed}`);
        }
    }

    // تحليل احتياجات المدرسين
    if (professors.length > 0) {
        const topProfessorNeed = findTopNeed(professors, 'requirements');
        if (topProfessorNeed) {
            insights.push(`الهيئة التدريسية تحتاج: ${topProfessorNeed}`);
        }
    }

    // مقارنة الرضا
    const studentSatisfaction = calculateAverageSatisfaction(students);
    const professorSatisfaction = calculateAverageSatisfaction(professors);

    if (studentSatisfaction > professorSatisfaction) {
        insights.push('الطلاب أكثر رضا عن النظام الحالي من الهيئة التدريسية');
    } else if (professorSatisfaction > studentSatisfaction) {
        insights.push('الهيئة التدريسية أكثر رضا عن النظام الحالي من الطلاب');
    }

    return insights.length > 0 ? insights : ['لا توجد insights كافية بعد'];
}

function findTopNeed(responses, field) {
    const needs = {};
    responses.forEach(response => {
        if (response[field]) {
            const needList = Array.isArray(response[field]) ? response[field] : [response[field]];
            needList.forEach(need => {
                needs[need] = (needs[need] || 0) + 1;
            });
        }
    });

    const sorted = Object.entries(needs).sort(([, a], [, b]) => b - a);
    return sorted.length > 0 ? sorted[0][0] : null;
}

function calculateAverageSatisfaction(responses) {
    const satisfactionMap = {
        'مرتفع جداً': 5,
        'مرتفع': 4,
        'متوسط': 3,
        'منخفض': 2,
        'منخفض جداً': 1
    };

    const scores = responses
        .map(r => satisfactionMap[r.overallSatisfaction || r.systemUsefulness] || 0)
        .filter(s => s > 0);

    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}

// ==================== Start Server ====================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🚀 سيرفر البحث العلمي يعمل بنجاح!
    🌐 الرابط المحلي: http://localhost:${PORT}
    📊 النظام جاهز لجمع بيانات البحث
    📅 ${new Date().toLocaleString('ar-SA')}
    `);

    // تحديث التحليل الأولي
    updateAnalysis();
});