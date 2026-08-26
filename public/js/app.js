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

        setText('profileName', profile.name, 'Ishtiak Hossain');
        setText('footerName', profile.name, 'Ishtiak Hossain');
        setText('profileTitle', profile.title, 'Creative Developer');
        setText('profileHeroTitle', profile.title, 'Creative Developer');
        setText('profileBio', profile.bio, 'Building websites, designs and digital projects.');
        setText('profileHeroBio', profile.bio, 'Building websites, designs and digital projects.');
        setText('profileLocation', profile.location, 'Location not available');

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

   const heroBio = document.getElementById('profileHeroBio');
        if (heroBio) {
            const fullBio = profile.bio || 'Building websites, designs and digital projects.';
            heroBio.textContent = fullBio;
            
            // Check if bio is long enough for show more
            const bioContainer = document.getElementById('heroBioContainer');
            const toggleBtn = document.getElementById('heroBioToggle');
            
            if (fullBio.length > 100) {
                // Bio is long - show toggle
                heroBio.classList.add('bio-collapsed');
                if (toggleBtn) toggleBtn.style.display = 'inline-block';
            } else {
                // Bio is short - hide toggle
                heroBio.classList.remove('bio-collapsed');
                if (toggleBtn) toggleBtn.style.display = 'none';
            }
        }



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

        setSocialLink('facebookLink', profile.facebook_url);
        setSocialLink('linkedinLink', profile.linkedin_url);
        setSocialLink('githubLink', profile.github_url);

        const heroFacebook = document.getElementById('heroFacebook');
        const heroLinkedin = document.getElementById('heroLinkedin');
        const heroGithub = document.getElementById('heroGithub');

        if (heroFacebook) {
            if (profile.facebook_url) {
                heroFacebook.href = profile.facebook_url;
                heroFacebook.style.display = 'inline-block';
            } else {
                heroFacebook.style.display = 'none';
            }
        }

        if (heroLinkedin) {
            if (profile.linkedin_url) {
                heroLinkedin.href = profile.linkedin_url;
                heroLinkedin.style.display = 'inline-block';
            } else {
                heroLinkedin.style.display = 'none';
            }
        }

        if (heroGithub) {
            if (profile.github_url) {
                heroGithub.href = profile.github_url;
                heroGithub.style.display = 'inline-block';
            } else {
                heroGithub.style.display = 'none';
            }
        }
    
        setResumeLink('resumeLink', profile.resume_url);
        setResumeLink('heroResumeLink', profile.resume_url);

        hideSkeleton('heroContainer');
        hideSkeleton('profileBioContainer');
        console.log('✅ Profile loaded successfully.');
    } catch (error) {
        console.error('❌ Profile loading error:', error);
        hideSkeleton('heroContainer');
        hideSkeleton('profileBioContainer');
    }
}


let bioExpanded = false;

function toggleHeroBio() {
    const bio = document.getElementById('profileHeroBio');
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
                <div class="card">
                    <h3>Web Development</h3>
                    <p>HTML5, CSS3, JavaScript, Node.js, Express.js</p>
                </div>
                <div class="card">
                    <h3>Graphic Design</h3>
                    <p>Canva, Photoshop and visual content design</p>
                </div>
                <div class="card">
                    <h3>Computer Skills</h3>
                    <p>MS Word, Excel and general computer operations</p>
                </div>
            `;
            hideSkeleton('skillsContainer');
            return;
        }

        const grouped = data.reduce((acc, skill) => {
            const category = skill.category || 'Other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(skill);
            return acc;
        }, {});

        const sortedCategories = Object.keys(grouped).sort();

        container.innerHTML = sortedCategories.map(category => {
            const skills = grouped[category];
            return `
                <div class="card">
                    <h3>${category}</h3>
                    <div style="margin-top:10px;">
                        ${skills.map(s => `
                            <div style="margin-bottom:8px;">
                                <span style="font-size:14px;font-weight:500;">${s.name}</span>
                                ${s.level ? `
                                    <div style="width:100%;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;margin-top:3px;">
                                        <div style="width:${s.level}%;height:100%;background:#005f5f;border-radius:3px;"></div>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        hideSkeleton('skillsContainer');
        console.log('✅ Skills loaded successfully.');
    } catch (error) {
        console.error('❌ Skills loading error:', error);
        hideSkeleton('skillsContainer');
    }
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

async function loadProjects() {
    showSkeleton('projectsContainer', 'project', 3);
    
    try {
        const response = await fetch('/api/projects');
        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error('Could not load projects:', result);
            hideSkeleton('projectsContainer');
            return;
        }

        const container = document.getElementById('projectsContainer');
        if (!container) return;

        const data = result.data || [];

        // ✅ Change container class for grid
        container.className = 'projects-grid';

        if (data.length === 0) {
            container.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-secondary);">
                    <p style="font-size:18px;">No projects added yet.</p>
                    <p style="font-size:14px;">Add from Admin Panel</p>
                </div>
            `;
            hideSkeleton('projectsContainer');
            return;
        }

        container.innerHTML = data.map(item => {
            const projectUrl = `${window.location.origin}/project/${item.id}`;
            
            // ✅ Get first 3 tech tags
            const techs = item.technologies ? item.technologies.split(',').map(t => t.trim()).slice(0, 3) : [];
            
            // ✅ Determine badge color based on project type
            const badgeText = item.technologies ? item.technologies.split(',')[0].trim() : 'Project';
            
            const imageHtml = item.image_url ? `
                <div class="project-image-wrapper">
                    <img src="${item.image_url}" alt="${item.title}" class="project-image" loading="lazy" onerror="this.style.display='none'">
                    <span class="project-badge">${badgeText}</span>
                </div>
            ` : `
                <div class="project-image-wrapper" style="background:linear-gradient(135deg,#005f5f,#003d3d);height:200px;display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:48px;color:rgba(255,255,255,0.3);">🚀</span>
                    <span class="project-badge">${badgeText}</span>
                </div>
            `;

            return `
                <div class="project-card">
                    ${imageHtml}
                    <div class="project-content">
                        <h3 class="project-title">${item.title || 'Project'}</h3>
                        
                        ${techs.length > 0 ? `
                            <div class="project-tech">
                                ${techs.map(tech => `<span>${tech}</span>`).join('')}
                                ${item.technologies && item.technologies.split(',').length > 3 ? `<span>+${item.technologies.split(',').length - 3}</span>` : ''}
                            </div>
                        ` : ''}
                        
                        <p class="project-description">${item.description || 'No description available.'}</p>
                        
                        <div class="project-links">
                            ${item.live_url ? `<a href="${item.live_url}" target="_blank" rel="noopener noreferrer">🔗 Live Demo</a>` : ''}
                            ${item.github_url ? `<a href="${item.github_url}" target="_blank" rel="noopener noreferrer" class="github-link">💻 GitHub</a>` : ''}
                            ${!item.live_url && !item.github_url ? `<span style="color:var(--text-secondary);font-size:13px;">Coming soon</span>` : ''}
                        </div>
                        
                        <div class="project-share">
                            <button onclick="shareProject('facebook', '${item.title}', '${projectUrl}')">📘</button>
                            <button onclick="shareProject('twitter', '${item.title}', 'projectUrl}')">🐦</button>
                            <button onclick="shareProject('linkedin', '${item.title}', '${projectUrl}')">🔗</button>
                            <button onclick="shareProject('whatsapp', '${item.title}', '${projectUrl}')">💬</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        hideSkeleton('projectsContainer');
        console.log('✅ Projects loaded successfully.');
    } catch (error) {
        console.error('❌ Projects loading error:', error);
        hideSkeleton('projectsContainer');
    }
}

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

console.log('🚀 My Resume Portfolio - All systems ready!');
console.log('📊 Analytics tracking enabled');
console.log('💀 Skeleton screens enabled');