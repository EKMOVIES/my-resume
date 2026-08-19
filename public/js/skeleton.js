/* =========================================================
   SKELETON SCREEN UTILITIES
========================================================= */

// Skeleton Manager
const SkeletonManager = {
    // Show skeleton for an element
    show: function(elementId, skeletonType = 'card', options = {}) {
        const container = document.getElementById(elementId);
        if (!container) return;
        
        // Store original content
        const originalContent = container.innerHTML;
        container.dataset.originalContent = originalContent;
        
        // Generate skeleton HTML
        const skeletonHTML = this.generateSkeleton(skeletonType, options);
        container.innerHTML = skeletonHTML;
        container.classList.add('skeleton-wrapper');
        
        return container;
    },
    
    // Hide skeleton and show original content
    hide: function(elementId) {
        const container = document.getElementById(elementId);
        if (!container) return;
        
        const originalContent = container.dataset.originalContent;
        if (originalContent) {
            container.innerHTML = originalContent;
            container.classList.remove('skeleton-wrapper');
            delete container.dataset.originalContent;
        }
    },
    
    // Generate skeleton HTML
    generateSkeleton: function(type, options) {
        const count = options.count || 3;
        const className = options.className || '';
        
        switch(type) {
            case 'card':
                return this.cardSkeleton(count, className);
            case 'project':
                return this.projectSkeleton(count, className);
            case 'blog':
                return this.blogSkeleton(count, className);
            case 'timeline':
                return this.timelineSkeleton(count, className);
            case 'hero':
                return this.heroSkeleton(className);
            case 'skill':
                return this.skillSkeleton(count, className);
            case 'testimonial':
                return this.testimonialSkeleton(count, className);
            case 'comment':
                return this.commentSkeleton(count, className);
            default:
                return this.cardSkeleton(count, className);
        }
    },
    
    // Card Skeleton
    cardSkeleton: function(count, className) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-card ${className}">
                    <div class="skeleton skeleton-image" style="height:150px;"></div>
                    <div class="skeleton skeleton-text skeleton-text-lg" style="margin-top:15px;"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width:70%;"></div>
                </div>
            `;
        }
        return html;
    },
    
    // Project Skeleton
    projectSkeleton: function(count, className) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="project skeleton-card ${className}">
                    <div class="skeleton skeleton-image" style="height:200px;"></div>
                    <div class="skeleton skeleton-text" style="width:40%;height:12px;margin-bottom:10px;"></div>
                    <div class="skeleton skeleton-text skeleton-text-lg"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width:60%;"></div>
                    <div style="display:flex;gap:10px;margin-top:15px;">
                        <div class="skeleton skeleton-button" style="width:80px;height:30px;"></div>
                        <div class="skeleton skeleton-button" style="width:80px;height:30px;"></div>
                    </div>
                </div>
            `;
        }
        return html;
    },
    
    // Blog Skeleton
    blogSkeleton: function(count, className) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-card ${className}">
                    <div class="skeleton skeleton-image" style="height:200px;"></div>
                    <div style="display:flex;gap:8px;margin:12px 0;">
                        <div class="skeleton" style="width:60px;height:24px;border-radius:12px;"></div>
                        <div class="skeleton" style="width:80px;height:24px;border-radius:12px;"></div>
                    </div>
                    <div class="skeleton skeleton-text skeleton-text-lg"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width:60%;"></div>
                    <div style="display:flex;justify-content:space-between;margin-top:15px;">
                        <div class="skeleton" style="width:80px;height:16px;"></div>
                        <div class="skeleton" style="width:100px;height:16px;"></div>
                    </div>
                </div>
            `;
        }
        return html;
    },
    
    // Timeline Skeleton
    timelineSkeleton: function(count, className) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-timeline-item ${className}">
                    <div class="skeleton skeleton-timeline-dot"></div>
                    <div class="skeleton-timeline-content">
                        <div class="skeleton skeleton-text skeleton-text-lg"></div>
                        <div class="skeleton skeleton-text" style="width:40%;"></div>
                        <div class="skeleton skeleton-text" style="width:50%;margin-top:8px;"></div>
                    </div>
                </div>
            `;
        }
        return html;
    },
    
    // Hero Skeleton
    heroSkeleton: function(className) {
        return `
            <div class="skeleton-hero ${className}">
                <div class="skeleton-hero-content">
                    <div class="skeleton" style="width:120px;height:20px;border-radius:4px;"></div>
                    <div class="skeleton skeleton-text-xl"></div>
                    <div class="skeleton skeleton-text" style="width:80%;"></div>
                    <div class="skeleton skeleton-text" style="width:60%;"></div>
                    <div style="display:flex;gap:12px;margin-top:20px;">
                        <div class="skeleton skeleton-button"></div>
                        <div class="skeleton skeleton-button" style="width:140px;"></div>
                    </div>
                </div>
                <div class="skeleton-hero-card skeleton-card">
                    <div class="skeleton skeleton-avatar-lg"></div>
                    <div class="skeleton skeleton-text skeleton-text-lg" style="width:60%;"></div>
                    <div class="skeleton skeleton-text" style="width:40%;"></div>
                    <div class="skeleton skeleton-text" style="width:50%;"></div>
                </div>
            </div>
        `;
    },
    
    // Skill Skeleton
    skillSkeleton: function(count, className) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-card ${className}">
                    <div class="skeleton skeleton-text skeleton-text-lg" style="width:50%;"></div>
                    <div style="margin-top:10px;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <div class="skeleton" style="width:60px;height:14px;"></div>
                            <div class="skeleton" style="width:30px;height:14px;"></div>
                        </div>
                        <div class="skeleton" style="width:100%;height:6px;border-radius:3px;"></div>
                    </div>
                    <div style="margin-top:8px;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <div class="skeleton" style="width:80px;height:14px;"></div>
                            <div class="skeleton" style="width:30px;height:14px;"></div>
                        </div>
                        <div class="skeleton" style="width:100%;height:6px;border-radius:3px;"></div>
                    </div>
                </div>
            `;
        }
        return html;
    },
    
    // Testimonial Skeleton
    testimonialSkeleton: function(count, className) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-card ${className}">
                    <div style="display:flex;align-items:center;gap:15px;margin-bottom:15px;">
                        <div class="skeleton skeleton-avatar"></div>
                        <div>
                            <div class="skeleton skeleton-text skeleton-text-lg" style="width:120px;"></div>
                            <div class="skeleton skeleton-text" style="width:80px;"></div>
                        </div>
                    </div>
                    <div class="skeleton" style="width:100px;height:20px;margin-bottom:10px;"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width:70%;"></div>
                </div>
            `;
        }
        return html;
    },
    
    // Comment Skeleton
    commentSkeleton: function(count, className) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-comment ${className}">
                    <div class="skeleton skeleton-avatar" style="width:40px;height:40px;"></div>
                    <div class="skeleton-comment-content">
                        <div style="display:flex;gap:10px;margin-bottom:8px;">
                            <div class="skeleton" style="width:100px;height:16px;"></div>
                            <div class="skeleton" style="width:80px;height:14px;"></div>
                        </div>
                        <div class="skeleton skeleton-text"></div>
                        <div class="skeleton skeleton-text" style="width:60%;"></div>
                    </div>
                </div>
            `;
        }
        return html;
    }
};

// Auto-show skeletons for elements with data-skeleton attribute
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-skeleton]').forEach(element => {
        const type = element.dataset.skeleton || 'card';
        const count = parseInt(element.dataset.skeletonCount) || 3;
        SkeletonManager.show(element.id, type, { count: count });
    });
});

// Export for use
window.SkeletonManager = SkeletonManager;