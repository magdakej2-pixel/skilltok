/**
 * Seed script: populates the database with initial categories, demo teachers,
 * 25+ demo videos, sample comments, and likes.
 * Run: node server/scripts/seed.js
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

const Category = require('../models/Category');
const User = require('../models/User');
const Video = require('../models/Video');
const Comment = require('../models/Comment');
const Like = require('../models/Like');

const categories = [
  { name: 'AI', slug: 'ai', iconName: 'cpu', order: 1 },
  { name: 'Programming', slug: 'programming', iconName: 'code', order: 2 },
  { name: 'Marketing', slug: 'marketing', iconName: 'trending-up', order: 3 },
  { name: 'Business', slug: 'business', iconName: 'briefcase', order: 4 },
  { name: 'Finance', slug: 'finance', iconName: 'dollar-sign', order: 5 },
  { name: 'Productivity', slug: 'productivity', iconName: 'zap', order: 6 },
  { name: 'Design', slug: 'design', iconName: 'palette', order: 7 },
  { name: 'Entrepreneurship', slug: 'entrepreneurship', iconName: 'rocket', order: 8 },
  { name: 'Content Creator', slug: 'content-creator', iconName: 'video', order: 9 },
];

const demoTeachers = [
  { firebaseUid: 'demo-teacher-1', email: 'ai.expert@demo.skilltok.com', displayName: 'Dr. Sarah AI', role: 'teacher', bio: 'AI researcher and educator. Making artificial intelligence accessible to everyone.', expertiseCategory: 'ai' },
  { firebaseUid: 'demo-teacher-2', email: 'code.master@demo.skilltok.com', displayName: 'CodeMaster Mike', role: 'teacher', bio: 'Full-stack developer with 10+ years of experience. Learn to code the right way.', expertiseCategory: 'programming' },
  { firebaseUid: 'demo-teacher-3', email: 'biz.guru@demo.skilltok.com', displayName: 'Business Guru Lisa', role: 'teacher', bio: 'Serial entrepreneur. Sharing lessons learned from building 3 startups.', expertiseCategory: 'business' },
  { firebaseUid: 'demo-teacher-4', email: 'design.pro@demo.skilltok.com', displayName: 'Design Pro Alex', role: 'teacher', bio: 'UI/UX designer at top tech companies. Design thinking simplified.', expertiseCategory: 'design' },
  { firebaseUid: 'demo-teacher-5', email: 'finance.ninja@demo.skilltok.com', displayName: 'Finance Ninja', role: 'teacher', bio: 'Financial advisor helping you build wealth through smart money moves.', expertiseCategory: 'finance' },
];

const demoStudents = [
  { firebaseUid: 'demo-student-1', email: 'learner1@demo.skilltok.com', displayName: 'Alex Learner', role: 'student', bio: 'Passionate about learning new tech skills!' },
  { firebaseUid: 'demo-student-2', email: 'learner2@demo.skilltok.com', displayName: 'Maria Student', role: 'student', bio: 'Business student exploring AI and design.' },
  { firebaseUid: 'demo-student-3', email: 'learner3@demo.skilltok.com', displayName: 'DevJunior Kim', role: 'student', bio: 'Aspiring full-stack developer.' },
];

// Sample video URLs (public domain / sample videos)
const sampleVideoUrls = [
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
];

const demoVideos = [
  // AI (4 videos)
  { title: 'What is Machine Learning in 60 Seconds', description: 'A quick intro to ML concepts — supervised, unsupervised, and reinforcement learning explained simply.', category: 'ai', tags: ['ml', 'ai', 'beginner'], duration: 60, teacherIndex: 0 },
  { title: 'GPT vs Claude: Which AI to Use?', description: 'Comparing the top AI assistants for different use cases.', category: 'ai', tags: ['gpt', 'claude', 'comparison'], duration: 90, teacherIndex: 0 },
  { title: 'Prompt Engineering 101', description: 'The art of asking AI the right questions. 5 techniques that work.', category: 'ai', tags: ['prompts', 'ai', 'tips'], duration: 75, teacherIndex: 0 },
  { title: 'AI in 2026: What Changed', description: 'The biggest AI breakthroughs this year and what they mean for you.', category: 'ai', tags: ['ai', 'trends', '2026'], duration: 120, teacherIndex: 0 },

  // Programming (5 videos)
  { title: 'Learn React in 90 Seconds', description: 'Components, props, state — the 3 React fundamentals you need.', category: 'programming', tags: ['react', 'javascript', 'frontend'], duration: 90, teacherIndex: 1 },
  { title: 'Git for Beginners: 5 Commands', description: 'init, add, commit, push, pull — all you need to start with Git.', category: 'programming', tags: ['git', 'beginner', 'tools'], duration: 75, teacherIndex: 1 },
  { title: 'TypeScript Types You Must Know', description: 'union, intersection, generics — level up your TypeScript.', category: 'programming', tags: ['typescript', 'types', 'advanced'], duration: 120, teacherIndex: 1 },
  { title: 'CSS Grid vs Flexbox', description: 'When to use Grid and when to use Flexbox — visual comparison.', category: 'programming', tags: ['css', 'layout', 'frontend'], duration: 60, teacherIndex: 1 },
  { title: 'Node.js REST API in 2 Minutes', description: 'Express, routes, middleware — build your first API fast.', category: 'programming', tags: ['nodejs', 'api', 'backend'], duration: 120, teacherIndex: 1 },

  // Business (3 videos)
  { title: 'Start a Business with $0', description: 'Service-based businesses you can start today with zero capital.', category: 'business', tags: ['startup', 'zero-capital', 'service'], duration: 60, teacherIndex: 2 },
  { title: 'The MVP Mindset', description: 'Why building a minimum viable product first saves you months.', category: 'entrepreneurship', tags: ['mvp', 'startup', 'lean'], duration: 45, teacherIndex: 2 },
  { title: 'Networking That Actually Works', description: 'Stop exchanging cards. Start building real professional relationships.', category: 'business', tags: ['networking', 'career', 'tips'], duration: 60, teacherIndex: 2 },

  // Design (3 videos)
  { title: 'Color Theory for Developers', description: 'How to pick colors that actually look good in your apps.', category: 'design', tags: ['color', 'ui', 'tips'], duration: 60, teacherIndex: 3 },
  { title: 'Figma Shortcuts that Save Hours', description: 'Top 10 Figma shortcuts every designer should know.', category: 'design', tags: ['figma', 'shortcuts', 'productivity'], duration: 90, teacherIndex: 3 },
  { title: 'Dark Mode Design Mistakes', description: 'The 5 most common mistakes when designing for dark mode.', category: 'design', tags: ['dark-mode', 'ui', 'ux'], duration: 75, teacherIndex: 3 },

  // Finance (3 videos)
  { title: 'Compound Interest Explained', description: 'The 8th wonder of the world — how compound interest builds wealth.', category: 'finance', tags: ['investing', 'compound', 'wealth'], duration: 60, teacherIndex: 4 },
  { title: 'ETF vs Index Fund', description: 'Which passive investment is better? Quick comparison.', category: 'finance', tags: ['etf', 'index-fund', 'investing'], duration: 75, teacherIndex: 4 },
  { title: 'Budgeting with the 50/30/20 Rule', description: 'The simplest budgeting method that actually works.', category: 'finance', tags: ['budget', 'personal-finance', 'saving'], duration: 45, teacherIndex: 4 },

  // Marketing (2 videos)
  { title: 'SEO in 60 Seconds', description: 'The 3 things that actually matter for SEO in 2026.', category: 'marketing', tags: ['seo', 'digital', 'traffic'], duration: 60, teacherIndex: 2 },
  { title: 'Social Media Strategy for Creators', description: 'How to grow from 0 to 10K followers with consistent content.', category: 'marketing', tags: ['social-media', 'growth', 'content'], duration: 90, teacherIndex: 2 },

  // Productivity (2 videos)
  { title: 'Pomodoro Technique Guide', description: '25 minutes of focus, 5 minutes of rest. A proven method.', category: 'productivity', tags: ['pomodoro', 'focus', 'time-management'], duration: 45, teacherIndex: 3 },
  { title: 'Second Brain with Notion', description: 'How to organize everything in Notion — tasks, notes, goals.', category: 'productivity', tags: ['notion', 'organization', 'tools'], duration: 90, teacherIndex: 3 },

  // Content Creator (2 videos)
  { title: 'Your First YouTube Video', description: 'Equipment, editing, thumbnails — everything you need to get started.', category: 'content-creator', tags: ['youtube', 'beginner', 'video'], duration: 120, teacherIndex: 2 },
  { title: 'Lighting on a Budget', description: '3 lighting setups under $50 that look professional.', category: 'content-creator', tags: ['lighting', 'budget', 'video'], duration: 60, teacherIndex: 3 },

  // Entrepreneurship (2 videos)
  { title: 'Side Hustle to Full-Time', description: 'How to transition from your 9-5 to your own business safely.', category: 'entrepreneurship', tags: ['side-hustle', 'transition', 'business'], duration: 90, teacherIndex: 2 },
  { title: 'Finding Product-Market Fit', description: 'The one metric that tells you if your product is ready to scale.', category: 'entrepreneurship', tags: ['pmf', 'startup', 'growth'], duration: 75, teacherIndex: 2 },
];

const sampleComments = [
  'This is super helpful, thank you! 🙏',
  'Can you make a part 2?',
  'Best explanation I have seen!',
  'I have been looking for this kind of content.',
  'Great video, very clear explanation!',
  'Mind blown! 🤯 Thanks for sharing.',
  'This saved me hours of research.',
  'Perfect for beginners like me.',
  'Would love to see more advanced topics!',
  'Just tried this and it works perfectly!',
  'Subscribed! Your content is amazing.',
  'Could you explain this in more detail?',
  'This is exactly what I needed today.',
  'Short and to the point — love it!',
  'How do I learn more about this topic?',
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skilltok');
    console.log('✅ Connected to MongoDB');

    // Seed categories
    await Category.deleteMany({});
    await Category.insertMany(categories);
    console.log(`✅ Seeded ${categories.length} categories`);

    // Seed demo teachers
    await User.deleteMany({ firebaseUid: { $regex: /^demo-/ } });
    const teachers = await User.insertMany(demoTeachers);
    console.log(`✅ Seeded ${teachers.length} demo teachers`);

    // Seed demo students
    const students = await User.insertMany(demoStudents);
    console.log(`✅ Seeded ${students.length} demo students`);

    const allUsers = [...teachers, ...students];

    // Seed demo videos (with varied sample video URLs)
    await Video.deleteMany({ teacherId: { $in: teachers.map((t) => t._id) } });
    const videoRecords = demoVideos.map((v, i) => ({
      title: v.title,
      description: v.description,
      category: v.category,
      tags: v.tags,
      duration: v.duration,
      teacherId: teachers[v.teacherIndex]._id,
      videoUrl: sampleVideoUrls[i % sampleVideoUrls.length],
      coverUrl: '',
      viewsCount: Math.floor(Math.random() * 10000) + 100,
      likesCount: Math.floor(Math.random() * 1000) + 10,
      commentsCount: 0,
      savesCount: Math.floor(Math.random() * 500) + 5,
      language: 'en',
    }));
    const videos = await Video.insertMany(videoRecords);
    console.log(`✅ Seeded ${videos.length} demo videos`);

    // Seed sample comments (distribute across videos)
    await Comment.deleteMany({ userId: { $in: allUsers.map((u) => u._id) } });
    const commentRecords = [];
    for (let i = 0; i < sampleComments.length; i++) {
      const video = videos[i % videos.length];
      const user = allUsers[i % allUsers.length];
      commentRecords.push({
        videoId: video._id,
        userId: user._id,
        text: sampleComments[i],
      });
    }
    const comments = await Comment.insertMany(commentRecords);
    console.log(`✅ Seeded ${comments.length} sample comments`);

    // Update comment counts on videos
    for (const video of videos) {
      const count = commentRecords.filter((c) => c.videoId.equals(video._id)).length;
      if (count > 0) {
        await Video.findByIdAndUpdate(video._id, { commentsCount: count });
      }
    }

    // Seed sample likes (each student likes random videos)
    await Like.deleteMany({ userId: { $in: students.map((s) => s._id) } });
    const likeRecords = [];
    for (const student of students) {
      // Each student likes 5-10 random videos
      const numLikes = 5 + Math.floor(Math.random() * 6);
      const shuffled = [...videos].sort(() => 0.5 - Math.random());
      for (let i = 0; i < Math.min(numLikes, shuffled.length); i++) {
        likeRecords.push({
          userId: student._id,
          videoId: shuffled[i]._id,
        });
      }
    }
    await Like.insertMany(likeRecords);
    console.log(`✅ Seeded ${likeRecords.length} sample likes`);

    // Update teacher video counts
    for (const teacher of teachers) {
      const videoCount = videos.filter((v) => v.teacherId.equals(teacher._id)).length;
      await User.findByIdAndUpdate(teacher._id, { videosCount: videoCount });
    }

    console.log('\n🎉 Seeding complete!');
    console.log(`   📁 ${categories.length} categories`);
    console.log(`   👩‍🏫 ${teachers.length} teachers`);
    console.log(`   👨‍🎓 ${students.length} students`);
    console.log(`   🎬 ${videos.length} videos`);
    console.log(`   💬 ${comments.length} comments`);
    console.log(`   ❤️  ${likeRecords.length} likes`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
