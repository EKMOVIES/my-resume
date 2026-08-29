/* =========================================================
   MY RESUME PORTFOLIO - Main Website JavaScript
   COMPLETE FILE WITH SKELETON SCREENS & ANALYTICS
========================================================= */

/* =========================================================
   MOBILE MENU
========================================================= */

const menuBtn = document.getElementById('menuBtn');
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        const nav = document.querySelector('.site-header nav');
        if (nav) nav.classList.toggle('active');
    });
}

const navLinks = document.querySelectorAll('.site-header nav a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        const nav = document.querySelector('.site-header nav');
        if (nav) nav.classList.remove('active');
    });
});

/* =========================================================
   CURRENT YEAR
========================================================= */

const yearElement = document.getElementById('year');
if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

/* =========================================================
   DARK MODE
========================================================= */

const darkToggle = document.getElementById('darkToggle');
const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (darkToggle) darkToggle.textContent = '☀️';
}

if (darkToggle) {
    darkToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            darkToggle.textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            darkToggle.textContent = '☀️';
        }
    });
}

/* =========================================================
   SKELETON SCREEN CONTROL
========================================================= */

function showSkeleton(containerId, type = 'card', count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const skeletonId = containerId + 'Skeleton';
    let skeletonEl = document.getElementById(skeletonId);
    
    if (!skeletonEl) {
        skeletonEl = document.createElement('div');
        skeletonEl.id = skeletonId;
        skeletonEl.style.display = 'block';
        container.prepend(skeletonEl);
    }
    
    if (window.SkeletonManager) {
        window.SkeletonManager.show(skeletonId, type, { count: count });
    } else {
        skeletonEl.style.display = 'block';
    }
}

function hideSkeleton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const skeletonId = containerId + 'Skeleton';
    const skeletonEl = document.getElementById(skeletonId);
    if (skeletonEl) {
        if (window.SkeletonManager) {
            window.SkeletonManager.hide(skeletonId);
        }
        skeletonEl.style.display = 'none';
    }
}

/* =========================================================
   PROFILE HELPERS
========================================================= */

function setText(id, value, fallback = '') {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = value || fallback;
}

function getInitials(name) {
    if (!name) return 'IH';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function setSocialLink(id, url) {
    const element = document.getElementById(id);
    if (!element) return;
    if (url) {
        element.href = url;
        element.target = '_blank';
        element.rel = 'noopener noreferrer';
        element.style.display = 'inline-block';
    } else {
        element.href = '#';
        element.style.display = 'none';
    }
}

function setResumeLink(id, url) {
    const element = document.getElementById(id);
    if (!element) return;
    if (url) {
        element.href = url;
        element.target = '_blank';
        element.rel = 'noopener noreferrer';
        element.style.display = 'inline-block';
    } else {
        element.href = '#';
        element.style.display = 'none';
    }
}

/* =========================================================
   LOAD PUBLIC PROFILE
========================================================= */

/* =========================================================
   LOAD PUBLIC PROFILE - COMPLETE VERSION
========================================================= */

async function loadProfile() {
    showSkeleton('heroContainer', 'hero', 1);
    showSkeleton('profileBioContainer', 'card', 1);
    
    try {
        const response = await fetch('/api/public-profile');
        const result = await response.json();

        if (!response.ok || !result.success || !result.data) {
            console.error('Could not load profile:', result);
            hideSkeleton('heroContainer');
            hideSkeleton('profileBioContainer');
            return;
        }

        const profile = result.data;

        // ============================================================
        // 1. BASIC PROFILE INFO
        // ============================================================
        
        setText('profileName', profile.name, 'Ishtiak Hossain');
        setText('footerName', profile.name, 'Ishtiak Hossain');
        setText('profileTitle', profile.title, 'Creative Developer');
        setText('profileBio', profile.bio, 'Building websites, designs and digital projects.');
        setText('profileLocation', profile.location, 'Location not available');

        // ============================================================
        // 2. HERO TITLE (ডায়নামিক)
        // ============================================================
        
        const heroTitle = document.getElementById('profileHeroTitle');
        if (heroTitle) {
            heroTitle.textContent = profile.title || 'Creative Developer';
        }

        // ============================================================
        // 3. HERO BIO (ডায়নামিক + Show More)
        // ============================================================
        
        const heroBioText = document.getElementById('profileHeroBioText');
        const heroBioToggle = document.getElementById('heroBioToggle');
        
        if (heroBioText) {
            const fullBio = profile.bio || 'Building websites, designs and digital projects.';
            heroBioText.textContent = fullBio;
            
            // বায়ো লম্বা হলে "Show More" বাটন দেখান
            if (fullBio.length > 100) {
                heroBioText.classList.add('bio-collapsed');
                if (heroBioToggle) {
                    heroBioToggle.style.display = 'inline-block';
                }
            } else {
                heroBioText.classList.remove('bio-collapsed');
                if (heroBioToggle) {
                    heroBioToggle.style.display = 'none';
                }
            }
        }
const aboutBio = document.getElementById('profileBio');
if (aboutBio) {
    // যদি about_bio থাকে তাহলে সেটা দেখান, নাহলে ডিফল্ট bio
    const detailedBio = profile.about_bio || profile.bio || 'Building websites, designs and digital projects.';
    aboutBio.textContent = detailedBio;
}
        // ============================================================
        // 4. PROFILE AVATAR (ইমেজ অথবা ইনিশিয়াল)
        // ============================================================
        
        const avatar = document.getElementById('profileAvatar');
        if (avatar) {
            if (profile.profile_image) {
                avatar.innerHTML = '';
                const image = document.createElement('img');
                image.src = profile.profile_image;
                image.alt = profile.name || 'Profile image';
                image.loading = 'lazy';
                avatar.appendChild(image);
            } else {
                avatar.textContent = getInitials(profile.name);
            }
        }

        // ============================================================
        // 5. CONTACT INFO (Email, Phone)
        // ============================================================
        
        const email = document.getElementById('profileEmail');
        if (email) {
            if (profile.email) {
                email.textContent = profile.email;
                email.href = `mailto:${profile.email}`;
            } else {
                email.textContent = 'Email not available';
                email.removeAttribute('href');
            }
        }

        const phone = document.getElementById('profilePhone');
        if (phone) {
            if (profile.phone) {
                phone.textContent = profile.phone;
                phone.href = `tel:${profile.phone}`;
            } else {
                phone.textContent = 'Phone not available';
                phone.removeAttribute('href');
            }
        }

        // ============================================================
        // 6. SOCIAL LINKS (Facebook, LinkedIn, GitHub)
        // ============================================================
        
        setSocialLink('facebookLink', profile.facebook_url);
        setSocialLink('linkedinLink', profile.linkedin_url);
        setSocialLink('githubLink', profile.github_url);

        // হিরোতে সোশ্যাল আইকন
        const heroFacebook = document.getElementById('heroFacebook');
        const heroLinkedin = document.getElementById('heroLinkedin');
        const heroGithub = document.getElementById('heroGithub');

        if (heroFacebook) {
            if (profile.facebook_url) {
                heroFacebook.href = profile.facebook_url;
                heroFacebook.style.display = 'inline-flex';
            } else {
                heroFacebook.style.display = 'none';
            }
        }

        if (heroLinkedin) {
            if (profile.linkedin_url) {
                heroLinkedin.href = profile.linkedin_url;
                heroLinkedin.style.display = 'inline-flex';
            } else {
                heroLinkedin.style.display = 'none';
            }
        }

        if (heroGithub) {
            if (profile.github_url) {
                heroGithub.href = profile.github_url;
                heroGithub.style.display = 'inline-flex';
            } else {
                heroGithub.style.display = 'none';
            }
        }

        
        // ============================================================
        // 7. RESUME LINK (Download CV)
        // ============================================================
        
        setResumeLink('resumeLink', profile.resume_url);
        setResumeLink('heroResumeLink', profile.resume_url);

        // ============================================================
        // 8. STATS (Projects, Clients, Experience) - ডায়নামিক
        // ============================================================
        
        const statProjects = document.getElementById('statProjects');
        const statClients = document.getElementById('statClients');
        const statExperience = document.getElementById('statExperience');

        // অ্যাডমিন প্যানেল থেকে সেট করা ভ্যালু ব্যবহার করুন
        if (statProjects) {
            const count = profile.stat_projects || 0;
            statProjects.textContent = count > 0 ? count + '+' : '0';
        }

        if (statClients) {
            const count = profile.stat_clients || 0;
            statClients.textContent = count > 0 ? count + '+' : '0';
        }

        if (statExperience) {
            const count = profile.stat_experience || 0;
            statExperience.textContent = count > 0 ? count + '+' : '0';
        }

        // ============================================================
        // 9. STATS - অটো ক্যালকুলেশন (ঐচ্ছিক)
        //    যদি অ্যাডমিন প্যানেলে ভ্যালু না দেন, তাহলে অটো ক্যালকুলেট
        // ============================================================
        
        // যদি stat_projects 0 হয়, তাহলে আসল প্রজেক্ট কাউন্ট দেখান
        if (statProjects && (profile.stat_projects === 0 || !profile.stat_projects)) {
            try {
                const projectResponse = await fetch('/api/projects');
                const projectResult = await projectResponse.json();
                if (projectResult.success && projectResult.data) {
                    const count = projectResult.data.length;
                    statProjects.textContent = count > 0 ? count + '+' : '0';
                }
            } catch (e) {
                console.warn('Could not auto-count projects:', e);
            }
        }

        // যদি stat_experience 0 হয়, তাহলে এক্সপেরিয়েন্স থেকে ইয়ার্স ক্যালকুলেট
        if (statExperience && (profile.stat_experience === 0 || !profile.stat_experience)) {
            try {
                const expResponse = await fetch('/api/experience');
                const expResult = await expResponse.json();
                if (expResult.success && expResult.data) {
                    let totalYears = 0;
                    expResult.data.forEach(exp => {
                        if (exp.start_date) {
                            const start = new Date(exp.start_date);
                            const end = exp.end_date ? new Date(exp.end_date) : new Date();
                            const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
                            totalYears += years;
                        }
                    });
                    const years = Math.floor(totalYears);
                    statExperience.textContent = years > 0 ? years + '+' : '0';
                }
            } catch (e) {
                console.warn('Could not auto-calculate experience:', e);
            }
        }

        console.log('✅ Profile loaded successfully.');
        
        // ============================================================
        // 10. HIDE SKELETONS
        // ============================================================
        
        hideSkeleton('heroContainer');
        hideSkeleton('profileBioContainer');

    } catch (error) {
        console.error('❌ Profile loading error:', error);
        hideSkeleton('heroContainer');
        hideSkeleton('profileBioContainer');
        
        // Error হলে ডিফল্ট দেখান
        document.getElementById('profileName').textContent = 'Ishtiak Hossain';
        document.getElementById('profileBio').textContent = 'Unable to load profile. Please try again.';
    }
}

let bioExpanded = false;

function toggleHeroBio() {
    const bio = document.getElementById('profileHeroBioText');
    const btn = document.getElementById('heroBioToggle');
    
    if (!bio || !btn) return;
    
    bioExpanded = !bioExpanded;
    
    if (bioExpanded) {
        bio.classList.remove('bio-collapsed');
        btn.textContent = 'Show Less';
    } else {
        bio.classList.add('bio-collapsed');
        btn.textContent = 'Show More';
    }
}

// প্রজেক্ট কাউন্ট
async function getProjectCount() {
    try {
        const response = await fetch('/api/projects');
        const result = await response.json();
        return result.data?.length || 0;
    } catch {
        return 0;
    }
}

// ক্লায়েন্ট কাউন্ট
async function getClientCount() {
    try {
        const response = await fetch('/api/admin/clients');
        const result = await response.json();
        return result.data?.length || 0;
    } catch {
        return 0;
    }
}

// এক্সপেরিয়েন্স ইয়ার্স
async function getExperienceYears() {
    try {
        const response = await fetch('/api/experience');
        const result = await response.json();
        const experiences = result.data || [];
        // মোট ইয়ার্স ক্যালকুলেট করুন
        let totalYears = 0;
        experiences.forEach(exp => {
            if (exp.start_date) {
                const start = new Date(exp.start_date);
                const end = exp.end_date ? new Date(exp.end_date) : new Date();
                const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
                totalYears += years;
            }
        });
        return Math.floor(totalYears);
    } catch {
        return 0;
    }
}
/* =========================================================
   LOAD EDUCATION - Updated with better design
========================================================= */

async function loadEducation() {
    showSkeleton('educationContainer', 'timeline', 2);
    
    try {
        const response = await fetch('/api/education');
        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error('Could not load education:', result);
            hideSkeleton('educationContainer');
            return;
        }

        const container = document.getElementById('educationContainer');
        if (!container) return;

        const data = result.data || [];

        if (data.length === 0) {
            container.innerHTML = `
                <div class="timeline-item education" style="text-align:center;padding:20px;color:var(--text-secondary);">
                    <p>No education added yet.</p>
                    <p style="font-size:13px;">Add from Admin Panel</p>
                </div>
            `;
            hideSkeleton('educationContainer');
            return;
        }

        const sortedData = [...data].sort((a, b) => (b.start_year || 0) - (a.start_year || 0));

        container.innerHTML = sortedData.map(item => `
            <div class="timeline-item education">
                <span class="timeline-date">
                    ${item.start_year || ''} ${item.end_year ? '- ' + item.end_year : ''}
                    ${!item.end_year ? '<span class="timeline-badge">Ongoing</span>' : ''}
                </span>
                <div class="timeline-institution">${item.institution || 'Institution'}</div>
                <div class="timeline-degree">${item.degree || 'Degree'}</div>
                ${item.description ? `<div class="timeline-description">${item.description}</div>` : ''}
            </div>
        `).join('');

        hideSkeleton('educationContainer');
        console.log('✅ Education loaded successfully.');
    } catch (error) {
        console.error('❌ Education loading error:', error);
        hideSkeleton('educationContainer');
    }
}

/* =========================================================
   LOAD EXPERIENCE - Updated with better design
========================================================= */

async function loadExperience() {
    showSkeleton('experienceContainer', 'timeline', 2);
    
    try {
        const response = await fetch('/api/experience');
        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error('Could not load experience:', result);
            hideSkeleton('experienceContainer');
            return;
        }

        const container = document.getElementById('experienceContainer');
        if (!container) return;

        const data = result.data || [];

        if (data.length === 0) {
            container.innerHTML = `
                <div class="timeline-item experience" style="text-align:center;padding:20px;color:var(--text-secondary);">
                    <p>No experience added yet.</p>
                    <p style="font-size:13px;">Add from Admin Panel</p>
                </div>
            `;
            hideSkeleton('experienceContainer');
            return;
        }

        const sortedData = [...data].sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date) : new Date(0);
            const dateB = b.start_date ? new Date(b.start_date) : new Date(0);
            return dateB - dateA;
        });

        container.innerHTML = sortedData.map(item => `
            <div class="timeline-item experience">
                <span class="timeline-date">
                    ${item.start_date ? new Date(item.start_date).getFullYear() : ''} 
                    ${item.end_date ? '- ' + new Date(item.end_date).getFullYear() : ''}
                    ${!item.end_date ? '<span class="timeline-badge">Ongoing</span>' : ''}
                </span>
                <div class="timeline-institution">${item.company || 'Company'}</div>
                <div class="timeline-degree">${item.job_title || 'Position'}</div>
                ${item.description ? `<div class="timeline-description">${item.description}</div>` : ''}
            </div>
        `).join('');

        hideSkeleton('experienceContainer');
        console.log('✅ Experience loaded successfully.');
    } catch (error) {
        console.error('❌ Experience loading error:', error);
        hideSkeleton('experienceContainer');
    }
}

/* =========================================================
   LOAD SKILLS
========================================================= */

/* =========================================================
   LOAD SKILLS - REDESIGNED
========================================================= */

async function loadSkills() {
    showSkeleton('skillsContainer', 'skill', 3);
    
    try {
        const response = await fetch('/api/skills');
        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error('Could not load skills:', result);
            hideSkeleton('skillsContainer');
            return;
        }

        const container = document.getElementById('skillsContainer');
        if (!container) return;

        const data = result.data || [];

        if (data.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:60px 20px;color:#6b7280;grid-column:1/-1;">
                    <p style="font-size:48px;margin-bottom:10px;">🎯</p>
                    <p style="font-size:18px;font-weight:600;">Skills coming soon</p>
                    <p style="font-size:14px;margin-top:5px;">I'm constantly learning and growing!</p>
                </div>
            `;
            hideSkeleton('skillsContainer');
            return;
        }

        // Group skills by category
        const grouped = data.reduce((acc, skill) => {
            const category = skill.category || 'Other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(skill);
            return acc;
        }, {});

        // Sort categories
        const sortedCategories = Object.keys(grouped).sort();

        // Category Icons Mapping
        const categoryIcons = {
            'Web Development': '🌐',
            'Frontend': '🎨',
            'Backend': '⚙️',
            'Database': '🗄️',
            'Design': '🖌️',
            'Cloud': '☁️',
            'DevOps': '🚀',
            'Mobile': '📱',
            'Programming': '💻',
            'Other': '📌'
        };

        container.innerHTML = sortedCategories.map((category, catIndex) => {
            const skills = grouped[category];
            const icon = categoryIcons[category] || '📌';
            
            return `
                <div class="skill-category" data-aos="fade-up" data-aos-delay="${catIndex * 100 + 100}">
                    <div class="category-header">
                        <div class="category-icon">${icon}</div>
                        <h3 class="category-name">${category}</h3>
                        <span class="category-count">${skills.length}</span>
                    </div>
                    <div class="skill-items">
                        ${skills.map(skill => `
                            <div class="skill-item" data-level="${skill.level || 0}">
                                <div class="skill-info">
                                    <span class="skill-name">${skill.name}</span>
                                    <span class="skill-percentage">${skill.level || 0}%</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${skill.level || 0}%;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        hideSkeleton('skillsContainer');
        console.log('✅ Skills loaded successfully.');

        // ✅ Animate progress bars on scroll
        animateSkillBars();

    } catch (error) {
        console.error('❌ Skills loading error:', error);
        hideSkeleton('skillsContainer');
    }
}

// ============================================================
// 📊 ANIMATE SKILL BARS ON SCROLL
// ============================================================

function animateSkillBars() {
    const skillItems = document.querySelectorAll('.skill-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const item = entry.target;
                const level = item.dataset.level || 0;
                const fill = item.querySelector('.progress-fill');
                
                if (fill) {
                    // Reset and animate
                    fill.style.width = '0%';
                    setTimeout(() => {
                        fill.style.width = level + '%';
                    }, 200);
                }
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
    });

    skillItems.forEach(item => observer.observe(item));
}


/* =========================================================
   LOAD SERVICES
========================================================= */

async function loadServices() {
    showSkeleton('servicesContainer', 'card', 3);
    
    try {
        const response = await fetch('/api/services');
        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error('Could not load services:', result);
            hideSkeleton('servicesContainer');
            return;
        }

        const container = document.getElementById('servicesContainer');
        if (!container) return;

        const data = result.data || [];

        if (data.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <h3>Web Development</h3>
                    <p>Professional website development services.</p>
                </div>
                <div class="card">
                    <h3>Graphic Design</h3>
                    <p>Creative design solutions for your brand.</p>
                </div>
                <div class="card">
                    <h3>Digital Solutions</h3>
                    <p>Custom digital solutions for your business.</p>
                </div>
            `;
            hideSkeleton('servicesContainer');
            return;
        }

        container.innerHTML = data.map(item => `
            <div class="card">
                ${item.icon ? `<div style="font-size:32px;margin-bottom:10px;">${item.icon}</div>` : ''}
                <h3>${item.title}</h3>
                <p>${item.description}</p>
            </div>
        `).join('');

        hideSkeleton('servicesContainer');
        console.log('✅ Services loaded successfully.');
    } catch (error) {
        console.error('❌ Services loading error:', error);
        hideSkeleton('servicesContainer');
    }
}

/* =========================================================
   LOAD PROJECTS
========================================================= */

/* =========================================================
   LOAD PROJECTS - Updated with New Design
========================================================= */

// ============================================================
// ✅ PROJECTS WITH FILTER
// ============================================================

let currentCategory = 'all';

// Load projects with filter
async function loadProjects(category = 'all') {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="loading">⏳ Loading projects...</div>';

    try {
        const url = category && category !== 'all' 
            ? `/api/projects?category=${category}` 
            : '/api/projects';

        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) throw new Error(result.message);

        const projects = result.data || [];
        renderProjects(projects);

    } catch (error) {
        grid.innerHTML = `
            <div style="text-align:center;padding:40px;color:#dc2626;">
                ❌ Error loading projects: ${error.message}
            </div>
        `;
    }
}

// Render projects
function renderProjects(projects) {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;

    if (projects.length === 0) {
        grid.innerHTML = `
            <div style="text-align:center;padding:60px 20px;color:#6b7280;grid-column:1/-1;">
                <p style="font-size:24px;margin-bottom:10px;">📂</p>
                <p style="font-size:18px;font-weight:600;">No projects found</p>
                <p style="font-size:14px;margin-top:5px;">Try selecting a different category</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = projects.map((project, index) => {
        const categoryColors = {
            'website': 'website',
            'logo': 'logo',
            'poster': 'poster',
            'app': 'app',
            'graphics': 'graphics',
            'branding': 'branding'
        };
        const categoryClass = categoryColors[project.category] || 'website';

        return `
            <div class="project-card" style="animation-delay: ${index * 0.1}s">
                ${project.image_url ? `
                    <img src="${project.image_url}" alt="${project.title}" 
                         style="width:100%;height:200px;object-fit:cover;"
                         onerror="this.style.display='none'">
                ` : `
                    <div style="width:100%;height:200px;background:linear-gradient(135deg,#005f5f,#0a7a7a);display:flex;align-items:center;justify-content:center;font-size:48px;color:white;">
                        🚀
                    </div>
                `}
                <div style="padding:20px;">
                    <span class="category-badge ${categoryClass}">${project.category || 'Website'}</span>
                    <h3 style="margin:10px 0 5px;font-size:20px;">${project.title}</h3>
                    <p style="color:#6b7280;font-size:14px;line-height:1.6;">${project.description || ''}</p>
                    ${project.technologies ? `
                        <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px;">
                            ${project.technologies.split(',').map(tech => `
                                <span style="background:#f3f4f6;padding:2px 12px;border-radius:12px;font-size:11px;color:#4b5563;">${tech.trim()}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                    <div style="margin-top:15px;display:flex;gap:10px;flex-wrap:wrap;">
                        ${project.live_url ? `<a href="${project.live_url}" target="_blank" style="background:#005f5f;color:white;padding:8px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">🔗 Live Demo</a>` : ''}
                        ${project.github_url ? `<a href="${project.github_url}" target="_blank" style="background:#1f2937;color:white;padding:8px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">💻 GitHub</a>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ✅ Filter Button Event Listeners
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove active class from all buttons
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Get category and load projects
        const category = this.dataset.category;
        currentCategory = category;
        loadProjects(category);
    });
});

/* =========================================================
   PROJECT SHARE FUNCTION
========================================================= */

window.shareProject = function(platform, title, url) {
    const text = `Check out my project: ${title}`;
    let shareUrl = '';

    switch(platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
            break;
        case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' - ' + url)}`;
            break;
        default:
            return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
};

/* =========================================================
   LOAD TESTIMONIALS
========================================================= */

async function loadTestimonials() {
    showSkeleton('testimonialsContainer', 'testimonial', 3);
    
    try {
        const response = await fetch('/api/testimonials');
        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error('Could not load testimonials:', result);
            hideSkeleton('testimonialsContainer');
            return;
        }

        const container = document.getElementById('testimonialsContainer');
        if (!container) return;

        const data = result.data || [];

        if (data.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px;color:var(--text-secondary);grid-column:1/-1;">
                    <p style="font-size:18px;">No testimonials yet.</p>
                    <p>Check back soon!</p>
                </div>
            `;
            hideSkeleton('testimonialsContainer');
            return;
        }

        function renderStars(rating) {
            return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
        }

        container.innerHTML = data.map(item => `
            <div class="card" style="display:flex;flex-direction:column;">
                <div style="display:flex;align-items:center;gap:15px;margin-bottom:15px;">
                    ${item.avatar_url ? `<img src="${item.avatar_url}" alt="${item.name}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;">` : 
                    `<div style="width:60px;height:60px;border-radius:50%;background:#005f5f;color:white;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;">${item.name.charAt(0)}</div>`}
                    <div>
                        <h3 style="margin:0;">${item.name}</h3>
                        <p style="margin:0;color:var(--text-secondary);font-size:14px;">${item.position || ''} ${item.company ? 'at ' + item.company : ''}</p>
                    </div>
                </div>
                <div style="color:#f59e0b;margin-bottom:10px;">${renderStars(item.rating)}</div>
                <p style="font-style:italic;line-height:1.6;flex:1;">"${item.message}"</p>
            </div>
        `).join('');

        hideSkeleton('testimonialsContainer');
        console.log('✅ Testimonials loaded successfully.');
    } catch (error) {
        console.error('❌ Testimonials loading error:', error);
        hideSkeleton('testimonialsContainer');
    }
}

/* =========================================================
   LOAD BLOG POSTS
========================================================= */

async function loadBlogPosts() {
    showSkeleton('blogContainer', 'blog', 3);
    
    try {
        const response = await fetch('/api/blog');
        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error('Could not load blog posts:', result);
            hideSkeleton('blogContainer');
            return;
        }

        const container = document.getElementById('blogContainer');
        if (!container) return;

        const data = result.data || [];

        if (data.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px;color:var(--text-secondary);grid-column:1/-1;">
                    <p style="font-size:18px;">📝 No blog posts yet.</p>
                    <p>Check back soon for new articles!</p>
                </div>
            `;
            hideSkeleton('blogContainer');
            return;
        }

        const latestPosts = data.slice(0, 6);

        container.innerHTML = latestPosts.map(post => `
            <div class="card" style="display:flex;flex-direction:column;">
                ${post.cover_image ? `<img src="${post.cover_image}" alt="${post.title}" style="width:100%;height:200px;object-fit:cover;border-radius:8px;margin-bottom:15px;">` : ''}
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                    ${post.category ? `<span style="background:#005f5f;color:white;padding:2px 10px;border-radius:12px;font-size:12px;">${post.category}</span>` : ''}
                    ${post.tags && post.tags.length ? post.tags.slice(0,3).map(tag => `<span style="background:#e5e7eb;padding:2px 10px;border-radius:12px;font-size:12px;">${tag}</span>`).join('') : ''}
                </div>
                <h3 style="margin-bottom:8px;">${post.title}</h3>
                <p style="color:var(--text-secondary);flex:1;">${post.excerpt || post.content.substring(0, 120) + '...'}</p>
                <div style="margin-top:15px;display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:13px;color:#6b7280;">📅 ${new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                    <a href="/blog/${post.slug}" style="color:#005f5f;text-decoration:none;font-weight:600;" class="blog-link">Read More →</a>
                </div>
            </div>
        `).join('');

        hideSkeleton('blogContainer');
        console.log('✅ Blog posts loaded successfully.');
    } catch (error) {
        console.error('❌ Blog posts loading error:', error);
        hideSkeleton('blogContainer');
    }
}

/* =========================================================
   FILE MANAGER - MAIN PAGE
========================================================= */

const FILE_PASSWORD = 'admin123';

window.verifyFilePassword = function() {
    const input = document.getElementById('filePasswordInput');
    const error = document.getElementById('filePasswordError');
    const container = document.getElementById('mainFilesContainer');
    
    if (!input || !container) {
        console.warn('File manager elements not found');
        return;
    }
    
    const password = input.value.trim();
    
    if (password === FILE_PASSWORD) {
        if (error) error.style.display = 'none';
        const section = document.getElementById('filePasswordSection');
        if (section) section.style.display = 'none';
        loadMainPageFiles();
    } else {
        if (error) error.style.display = 'block';
        input.value = '';
        input.focus();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('filePasswordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (typeof window.verifyFilePassword === 'function') {
                    window.verifyFilePassword();
                }
            }
        });
    }
});

async function loadMainPageFiles() {
    const container = document.getElementById('mainFilesContainer');
    if (!container) return;

    try {
        container.innerHTML = '<div style="text-align:center;padding:20px;grid-column:1/-1;color:var(--text-secondary);">⏳ Loading files...</div>';

        const response = await fetch('/api/public/files');

        if (!response.ok) {
            throw new Error('Failed to load files');
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Could not load files.');
        }

        const data = result.data || [];

        if (data.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px;color:var(--text-secondary);grid-column:1/-1;">
                    <p style="font-size:48px;margin-bottom:10px;">📁</p>
                    <p style="font-size:18px;">No files available</p>
                </div>
            `;
            return;
        }

        const grouped = data.reduce((acc, file) => {
            const category = file.category || 'Uncategorized';
            if (!acc[category]) acc[category] = [];
            acc[category].push(file);
            return acc;
        }, {});

        const sortedCategories = Object.keys(grouped).sort();

        container.innerHTML = sortedCategories.map(category => `
            <div style="grid-column:1/-1;margin-top:${category === sortedCategories[0] ? '0' : '20px'};">
                <h3 style="color:var(--text-primary);margin-bottom:15px;border-bottom:2px solid #005f5f;padding-bottom:8px;">📂 ${category}</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:15px;">
                    ${grouped[category].map(file => {
                        const isPDF = file.file_url && file.file_url.toLowerCase().includes('.pdf');
                        const isImage = file.file_url && file.file_url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i);
                        
                        return `
                            <div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:10px;padding:15px;text-align:center;transition:all 0.3s;">
                                <div style="font-size:40px;margin-bottom:8px;">${getFileIconMain(file.file_type, file.file_url)}</div>
                                <div style="font-size:13px;font-weight:600;margin-bottom:5px;word-break:break-all;">${file.file_name}</div>
                                <div style="font-size:11px;color:var(--text-secondary);margin-bottom:10px;">${formatFileSizeMain(file.file_size || 0)}</div>
                                <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
                                    ${isImage ? `<a href="${file.file_url}" target="_blank" style="background:#005f5f;color:white;padding:4px 12px;border-radius:5px;text-decoration:none;font-size:12px;">👁️ View</a>` : ''}
                                    ${isPDF ? `<a href="${file.file_url}" target="_blank" style="background:#005f5f;color:white;padding:4px 12px;border-radius:5px;text-decoration:none;font-size:12px;">📄 PDF</a>` : ''}
                                    ${!isImage && !isPDF ? `<a href="${file.file_url}" target="_blank" style="background:#005f5f;color:white;padding:4px 12px;border-radius:5px;text-decoration:none;font-size:12px;">👁️ View</a>` : ''}
                                    <a href="${file.file_url}" download="${file.file_name}" style="background:#16a34a;color:white;padding:4px 12px;border-radius:5px;text-decoration:none;font-size:12px;" class="file-download-link">⬇️</a>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Load files error:', error);
        container.innerHTML = `
            <div style="text-align:center;padding:40px;color:#dc2626;grid-column:1/-1;">
                <p>❌ Error loading files: ${error.message}</p>
                <button onclick="window.verifyFilePassword()" style="margin-top:10px;background:#005f5f;color:white;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;">🔄 Retry</button>
            </div>
        `;
    }
}

function getFileIconMain(fileType, fileUrl) {
    if (!fileUrl) return '📄';
    const url = fileUrl.toLowerCase();
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/)) return '🖼️';
    if (url.match(/\.(pdf)$/)) return '📕';
    if (url.match(/\.(doc|docx)$/)) return '📘';
    if (url.match(/\.(xls|xlsx)$/)) return '📊';
    if (url.match(/\.(ppt|pptx)$/)) return '📙';
    if (url.match(/\.(zip|rar|7z)$/)) return '📦';
    if (url.match(/\.(mp4|avi|mov|wmv|flv|mkv)$/)) return '🎬';
    if (url.match(/\.(mp3|wav|wma|aac)$/)) return '🎵';
    if (url.match(/\.(txt|log)$/)) return '📝';
    if (url.match(/\.(json|xml|yaml|yml)$/)) return '⚙️';
    if (url.match(/\.(js|ts|jsx|tsx|html|css|scss|php|py|java|cpp|c|go|rb|swift)$/)) return '💻';
    return '📄';
}

function formatFileSizeMain(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/* =========================================================
   CONTACT FORM
========================================================= */

const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const subject = document.getElementById('contactSubject').value.trim();
        const message = document.getElementById('contactMessage').value.trim();
        const status = document.getElementById('contactMessageStatus');

        if (!name || !email || !message) {
            status.style.display = 'block';
            status.style.background = '#fdecec';
            status.style.color = '#b42318';
            status.textContent = '⚠️ Please fill in all required fields.';
            return;
        }

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, subject, message })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Could not send message.');
            }

            trackContactSubmission();

            status.style.display = 'block';
            status.style.background = '#e7f7ef';
            status.style.color = '#147a43';
            status.textContent = '✅ Message sent successfully! I\'ll get back to you soon.';
            contactForm.reset();

            setTimeout(() => {
                status.style.display = 'none';
            }, 5000);

        } catch (error) {
            status.style.display = 'block';
            status.style.background = '#fdecec';
            status.style.color = '#b42318';
            status.textContent = '❌ ' + error.message;
        }
    });
}

/* =========================================================
   FLOATING SHARE BUTTON
========================================================= */

function toggleFloatShare() {
    const buttons = document.getElementById('floatShareButtons');
    const toggle = document.getElementById('shareToggle');

    if (buttons && toggle) {
        buttons.classList.toggle('show');
        toggle.classList.toggle('active');

        if (toggle.classList.contains('active')) {
            toggle.textContent = '✕';
        } else {
            toggle.textContent = '📤';
        }
    }
}

function shareCurrentPage(platform) {
    const url = window.location.href;
    const title = document.title || 'My Portfolio';
    let shareUrl = '';

    switch(platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
            break;
        case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' - ' + url)}`;
            break;
        default:
            return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
}

function copyCurrentPageLink() {
    const url = window.location.href;
    const btn = document.querySelector('.float-share .copy');

    if (!btn) return;

    navigator.clipboard.writeText(url).then(() => {
        const original = btn.textContent;
        btn.textContent = '✅';
        btn.style.background = '#16a34a';
        setTimeout(() => {
            btn.textContent = original;
            btn.style.background = '#6b7280';
        }, 2000);
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        const original = btn.textContent;
        btn.textContent = '✅';
        btn.style.background = '#16a34a';
        setTimeout(() => {
            btn.textContent = original;
            btn.style.background = '#6b7280';
        }, 2000);
    });
}

document.addEventListener('click', function(e) {
    const floatShare = document.getElementById('floatShare');
    if (floatShare && !floatShare.contains(e.target)) {
        const buttons = document.getElementById('floatShareButtons');
        const toggle = document.getElementById('shareToggle');
        if (buttons && buttons.classList.contains('show')) {
            buttons.classList.remove('show');
            if (toggle) {
                toggle.classList.remove('active');
                toggle.textContent = '📤';
            }
        }
    }
});

/* =========================================================
   ⭐ ANALYTICS TRACKING
========================================================= */

function trackPageView() {
    try {
        const page = window.location.pathname;
        const referrer = document.referrer || 'Direct';
        const user_agent = navigator.userAgent;

        fetch('/api/analytics/pageview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page, referrer, user_agent })
        }).catch(() => {});
    } catch (e) {}
}

function trackResumeDownload() {
    try {
        fetch('/api/analytics/resume-download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).catch(() => {});
    } catch (e) {}
}

function trackProjectClick(projectTitle, linkType = 'click') {
    try {
        fetch('/api/analytics/project-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                project_title: projectTitle, 
                link_type: linkType 
            })
        }).catch(() => {});
    } catch (e) {}
}

function trackBlogView(postTitle) {
    try {
        fetch('/api/analytics/blog-view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post_title: postTitle })
        }).catch(() => {});
    } catch (e) {}
}

function trackContactSubmission() {
    try {
        fetch('/api/analytics/contact-submission', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).catch(() => {});
    } catch (e) {}
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(trackPageView, 500);
        console.log('✅ Analytics: Page view tracked');
    });
}

document.addEventListener('click', (e) => {
    const resumeLink = e.target.closest('#resumeLink, #heroResumeLink');
    if (resumeLink) {
        setTimeout(() => {
            trackResumeDownload();
            console.log('✅ Analytics: Resume download tracked');
        }, 100);
    }

    const projectCard = e.target.closest('.project');
    if (projectCard) {
        const title = projectCard.querySelector('h3')?.textContent || 'Unknown';
        const linkType = e.target.tagName === 'A' ? 'link_click' : 'click';
        setTimeout(() => {
            trackProjectClick(title, linkType);
            console.log('✅ Analytics: Project click tracked:', title);
        }, 100);
    }

    const blogLink = e.target.closest('.blog-link');
    if (blogLink) {
        const postTitle = blogLink.closest('.card')?.querySelector('h3')?.textContent || 'Unknown';
        setTimeout(() => {
            trackBlogView(postTitle);
            console.log('✅ Analytics: Blog view tracked:', postTitle);
        }, 100);
    }
});

/* =========================================================
   🔥 DISCIPLINE TRACKER - Public Stats
========================================================= */

async function loadDisciplinePublic() {
    try {
        const response = await fetch('/api/discipline/public-stats');
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.message);
        
        const stats = result.stats || {};
        
        const daysEl = document.getElementById('disciplineDays');
        const streakEl = document.getElementById('disciplineStreak');
        const walkEl = document.getElementById('disciplineWalk');
        const gymEl = document.getElementById('disciplineGym');
        
        if (daysEl) daysEl.textContent = stats.total_days || 0;
        if (streakEl) streakEl.textContent = stats.current_streak || 0;
        if (walkEl) walkEl.textContent = stats.total_walk || 0;
        if (gymEl) gymEl.textContent = stats.total_gym || 0;
        
    } catch (error) {
        console.error('Discipline stats error:', error);
    }
}

/* =========================================================
   SERVICES SALE - Load from API
========================================================= */

async function loadServicesSale() {
    try {
        console.log('📡 Loading services from API...');
        const response = await fetch('/api/services-sale');
        console.log('📡 API Response Status:', response.status);
        
        const result = await response.json();
        console.log('📦 Services Data:', result);

        if (!response.ok || !result.success) {
            console.error('Could not load services:', result);
            return;
        }

        const container = document.getElementById('servicesSaleContainer');
        if (!container) return;

        const data = result.data || [];
        console.log('📊 Total services found:', data.length);

        if (data.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px;color:var(--text-secondary);grid-column:1/-1;">
                    <p style="font-size:18px;">No services available yet.</p>
                    <p>Check back soon!</p>
                </div>
            `;
            return;
        }

        container.className = 'services-sale-grid';
        container.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:25px;';

        container.innerHTML = data.map(item => {
            // ✅ Debug: Log each service
            console.log('🔍 Rendering service:', item.name, 'Slug:', item.slug);
            
            return `
                <div class="service-card" style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:14px;overflow:hidden;transition:all 0.3s;">
                    <div style="position:relative;overflow:hidden;height:200px;">
                        <img src="${item.image_url || 'https://via.placeholder.com/400x200'}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s;" onerror="this.style.display='none'">
                        ${item.sale_price ? `<span style="position:absolute;top:10px;right:10px;background:#ef4444;color:white;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;">SALE!</span>` : ''}
                    </div>
                    <div style="padding:20px;">
                        <h3 style="font-size:18px;margin-bottom:5px;">${item.name}</h3>
                        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:10px;">${item.category || 'Service'}</p>
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                            <span style="font-size:22px;font-weight:800;color:#005f5f;">$${item.price}</span>
                            ${item.sale_price ? `<span style="font-size:14px;color:#ef4444;text-decoration:line-through;">$${item.sale_price}</span>` : ''}
                        </div>
                        <p style="font-size:14px;color:var(--text-secondary);margin-bottom:15px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${item.description}</p>
                        <a href="/service/${item.slug}" class="btn primary" style="width:100%;text-align:center;padding:10px;display:block;">View Details</a>
                    </div>
                </div>
            `;
        }).join('');

        console.log('✅ Services loaded successfully.');
    } catch (error) {
        console.error('❌ Services loading error:', error);
    }
}

/* =========================================================
   CHAT BOX FUNCTIONS
========================================================= */

/* =========================================================
   💬 CHAT SYSTEM - COMPLETE FUNCTIONS
========================================================= */

let chatOpen = false;
let chatSessionId = localStorage.getItem('chatSessionId') || null;
let chatGuestName = localStorage.getItem('chatGuestName') || null;
let chatGuestEmail = localStorage.getItem('chatGuestEmail') || null;

// ✅ Generate Session ID
function generateSessionId() {
    return 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
}

// ✅ Toggle Chat Box
function toggleChatBox() {
    if (chatOpen) {
        closeChatBox();
    } else {
        openChatBox();
    }
}

// ✅ Open Chat Box
function openChatBox() {
    const chatBox = document.getElementById('chatBox');
    const chatToggle = document.getElementById('chatToggle');
    
    if (!chatBox) return;
    
    chatBox.style.display = 'block';
    if (chatToggle) chatToggle.style.display = 'none';
    chatOpen = true;
    
    // Create session if not exists
    if (!chatSessionId) {
        chatSessionId = generateSessionId();
        localStorage.setItem('chatSessionId', chatSessionId);
    }
    
    // Ask for guest info (once)
    if (!chatGuestName) {
        chatGuestName = prompt('Please enter your name:', 'Guest') || 'Guest';
        chatGuestEmail = prompt('Please enter your email (optional):', '') || '';
        localStorage.setItem('chatGuestName', chatGuestName);
        localStorage.setItem('chatGuestEmail', chatGuestEmail);
    }
    
    loadChatMessages();
    
    if (window.chatInterval) clearInterval(window.chatInterval);
    window.chatInterval = setInterval(loadChatMessages, 5000);
}

// ✅ Close Chat Box
function closeChatBox() {
    const chatBox = document.getElementById('chatBox');
    const chatToggle = document.getElementById('chatToggle');
    
    if (chatBox) chatBox.style.display = 'none';
    if (chatToggle) chatToggle.style.display = 'block';
    chatOpen = false;
    
    if (window.chatInterval) {
        clearInterval(window.chatInterval);
        window.chatInterval = null;
    }
}

// ✅ Load Chat Messages
async function loadChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    try {
        const sessionId = localStorage.getItem('chatSessionId') || '';
        const response = await fetch(`/api/chat/messages?session=${sessionId}`);
        const result = await response.json();

        if (!response.ok) throw new Error('Could not load messages');

        const messages = result.data || [];

        if (messages.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;color:var(--text-secondary);padding:20px;font-size:14px;">
                    👋 Welcome! Ask me anything.
                </div>
            `;
            return;
        }

        container.innerHTML = messages.map(msg => {
            const isAdmin = msg.is_admin === true;
            const senderName = isAdmin ? '👤 Admin' : (msg.sender_name || 'Guest');
            const bgColor = isAdmin ? '#e5f0ff' : '#f3f4f6';
            const borderColor = isAdmin ? '#005f5f' : '#7c3aed';
            const align = isAdmin ? 'flex-start' : 'flex-end';
            const nameColor = isAdmin ? '#005f5f' : '#7c3aed';

            return `
                <div style="margin-bottom:12px;display:flex;flex-direction:column;align-items:${align};">
                    <div style="max-width:85%;padding:12px 16px;background:${bgColor};border-radius:12px;border-left:3px solid ${borderColor};word-wrap:break-word;">
                        <div style="font-size:12px;font-weight:600;color:${nameColor};margin-bottom:4px;">
                            ${senderName}
                            ${isAdmin ? '🟢' : ''}
                        </div>
                        <div style="font-size:14px;line-height:1.6;">${msg.message}</div>
                        <div style="font-size:10px;color:#6b7280;margin-top:4px;">
                            ${new Date(msg.created_at).toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.scrollTop = container.scrollHeight;

    } catch (error) {
        console.error('Load chat error:', error);
    }
}

// ✅ Send Chat Message
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const message = input.value.trim();

    if (!message) {
        alert('Please type a message');
        return;
    }

    const name = localStorage.getItem('chatGuestName') || 'Guest';
    const email = localStorage.getItem('chatGuestEmail') || '';
    const sessionId = localStorage.getItem('chatSessionId') || generateSessionId();

    try {
        const response = await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sender_name: name, 
                sender_email: email, 
                message: message,
                session_id: sessionId
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not send message');
        }

        input.value = '';
        loadChatMessages();

    } catch (error) {
        console.error('Chat send error:', error);
        alert('❌ ' + error.message);
    }
}

// ✅ Enter key support for chat
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('chatInput');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
});

console.log('✅ Chat system loaded');


// Auto-refresh chat every 10 seconds
setInterval(() => {
    if (chatOpen) loadChatMessages();
}, 10000);


// ============================================================
// ✅ PROJECTS WITH SEARCH & FILTER - FRONTEND
// ============================================================

let allProjectsData = [];
let currentCategoryFrontend = 'all';

// Load projects
async function loadProjectsFrontend(category = 'all') {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="loading" style="text-align:center;padding:40px;color:#6b7280;">⏳ Loading projects...</div>';

    try {
        const url = category && category !== 'all' 
            ? `/api/projects?category=${category}` 
            : '/api/projects';

        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) throw new Error(result.message);

        allProjectsData = result.data || [];
        renderProjectsFrontend(allProjectsData);
        updateProjectCountFrontend(allProjectsData.length);

    } catch (error) {
        grid.innerHTML = `
            <div style="text-align:center;padding:40px;color:#dc2626;">
                ❌ Error loading projects: ${error.message}
                <br><br>
                <button onclick="loadProjectsFrontend('${category}')" style="padding:10px 25px;background:#005f5f;color:white;border:none;border-radius:8px;cursor:pointer;">
                    Retry
                </button>
            </div>
        `;
    }
}

// Render projects
function renderProjectsFrontend(projects) {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;

    if (projects.length === 0) {
        grid.innerHTML = `
            <div style="text-align:center;padding:60px 20px;color:#6b7280;grid-column:1/-1;">
                <p style="font-size:48px;margin-bottom:10px;">🔍</p>
                <p style="font-size:18px;font-weight:600;">No projects found</p>
                <p style="font-size:14px;margin-top:5px;">Try adjusting your search or filter</p>
            </div>
        `;
        return;
    }

    const searchTerm = document.getElementById('projectSearchInput')?.value?.trim() || '';

    grid.innerHTML = projects.map((project, index) => {
        const categoryColors = {
            'website': 'website',
            'logo': 'logo',
            'poster': 'poster',
            'app': 'app',
            'graphics': 'graphics',
            'branding': 'branding'
        };
        const categoryClass = categoryColors[project.category] || 'website';

        // Highlight search term
        const highlightedTitle = highlightTextFrontend(project.title, searchTerm);
        const highlightedDesc = highlightTextFrontend(project.description, searchTerm);
        const highlightedTech = highlightTextFrontend(project.technologies, searchTerm);

        return `
            <div class="project-card" style="animation-delay: ${index * 0.08}s">
                ${project.image_url ? `
                    <img src="${project.image_url}" alt="${project.title}" 
                         style="width:100%;height:200px;object-fit:cover;"
                         onerror="this.style.display='none'">
                ` : `
                    <div style="width:100%;height:200px;background:linear-gradient(135deg,#005f5f,#0a7a7a);display:flex;align-items:center;justify-content:center;font-size:48px;color:white;">
                        🚀
                    </div>
                `}
                <div style="padding:20px;">
                    <span class="category-badge ${categoryClass}">${project.category || 'Website'}</span>
                    <h3 style="margin:10px 0 5px;font-size:20px;">${highlightedTitle}</h3>
                    <p style="color:#6b7280;font-size:14px;line-height:1.6;">${highlightedDesc || ''}</p>
                    ${project.technologies ? `
                        <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px;">
                            ${project.technologies.split(',').map(tech => `
                                <span style="background:#f3f4f6;padding:2px 12px;border-radius:12px;font-size:11px;color:#4b5563;">${highlightTechFrontend(tech.trim(), searchTerm)}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                    <div style="margin-top:15px;display:flex;gap:10px;flex-wrap:wrap;">
                        ${project.live_url ? `<a href="${project.live_url}" target="_blank" style="background:#005f5f;color:white;padding:8px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">🔗 Live Demo</a>` : ''}
                        ${project.github_url ? `<a href="${project.github_url}" target="_blank" style="background:#1f2937;color:white;padding:8px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">💻 GitHub</a>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Highlight text
function highlightTextFrontend(text, searchTerm) {
    if (!text || !searchTerm) return text || '';
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background:#fef3c7;padding:0 2px;border-radius:2px;">$1</mark>');
}

function highlightTechFrontend(text, searchTerm) {
    if (!text || !searchTerm) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background:#fef3c7;padding:0 2px;border-radius:2px;">$1</mark>');
}

// Filter projects (Search + Category)
function filterProjectsFrontend() {
    const searchTerm = document.getElementById('projectSearchInput')?.value?.toLowerCase().trim() || '';
    const clearBtn = document.getElementById('clearSearchFrontend');

    if (searchTerm.length > 0) {
        clearBtn.style.display = 'block';
    } else {
        clearBtn.style.display = 'none';
    }

    let filtered = allProjectsData;

    // Apply category filter
    if (currentCategoryFrontend !== 'all') {
        filtered = filtered.filter(p => (p.category || 'website') === currentCategoryFrontend);
    }

    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(p => {
            const title = (p.title || '').toLowerCase();
            const description = (p.description || '').toLowerCase();
            const technologies = (p.technologies || '').toLowerCase();
            const category = (p.category || '').toLowerCase();
            
            return title.includes(searchTerm) || 
                   description.includes(searchTerm) || 
                   technologies.includes(searchTerm) || 
                   category.includes(searchTerm);
        });
    }

    renderProjectsFrontend(filtered);
    updateProjectCountFrontend(filtered.length);
}

// Filter by category
function filterByCategoryFrontend(category, btn) {
    currentCategoryFrontend = category;
    
    document.querySelectorAll('.filter-buttons .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    filterProjectsFrontend();
}

// Clear search
function clearSearchFrontend() {
    document.getElementById('projectSearchInput').value = '';
    document.getElementById('clearSearchFrontend').style.display = 'none';
    filterProjectsFrontend();
    document.getElementById('projectSearchInput').focus();
}

// Update project count
function updateProjectCountFrontend(count) {
    const el = document.getElementById('visibleCountFrontend');
    if (el) {
        el.textContent = count;
    }
}



// ============================================================
// 👥 LOAD TEAM MEMBERS - WITH VIEW DETAILS
// ============================================================

async function loadTeamMembers() {
    const container = document.getElementById('teamGrid');
    if (!container) return;

    container.innerHTML = `<div class="loading">⏳ Loading team members...</div>`;

    try {
        const response = await fetch('/api/team');
        const result = await response.json();

        if (!response.ok) throw new Error(result.message);

        const members = result.data || [];

        if (members.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:60px 20px;color:#6b7280;grid-column:1/-1;">
                    <p style="font-size:48px;margin-bottom:10px;">👥</p>
                    <p style="font-size:18px;font-weight:600;">Team coming soon</p>
                    <p style="font-size:14px;margin-top:5px;">We're building an amazing team!</p>
                </div>
            `;
            return;
        }

        renderTeamMembersWithDetails(members, container);

    } catch (error) {
        console.error('Team load error:', error);
        container.innerHTML = `
            <div style="text-align:center;padding:40px;color:#dc2626;grid-column:1/-1;">
                ❌ Error loading team: ${error.message}
                <br><br>
                <button onclick="loadTeamMembers()" style="padding:10px 25px;background:#005f5f;color:white;border:none;border-radius:8px;cursor:pointer;">
                    Retry
                </button>
            </div>
        `;
    }
}

// ============================================================
// ✅ RENDER TEAM WITH VIEW DETAILS BUTTON
// ============================================================

function renderTeamMembersWithDetails(members, container) {
    container.innerHTML = members.map((member, index) => {
        // Social links for card
        const socialLinks = [];
        if (member.social_linkedin) socialLinks.push({ icon: 'fab fa-linkedin-in', url: member.social_linkedin });
        if (member.social_github) socialLinks.push({ icon: 'fab fa-github', url: member.social_github });
        if (member.social_twitter) socialLinks.push({ icon: 'fab fa-twitter', url: member.social_twitter });
        if (member.social_dribbble) socialLinks.push({ icon: 'fab fa-dribbble', url: member.social_dribbble });
        if (member.social_behance) socialLinks.push({ icon: 'fab fa-behance', url: member.social_behance });

        return `
            <div class="team-card" data-aos="fade-up" data-aos-delay="${index * 100 + 100}">
                <div class="team-image">
                    ${member.image_url ? 
                        `<img src="${member.image_url}" alt="${member.name}" loading="lazy" onerror="this.style.display='none'">` : 
                        `<div style="width:100%;height:100%;background:linear-gradient(135deg,#005f5f,#0a7a7a);display:flex;align-items:center;justify-content:center;font-size:64px;color:white;">👤</div>`
                    }
                    <div class="team-overlay">
                        <div class="team-social">
                            ${socialLinks.map(s => `
                                <a href="${s.url}" target="_blank" aria-label="Social"><i class="${s.icon}"></i></a>
                            `).join('')}
                            ${socialLinks.length === 0 ? '<span style="color:white;font-size:13px;">No social links</span>' : ''}
                        </div>
                    </div>
                    ${member.experience_years ? `
                        <div class="team-experience-badge">
                            <span>${member.experience_years}+ Years</span>
                        </div>
                    ` : ''}
                </div>
                <div class="team-info">
                    <h3>${member.name}</h3>
                    <span class="team-role">${member.role}</span>
                    <p>${member.bio ? member.bio.substring(0, 80) + (member.bio.length > 80 ? '...' : '') : 'Passionate about creating amazing digital experiences.'}</p>
                    ${member.skills && member.skills.length > 0 ? `
                        <div class="team-skills">
                            ${member.skills.slice(0, 3).map(s => `<span>${s}</span>`).join('')}
                            ${member.skills.length > 3 ? `<span>+${member.skills.length - 3}</span>` : ''}
                        </div>
                    ` : ''}
                    <div class="team-stats">
                        ${member.projects_count ? `
                            <div class="stat-item">
                                <span class="stat-number">${member.projects_count}+</span>
                                <span class="stat-label">Projects</span>
                            </div>
                        ` : ''}
                        ${member.satisfaction_rate ? `
                            <div class="stat-item">
                                <span class="stat-number">${member.satisfaction_rate}%</span>
                                <span class="stat-label">Satisfaction</span>
                            </div>
                        ` : ''}
                        ${member.rating ? `
                            <div class="stat-item">
                                <span class="stat-number">${member.rating}</span>
                                <span class="stat-label">Rating</span>
                            </div>
                        ` : ''}
                    </div>
                    <!-- ✅ View Details Button -->
                    <button class="btn-view-details" onclick="openMemberModal('${member.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================
// 👤 OPEN MEMBER DETAILS MODAL
// ============================================================

let currentMember = null;

async function openMemberModal(memberId) {
    try {
        // Fetch single member details
        const response = await fetch(`/api/team/${memberId}`);
        const result = await response.json();

        if (!response.ok) throw new Error(result.message);

        const member = result.data;
        currentMember = member;

        // Fill modal with data
        document.getElementById('modalName').textContent = member.name;
        document.getElementById('modalRole').textContent = member.role;
        document.getElementById('modalBio').textContent = member.bio || 'Passionate about creating amazing digital experiences.';
        document.getElementById('modalImage').src = member.image_url || '/images/default-avatar.png';
        document.getElementById('modalProjects').textContent = member.projects_count || '0';
        document.getElementById('modalSatisfaction').textContent = (member.satisfaction_rate || 0) + '%';
        document.getElementById('modalRating').textContent = member.rating || '0';
        document.getElementById('modalExperience').textContent = (member.experience_years || 0) + ' Years';

          // ✅ Portfolio বাটন কন্ট্রোল
        const portfolioBtn = document.querySelector('.btn-portfolio');
        if (member.portfolio_url && member.portfolio_url.trim() !== '') {
            portfolioBtn.style.display = 'flex';
            portfolioBtn.onclick = function() {
                window.open(member.portfolio_url, '_blank');
            };
        } else {
            portfolioBtn.style.display = 'none';
        }

           // ✅ Contact বাটন - ফর্মে অটোফিল
        const contactBtn = document.querySelector('.btn-contact');
        contactBtn.onclick = function() {
            // Contact ফর্মে নাম অটোফিল
            const nameInput = document.getElementById('contactName');
            const messageInput = document.getElementById('contactMessage');
            
            if (nameInput) {
                nameInput.value = member.name;
            }
            if (messageInput) {
                messageInput.value = `Hi ${member.name},\n\nI'm interested in working with you...`;
            }
            
            // Contact সেকশনে স্ক্রল
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
            closeMemberModal();
        };
        // Skills
        const skillsContainer = document.getElementById('modalSkills');
        if (member.skills && member.skills.length > 0) {
            skillsContainer.innerHTML = member.skills.map(s => `<span>${s}</span>`).join('');
        } else {
            skillsContainer.innerHTML = '<span style="color:#6b7280;font-size:13px;">No skills listed</span>';
        }

        // Social Links
        const socialLinks = {
            linkedin: document.getElementById('modalLinkedin'),
            github: document.getElementById('modalGithub'),
            twitter: document.getElementById('modalTwitter'),
            dribbble: document.getElementById('modalDribbble'),
            behance: document.getElementById('modalBehance')
        };

        // Show/hide and set URLs
        Object.keys(socialLinks).forEach(key => {
            const url = member[`social_${key}`];
            if (url) {
                socialLinks[key].href = url;
                socialLinks[key].classList.remove('hidden');
            } else {
                socialLinks[key].classList.add('hidden');
            }
        });

        // Show modal
        document.getElementById('memberModal').classList.add('active');
        document.body.style.overflow = 'hidden';

    } catch (error) {
        console.error('Error loading member details:', error);
        alert('❌ Could not load member details: ' + error.message);
    }
}

// ============================================================
// ❌ CLOSE MODAL
// ============================================================

function closeMemberModal() {
    document.getElementById('memberModal').classList.remove('active');
    document.body.style.overflow = '';
}

// Close on overlay click
document.getElementById('memberModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeMemberModal();
    }
});

// Close on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeMemberModal();
    }
});

// ============================================================
// 📧 CONTACT MEMBER
// ============================================================

function contactMember() {
    if (!currentMember) return;
    // Redirect to contact page with member name
    window.location.href = `/#contact?member=${encodeURIComponent(currentMember.name)}`;
}

// ============================================================
// 💼 VIEW PORTFOLIO
// ============================================================

function viewPortfolio() {
    if (!currentMember) return;
    // You can add portfolio URL or open a new page
    alert(`View ${currentMember.name}'s portfolio coming soon!`);
    // window.open(`/portfolio/${currentMember.id}`, '_blank');
}


// ============================================================
// 👥 TEAM SECTION - SCROLL ANIMATION
// ============================================================

// Intersection Observer for scroll animations
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.team-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add animation class with delay
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        observer.observe(card);
    });
});

/* =========================================================
   TYPEWRITER EFFECT - ONLY FOR "Creative Developer"
========================================================= */

(function() {
    'use strict';
    
    const CONFIG = {
        typingSpeed: 100,
        deletingSpeed: 50,
        pauseBeforeDelete: 2500,
        pauseBeforeNext: 500,
        startDelay: 800,
        titles: [
            'Creative Developer',
            'UI/UX Designer',
            'Full-Stack Developer',
            'fluent speaker'
        ]
    };
    
    const element = document.getElementById('dynamicTitle');
    let currentIndex = 0;
    let isDeleting = false;
    let currentText = '';
    let timerId = null;
    
    // ✅ Set fixed width to prevent layout shift
    function setFixedWidth() {
        if (!element) return;
        const maxLength = Math.max(...CONFIG.titles.map(t => t.length));
        element.style.minWidth = (maxLength * 0.8) + 'ch';
        element.style.display = 'inline-block';
        element.style.whiteSpace = 'nowrap';
        element.style.minHeight = '1.2em';
    }
    
    function typeWriter() {
        if (!element) return;
        
        const fullText = CONFIG.titles[currentIndex];
        
        if (!isDeleting) {
            // Typing forward
            if (currentText.length < fullText.length) {
                currentText = fullText.substring(0, currentText.length + 1);
                element.textContent = currentText;
                timerId = setTimeout(typeWriter, CONFIG.typingSpeed);
            } else {
                // Done typing - wait then delete
                isDeleting = true;
                timerId = setTimeout(typeWriter, CONFIG.pauseBeforeDelete);
            }
        } else {
            // Deleting backward
            if (currentText.length > 0) {
                currentText = currentText.substring(0, currentText.length - 1);
                element.textContent = currentText;
                timerId = setTimeout(typeWriter, CONFIG.deletingSpeed);
            } else {
                // Done deleting - move to next title
                isDeleting = false;
                currentIndex = (currentIndex + 1) % CONFIG.titles.length;
                timerId = setTimeout(typeWriter, CONFIG.pauseBeforeNext);
            }
        }
    }
    
    function startTypewriter() {
        if (!element) {
            console.warn('⚠️ Typewriter element not found');
            return;
        }
        
        if (timerId) clearTimeout(timerId);
        
        setFixedWidth();
        
        currentIndex = 0;
        isDeleting = false;
        currentText = '';
        element.textContent = '';
        
        timerId = setTimeout(typeWriter, 500);
    }
    
    // ✅ Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(startTypewriter, CONFIG.startDelay);
        });
    } else {
        setTimeout(startTypewriter, CONFIG.startDelay);
    }
    
    // ✅ Expose for debugging
    window.typewriter = {
        start: startTypewriter,
        stop: () => { if (timerId) clearTimeout(timerId); },
        reset: () => {
            if (timerId) clearTimeout(timerId);
            currentText = '';
            element.textContent = '';
            currentIndex = 0;
            isDeleting = false;
            setTimeout(startTypewriter, 500);
        }
    };
    
    console.log('✅ Typewriter (Only for title) initialized!');
    
})();

// ============================================================
// ✅ INIT - FRONTEND
// ============================================================

// Load projects when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadProjectsFrontend('all');

    // Search on Enter key
    const searchInput = document.getElementById('projectSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                filterProjectsFrontend();
            }
        });
    }
});
/* =========================================================
   START - Load Everything
========================================================= */

loadProfile();
loadEducation();
loadExperience();
loadSkills();
loadServices();
loadProjects();
loadTestimonials();
loadBlogPosts();
loadServicesSale();

if (document.getElementById('disciplineStats')) {
    loadDisciplinePublic();
}

// ============================================================
// ✅ INIT - Load team when page loads
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    loadTeamMembers();
});
console.log('🚀 My Resume Portfolio - All systems ready!');
console.log('📊 Analytics tracking enabled');
console.log('💀 Skeleton screens enabled');