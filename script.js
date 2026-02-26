document.addEventListener('DOMContentLoaded', () => {
    // Force scroll to top on load to ensure Hero section is seen
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // Custom Cursor
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    const links = document.querySelectorAll('a, button, .skill-category, input, textarea');

    if (window.matchMedia("(pointer: fine)").matches) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';

            setTimeout(() => {
                follower.style.left = e.clientX + 'px';
                follower.style.top = e.clientY + 'px';
            }, 50);
        });

        links.forEach(link => {
            link.addEventListener('mouseenter', () => {
                document.body.classList.add('cursor-active');
            });
            link.addEventListener('mouseleave', () => {
                document.body.classList.remove('cursor-active');
            });
        });
    }

    // Intersection Observer for Reveal Animations
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    // Smooth Scroll specifically for Safari/older browsers fallback handled by CSS, 
    // but we add active state to nav links here if needed.

    // Form Submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const btn = contactForm.querySelector('.btn-submit');
            const originalText = btn.innerHTML;

            btn.innerHTML = 'Sending...';
            btn.style.opacity = '0.7';

            // Simulate API call
            setTimeout(() => {
                btn.innerHTML = 'Message Sent! <i data-feather="check"></i>';
                btn.style.background = 'var(--text-primary)';
                btn.style.color = '#000';

                contactForm.reset();

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.style.color = '';
                    btn.style.opacity = '1';
                }, 3000);
            }, 1500);
        });
    }

    // Mobile Menu (Simple implementation)
    // Note: In a real app we'd toggle a class on nav-links
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-link, .nav-button').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
    }
});

// AI Chatbot Logic
document.addEventListener('DOMContentLoaded', () => {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotContainer = document.getElementById('chatbot-container');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotMessages = document.getElementById('chatbot-messages');

    // Setup Supabase (Ensure supabase-js is loaded in index.html)
    const SUPABASE_URL = 'https://balwqqisfhehzydeehtd.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhbHdxcWlzZmhlaHp5ZGVlaHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4OTM1NDcsImV4cCI6MjA4NzQ2OTU0N30.KLuUNKm4Y4SnPYZcr16f8RjWu0vLGCG4jVKNlGVHn6s';
    const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
    
    const GEMINI_API_KEY = 'AIzaSyAZUt9B2pfcPZi-qiqii10cwAiGqWEfkCI.'; // API Key provided by user

    const systemPrompt = `You are a digital transformation strategist from MetaHire Solutions, Dubai.
Your mission is to identify business inefficiencies and convert them into AI-powered automated systems.
If a client:
- Is stuck with a developer -> Offer project rescue.
- Has no CRM -> Offer AI-powered CRM.
- Is manually managing leads -> Offer automation.
- Has high operational cost -> Offer AI agents.
- Wants scaling -> Offer AI-driven growth architecture.
Always position the company as: Affordable. Scalable. AI-First. Results-Focused.

You must collect structured data including: Company Name, Industry, Contact Details, Project Type, Current Challenges, Budget Range, Timeline, Existing Tech Stack, Team Size, Expected Outcome.
Ask these questions conversationally and naturally, one or two at a time. Do not overwhelm the user.

IMPORTANT INSTRUCTION: 
When you have successfully collected ALL of the above information from the user during the natural flow of conversation, you MUST output a JSON object containing the data, wrapped in a markdown code block starting with \`\`\`json and ending with \`\`\`. 
The JSON keys should be EXACTLY: company_name, industry, contact_details, project_type, current_challenges, budget_range, timeline, existing_tech_stack, team_size, expected_outcome.
Do not output anything else in that specific message except the JSON block. Do not say "Here is the JSON", just output the markdown JSON block.`;

    let chatHistory = [];

    const toggleChat = () => {
        chatbotContainer.classList.toggle('hidden');
        if (!chatbotContainer.classList.contains('hidden')) {
            chatbotInput.focus();
        }
    };

    chatbotToggle.addEventListener('click', toggleChat);
    chatbotClose.addEventListener('click', toggleChat);

    const addMessage = (message, isUser = false, isLoading = false) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        
        if (isLoading) {
            messageDiv.id = 'loading-message';
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Simple markdown parsing for bold text
        let formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        contentDiv.innerHTML = formattedMessage;
        
        messageDiv.appendChild(contentDiv);
        chatbotMessages.appendChild(messageDiv);
        
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    };

    const callGemini = async (userMessage) => {
        chatHistory.push({ "role": "user", "parts": [{ "text": userMessage }] });
        
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: { text: systemPrompt } },
                    contents: chatHistory
                })
            });
            
            const data = await response.json();
            
            if (data.candidates && data.candidates.length > 0) {
                const aiText = data.candidates[0].content.parts[0].text;
                
                // Check if it's the JSON payload
                if (aiText.includes('```json')) {
                    const jsonStrMatch = aiText.match(/```json\n([\s\S]*?)\n```/);
                    if (jsonStrMatch && jsonStrMatch[1]) {
                        try {
                            const leadData = JSON.parse(jsonStrMatch[1].trim());
                            
                            // Send to Supabase
                            if(supabase) {
                                const { error } = await supabase.from('client_leads').insert([leadData]);
                                if (error) {
                                    console.error('Supabase Error:', error);
                                    addMessage("I collected your details, but there was an error saving them to our system. Please try again later.");
                                    chatHistory.push({ "role": "model", "parts": [{ "text": "Error saving to database." }] });
                                } else {
                                    addMessage("Thank you! I have successfully saved your project details. Our team at MetaHire Solutions will review this and contact you shortly to discuss the next steps.");
                                    chatHistory.push({ "role": "model", "parts": [{ "text": "Saved successfully to database." }] });
                                }
                            } else {
                                addMessage("Thank you! Supabase is currently not connected, but I have collected your details.");
                            }
                        } catch (e) {
                            console.error('Error parsing JSON:', e);
                            addMessage("Thank you! I have collected your details (error formatting).");
                        }
                    }
                } else {
                    addMessage(aiText);
                    chatHistory.push({ "role": "model", "parts": [{ "text": aiText }] });
                }
            } else {
                 addMessage("I'm sorry, I couldn't generate a response. Please try again.");
            }
        } catch (error) {
            console.error('Error calling Gemini:', error);
            addMessage("I'm having trouble connecting right now. Please check your internet connection and try again.");
        }
    };

    const handleSend = async () => {
        const message = chatbotInput.value.trim();
        if (message) {
            addMessage(message, true);
            chatbotInput.value = '';
            chatbotInput.disabled = true;
            chatbotSend.disabled = true;
            
            addMessage("Typing...", false, true); // Loading state
            
            await callGemini(message);
            
            const loadingEl = document.getElementById('loading-message');
            if(loadingEl) loadingEl.remove();
            
            chatbotInput.disabled = false;
            chatbotSend.disabled = false;
            chatbotInput.focus();
        }
    };

    chatbotSend.addEventListener('click', handleSend);
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !chatbotInput.disabled) {
            handleSend();
        }
    });
});
