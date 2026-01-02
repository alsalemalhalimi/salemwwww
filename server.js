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

// 🔧 إعداد مسارات الملفات لتعمل على Render
const dataDir = path.join(__dirname, 'data');

// 🔧 التأكد من وجود مجلد data
if (!fs.existsSync(dataDir)) {
    console.log('📁 إنشاء مجلد data...');
    fs.mkdirSync(dataDir, { recursive: true });
}

const studentsFile = path.join(dataDir, 'student-results.json');
const professorsFile = path.join(dataDir, 'professor-results.json');
const analysisFile = path.join(dataDir, 'combined-analysis.json');

// 🔧 تهيئة الملفات إذا لم تكن موجودة
const initFile = (filePath, initialData) => {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`📄 إنشاء ملف ${path.basename(filePath)}...`);
            fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf8');
        }
    } catch (error) {
        console.error(`❌ خطأ في إنشاء ${filePath}:`, error);
    }
};

// تهيئة الملفات ببيانات فارغة
initFile(studentsFile, []);
initFile(professorsFile, []);
initFile(analysisFile, {
    summary: {},
    charts: {},
    insights: [],
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

// 🔧 دالة محسنة لقراءة الملفات مع معالجة الأخطاء
const readJSONFile = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            return [];
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`❌ خطأ في قراءة ${filePath}:`, error);
        return [];
    }
};

// 🔧 دالة محسنة لكتابة الملفات
const writeJSONFile = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`❌ خطأ في كتابة ${filePath}:`, error);
        return false;
    }
};

// 🔧 دالة لإنشاء اسم مستعار إذا لم يتم تقديم اسم
const generateDisplayName = (originalName, type) => {
    if (originalName && originalName.trim() !== '') {
        return originalName;
    }

    const prefixes = {
        student: ['طالب', 'مشارك', 'باحث', 'دارس'],
        professor: ['أستاذ', 'محاضر', 'باحث', 'عضو هيئة']
    };

    const prefix = prefixes[type] ? prefixes[type][Math.floor(Math.random() * prefixes[type].length)] : 'مشارك';
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    return `${prefix} ${randomNum}`;
};

// حفظ استبيان الطالب
app.post('/api/survey/student', (req, res) => {
    try {
        console.log('📝 استلام استبيان طالب...');

        const data = readJSONFile(studentsFile);
        const displayName = generateDisplayName(req.body.name || '', 'student');

        const surveyData = {
            id: Date.now(),
            name: displayName,
            originalName: req.body.name || '', // لحفظ الاسم الأصلي إذا تم تقديمه
            gender: req.body.gender || 'غير محدد',
            major: req.body.major || 'غير محدد',
            academicLevel: req.body.academicLevel || 'غير محدد',
            currentSystemRating: req.body.currentSystemRating || 0,
            currentProblems: req.body.currentProblems || [],
            currentPlatform: req.body.currentPlatform || 'غير محدد',
            featureLectures: req.body.featureLectures || 0,
            featureAttendance: req.body.featureAttendance || 0,
            featureMonitoring: req.body.featureMonitoring || 0,
            featureExams: req.body.featureExams || 0,
            featureActivities: req.body.featureActivities || 0,
            preferredAttendance: req.body.preferredAttendance || 'غير محدد',
            biggestChallenge: req.body.biggestChallenge || '',
            examTrust: req.body.examTrust || 'غير محدد',
            cameraIssue: req.body.cameraIssue || 'غير محدد',
            internetAvailability: req.body.internetAvailability || 'غير محدد',
            cheatingPrevention: req.body.cheatingPrevention || 'غير محدد',
            mostExpectedFeature: req.body.mostExpectedFeature || '',
            suggestions: req.body.suggestions || '',
            testingParticipation: req.body.testingParticipation || 'غير محدد',
            overallSatisfaction: req.body.overallSatisfaction || 0,
            timestamp: new Date().toLocaleString('ar-SA'),
            ip: req.ip || 'غير معروف',
            completionTime: req.body.completionTime || Math.round(Math.random() * 10) + 5, // زمن عشوائي للاختبار
            participationType: req.body.name ? 'named' : 'anonymous',
            completed: true
        };

        console.log(`✅ مشاركة جديدة من طالب: ${surveyData.name}`);

        data.push(surveyData);

        if (writeJSONFile(studentsFile, data)) {
            updateAnalysis();

            res.json({
                success: true,
                message: 'شكراً لمشاركتك! تم حفظ استبيانك بنجاح',
                id: surveyData.id,
                displayName: surveyData.name,
                anonymous: !req.body.name
            });
        } else {
            throw new Error('فشل في حفظ الملف');
        }
    } catch (error) {
        console.error('❌ خطأ في حفظ استبيان الطالب:', error);
        res.status(500).json({
            success: false,
            message: 'عذراً، حدث خطأ تقني. يرجى المحاولة مرة أخرى',
            error: error.message
        });
    }
});

// حفظ استبيان الهيئة التدريسية
app.post('/api/survey/professor', (req, res) => {
    try {
        console.log('📝 استلام استبيان هيئة تدريسية...');

        const data = readJSONFile(professorsFile);
        const displayName = generateDisplayName(req.body.name || '', 'professor');

        const surveyData = {
            id: Date.now(),
            name: displayName,
            originalName: req.body.name || '', // لحفظ الاسم الأصلي إذا تم تقديمه
            department: req.body.department || 'غير محدد',
            academicRank: req.body.academicRank || 'غير محدد',
            teachingExperience: req.body.teachingExperience || 'غير محدد',
            onlineCourses: req.body.onlineCourses || 'غير محدد',
            teachingChallenges: req.body.teachingChallenges || [],
            currentSystemEffectiveness: req.body.currentSystemEffectiveness || 0,
            reqLectures: req.body.reqLectures || 0,
            reqAttendance: req.body.reqAttendance || 0,
            reqMonitoring: req.body.reqMonitoring || 0,
            reqExams: req.body.reqExams || 0,
            reqActivities: req.body.reqActivities || 0,
            preferredAttendanceMethod: req.body.preferredAttendanceMethod || 'غير محدد',
            cheatingPreventionEffectiveness: req.body.cheatingPreventionEffectiveness || 0,
            biggestObstacle: req.body.biggestObstacle || '',
            attendanceProblems: req.body.attendanceProblems || 'غير محدد',
            examProblems: req.body.examProblems || [],
            techSupport: req.body.techSupport || 'غير محدد',
            mostImportantFeature: req.body.mostImportantFeature || '',
            offlineImportance: req.body.offlineImportance || 'غير محدد',
            expectedChallenges: req.body.expectedChallenges || '',
            managementRecommendations: req.body.managementRecommendations || '',
            systemUsefulness: req.body.systemUsefulness || 0,
            developmentParticipation: req.body.developmentParticipation || 'غير محدد',
            timestamp: new Date().toLocaleString('ar-SA'),
            ip: req.ip || 'غير معروف',
            completionTime: req.body.completionTime || Math.round(Math.random() * 10) + 5, // زمن عشوائي للاختبار
            participationType: req.body.name ? 'named' : 'anonymous',
            completed: true
        };

        console.log(`✅ مشاركة جديدة من هيئة تدريسية: ${surveyData.name}`);

        data.push(surveyData);

        if (writeJSONFile(professorsFile, data)) {
            updateAnalysis();

            res.json({
                success: true,
                message: 'شكراً لمشاركتك القيمة! تم حفظ استبيانك بنجاح',
                id: surveyData.id,
                displayName: surveyData.name,
                anonymous: !req.body.name
            });
        } else {
            throw new Error('فشل في حفظ الملف');
        }
    } catch (error) {
        console.error('❌ خطأ في حفظ استبيان الهيئة التدريسية:', error);
        res.status(500).json({
            success: false,
            message: 'عذراً، حدث خطأ تقني. يرجى المحاولة مرة أخرى',
            error: error.message
        });
    }
});

// الحصول على جميع البيانات
app.get('/api/data/all', (req, res) => {
    try {
        console.log('📊 طلب جميع البيانات...');
        const students = readJSONFile(studentsFile);
        const professors = readJSONFile(professorsFile);

        res.json({
            students,
            professors,
            totals: {
                students: students.length,
                professors: professors.length,
                total: students.length + professors.length
            },
            serverTime: new Date().toLocaleString('ar-SA')
        });
    } catch (error) {
        console.error('❌ خطأ في قراءة البيانات:', error);
        res.status(500).json({
            error: 'خطأ في قراءة البيانات',
            details: error.message
        });
    }
});

// الحصول على التحليلات
app.get('/api/analysis', (req, res) => {
    try {
        console.log('📈 طلب التحليلات...');
        const analysis = readJSONFile(analysisFile);
        res.json(analysis);
    } catch (error) {
        console.error('❌ خطأ في قراءة التحليلات:', error);
        res.status(500).json({
            error: 'خطأ في قراءة التحليلات',
            details: error.message
        });
    }
});

// 🔧 دالة تحديث التحليل
function updateAnalysis() {
    try {
        console.log('🔄 تحديث التحليلات...');
        const students = readJSONFile(studentsFile);
        const professors = readJSONFile(professorsFile);
        const allResponses = [...students, ...professors];

        // حساب إحصائيات المشاركة المجهولة
        const anonymousStudents = students.filter(s => s.participationType === 'anonymous').length;
        const anonymousProfessors = professors.filter(p => p.participationType === 'anonymous').length;

        const analysis = {
            summary: {
                totalParticipants: allResponses.length,
                studentCount: students.length,
                professorCount: professors.length,
                anonymousStudents,
                anonymousProfessors,
                anonymousPercentage: allResponses.length > 0 ?
                    Math.round(((anonymousStudents + anonymousProfessors) / allResponses.length) * 100) : 0,
                completionRate: calculateCompletionRate(allResponses),
                averageTime: calculateAverageTime(allResponses),
                lastUpdate: new Date().toLocaleString('ar-SA')
            },
            charts: {
                byMajor: groupBy(students, 'major'),
                byDepartment: groupBy(professors, 'department'),
                byExperience: groupBy(allResponses, 'teachingExperience'),
                byAcademicLevel: groupBy(students, 'academicLevel'),
                byAcademicRank: groupBy(professors, 'academicRank'),
                satisfactionLevels: calculateSatisfaction(allResponses),
                participationTypes: {
                    named: allResponses.filter(r => r.participationType === 'named').length,
                    anonymous: allResponses.filter(r => r.participationType === 'anonymous').length
                }
            },
            insights: generateInsights(students, professors),
            lastUpdated: new Date().toISOString()
        };

        writeJSONFile(analysisFile, analysis);
        console.log('✅ تم تحديث التحليلات بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تحديث التحليلات:', error);
    }
}

// 🔧 دوال مساعدة
function groupBy(array, key) {
    if (!array || !key) return {};
    return array.reduce((acc, item) => {
        const value = item[key] || 'غير محدد';
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
}

function calculateCompletionRate(responses) {
    if (!responses || responses.length === 0) return 0;
    const completed = responses.filter(r => r.completed === true).length;
    return ((completed / responses.length) * 100).toFixed(1);
}

function calculateAverageTime(responses) {
    if (!responses || responses.length === 0) return 0;
    const times = responses.map(r => parseInt(r.completionTime) || 0);
    const validTimes = times.filter(t => t > 0);
    return validTimes.length ?
        (validTimes.reduce((a, b) => a + b, 0) / validTimes.length).toFixed(1) : 0;
}

function calculateSatisfaction(responses) {
    const levels = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };

    responses.forEach(response => {
        const satisfaction = response.overallSatisfaction || response.systemUsefulness;
        if (satisfaction) {
            const level = satisfaction.toString();
            if (levels.hasOwnProperty(level)) {
                levels[level]++;
            }
        }
    });

    return {
        'مرتفع جداً': levels['5'] || 0,
        'مرتفع': levels['4'] || 0,
        'متوسط': levels['3'] || 0,
        'منخفض': levels['2'] || 0,
        'منخفض جداً': levels['1'] || 0
    };
}

function generateInsights(students, professors) {
    const insights = [];

    if (students.length > 0) {
        insights.push(`عدد الطلاب المشاركين: ${students.length} (${students.filter(s => s.participationType === 'anonymous').length} مجهولين)`);

        const topMajor = Object.entries(groupBy(students, 'major')).sort(([, a], [, b]) => b - a)[0];
        if (topMajor) {
            insights.push(`أكثر تخصص مشارك: ${topMajor[0]} (${topMajor[1]} مشارك)`);
        }
    }

    if (professors.length > 0) {
        insights.push(`عدد أعضاء الهيئة التدريسية المشاركين: ${professors.length} (${professors.filter(p => p.participationType === 'anonymous').length} مجهولين)`);

        const topDepartment = Object.entries(groupBy(professors, 'department')).sort(([, a], [, b]) => b - a)[0];
        if (topDepartment) {
            insights.push(`أكثر قسم مشارك: ${topDepartment[0]}`);
        }
    }

    const allResponses = [...students, ...professors];
    if (allResponses.length > 0) {
        const anonymousCount = allResponses.filter(r => r.participationType === 'anonymous').length;
        const anonymousPercentage = Math.round((anonymousCount / allResponses.length) * 100);
        insights.push(`نسبة المشاركة المجهولة: ${anonymousPercentage}%`);
    }

    return insights.length > 0 ? insights : ['بدء جمع البيانات...'];
}

// 🔧 إضافة API للتحقق من صحة السيرفر
app.get('/api/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'LMS Research Survey',
        version: '3.0.0',
        features: ['anonymous-survey', 'privacy-first', 'real-time-analysis'],
        dataFiles: {
            students: fs.existsSync(studentsFile),
            professors: fs.existsSync(professorsFile),
            analysis: fs.existsSync(analysisFile)
        }
    };
    res.json(health);
});

// 🔧 إضافة API لتصدير البيانات
app.get('/api/export/json', (req, res) => {
    try {
        const students = readJSONFile(studentsFile);
        const professors = readJSONFile(professorsFile);

        const exportData = {
            exportDate: new Date().toISOString(),
            project: "LMS Research Survey - Privacy Edition",
            privacyNote: "جميع الأسماء مجهولة لحماية خصوصية المشاركين",
            totals: {
                students: students.length,
                professors: professors.length,
                total: students.length + professors.length,
                anonymous: students.filter(s => s.participationType === 'anonymous').length +
                    professors.filter(p => p.participationType === 'anonymous').length
            },
            students: students.map(s => ({
                ...s,
                name: s.participationType === 'anonymous' ? 'مشارك مجهول' : s.name,
                originalName: undefined // إزالة الاسم الأصلي للخصوصية
            })),
            professors: professors.map(p => ({
                ...p,
                name: p.participationType === 'anonymous' ? 'عضو هيئة مجهول' : p.name,
                originalName: undefined // إزالة الاسم الأصلي للخصوصية
            }))
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="lms-research-anonymous-data.json"');
        res.send(JSON.stringify(exportData, null, 2));
    } catch (error) {
        console.error('❌ خطأ في التصدير:', error);
        res.status(500).json({ error: 'خطأ في التصدير' });
    }
});

// إضافة API للحصول على إحصائيات المشاركة المجهولة
app.get('/api/stats/anonymous', (req, res) => {
    try {
        const students = readJSONFile(studentsFile);
        const professors = readJSONFile(professorsFile);

        const stats = {
            totalParticipants: students.length + professors.length,
            anonymousStudents: students.filter(s => s.participationType === 'anonymous').length,
            anonymousProfessors: professors.filter(p => p.participationType === 'anonymous').length,
            totalAnonymous: students.filter(s => s.participationType === 'anonymous').length +
                professors.filter(p => p.participationType === 'anonymous').length,
            anonymousPercentage: Math.round(
                ((students.filter(s => s.participationType === 'anonymous').length +
                        professors.filter(p => p.participationType === 'anonymous').length) /
                    (students.length + professors.length)) * 100
            ) || 0,
            updatedAt: new Date().toLocaleString('ar-SA')
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في حساب الإحصائيات' });
    }
});

// ==================== Start Server ====================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🚀 سيرفر البحث العلمي يعمل بنجاح!
    🌐 الرابط: http://localhost:${PORT}
    🔒 الإصدار: 3.0.0 (خصوصية أولاً)
    📊 المميزات: المشاركة المجهولة - لا حقول إلزامية
    📅 ${new Date().toLocaleString('ar-SA')}
    `);

    // 🔧 التحقق من وجود الملفات
    console.log('🔍 التحقق من الملفات:');
    console.log(`   📄 students.json: ${fs.existsSync(studentsFile) ? '✅ موجود' : '❌ غير موجود'}`);
    console.log(`   📄 professors.json: ${fs.existsSync(professorsFile) ? '✅ موجود' : '❌ غير موجود'}`);
    console.log(`   📄 analysis.json: ${fs.existsSync(analysisFile) ? '✅ موجود' : '❌ غير موجود'}`);

    // تحديث التحليل الأولي
    updateAnalysis();
});

// 🔧 معالجة الأخطاء غير المتوقعة
process.on('uncaughtException', (error) => {
    console.error('❌ خطأ غير متوقع:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ رفض وعد غير معالج:', error);
});