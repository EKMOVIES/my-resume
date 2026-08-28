require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
console.log('🌐 BASE_URL:', BASE_URL);

const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const pdf = require('html-pdf');

// Nodemailer - optional
let nodemailer;
try {
    nodemailer = require('nodemailer');
    console.log('✅ Nodemailer loaded successfully');
} catch (error) {
    console.warn('⚠️ Nodemailer not installed. Email notifications disabled.');
    nodemailer = null;
}
const SSLCommerz = require('sslcommerz-lts');

// SSLCommerz Config
const store_id = process.env.STORE_ID || 'myres6a8f1c4131455';
const store_passwd = process.env.STORE_PASSWORD || '0987654321';
const is_live = false;

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================================================
   SUPABASE
========================================================= */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/* =========================================================
   EXPRESS MIDDLEWARE
========================================================= */

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* =========================================================
   EMAIL NOTIFICATION (Optional)
========================================================= */

let transporter = null;

if (nodemailer) {
    try {
        transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        transporter.verify((error, success) => {
            if (error) {
                console.warn('❌ Email verification failed:', error.message);
                transporter = null;
            } else {
                console.log('✅ Email transporter is ready');
            }
        });
    } catch (error) {
        console.warn('⚠️ Email configuration error:', error.message);
        transporter = null;
    }
}

async function sendEmailNotification(data) {
    if (!transporter) {
        console.warn('⚠️ Email not sent - transporter not configured');
        return false;
    }

    try {
        const { name, email, subject, message } = data;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
            subject: `📩 New Message from ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f7f9; border-radius: 10px;">
                    <h2 style="color: #005f5f;">New Contact Form Message</h2>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                        ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
                        <p><strong>Message:</strong></p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #005f5f;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                        <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                            Sent from your portfolio website.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('📧 Email notification sent successfully');
        return true;
    } catch (error) {
        console.error('❌ Email send error:', error.message);
        return false;
    }
}

async function sendAdminNotification({ subject, html }) {
    if (!transporter) return;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: subject,
        html: html
    };

    await transporter.sendMail(mailOptions);
}

async function sendClientEmail({ to, subject, html }) {
    if (!transporter) return;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: html
    };

    await transporter.sendMail(mailOptions);
}

/* =========================================================
   HELPER: Create Admin Notification
========================================================= */

async function createAdminNotification({ type, title, message, link, icon, color }) {
    try {
        const { data, error } = await supabase
            .from('admin_notifications')
            .insert({
                type: type || 'system',
                title: title || 'Notification',
                message: message || '',
                link: link || null,
                icon: icon || '📌',
                color: color || '#005f5f',
                is_read: false,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Create notification error:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Create notification error:', error);
        return null;
    }
}

/* =========================================================
   HELPER: Extract Client ID from Token
========================================================= */

async function extractClientIdFromToken(token) {
    if (!token) return null;

    console.log('🔍 Extracting client ID from token:', token.substring(0, 30) + '...');

    // Method 1: Check if it's a temp token (temp_timestamp)
    if (token.startsWith('temp_')) {
        console.log('⚠️ Temp token detected, trying to find client from localStorage...');
        return null;
    }

    // Method 2: Try Supabase auth
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (!userError && user) {
            console.log('👤 User found via Supabase:', user.email);
            const { data: client, error: clientError } = await supabase
                .from('clients')
                .select('id')
                .eq('email', user.email)
                .single();
            
            if (!clientError && client) {
                console.log('✅ Client found via email:', client.id);
                return client.id;
            }
        }
    } catch (e) {
        console.warn('Supabase auth failed:', e.message);
    }

    // Method 3: Legacy token decode (base64)
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        console.log('📝 Decoded token:', decoded);
        const parts = decoded.split(':');
        if (parts.length >= 1) {
            const id = parts[0];
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(id)) {
                console.log('✅ Client ID from legacy token:', id);
                return id;
            }
        }
    } catch (e) {
        // Continue
    }

    // Method 4: Check if token itself is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(token)) {
        console.log('✅ Token is a valid UUID:', token);
        return token;
    }

    console.error('❌ Could not extract client ID from token');
    return null;
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'My Resume Portfolio API is running.'
    });
});

/* =========================================================
   AUTH MIDDLEWARE
========================================================= */

async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired session.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error.'
        });
    }
}

/* =========================================================
   PROFILE API
========================================================= */

app.get('/api/profile', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profile')
            .select('*')
            .order('id', { ascending: true })
            .limit(1);

        if (error) {
            console.error('Profile load error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load profile.',
                error: error.message
            });
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Profile GET server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.post('/api/profile', requireAuth, async (req, res) => {
    try {
        const {
            name, title, bio, email, phone, location,
            profile_image, resume_url, facebook_url,
            linkedin_url, github_url
        } = req.body;

        const { data, error } = await supabase
            .from('profile')
            .insert({
                name, title, bio, email, phone, location,
                profile_image, resume_url, facebook_url,
                linkedin_url, github_url
            })
            .select()
            .single();

        if (error) {
            console.error('Profile create error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not create profile.',
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Profile created successfully.',
            data
        });
    } catch (error) {
        console.error('Profile POST server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.put('/api/profile/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, title, bio, email, phone, location,
            profile_image, resume_url, facebook_url,
            linkedin_url, github_url
        } = req.body;

        const { data, error } = await supabase
            .from('profile')
            .update({
                name, title, bio, email, phone, location,
                profile_image, resume_url, facebook_url,
                linkedin_url, github_url,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Profile update error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not update profile.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully.',
            data
        });
    } catch (error) {
        console.error('Profile PUT server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.get('/api/public-profile', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profile')
            .select('*')
            .order('id', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Public profile error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load profile.',
                error: error.message
            });
        }

        res.json({ success: true, data: data || null });
    } catch (error) {
        console.error('Public profile server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

/* =========================================================
   EDUCATION API
========================================================= */

app.get('/api/education', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('education')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('start_year', { ascending: false });

        if (error) {
            console.error('Education load error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load education.',
                error: error.message
            });
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Education GET server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.post('/api/education', requireAuth, async (req, res) => {
    try {
        const { degree, institution, start_year, end_year, description, sort_order } = req.body;

        const { data, error } = await supabase
            .from('education')
            .insert({
                degree,
                institution,
                start_year,
                end_year,
                description,
                sort_order: sort_order || 0
            })
            .select()
            .single();

        if (error) {
            console.error('Education create error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not create education.',
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Education created successfully.',
            data
        });
    } catch (error) {
        console.error('Education POST server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.put('/api/education/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { degree, institution, start_year, end_year, description, sort_order } = req.body;

        const { data, error } = await supabase
            .from('education')
            .update({
                degree,
                institution,
                start_year,
                end_year,
                description,
                sort_order: sort_order || 0,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Education update error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not update education.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Education updated successfully.',
            data
        });
    } catch (error) {
        console.error('Education PUT server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.delete('/api/education/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('education')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Education delete error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not delete education.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Education deleted successfully.'
        });
    } catch (error) {
        console.error('Education DELETE server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

/* =========================================================
   EXPERIENCE API
========================================================= */

app.get('/api/experience', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('experience')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('start_date', { ascending: false });

        if (error) {
            console.error('Experience load error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load experience.',
                error: error.message
            });
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Experience GET server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.post('/api/experience', requireAuth, async (req, res) => {
    try {
        const { job_title, company, start_date, end_date, description, sort_order } = req.body;

        const { data, error } = await supabase
            .from('experience')
            .insert({
                job_title,
                company,
                start_date,
                end_date,
                description,
                sort_order: sort_order || 0
            })
            .select()
            .single();

        if (error) {
            console.error('Experience create error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not create experience.',
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Experience created successfully.',
            data
        });
    } catch (error) {
        console.error('Experience POST server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.put('/api/experience/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { job_title, company, start_date, end_date, description, sort_order } = req.body;

        const { data, error } = await supabase
            .from('experience')
            .update({
                job_title,
                company,
                start_date,
                end_date,
                description,
                sort_order: sort_order || 0,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Experience update error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not update experience.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Experience updated successfully.',
            data
        });
    } catch (error) {
        console.error('Experience PUT server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.delete('/api/experience/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('experience')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Experience delete error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not delete experience.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Experience deleted successfully.'
        });
    } catch (error) {
        console.error('Experience DELETE server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

/* =========================================================
   SKILLS API
========================================================= */

app.get('/api/skills', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('skills')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('category', { ascending: true });

        if (error) {
            console.error('Skills load error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load skills.',
                error: error.message
            });
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Skills GET server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.post('/api/skills', requireAuth, async (req, res) => {
    try {
        const { name, category, level, sort_order } = req.body;

        const { data, error } = await supabase
            .from('skills')
            .insert({
                name,
                category,
                level: level || 0,
                sort_order: sort_order || 0
            })
            .select()
            .single();

        if (error) {
            console.error('Skill create error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not create skill.',
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Skill created successfully.',
            data
        });
    } catch (error) {
        console.error('Skill POST server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.put('/api/skills/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, level, sort_order } = req.body;

        const { data, error } = await supabase
            .from('skills')
            .update({
                name,
                category,
                level: level || 0,
                sort_order: sort_order || 0,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Skill update error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not update skill.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Skill updated successfully.',
            data
        });
    } catch (error) {
        console.error('Skill PUT server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.delete('/api/skills/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('skills')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Skill delete error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not delete skill.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Skill deleted successfully.'
        });
    } catch (error) {
        console.error('Skill DELETE server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

/* =========================================================
   SERVICES API
========================================================= */

app.get('/api/services', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Services load error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load services.',
                error: error.message
            });
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Services GET server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.post('/api/services', requireAuth, async (req, res) => {
    try {
        const { title, description, icon, sort_order } = req.body;

        const { data, error } = await supabase
            .from('services')
            .insert({
                title,
                description,
                icon,
                sort_order: sort_order || 0
            })
            .select()
            .single();

        if (error) {
            console.error('Service create error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not create service.',
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Service created successfully.',
            data
        });
    } catch (error) {
        console.error('Service POST server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.put('/api/services/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, icon, sort_order } = req.body;

        const { data, error } = await supabase
            .from('services')
            .update({
                title,
                description,
                icon,
                sort_order: sort_order || 0,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Service update error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not update service.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Service updated successfully.',
            data
        });
    } catch (error) {
        console.error('Service PUT server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.delete('/api/services/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Service delete error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not delete service.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Service deleted successfully.'
        });
    } catch (error) {
        console.error('Service DELETE server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

/* =========================================================
   PROJECTS API
========================================================= */

app.get('/api/projects', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Projects load error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load projects.',
                error: error.message
            });
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Projects GET server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.post('/api/projects', requireAuth, async (req, res) => {
    try {
        const { title, description, image_url, technologies, live_url, github_url, sort_order } = req.body;

        const { data, error } = await supabase
            .from('projects')
            .insert({
                title,
                description,
                image_url,
                technologies,
                live_url,
                github_url,
                sort_order: sort_order || 0
            })
            .select()
            .single();

        if (error) {
            console.error('Project create error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not create project.',
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Project created successfully.',
            data
        });
    } catch (error) {
        console.error('Project POST server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.put('/api/projects/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, image_url, technologies, live_url, github_url, sort_order } = req.body;

        const { data, error } = await supabase
            .from('projects')
            .update({
                title,
                description,
                image_url,
                technologies,
                live_url,
                github_url,
                sort_order: sort_order || 0,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Project update error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not update project.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Project updated successfully.',
            data
        });
    } catch (error) {
        console.error('Project PUT server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.delete('/api/projects/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Project delete error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not delete project.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Project deleted successfully.'
        });
    } catch (error) {
        console.error('Project DELETE server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

/* =========================================================
   MESSAGES API
========================================================= */

app.post('/api/messages', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and message are required.'
            });
        }

        const { data, error } = await supabase
            .from('messages')
            .insert({
                name,
                email,
                subject: subject || '',
                message,
                is_read: false,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Message create error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not send message.',
                error: error.message
            });
        }

        try {
            await createAdminNotification({
                type: 'contact',
                title: '✉️ New Contact Message!',
                message: `${name} (${email}) sent a message`,
                link: '/admin-messages.html',
                icon: '✉️',
                color: '#f59e0b'
            });
        } catch (notifError) {
            console.warn('Notification error:', notifError.message);
        }

        try {
            await sendEmailNotification({ name, email, subject, message });
        } catch (emailError) {
            console.error('Email notification failed:', emailError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Message sent successfully.',
            data
        });

    } catch (error) {
        console.error('Message POST server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.get('/api/messages', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Messages load error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load messages.',
                error: error.message
            });
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Messages GET server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.put('/api/messages/:id/read', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Message update error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not update message.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Message marked as read.',
            data
        });
    } catch (error) {
        console.error('Message PUT server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.delete('/api/messages/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Message delete error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not delete message.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Message deleted successfully.'
        });
    } catch (error) {
        console.error('Message DELETE server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

/* =========================================================
   BLOG POSTS API
========================================================= */

app.get('/api/blog', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('is_published', true)
            .order('published_at', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Blog load error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load blog posts.',
                error: error.message
            });
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Blog GET server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.get('/api/blog/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();

        if (error) {
            console.error('Blog post load error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load blog post.',
                error: error.message
            });
        }

        if (data) {
            await supabase
                .from('blog_posts')
                .update({ views: (data.views || 0) + 1 })
                .eq('id', data.id);
        }

        res.json({ success: true, data: data || null });
    } catch (error) {
        console.error('Blog post GET server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.get('/api/admin/blog', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Admin blog load error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load blog posts.',
                error: error.message
            });
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Admin blog GET server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.post('/api/admin/blog', requireAuth, async (req, res) => {
    try {
        const { title, slug, excerpt, content, cover_image, category, tags, is_published } = req.body;

        if (!title || !slug || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title, slug and content are required.'
            });
        }

        const { data: existing } = await supabase
            .from('blog_posts')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Slug already exists. Please use a different slug.'
            });
        }

        const { data, error } = await supabase
            .from('blog_posts')
            .insert({
                title,
                slug,
                excerpt: excerpt || '',
                content,
                cover_image: cover_image || '',
                category: category || '',
                tags: tags || [],
                is_published: is_published || false,
                published_at: is_published ? new Date().toISOString() : null
            })
            .select()
            .single();

        if (error) {
            console.error('Blog post create error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not create blog post.',
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Blog post created successfully.',
            data
        });
    } catch (error) {
        console.error('Blog post POST server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.put('/api/admin/blog/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, excerpt, content, cover_image, category, tags, is_published } = req.body;

        if (!title || !slug || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title, slug and content are required.'
            });
        }

        const updateData = {
            title,
            slug,
            excerpt: excerpt || '',
            content,
            cover_image: cover_image || '',
            category: category || '',
            tags: tags || [],
            is_published: is_published || false,
            updated_at: new Date().toISOString()
        };

        if (is_published) {
            updateData.published_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('blog_posts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Blog post update error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not update blog post.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Blog post updated successfully.',
            data
        });
    } catch (error) {
        console.error('Blog post PUT server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.delete('/api/admin/blog/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Blog post delete error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not delete blog post.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Blog post deleted successfully.'
        });
    } catch (error) {
        console.error('Blog post DELETE server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

/* =========================================================
   TESTIMONIALS API
========================================================= */

app.get('/api/testimonials', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('testimonials')
            .select('*')
            .eq('is_approved', true)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Testimonials load error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load testimonials.',
                error: error.message
            });
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Testimonials GET server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.get('/api/admin/testimonials', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('testimonials')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Admin testimonials load error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load testimonials.',
                error: error.message
            });
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Admin testimonials GET server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.post('/api/admin/testimonials', requireAuth, async (req, res) => {
    try {
        const { name, position, company, avatar_url, message, rating, is_approved, sort_order } = req.body;

        if (!name || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name and message are required.'
            });
        }

        const { data, error } = await supabase
            .from('testimonials')
            .insert({
                name,
                position: position || '',
                company: company || '',
                avatar_url: avatar_url || '',
                message,
                rating: rating || 5,
                is_approved: is_approved !== undefined ? is_approved : true,
                sort_order: sort_order || 0
            })
            .select()
            .single();

        if (error) {
            console.error('Testimonial create error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not create testimonial.',
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Testimonial created successfully.',
            data
        });
    } catch (error) {
        console.error('Testimonial POST server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.put('/api/admin/testimonials/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, position, company, avatar_url, message, rating, is_approved, sort_order } = req.body;

        const { data, error } = await supabase
            .from('testimonials')
            .update({
                name,
                position: position || '',
                company: company || '',
                avatar_url: avatar_url || '',
                message,
                rating: rating || 5,
                is_approved: is_approved !== undefined ? is_approved : true,
                sort_order: sort_order || 0,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Testimonial update error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not update testimonial.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Testimonial updated successfully.',
            data
        });
    } catch (error) {
        console.error('Testimonial PUT server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.delete('/api/admin/testimonials/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('testimonials')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Testimonial delete error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not delete testimonial.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Testimonial deleted successfully.'
        });
    } catch (error) {
        console.error('Testimonial DELETE server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

/* =========================================================
   FILE MANAGER API
========================================================= */

app.get('/api/public/files', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('file_manager')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Public files load error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load files.',
                error: error.message
            });
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Public files GET server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.get('/api/admin/files', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('file_manager')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Files load error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load files.',
                error: error.message
            });
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Files GET server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.post('/api/admin/files', requireAuth, async (req, res) => {
    try {
        const { file_name, file_url, file_type, file_size, category, description } = req.body;

        if (!file_name || !file_url) {
            return res.status(400).json({
                success: false,
                message: 'File name and URL are required.'
            });
        }

        const { data, error } = await supabase
            .from('file_manager')
            .insert({
                file_name,
                file_url,
                file_type: file_type || 'document',
                file_size: file_size || 0,
                category: category || 'Uncategorized',
                description: description || '',
                uploaded_by: req.user?.email || 'Admin'
            })
            .select()
            .single();

        if (error) {
            console.error('File create error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not create file.',
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully.',
            data
        });
    } catch (error) {
        console.error('File POST server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.put('/api/admin/files/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { file_name, category, description, sort_order } = req.body;

        const { data, error } = await supabase
            .from('file_manager')
            .update({
                file_name: file_name,
                category: category,
                description: description,
                sort_order: sort_order || 0,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('File update error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not update file.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'File updated successfully.',
            data
        });
    } catch (error) {
        console.error('File PUT server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.delete('/api/admin/files/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('file_manager')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('File delete error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not delete file.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'File deleted successfully.'
        });
    } catch (error) {
        console.error('File DELETE server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

/* =========================================================
   📄 PDF RESUME GENERATOR
========================================================= */

function generateResumeHTML(profile, education, experience, skills, projects) {
    const name = profile?.name || 'Your Name';
    const title = profile?.title || 'Professional';
    const email = profile?.email || 'email@example.com';
    const phone = profile?.phone || '+880123456789';
    const location = profile?.location || 'Location';
    const bio = profile?.bio || 'Professional bio goes here.';
    const profileImage = profile?.profile_image || '';
    const socialLinks = {
        facebook: profile?.facebook_url || '',
        linkedin: profile?.linkedin_url || '',
        github: profile?.github_url || ''
    };

    const educationHTML = education && education.length > 0 ? education.map(item => `
        <div class="edu-item">
            <h4>${item.institution || 'Institution'}</h4>
            <p><strong>${item.degree || 'Degree'}</strong></p>
            <p class="date">${item.start_year || ''} ${item.end_year ? '- ' + item.end_year : ''}</p>
            ${item.description ? `<p>${item.description}</p>` : ''}
        </div>
    `).join('') : '<p>No education added yet.</p>';

    const experienceHTML = experience && experience.length > 0 ? experience.map(item => `
        <div class="exp-item">
            <h4>${item.company || 'Company'}</h4>
            <p><strong>${item.job_title || 'Position'}</strong></p>
            <p class="date">${item.start_date ? new Date(item.start_date).getFullYear() : ''} ${item.end_date ? '- ' + new Date(item.end_date).getFullYear() : ''}</p>
            ${item.description ? `<p>${item.description}</p>` : ''}
        </div>
    `).join('') : '<p>No experience added yet.</p>';

    const skillsHTML = skills && skills.length > 0 ? skills.map(item => `
        <div class="skill-item">
            <span class="skill-name">${item.name || 'Skill'}</span>
            <div class="skill-bar">
                <div class="skill-fill" style="width: ${item.level || 0}%;"></div>
            </div>
        </div>
    `).join('') : '<p>No skills added yet.</p>';

    const projectsHTML = projects && projects.length > 0 ? projects.slice(0, 4).map(item => `
        <div class="project-item">
            <h4>${item.title || 'Project'}</h4>
            <p>${item.description || ''}</p>
            ${item.technologies ? `<p><strong>Tech:</strong> ${item.technologies}</p>` : ''}
        </div>
    `).join('') : '<p>No projects added yet.</p>';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Resume - ${name}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: Arial, Helvetica, sans-serif;
                color: #17212b;
                line-height: 1.6;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
                background: white;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #005f5f;
                padding-bottom: 20px;
                margin-bottom: 25px;
            }
            .header .avatar {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                object-fit: cover;
                margin-bottom: 10px;
                border: 3px solid #005f5f;
            }
            .header h1 {
                font-size: 32px;
                color: #005f5f;
                margin-bottom: 5px;
            }
            .header .title {
                font-size: 18px;
                color: #5b6872;
                margin-bottom: 10px;
            }
            .header .contact {
                font-size: 14px;
                color: #5b6872;
                display: flex;
                justify-content: center;
                gap: 20px;
                flex-wrap: wrap;
            }
            .header .contact span { display: inline-block; }
            .section { margin-bottom: 25px; }
            .section h2 {
                font-size: 20px;
                color: #005f5f;
                border-bottom: 2px solid #e8edf0;
                padding-bottom: 8px;
                margin-bottom: 15px;
            }
            .bio { font-size: 15px; color: #2d3748; line-height: 1.8; }
            .edu-item, .exp-item, .project-item { margin-bottom: 15px; }
            .edu-item h4, .exp-item h4, .project-item h4 {
                font-size: 16px;
                color: #17212b;
            }
            .edu-item p, .exp-item p, .project-item p {
                font-size: 14px;
                color: #4a5568;
            }
            .edu-item .date, .exp-item .date {
                font-size: 13px;
                color: #718096;
                font-weight: bold;
            }
            .skills-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            .skill-item { margin-bottom: 8px; }
            .skill-item .skill-name {
                font-size: 14px;
                font-weight: 600;
                display: block;
                margin-bottom: 2px;
            }
            .skill-bar {
                width: 100%;
                height: 6px;
                background: #e5e7eb;
                border-radius: 3px;
                overflow: hidden;
            }
            .skill-bar .skill-fill {
                height: 100%;
                background: #005f5f;
                border-radius: 3px;
            }
            .social-links {
                margin-top: 10px;
                display: flex;
                justify-content: center;
                gap: 15px;
                flex-wrap: wrap;
            }
            .social-links a {
                color: #005f5f;
                text-decoration: none;
                font-size: 13px;
            }
            .footer {
                text-align: center;
                font-size: 12px;
                color: #a0aec0;
                border-top: 1px solid #e8edf0;
                padding-top: 15px;
                margin-top: 25px;
            }
            @media print {
                body { padding: 20px; }
                .skill-bar { background: #e5e7eb !important; }
                .skill-fill { background: #005f5f !important; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            ${profileImage ? `<img src="${profileImage}" alt="${name}" class="avatar" onerror="this.style.display='none'">` : ''}
            <h1>${name}</h1>
            <div class="title">${title}</div>
            <div class="contact">
                ${email ? `<span>📧 ${email}</span>` : ''}
                ${phone ? `<span>📱 ${phone}</span>` : ''}
                ${location ? `<span>📍 ${location}</span>` : ''}
            </div>
            <div class="social-links">
                ${socialLinks.facebook ? `<a href="${socialLinks.facebook}" target="_blank">📘 Facebook</a>` : ''}
                ${socialLinks.linkedin ? `<a href="${socialLinks.linkedin}" target="_blank">🔗 LinkedIn</a>` : ''}
                ${socialLinks.github ? `<a href="${socialLinks.github}" target="_blank">💻 GitHub</a>` : ''}
            </div>
        </div>

        ${bio ? `
        <div class="section">
            <h2>About Me</h2>
            <div class="bio">${bio}</div>
        </div>
        ` : ''}

        <div class="section">
            <h2>Experience</h2>
            ${experienceHTML}
        </div>

        <div class="section">
            <h2>Education</h2>
            ${educationHTML}
        </div>

        ${skills && skills.length > 0 ? `
        <div class="section">
            <h2>Skills</h2>
            <div class="skills-grid">
                ${skillsHTML}
            </div>
        </div>
        ` : ''}

        ${projects && projects.length > 0 ? `
        <div class="section">
            <h2>Projects</h2>
            ${projectsHTML}
        </div>
        ` : ''}

        <div class="footer">
            Generated from ${name}'s Portfolio • ${new Date().getFullYear()}
        </div>
    </body>
    </html>
    `;
}

app.post('/api/resume/generate-pdf-public', async (req, res) => {
    try {
        console.log('📄 Generating PDF (Public)...');

        const [profileRes, educationRes, experienceRes, skillsRes, projectsRes] = await Promise.all([
            supabase.from('profile').select('*').limit(1).maybeSingle(),
            supabase.from('education').select('*').order('sort_order', { ascending: true }),
            supabase.from('experience').select('*').order('sort_order', { ascending: true }),
            supabase.from('skills').select('*').order('sort_order', { ascending: true }),
            supabase.from('projects').select('*').order('sort_order', { ascending: true })
        ]);

        const profile = profileRes.data;
        const education = educationRes.data || [];
        const experience = experienceRes.data || [];
        const skills = skillsRes.data || [];
        const projects = projectsRes.data || [];

        const html = generateResumeHTML(profile, education, experience, skills, projects);

        const options = {
            format: 'A4',
            border: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
            printBackground: true,
            timeout: 30000
        };

        pdf.create(html, options).toBuffer((err, buffer) => {
            if (err) {
                console.error('❌ PDF generation error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Could not generate PDF',
                    error: err.message
                });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="resume_${profile?.name || 'portfolio'}.pdf"`);
            res.send(buffer);
        });

    } catch (error) {
        console.error('❌ PDF generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not generate PDF',
            error: error.message
        });
    }
});

app.get('/api/resume/preview', requireAuth, async (req, res) => {
    try {
        console.log('👁️ Loading resume preview for user:', req.user?.email);

        const [profileRes, educationRes, experienceRes, skillsRes, projectsRes] = await Promise.all([
            supabase.from('profile').select('*').limit(1).maybeSingle(),
            supabase.from('education').select('*').order('sort_order', { ascending: true }),
            supabase.from('experience').select('*').order('sort_order', { ascending: true }),
            supabase.from('skills').select('*').order('sort_order', { ascending: true }),
            supabase.from('projects').select('*').order('sort_order', { ascending: true })
        ]);

        const profile = profileRes.data;
        const education = educationRes.data || [];
        const experience = experienceRes.data || [];
        const skills = skillsRes.data || [];
        const projects = projectsRes.data || [];

        const html = generateResumeHTML(profile, education, experience, skills, projects);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('❌ Preview error:', error);
        res.status(500).send('Error generating preview: ' + error.message);
    }
});

/* =========================================================
   👥 CLIENT PORTAL API
========================================================= */

console.log('✅ Client Portal API loading...');

app.post('/api/client/signup', async (req, res) => {
    try {
        const { name, email, password, company, phone } = req.body;
        console.log('📝 Signup attempt:', { name, email });

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        const { data: existing, error: checkError } = await supabase
            .from('clients')
            .select('email')
            .eq('email', email)
            .single();

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered. Please login.'
            });
        }

        const { data: client, error } = await supabase
            .from('clients')
            .insert({
                name,
                email,
                password_hash: password,
                company: company || '',
                phone: phone || '',
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Signup error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not create account'
            });
        }

        console.log('✅ Client created:', client.id);

        try {
            await createAdminNotification({
                type: 'client',
                title: '👤 New Client Signup!',
                message: `${name} (${email}) just signed up${company ? ' from ' + company : ''}`,
                link: '/admin-clients.html',
                icon: '👤',
                color: '#2563eb'
            });
        } catch (notifError) {
            console.warn('Notification error:', notifError.message);
        }

        try {
            await sendAdminNotification({
                subject: '📝 New Client Signup Request',
                html: `
                    <h2>New Client Signup Request</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Company:</strong> ${company || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
                    <p><a href="/admin-clients.html">Approve or Reject</a></p>
                `
            });
        } catch (emailError) {
            console.warn('Email notification failed:', emailError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Signup successful! Please wait for admin approval.',
            data: {
                id: client.id,
                name: client.name,
                email: client.email,
                status: client.status
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

app.post('/api/client/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔐 Login attempt:', { email });

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const { data: client, error } = await supabase
            .from('clients')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !client) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (client.status === 'pending') {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending approval. Please wait.',
                code: 'PENDING'
            });
        }

        if (client.status === 'rejected') {
            return res.status(403).json({
                success: false,
                message: 'Your account was rejected. Contact admin for details.',
                code: 'REJECTED'
            });
        }

        if (client.password_hash !== password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = Buffer.from(`${client.id}:${Date.now()}`).toString('base64');

        res.json({
            success: true,
            message: 'Login successful!',
            data: {
                client: {
                    id: client.id,
                    name: client.name,
                    email: client.email,
                    company: client.company,
                    phone: client.phone,
                    status: client.status
                },
                token: token
            }
        });

    } catch (error) {
        console.error('Client login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/* =========================================================
   💬 CLIENT CHAT SYSTEM
========================================================= */

app.get('/api/client/chat/messages', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        const token = authHeader.substring(7);
        console.log('📩 Chat token received:', token.substring(0, 30) + '...');

        const clientId = await extractClientIdFromToken(token);
        
        if (!clientId) {
            console.error('❌ Could not extract client ID from token');
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid client ID in token' 
            });
        }

        console.log('✅ Fetching messages for client:', clientId);

        const { data, error } = await supabase
            .from('client_chat_messages')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('❌ Database error:', error);
            throw error;
        }

        console.log(`✅ Found ${data?.length || 0} messages`);
        res.json({ success: true, data: data || [] });

    } catch (error) {
        console.error('❌ Chat error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Could not load messages' 
        });
    }
});

app.post('/api/client/chat/send', async (req, res) => {
    try {
        const { message } = req.body;
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        const token = authHeader.substring(7);

        if (!message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Message is required' 
            });
        }

        const clientId = await extractClientIdFromToken(token);
        
        if (!clientId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Could not identify client' 
            });
        }

        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('name, email')
            .eq('id', clientId)
            .single();

        if (clientError) {
            console.error('Client error:', clientError);
            return res.status(404).json({ 
                success: false, 
                message: 'Client not found' 
            });
        }

        const { data, error } = await supabase
            .from('client_chat_messages')
            .insert({
                client_id: clientId,
                client_email: client.email,
                client_name: client.name || 'Client',
                message: message,
                is_admin: false,
                is_read: false,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Send message error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not send message'
            });
        }

        try {
            await createAdminNotification({
                type: 'chat',
                title: '💬 New Chat Message!',
                message: `${client.name || 'Client'} (${client.email}) sent: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
                link: '/admin-chat.html',
                icon: '💬',
                color: '#7c3aed'
            });
        } catch (notifError) {
            console.warn('Notification error:', notifError.message);
        }

        res.json({ success: true, data });

    } catch (error) {
        console.error('Send chat error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Could not send message' 
        });
    }
});

/* =========================================================
   CLIENT PROJECTS API
========================================================= */

app.get('/api/client/projects', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const token = authHeader.substring(7);
        const clientId = await extractClientIdFromToken(token);
        
        if (!clientId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid client ID'
            });
        }

        const { data, error } = await supabase
            .from('client_projects')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Projects error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load projects'
            });
        }

        res.json({
            success: true,
            data: data || []
        });

    } catch (error) {
        console.error('Projects error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not load projects'
        });
    }
});

/* =========================================================
   CLIENT ORDERS API
========================================================= */

app.get('/api/client/orders', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const token = authHeader.substring(7);
        const clientId = await extractClientIdFromToken(token);
        
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Invalid client ID' });
        }

        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('email')
            .eq('id', clientId)
            .single();

        if (clientError || !client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                *,
                services_sale!inner(
                    id,
                    name,
                    category,
                    image_url
                )
            `)
            .eq('customer_email', client.email)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const transformed = orders.map(order => ({
            ...order,
            service_name: order.services_sale?.name,
            service_category: order.services_sale?.category,
            service_image: order.services_sale?.image_url
        }));

        res.json({ success: true, data: transformed });
    } catch (error) {
        console.error('Orders error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/* =========================================================
   CLIENT ORDER TRACKING API
========================================================= */

app.get('/api/client/order-tracking/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const token = authHeader.substring(7);
        const clientId = await extractClientIdFromToken(token);
        
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Invalid client ID' });
        }

        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('email')
            .eq('id', clientId)
            .single();

        if (clientError || !client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, services_sale(name)')
            .eq('id', orderId)
            .eq('customer_email', client.email)
            .single();

        if (orderError) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found or access denied' 
            });
        }

        const { data: tracking, error: trackingError } = await supabase
            .from('order_tracking')
            .select('*')
            .eq('order_id', orderId)
            .order('timestamp', { ascending: false });

        if (trackingError) throw trackingError;

        if (!tracking || tracking.length === 0) {
            const defaultTracking = [
                {
                    status: order.order_status || 'pending',
                    description: `Order ${order.order_status || 'pending'}`,
                    timestamp: order.created_at,
                    location: 'Online'
                }
            ];
            return res.json({
                success: true,
                data: {
                    service_name: order.services_sale?.name,
                    tracking: defaultTracking
                }
            });
        }

        res.json({
            success: true,
            data: {
                service_name: order.services_sale?.name,
                tracking: tracking
            }
        });
    } catch (error) {
        console.error('Tracking error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/* =========================================================
   ADMIN - CLIENT MANAGEMENT API
========================================================= */

app.get('/api/admin/clients', requireAuth, async (req, res) => {
    try {
        const { status } = req.query;
        
        let query = supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: data || []
        });

    } catch (error) {
        console.error('Clients error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not load clients'
        });
    }
});

app.post('/api/admin/clients', requireAuth, async (req, res) => {
    try {
        const { name, email, password, company, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        const { data: existing, error: checkError } = await supabase
            .from('clients')
            .select('email')
            .eq('email', email)
            .single();

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        const { data, error } = await supabase
            .from('clients')
            .insert({
                name,
                email,
                password_hash: password,
                company: company || '',
                phone: phone || '',
                status: 'approved'
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            success: true,
            message: 'Client created successfully',
            data: data
        });

    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not create client'
        });
    }
});

app.put('/api/admin/clients/:id/approve', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        const { data: client, error: fetchError } = await supabase
            .from('clients')
            .select('email, name')
            .eq('id', id)
            .single();

        if (fetchError) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        const { data, error } = await supabase
            .from('clients')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        try {
            await sendClientEmail({
                to: client.email,
                subject: '✅ Account Approved!',
                html: `
                    <h2>Congratulations ${client.name}!</h2>
                    <p>Your account has been approved by the admin.</p>
                    <p>You can now login to access your portal:</p>
                    <p><a href="/client-login.html">Login Here</a></p>
                    <p>Email: ${client.email}</p>
                `
            });
        } catch (emailError) {
            console.warn('Email notification failed:', emailError.message);
        }

        res.json({
            success: true,
            message: 'Client approved successfully',
            data: data
        });

    } catch (error) {
        console.error('Approve error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not approve client'
        });
    }
});

app.put('/api/admin/clients/:id/reject', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        const { data: client, error: fetchError } = await supabase
            .from('clients')
            .select('email, name')
            .eq('id', id)
            .single();

        if (fetchError) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        const { data, error } = await supabase
            .from('clients')
            .update({
                status: 'rejected',
                rejection_reason: rejectionReason || 'No reason provided',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        try {
            await sendClientEmail({
                to: client.email,
                subject: '❌ Account Rejected',
                html: `
                    <h2>Hello ${client.name},</h2>
                    <p>We regret to inform you that your account request was rejected.</p>
                    <p><strong>Reason:</strong> ${rejectionReason || 'No reason provided'}</p>
                    <p>If you have any questions, please contact the admin.</p>
                `
            });
        } catch (emailError) {
            console.warn('Email notification failed:', emailError.message);
        }

        res.json({
            success: true,
            message: 'Client rejected',
            data: data
        });

    } catch (error) {
        console.error('Reject error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not reject client'
        });
    }
});

app.delete('/api/admin/clients/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            message: 'Client deleted successfully'
        });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not delete client'
        });
    }
});

app.post('/api/admin/client-project', requireAuth, async (req, res) => {
    try {
        const { clientId, projectName, projectType, description, status, startDate, endDate, budget } = req.body;

        if (!clientId || !projectName) {
            return res.status(400).json({
                success: false,
                message: 'Client ID and project name are required'
            });
        }

        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('id')
            .eq('id', clientId)
            .single();

        if (clientError || !client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        const { data, error } = await supabase
            .from('client_projects')
            .insert({
                client_id: clientId,
                project_name: projectName,
                project_type: projectType || 'Website',
                description: description || '',
                status: status || 'active',
                start_date: startDate || null,
                end_date: endDate || null,
                budget: budget || null
            })
            .select()
            .single();

        if (error) {
            console.error('Add project error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not add project: ' + error.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Project added successfully',
            data: data
        });

    } catch (error) {
        console.error('Add project error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not add project',
            error: error.message
        });
    }
});

/* =========================================================
   ADMIN - CHAT API
========================================================= */

app.get('/api/admin/chat/clients', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('client_chat_messages')
            .select('client_id, client_name, client_email, created_at, is_read')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const clients = {};
        data.forEach(msg => {
            const id = msg.client_id;
            if (!clients[id]) {
                clients[id] = {
                    client_id: id,
                    client_name: msg.client_name,
                    client_email: msg.client_email,
                    last_message: msg.created_at,
                    unread_count: 0
                };
            }
            if (!msg.is_read) {
                clients[id].unread_count++;
            }
        });

        res.json({ success: true, data: Object.values(clients) });
    } catch (error) {
        console.error('Chat clients error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/admin/chat/messages', requireAuth, async (req, res) => {
    try {
        const { client_id } = req.query;
        
        let query = supabase
            .from('client_chat_messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (client_id) {
            query = query.eq('client_id', client_id);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Admin chat error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/admin/chat/reply', requireAuth, async (req, res) => {
    try {
        const { client_id, message } = req.body;

        if (!client_id || !message) {
            return res.status(400).json({ success: false, message: 'Client ID and message are required' });
        }

        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('name, email')
            .eq('id', client_id)
            .single();

        if (clientError) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        const { data, error } = await supabase
            .from('client_chat_messages')
            .insert({
                client_id: client_id,
                client_email: client.email,
                client_name: client.name || 'Client',
                message: message,
                is_admin: true,
                is_read: true,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Reply error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not send reply'
            });
        }

        try {
            await supabase
                .from('customer_notifications')
                .insert({
                    customer_email: client.email,
                    customer_name: client.name || 'Client',
                    title: '💬 Admin Reply',
                    message: `Admin replied: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
                    notification_type: 'chat_reply',
                    is_read: false,
                    created_at: new Date().toISOString()
                });
        } catch (notifError) {
            console.warn('Client notification error:', notifError.message);
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Reply error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/admin/chat/mark-read/:client_id', requireAuth, async (req, res) => {
    try {
        const { client_id } = req.params;

        const { error } = await supabase
            .from('client_chat_messages')
            .update({ is_read: true })
            .eq('client_id', client_id)
            .eq('is_read', false);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/* =========================================================
   📢 NOTIFICATIONS API
========================================================= */

app.get('/api/notifications', async (req, res) => {
    try {
        const email = req.query.email;
        console.log('📩 Fetching notifications for:', email);
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        const { data, error } = await supabase
            .from('customer_notifications')
            .select('*')
            .eq('customer_email', email)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Database error:', error);
            throw error;
        }

        console.log(`✅ Found ${data?.length || 0} notifications`);
        res.json({ success: true, data: data || [] });
        
    } catch (error) {
        console.error('❌ Notifications error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Could not load notifications' 
        });
    }
});

app.put('/api/notifications/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📩 Marking notification as read:', id);

        const { data, error } = await supabase
            .from('customer_notifications')
            .update({
                status: 'read',
                read_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('❌ Database error:', error);
            throw error;
        }

        console.log('✅ Notification marked as read');
        res.json({ success: true, data });
        
    } catch (error) {
        console.error('❌ Mark read error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Could not mark as read' 
        });
    }
});

app.post('/api/notifications', async (req, res) => {
    try {
        const { customer_email, customer_name, message, notification_type, title, action_url } = req.body;

        if (!customer_email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Email and message are required'
            });
        }

        const { data, error } = await supabase
            .from('customer_notifications')
            .insert({
                customer_email,
                customer_name: customer_name || 'Client',
                message,
                notification_type: notification_type || 'general',
                title: title || 'Notification',
                action_url: action_url || null,
                status: 'unread',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Database error:', error);
            throw error;
        }

        console.log('✅ Notification created for:', customer_email);
        res.status(201).json({ success: true, data });
        
    } catch (error) {
        console.error('❌ Create notification error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Could not create notification' 
        });
    }
});


/* =========================================================
   📢 ADMIN NOTIFICATIONS API
========================================================= */

// ✅ Admin - Send notification to clients
app.post('/api/admin/notifications/send', requireAuth, async (req, res) => {
    try {
        const { title, message, notification_type, target_type, target_clients } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }

        // ✅ Create notification record
        const { data: notification, error } = await supabase
            .from('admin_notifications')
            .insert({
                title,
                message,
                notification_type: notification_type || 'announcement',
                target_type: target_type || 'all',
                target_clients: target_clients || [],
                created_by: req.user?.id || 'admin',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Create notification error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not create notification',
                error: error.message
            });
        }

        // ✅ Get target clients
        let clients = [];
        if (target_type === 'all') {
            const { data: allClients, error: allError } = await supabase
                .from('clients')
                .select('id, name, email')
                .eq('status', 'approved');
            
            if (allError) {
                console.error('Get clients error:', allError);
            } else {
                clients = allClients || [];
            }
        } else if (target_type === 'specific' && target_clients && target_clients.length > 0) {
            const { data: specificClients, error: specificError } = await supabase
                .from('clients')
                .select('id, name, email')
                .in('id', target_clients)
                .eq('status', 'approved');
            
            if (specificError) {
                console.error('Get specific clients error:', specificError);
            } else {
                clients = specificClients || [];
            }
        }

        // ✅ Create notifications for each client
        let sentCount = 0;
        for (const client of clients) {
            const { error: notifError } = await supabase
                .from('customer_notifications')
                .insert({
                    order_id: null,
                    customer_email: client.email,
                    customer_name: client.name,
                    message: message,
                    notification_type: notification_type || 'announcement',
                    title: title,
                    action_url: '/client-notifications.html',
                    is_broadcast: true,
                    status: 'unread',
                    created_at: new Date().toISOString()
                });

            if (!notifError) {
                sentCount++;
            }
        }

        // ✅ Update sent_at
        await supabase
            .from('admin_notifications')
            .update({ 
                sent_at: new Date().toISOString(),
                sent_count: sentCount 
            })
            .eq('id', notification.id);

        res.json({
            success: true,
            message: `Notification sent successfully!`,
            data: {
                notification: notification,
                sent_count: sentCount,
                total_clients: clients.length
            }
        });

    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not send notification',
            error: error.message
        });
    }
});

// ✅ Admin - Get all notifications (with pagination)
app.get('/api/admin/notifications', requireAuth, async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        
        const { data, error } = await supabase
            .from('admin_notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        if (error) {
            console.error('Get notifications error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load notifications',
                error: error.message
            });
        }

        // Get total count
        const { count, error: countError } = await supabase
            .from('admin_notifications')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Count error:', countError);
        }

        res.json({
            success: true,
            data: data || [],
            total: count || 0
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not load notifications',
            error: error.message
        });
    }
});

// ✅ Admin - Get single notification
app.get('/api/admin/notifications/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('admin_notifications')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Get notification error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load notification',
                error: error.message
            });
        }

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('Get notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not load notification',
            error: error.message
        });
    }
});

// ✅ Admin - Delete notification
app.delete('/api/admin/notifications/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('admin_notifications')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete notification error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not delete notification',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not delete notification',
            error: error.message
        });
    }
});
/* =========================================================
   SERVICES SALE API
========================================================= */

app.get('/api/services-sale', async (req, res) => {
    try {
        const { category, featured } = req.query;
        
        let query = supabase
            .from('services_sale')
            .select('*')
            .eq('is_available', true)
            .order('sort_order', { ascending: true });

        if (category) query = query.eq('category', category);
        if (featured === 'true') query = query.eq('is_featured', true);

        const { data, error } = await query;
        if (error) throw error;
        res.json({ success: true, data: data || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/services-sale/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const { data, error } = await supabase
            .from('services_sale')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) throw error;
        
        await supabase
            .from('services_sale')
            .update({ views: (data.views || 0) + 1 })
            .eq('id', data.id);

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/* =========================================================
   ORDER API
========================================================= */

app.post('/api/order', async (req, res) => {
    try {
        const { service_id, customer_name, customer_email, customer_phone, notes, payment_method } = req.body;

        if (!service_id || !customer_name || !customer_email) {
            return res.status(400).json({
                success: false,
                message: 'Service ID, name and email are required'
            });
        }

        const { data: service, error: serviceError } = await supabase
            .from('services_sale')
            .select('price, name, category')
            .eq('id', service_id)
            .single();

        if (serviceError) {
            console.error('Service error:', serviceError);
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        const { data, error } = await supabase
            .from('orders')
            .insert({
                service_id,
                customer_name,
                customer_email,
                customer_phone: customer_phone || '',
                amount: service.price,
                payment_method: payment_method || 'pending',
                notes: notes || '',
                payment_status: 'pending',
                order_status: 'processing',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Order creation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not create order',
                error: error.message
            });
        }

        try {
            await createAdminNotification({
                type: 'order',
                title: '🛒 New Order Received!',
                message: `${customer_name} ordered "${service.name}" worth $${service.price}`,
                link: '/admin-orders.html',
                icon: '🛒',
                color: '#10b981'
            });
        } catch (notifError) {
            console.warn('Notification error:', notifError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            data: data
        });

    } catch (error) {
        console.error('Order error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not place order',
            error: error.message
        });
    }
});

app.get('/api/admin/orders', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*, services_sale(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: data || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/admin/orders/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_status, order_status } = req.body;

        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*, services_sale(name)')
            .eq('id', id)
            .single();

        if (fetchError) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const { data, error } = await supabase
            .from('orders')
            .update({
                payment_status: payment_status || 'pending',
                order_status: order_status || 'processing',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Update order error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not update order',
                error: error.message
            });
        }

        try {
            const statusEmoji = {
                'pending': '⏳',
                'processing': '🔄',
                'completed': '✅',
                'cancelled': '❌'
            };
            
            const statusMessages = {
                'pending': 'Your order is pending review.',
                'processing': 'Your order is being processed.',
                'completed': 'Your order has been completed! 🎉',
                'cancelled': 'Your order has been cancelled.'
            };

            const message = `${statusEmoji[order_status] || '📦'} Order #${order.id.substring(0, 8)}: ${statusMessages[order_status] || 'Status updated'}`;

            await fetch(`http://localhost:${PORT}/api/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization
                },
                body: JSON.stringify({
                    customer_email: order.customer_email,
                    customer_name: order.customer_name,
                    message: message,
                    title: '📦 Order Update',
                    notification_type: 'order_update'
                })
            });
        } catch (notifError) {
            console.error('❌ Notification error:', notifError.message);
        }

        res.json({
            success: true,
            message: 'Order updated successfully!',
            data: data
        });

    } catch (error) {
        console.error('Order update error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not update order',
            error: error.message
        });
    }
});

app.delete('/api/admin/orders/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete order error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not delete order',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Order deleted successfully'
        });

    } catch (error) {
        console.error('Order delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not delete order',
            error: error.message
        });
    }
});

/* =========================================================
   PAYMENT API
========================================================= */

app.post('/api/payment/initiate', async (req, res) => {
    try {
        const { order_id, customer_name, customer_email, amount } = req.body;
        
        console.log('💰 Payment Request:', { order_id, customer_name, customer_email, amount });

        if (!order_id || !customer_name || !customer_email) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        await supabase
            .from('orders')
            .update({
                payment_status: 'completed',
                order_status: 'processing'
            })
            .eq('id', order_id);

          return res.json({
            success: true,
            redirect_url: `${BASE_URL}/payment-success.html?order=${order_id}&test=true`
        });

    } catch (error) {
        console.error('❌ Payment error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Payment initiation failed'
        });
    }
});

/* =========================================================
   FRONTEND FALLBACK
========================================================= */

app.get('/service/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'service.html'));
});

app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, () => {
    console.log(`🚀 My Resume Portfolio running at http://localhost:${PORT}`);
    console.log('👥 Client Portal API ready');
    console.log('💬 Chat System ready');
    console.log('📢 Notifications API ready');
    console.log('✅ All systems ready!');
});