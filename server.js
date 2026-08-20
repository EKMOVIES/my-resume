require('dotenv').config();

const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const pdf = require('html-pdf');
const multer = require('multer');
const fs = require('fs');

// Nodemailer - optional (যদি ইনস্টল থাকে)
let nodemailer;
try {
    nodemailer = require('nodemailer');
    console.log('✅ Nodemailer loaded successfully');
} catch (error) {
    console.warn('⚠️ Nodemailer not installed. Email notifications disabled.');
    nodemailer = null;
}

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
                is_read: false
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

        // Send email notification
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
   BLOG COMMENTS API
========================================================= */

app.get('/api/blog/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;

        const { data, error } = await supabase
            .from('blog_comments')
            .select('*')
            .eq('post_id', postId)
            .eq('is_approved', true)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Comments load error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load comments.',
                error: error.message
            });
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Comments GET server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.post('/api/blog/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;
        const { name, email, comment } = req.body;

        if (!name || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Name and comment are required.'
            });
        }

        const { data, error } = await supabase
            .from('blog_comments')
            .insert({
                post_id: parseInt(postId),
                name,
                email: email || '',
                comment,
                is_approved: false
            })
            .select()
            .single();

        if (error) {
            console.error('Comment create error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not post comment.',
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Comment posted successfully. Awaiting approval.',
            data
        });
    } catch (error) {
        console.error('Comment POST server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.get('/api/admin/comments', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('blog_comments')
            .select('*, blog_posts(title)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Admin comments load error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load comments.',
                error: error.message
            });
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Admin comments GET server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.put('/api/admin/comments/:id/approve', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('blog_comments')
            .update({ is_approved: true })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Comment approve error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not approve comment.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Comment approved successfully.',
            data
        });
    } catch (error) {
        console.error('Comment approve PUT server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

app.delete('/api/admin/comments/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('blog_comments')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Comment delete error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not delete comment.',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Comment deleted successfully.'
        });
    } catch (error) {
        console.error('Comment DELETE server error:', error);
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

// PUBLIC API (No Auth Required)
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

// ADMIN API (Auth Required)
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

app.get('/api/admin/files/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('file_manager')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('File load error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not load file.',
                error: error.message
            });
        }

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'File not found.'
            });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('File GET server error:', error);
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
   📁 SERVER FILE UPLOAD (Render Compatible)
========================================================= */

// ✅ Render-এ Persistent Disk ব্যবহার
let uploadDir;
if (process.env.RENDER) {
    uploadDir = '/data/uploads';
} else {
    uploadDir = path.join(__dirname, 'public', 'uploads');
}

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, Date.now() + '-' + cleanName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }
});

// 📤 Upload File to Server (Admin Only)
app.post('/api/admin/upload-server', requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const { category, description } = req.body;
        const fileUrl = `/uploads/${req.file.filename}`;

        let fileType = 'document';
        if (req.file.mimetype.startsWith('image/')) {
            fileType = 'image';
        } else if (req.file.mimetype === 'application/pdf') {
            fileType = 'pdf';
        }

        const { data, error } = await supabase
            .from('file_manager')
            .insert({
                file_name: req.file.originalname,
                file_url: fileUrl,
                file_type: fileType,
                file_size: req.file.size,
                category: category || 'Uncategorized',
                description: description || '',
                uploaded_by: req.user?.email || 'Admin'
            })
            .select()
            .single();

        if (error) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
            return res.status(500).json({
                success: false,
                message: 'Could not save file',
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            data: { ...data, file_url: fileUrl }
        });

    } catch (error) {
        console.error('Upload error:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        res.status(500).json({
            success: false,
            message: 'Could not upload file',
            error: error.message
        });
    }
});

// 🗑️ Delete File from Server
app.delete('/api/admin/delete-server-file/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: fileData, error: fetchError } = await supabase
            .from('file_manager')
            .select('file_url')
            .eq('id', id)
            .single();

        if (fetchError) {
            return res.status(500).json({
                success: false,
                message: 'Could not find file'
            });
        }

        const { error: deleteError } = await supabase
            .from('file_manager')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return res.status(500).json({
                success: false,
                message: 'Could not delete from database'
            });
        }

        if (fileData?.file_url) {
            const filePath = path.join(uploadDir, path.basename(fileData.file_url));
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) {}
            }
        }

        res.json({ success: true, message: 'File deleted successfully' });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not delete file'
        });
    }
});

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

/* =========================================================
   📄 PDF RESUME GENERATOR
========================================================= */

// Helper: Generate Resume HTML
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

    // Education HTML
    const educationHTML = education && education.length > 0 ? education.map(item => `
        <div class="edu-item">
            <h4>${item.institution || 'Institution'}</h4>
            <p><strong>${item.degree || 'Degree'}</strong></p>
            <p class="date">${item.start_year || ''} ${item.end_year ? '- ' + item.end_year : ''}</p>
            ${item.description ? `<p>${item.description}</p>` : ''}
        </div>
    `).join('') : '<p>No education added yet.</p>';

    // Experience HTML
    const experienceHTML = experience && experience.length > 0 ? experience.map(item => `
        <div class="exp-item">
            <h4>${item.company || 'Company'}</h4>
            <p><strong>${item.job_title || 'Position'}</strong></p>
            <p class="date">${item.start_date ? new Date(item.start_date).getFullYear() : ''} ${item.end_date ? '- ' + new Date(item.end_date).getFullYear() : ''}</p>
            ${item.description ? `<p>${item.description}</p>` : ''}
        </div>
    `).join('') : '<p>No experience added yet.</p>';

    // Skills HTML
    const skillsHTML = skills && skills.length > 0 ? skills.map(item => `
        <div class="skill-item">
            <span class="skill-name">${item.name || 'Skill'}</span>
            <div class="skill-bar">
                <div class="skill-fill" style="width: ${item.level || 0}%;"></div>
            </div>
        </div>
    `).join('') : '<p>No skills added yet.</p>';

    // Projects HTML
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

// 📄 Generate PDF - Public (No Auth)
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

// 📄 Preview Resume (Admin Only)
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

// ✅ Client Signup (No Auth Required)
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

        // Check if email exists
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

        // Create client
        const { data: client, error } = await supabase
            .from('clients')
            .insert({
                name,
                email,
                password_hash: password,
                company: company || '',
                phone: phone || '',
                status: 'pending'
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

        // Send notification to admin
        try {
            await sendAdminNotification({
                subject: '📝 New Client Signup Request',
                html: `
                    <h2>New Client Signup Request</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Company:</strong> ${company || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
                    <p><a href="https://your-site.com/admin-clients.html">Approve or Reject</a></p>
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

// ✅ Client Login
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

        // Find client
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

        // Check status
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

        // Verify password
        if (client.password_hash !== password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
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

// ✅ Get client projects (for client dashboard)
app.get('/api/client/projects', async (req, res) => {
    try {
        const token = req.headers.authorization?.substring(7);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        let clientId = req.query.clientId; // Admin থেকে clientId পাঠানো হলে
            
        // যদি clientId না থাকে, token থেকে নাও
        if (!clientId) {
            clientId = Buffer.from(token, 'base64').toString().split(':')[0];
        }

        // Verify client exists
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

// ✅ Client Files
app.get('/api/client/files/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const token = req.headers.authorization?.substring(7);
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const { data, error } = await supabase
            .from('client_files')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: data || []
        });

    } catch (error) {
        console.error('Files error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not load files'
        });
    }
});

// ✅ Client Send Message
app.post('/api/client/message', async (req, res) => {
    try {
        const { projectId, message } = req.body;
        const token = req.headers.authorization?.substring(7);
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!message || !projectId) {
            return res.status(400).json({
                success: false,
                message: 'Project ID and message are required'
            });
        }

        const clientId = Buffer.from(token, 'base64').toString().split(':')[0];

        // Verify project belongs to client
        const { data: project, error: projectError } = await supabase
            .from('client_projects')
            .select('id')
            .eq('id', projectId)
            .eq('client_id', clientId)
            .single();

        if (projectError || !project) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this project'
            });
        }

        const { data, error } = await supabase
            .from('client_messages')
            .insert({
                client_id: clientId,
                project_id: projectId,
                sender_type: 'client',
                message: message,
                is_read: false
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Notify admin (optional)
        try {
            await sendAdminNotification({
                subject: '💬 New Message from Client',
                html: `
                    <h2>New Message</h2>
                    <p><strong>Client:</strong> ${clientId}</p>
                    <p><strong>Project:</strong> ${projectId}</p>
                    <p><strong>Message:</strong> ${message}</p>
                `
            });
        } catch (e) {}

        res.json({
            success: true,
            message: 'Message sent successfully',
            data: data
        });

    } catch (error) {
        console.error('Message error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not send message'
        });
    }
});

// ✅ Get messages for a project
app.get('/api/client/messages/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const token = req.headers.authorization?.substring(7);
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const clientId = Buffer.from(token, 'base64').toString().split(':')[0];

        // Verify project belongs to client
        const { data: project, error: projectError } = await supabase
            .from('client_projects')
            .select('id')
            .eq('id', projectId)
            .eq('client_id', clientId)
            .single();

        if (projectError || !project) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this project'
            });
        }

        const { data, error } = await supabase
            .from('client_messages')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: data || []
        });

    } catch (error) {
        console.error('Messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not load messages'
        });
    }
});

// ✅ Admin - Get all clients
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

// ✅ Admin - Create client
app.post('/api/admin/clients', requireAuth, async (req, res) => {
    try {
        const { name, email, password, company, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        // Check if email exists
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
                status: 'approved' // Admin created clients are auto-approved
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

// ✅ Admin - Approve client
app.put('/api/admin/clients/:id/approve', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        // Get client email first
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

        // Send approval email
        try {
            await sendClientEmail({
                to: client.email,
                subject: '✅ Account Approved!',
                html: `
                    <h2>Congratulations ${client.name}!</h2>
                    <p>Your account has been approved by the admin.</p>
                    <p>You can now login to access your portal:</p>
                    <p><a href="https://your-site.com/client-login.html">Login Here</a></p>
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

// ✅ Admin - Reject client
app.put('/api/admin/clients/:id/reject', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        // Get client email first
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

        // Send rejection email
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

// ✅ Admin - Delete client
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

// ✅ Admin - Add project to client
app.post('/api/admin/client-project', requireAuth, async (req, res) => {
    try {
        const { clientId, projectName, projectType, description, status, startDate, endDate, budget } = req.body;
        console.log('📁 Adding project for client:', clientId);

        if (!clientId || !projectName) {
            return res.status(400).json({
                success: false,
                message: 'Client ID and project name are required'
            });
        }

        // Check if client exists
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

        console.log('✅ Project added:', data.id);
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

console.log('✅ Client Portal API ready');

/* =========================================================
   ANALYTICS API
========================================================= */

// Track page view
app.post('/api/analytics/pageview', async (req, res) => {
    try {
        const { page, referrer, user_agent } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        
        let country = 'Unknown';
        try {
            const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=country`);
            const geoData = await geoResponse.json();
            country = geoData.country || 'Unknown';
        } catch (e) {}

        const { data, error } = await supabase
            .from('analytics_pageviews')
            .insert({
                page: page || '/',
                ip_address: ip,
                country: country,
                referrer: referrer || 'Direct',
                user_agent: user_agent || 'Unknown',
                viewed_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Analytics error:', error);
            return res.status(500).json({
                success: false,
                message: 'Could not track pageview'
            });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Analytics server error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Track resume download
app.post('/api/analytics/resume-download', async (req, res) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        
        const { data, error } = await supabase
            .from('analytics_resume_downloads')
            .insert({
                downloaded_at: new Date().toISOString(),
                ip_address: ip
            })
            .select()
            .single();

        if (error) {
            console.error('Resume download tracking error:', error);
            return res.status(500).json({ success: false, message: 'Could not track download' });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Resume download error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Track project click
app.post('/api/analytics/project-click', async (req, res) => {
    try {
        const { project_id, project_title, link_type } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

        const { data, error } = await supabase
            .from('analytics_project_clicks')
            .insert({
                project_id: project_id || null,
                project_title: project_title || 'Unknown',
                link_type: link_type || 'click',
                ip_address: ip,
                clicked_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Project click tracking error:', error);
            return res.status(500).json({ success: false, message: 'Could not track click' });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Project click error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Track blog view
app.post('/api/analytics/blog-view', async (req, res) => {
    try {
        const { post_id, post_title } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

        const { data, error } = await supabase
            .from('analytics_blog_views')
            .insert({
                post_id: post_id || null,
                post_title: post_title || 'Unknown',
                ip_address: ip,
                viewed_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Blog view tracking error:', error);
            return res.status(500).json({ success: false, message: 'Could not track view' });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Blog view error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Track contact form submission
app.post('/api/analytics/contact-submission', async (req, res) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        
        const { data, error } = await supabase
            .from('analytics_contact_submissions')
            .insert({
                submitted_at: new Date().toISOString(),
                ip_address: ip
            })
            .select()
            .single();

        if (error) {
            console.error('Contact submission tracking error:', error);
            return res.status(500).json({ success: false, message: 'Could not track submission' });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Contact submission error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET ANALYTICS DATA (Admin only)
app.get('/api/admin/analytics', requireAuth, async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { count: totalViews, error: viewsError } = await supabase
            .from('analytics_pageviews')
            .select('*', { count: 'exact', head: true })
            .gte('viewed_at', startDate.toISOString());

        if (viewsError) throw viewsError;

        const { data: uniqueIPs, error: ipError } = await supabase
            .from('analytics_pageviews')
            .select('ip_address')
            .gte('viewed_at', startDate.toISOString());

        if (ipError) throw ipError;

        const uniqueIPCount = new Set(uniqueIPs?.map(item => item.ip_address)).size;

        const { data: dailyViews, error: dailyError } = await supabase
            .from('analytics_pageviews')
            .select('viewed_at')
            .gte('viewed_at', startDate.toISOString())
            .order('viewed_at', { ascending: true });

        if (dailyError) throw dailyError;

        const dailyData = {};
        dailyViews?.forEach(view => {
            const date = new Date(view.viewed_at).toLocaleDateString();
            dailyData[date] = (dailyData[date] || 0) + 1;
        });

        const dailyChartData = Object.keys(dailyData).map(date => ({
            date,
            views: dailyData[date]
        }));

        // Get top pages
        let topPages = [];
        try {
            const { data } = await supabase
                .from('analytics_pageviews')
                .select('page')
                .gte('viewed_at', startDate.toISOString());

            if (data) {
                const pageCounts = {};
                data.forEach(item => {
                    const page = item.page || '/';
                    pageCounts[page] = (pageCounts[page] || 0) + 1;
                });
                topPages = Object.keys(pageCounts).map(page => ({
                    page,
                    count: pageCounts[page]
                })).sort((a, b) => b.count - a.count).slice(0, 10);
            }
        } catch (e) {}

        // Get countries
        let countries = [];
        try {
            const { data } = await supabase
                .from('analytics_pageviews')
                .select('country')
                .gte('viewed_at', startDate.toISOString())
                .not('country', 'is', null);

            if (data) {
                const countryCounts = {};
                data.forEach(item => {
                    const country = item.country || 'Unknown';
                    countryCounts[country] = (countryCounts[country] || 0) + 1;
                });
                countries = Object.keys(countryCounts).map(country => ({
                    country,
                    count: countryCounts[country]
                })).sort((a, b) => b.count - a.count).slice(0, 10);
            }
        } catch (e) {}

        // Get referrers
        let referrers = [];
        try {
            const { data } = await supabase
                .from('analytics_pageviews')
                .select('referrer')
                .gte('viewed_at', startDate.toISOString());

            if (data) {
                const referrerCounts = {};
                data.forEach(item => {
                    const referrer = item.referrer || 'Direct';
                    referrerCounts[referrer] = (referrerCounts[referrer] || 0) + 1;
                });
                referrers = Object.keys(referrerCounts).map(referrer => ({
                    referrer,
                    count: referrerCounts[referrer]
                })).sort((a, b) => b.count - a.count).slice(0, 10);
            }
        } catch (e) {}

        const { count: resumeDownloads, error: resumeError } = await supabase
            .from('analytics_resume_downloads')
            .select('*', { count: 'exact', head: true })
            .gte('downloaded_at', startDate.toISOString());

        if (resumeError) throw resumeError;

        // Get project clicks
        let projectClicks = [];
        try {
            const { data } = await supabase
                .from('analytics_project_clicks')
                .select('project_title')
                .gte('clicked_at', startDate.toISOString());

            if (data) {
                const projectCounts = {};
                data.forEach(item => {
                    const title = item.project_title || 'Unknown';
                    projectCounts[title] = (projectCounts[title] || 0) + 1;
                });
                projectClicks = Object.keys(projectCounts).map(title => ({
                    project_title: title,
                    count: projectCounts[title]
                })).sort((a, b) => b.count - a.count).slice(0, 10);
            }
        } catch (e) {}

        // Get blog views
        let blogViews = [];
        try {
            const { data } = await supabase
                .from('analytics_blog_views')
                .select('post_title')
                .gte('viewed_at', startDate.toISOString());

            if (data) {
                const blogCounts = {};
                data.forEach(item => {
                    const title = item.post_title || 'Unknown';
                    blogCounts[title] = (blogCounts[title] || 0) + 1;
                });
                blogViews = Object.keys(blogCounts).map(title => ({
                    post_title: title,
                    count: blogCounts[title]
                })).sort((a, b) => b.count - a.count).slice(0, 10);
            }
        } catch (e) {}

        const { count: contactSubmissions, error: contactError } = await supabase
            .from('analytics_contact_submissions')
            .select('*', { count: 'exact', head: true })
            .gte('submitted_at', startDate.toISOString());

        if (contactError) throw contactError;

        res.json({
            success: true,
            data: {
                totalViews: totalViews || 0,
                uniqueVisitors: uniqueIPCount || 0,
                resumeDownloads: resumeDownloads || 0,
                contactSubmissions: contactSubmissions || 0,
                dailyViews: dailyChartData || [],
                topPages: topPages || [],
                countries: countries || [],
                referrers: referrers || [],
                projectClicks: projectClicks || [],
                blogViews: blogViews || [],
                period: days
            }
        });

    } catch (error) {
        console.error('Analytics data error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not load analytics data',
            error: error.message
        });
    }
});

/* =========================================================
   FRONTEND FALLBACK
========================================================= */

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
    console.log('📊 Analytics endpoints enabled');
    console.log('📄 PDF Resume Generator enabled');
    console.log('📁 Server File Upload enabled');
    console.log('👥 Client Portal API ready');
    console.log('✅ All systems ready!');
});