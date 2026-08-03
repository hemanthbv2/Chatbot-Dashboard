/**
 * RVGHS Chatbot — Conversation Engine & State Machine
 * Handles chat interactions, form submissions, and intent matching
 */

(function () {
  'use strict';

  // ─── State ─────────────────────────────────────────────────
  let isOpen = false;
  let isTyping = false;
  let messageQueue = [];
  let currentFlow = null;
  let promptDismissed = false;
  let inactivityTimer = null;
  const INACTIVITY_TIMEOUT = 120000; // 120 seconds (2 minutes)
  const STORAGE_KEY = 'rvghs_chatbot_state';

  // Helper to dynamically resolve the logo path in WordPress or standalone environments
  const getLogoUrl = () => {
    return (window.rvghsChatbotSettings && window.rvghsChatbotSettings.logoUrl)
      ? window.rvghsChatbotSettings.logoUrl
      : 'https://rvghs.edu.in/wp-content/uploads/2026/07/logo.png';
  };

  // ─── DOM References ────────────────────────────────────────
  const chatContainer = document.getElementById('chatContainer');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatToggle = document.getElementById('chatToggle');
  const chatCloseBtn = document.getElementById('chatCloseBtn');
  const chatClearBtn = document.getElementById('chatClearBtn');
  const welcomePrompt = document.getElementById('welcomePrompt');
  const welcomePromptClose = document.getElementById('welcomePromptClose');
  const landingCta = document.getElementById('landingCta');

  // ─── Initialize ────────────────────────────────────────────
  function init() {
    attachEventListeners();
    const loaded = loadState();

    if (!loaded) {
      showWelcomePrompt();
    }
  }

  // ─── Local Storage ────────────────────────────────────────
  function saveState() {
    const messages = [];
    const messageEls = chatMessages.querySelectorAll('.message');
    messageEls.forEach(el => {
      const isBot = el.classList.contains('bot');
      messages.push({
        type: isBot ? 'bot' : 'user',
        html: el.querySelector('.message-bubble').innerHTML,
        time: el.querySelector('.message-time').innerText
      });
    });

    // Determine if buttons or form are currently active
    let activeInteractive = null;
    const buttonsContainer = document.getElementById('buttonsContainer');
    const formContainer = document.getElementById('formContainer');

    if (formContainer && currentFlow) {
      activeInteractive = { type: 'form', flowId: currentFlow };
    } else if (buttonsContainer && currentFlow) {
      activeInteractive = { type: 'buttons', flowId: currentFlow };
    }

    const state = {
      isOpen,
      promptDismissed,
      currentFlow,
      messages,
      activeInteractive
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;

    try {
      const state = JSON.parse(saved);
      isOpen = state.isOpen;
      promptDismissed = state.promptDismissed;
      currentFlow = state.currentFlow;

      // Restore messages
      if (state.messages && state.messages.length > 0) {
        state.messages.forEach(msg => {
          const messageEl = document.createElement('div');
          messageEl.className = `message ${msg.type}`;
          messageEl.innerHTML = `
            <div class="message-avatar">${msg.type === 'bot' ? '<img src="' + getLogoUrl() + '" alt="RV">' : 'You'}</div>
            <div>
              <div class="message-bubble">${msg.html}</div>
              <span class="message-time">${msg.time}</span>
            </div>
          `;
          chatMessages.appendChild(messageEl);
        });
        scrollToBottom();
      } else {
        // If no messages, we should show welcome
        if (isOpen) {
          navigateTo('welcome');
        }
      }

      // Restore interactive elements
      if (state.activeInteractive) {
        const flow = CHAT_FLOWS[state.activeInteractive.flowId];
        if (flow) {
          if (state.activeInteractive.type === 'buttons' && flow.buttons) {
            renderButtons(flow.buttons, false); // Pass false to skip saving during load
          } else if (state.activeInteractive.type === 'form' && flow.form) {
            renderForm(flow.form, flow.buttons, false);
          }
        }
      }

      // Restore UI state
      if (isOpen) {
        chatContainer.classList.add('open');
        chatToggle.classList.add('hidden');
        resetInactivityTimer();
      }

      if (promptDismissed && welcomePrompt) {
        welcomePrompt.classList.add('hidden');
      }

      return state.messages && state.messages.length > 0;
    } catch (e) {
      console.error('[RVGHS Chatbot] Error loading state:', e);
      return false;
    }
  }

  // ─── Event Listeners ──────────────────────────────────────
  function attachEventListeners() {
    chatToggle.addEventListener('click', toggleChat);
    chatCloseBtn.addEventListener('click', closeChat);

    if (chatClearBtn) {
      chatClearBtn.addEventListener('click', clearChat);
    }

    chatSendBtn.addEventListener('click', handleUserInput);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserInput();
      }
    });

    if (welcomePrompt) {
      welcomePrompt.addEventListener('click', (e) => {
        if (!e.target.closest('.welcome-prompt-close')) {
          openChat();
        }
      });
    }

    if (welcomePromptClose) {
      welcomePromptClose.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissPrompt();
      });
    }

    if (landingCta) {
      landingCta.addEventListener('click', openChat);
    }
  }

  // ─── Chat Toggle ──────────────────────────────────────────
  function toggleChat() {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  function openChat() {
    isOpen = true;
    chatContainer.classList.add('open');
    chatToggle.classList.add('hidden');
    dismissPrompt();

    // Start welcome flow if no messages yet
    if (chatMessages.children.length === 0) {
      setTimeout(() => navigateTo('welcome'), 300);
    }

    saveState();
    setTimeout(() => chatInput.focus(), 500);
    resetInactivityTimer();
  }

  function closeChat() {
    isOpen = false;
    chatContainer.classList.remove('open');
    setTimeout(() => {
      chatToggle.classList.remove('hidden');
    }, 300);
    saveState();
    clearInactivityTimer();
  }

  function clearChat() {
    chatMessages.innerHTML = '';
    messageQueue = [];
    isTyping = false;
    currentFlow = null;
    localStorage.removeItem(STORAGE_KEY);
    clearInactivityTimer();

    if (isOpen) {
      setTimeout(() => navigateTo('welcome'), 100);
    }
  }

  // ─── Welcome Prompt ───────────────────────────────────────
  function showWelcomePrompt() {
    if (promptDismissed) return;
    setTimeout(() => {
      if (!isOpen && welcomePrompt) {
        welcomePrompt.classList.remove('hidden');
      }
    }, 5000); // Changed from 2s to 5s
  }

  function dismissPrompt() {
    promptDismissed = true;
    if (welcomePrompt) {
      welcomePrompt.classList.add('hidden');
    }
    saveState();
  }

  // ─── Navigation ───────────────────────────────────────────
  function navigateTo(flowId) {
    const flow = CHAT_FLOWS[flowId];
    if (!flow) {
      addBotMessage("I'm sorry, I couldn't find that information. Let me take you back to the main menu.");
      setTimeout(() => navigateTo('welcome'), 1000);
      return;
    }

    currentFlow = flowId;
    clearButtons();
    clearForms();

    // Queue messages
    const messages = flow.messages || [];
    const buttons = flow.buttons || [];
    const form = flow.form || null;

    showTypingIndicator();

    let totalDelay = 600;
    messages.forEach((msg, index) => {
      const delay = totalDelay + (msg.delay || 400);
      totalDelay = delay;

      setTimeout(() => {
        hideTypingIndicator();
        addBotMessage(msg.text);

        // Show typing for next message if more messages
        if (index < messages.length - 1) {
          setTimeout(() => showTypingIndicator(), 200);
        }
      }, delay);
    });

    // Show form after messages
    if (form) {
      setTimeout(() => {
        renderForm(form, buttons);
      }, totalDelay + 400);
    }

    // Show buttons after messages (and form if no form)
    if (!form && buttons.length > 0) {
      setTimeout(() => {
        renderButtons(buttons);
      }, totalDelay + 400);
    }

    saveState();
    resetInactivityTimer();
  }

  // ─── Messages ─────────────────────────────────────────────
  function addBotMessage(html) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message bot';
    messageEl.innerHTML = `
      <div class="message-avatar"><img src="${getLogoUrl()}" alt="RV" onerror="this.onerror=null;this.src='https://rvghs.edu.in/wp-content/uploads/2026/07/logo.png';"></div>
      <div>
        <div class="message-bubble">${formatMessage(html)}</div>
        <span class="message-time">${getTimeString()}</span>
      </div>
    `;
    chatMessages.appendChild(messageEl);
    saveState();
    scrollToBottom();
  }

  function addUserMessage(text) {
    if (window.rvghsTrackEvent) {
      window.rvghsTrackEvent('message', { intent: currentFlow || 'chat', query: text });
    }
    const messageEl = document.createElement('div');
    messageEl.className = 'message user';
    messageEl.innerHTML = `
      <div class="message-avatar">You</div>
      <div>
        <div class="message-bubble">${escapeHtml(text)}</div>
        <span class="message-time">${getTimeString()}</span>
      </div>
    `;
    chatMessages.appendChild(messageEl);
    saveState();
    scrollToBottom();
  }

  function formatMessage(html) {
    // Convert \n to <br>
    return html.replace(/\n/g, '<br>');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ─── Typing Indicator ────────────────────────────────────
  function showTypingIndicator() {
    if (isTyping) return;
    isTyping = true;

    const typingEl = document.createElement('div');
    typingEl.className = 'typing-indicator';
    typingEl.id = 'typingIndicator';
    typingEl.innerHTML = `
      <div class="message-avatar">RV</div>
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    chatMessages.appendChild(typingEl);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    isTyping = false;
    const typingEl = document.getElementById('typingIndicator');
    if (typingEl) typingEl.remove();
  }

  // ─── Buttons ──────────────────────────────────────────────
  function renderButtons(buttons, shouldSave = true) {
    clearButtons();
    const container = document.createElement('div');
    container.className = 'buttons-container';
    container.id = 'buttonsContainer';

    buttons.forEach((btn, index) => {
      const buttonEl = document.createElement('button');
      buttonEl.className = 'quick-btn' + (btn.label.includes('←') ? ' back-btn' : '');
      buttonEl.textContent = btn.label;
      buttonEl.style.animationDelay = `${index * 60}ms`;

      buttonEl.addEventListener('click', () => {
        addUserMessage(btn.label);
        clearButtons();
        clearForms();
        setTimeout(() => navigateTo(btn.action), 300);
      });

      container.appendChild(buttonEl);
    });

    chatMessages.appendChild(container);
    if (shouldSave) saveState();
    scrollToBottom();
  }

  function clearButtons() {
    const existing = document.getElementById('buttonsContainer');
    if (existing) {
      existing.remove();
      saveState();
    }
  }

  // ─── Forms ────────────────────────────────────────────────
  function renderForm(form, afterButtons, shouldSave = true) {
    clearForms();
    const container = document.createElement('div');
    container.className = 'chat-form';
    container.id = 'formContainer';

    const card = document.createElement('div');
    card.className = 'form-card';

    form.fields.forEach((field) => {
      const group = document.createElement('div');
      group.className = 'form-group';

      const label = document.createElement('label');
      label.textContent = field.label;
      label.setAttribute('for', `field_${field.name}`);
      group.appendChild(label);

      if (field.type === 'select') {
        const select = document.createElement('select');
        select.id = `field_${field.name}`;
        select.name = field.name;
        select.required = field.required;

        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = `Select ${field.label}`;
        defaultOpt.disabled = true;
        defaultOpt.selected = true;
        select.appendChild(defaultOpt);

        field.options.forEach((opt) => {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          select.appendChild(option);
        });

        group.appendChild(select);
      } else {
        const input = document.createElement('input');
        input.type = field.type;
        input.id = `field_${field.name}`;
        input.name = field.name;
        input.placeholder = field.placeholder || '';
        input.required = field.required;
        if (field.type === 'tel') {
          input.pattern = '[0-9]{10}';
          input.maxLength = 10;
          input.inputMode = 'numeric';
          // Block non-digit characters on keypress
          input.addEventListener('keypress', (e) => {
            if (!/[0-9]/.test(e.key)) {
              e.preventDefault();
            }
          });
          // Strip non-digits on paste/input
          input.addEventListener('input', (e) => {
            const cleaned = input.value.replace(/\D/g, '').slice(0, 10);
            if (input.value !== cleaned) {
              input.value = cleaned;
            }
          });
        }
        group.appendChild(input);
      }

      card.appendChild(group);
    });

    const submitBtn = document.createElement('button');
    submitBtn.className = 'form-submit-btn';
    submitBtn.textContent = form.submitLabel;
    submitBtn.type = 'button';

    submitBtn.addEventListener('click', () => {
      if (validateForm(card, form.fields)) {
        const formData = collectFormData(card, form.fields);
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        // Show user input summary
        const summary = form.fields.map(f => {
          const value = formData[f.name];
          return `${f.label}: ${value}`;
        }).join('\n');
        addUserMessage(summary);

        clearForms();

        // Send data to Google Sheets (if configured)
        sendToGoogleSheets(form.id, formData);

        // Show success response
        setTimeout(() => {
          showTypingIndicator();
          setTimeout(() => {
            hideTypingIndicator();
            addBotMessage(form.successMessage);

            if (afterButtons && afterButtons.length > 0) {
              setTimeout(() => renderButtons(afterButtons), 400);
            }
          }, 1000);
        }, 500);
      }
    });

    card.appendChild(submitBtn);
    container.appendChild(card);
    chatMessages.appendChild(container);
    if (shouldSave) saveState();
    scrollToBottom();
  }

  function clearForms() {
    const existing = document.getElementById('formContainer');
    if (existing) {
      existing.remove();
      saveState();
    }
  }

  function validateForm(card, fields) {
    let isValid = true;

    fields.forEach((field) => {
      const input = card.querySelector(`#field_${field.name}`);
      if (!input) return;

      const value = input.value.trim();

      if (field.required && !value) {
        input.style.borderColor = '#ef4444';
        input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)';
        isValid = false;
      } else if (field.type === 'tel' && value && !/^\d{10}$/.test(value)) {
        input.style.borderColor = '#ef4444';
        input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)';
        isValid = false;
      } else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        input.style.borderColor = '#ef4444';
        input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)';
        isValid = false;
      } else {
        input.style.borderColor = '';
        input.style.boxShadow = '';
      }
    });

    if (!isValid) {
      // Show validation message
      const existingError = card.querySelector('.form-error');
      if (!existingError) {
        const error = document.createElement('div');
        error.className = 'form-error';
        error.style.cssText = 'color: #f87171; font-size: 12px; text-align: center; margin-top: 4px;';
        error.textContent = '⚠️ Please fill in all required fields correctly';
        card.appendChild(error);
        setTimeout(() => error.remove(), 3000);
      }
    }

    return isValid;
  }

  function collectFormData(card, fields) {
    const data = {};
    fields.forEach((field) => {
      const input = card.querySelector(`#field_${field.name}`);
      if (input) data[field.name] = input.value.trim();
    });
    return data;
  }

  // ─── Google Sheets Integration ────────────────────────────
  function sendToGoogleSheets(formType, formData) {
    if (window.rvghsTrackEvent) {
      window.rvghsTrackEvent('form_submit', { formType, ...formData });
    }
    // Skip if Google Sheets URL is not configured
    if (typeof GOOGLE_SHEETS_URL === 'undefined' || !GOOGLE_SHEETS_URL || GOOGLE_SHEETS_URL === '') {
      console.log('[RVGHS Chatbot] Google Sheets URL not configured. Form data:', formType, formData);
      return;
    }

    // Map form data to spreadsheet columns based on form type
    let payload = {
      ...formData,
      formType: formType,
      name: formData.name || '',
      phone: formData.phone || '',
      email: formData.email || ''
    };

    switch (formType) {
      case 'fee_enquiry':
        payload.programme = 'B.Sc. Nursing';
        payload.extra1 = formData.percentage || '';  // 12th %
        payload.extra2 = formData.city || '';         // City
        payload.extra3 = 'Fee Enquiry';
        break;

      case 'fee_enquiry_msc':
        payload.programme = 'M.Sc. Nursing';
        payload.extra1 = formData.specialization || ''; // Specialization
        payload.extra2 = formData.city || '';             // City
        payload.extra3 = 'Fee Enquiry';
        break;

      case 'scholarship_apply':
        payload.programme = formData.programme || '';
        payload.extra1 = formData.category || '';     // Category
        payload.extra2 = '';
        payload.extra3 = 'Scholarship Guidance';
        break;

      case 'campus_visit_1030':
        payload.programme = '';
        payload.extra1 = '';
        payload.extra2 = '';
        payload.extra3 = 'Campus Visit';
        payload.timeSlot = '10:30 AM';
        break;

      case 'campus_visit_1200':
        payload.programme = '';
        payload.extra1 = '';
        payload.extra2 = '';
        payload.extra3 = 'Campus Visit';
        payload.timeSlot = '12:00 PM';
        break;

      case 'campus_visit_0300':
        payload.programme = '';
        payload.extra1 = '';
        payload.extra2 = '';
        payload.extra3 = 'Campus Visit';
        payload.timeSlot = '3:00 PM';
        break;

      case 'talk_to_counsellor':
        payload.programme = '';
        payload.extra1 = '';
        payload.extra2 = '';
        payload.extra3 = 'Talk to Admission Counsellor';
        break;

      case 'book_counselling':
        payload.programme = 'M.Sc. Nursing';
        payload.extra1 = formData.specialization || '';
        payload.extra2 = '';
        payload.extra3 = 'Book Counselling Session';
        break;

      default:
        payload.extra3 = formType;
    }

    if (payload.extra3) {
      payload.formType = payload.extra3;
    }

    let endpoint = '/send-lead';
    switch (payload.extra3) {
      case 'Fee Enquiry': endpoint = '/send-fee-enquiry'; break;
      case 'Scholarship Guidance': endpoint = '/send-scholarship'; break;
      case 'Campus Visit': endpoint = '/send-campus-visit'; break;
      case 'Talk to Admission Counsellor': endpoint = '/send-counsellor'; break;
      case 'Book Counselling Session': endpoint = '/send-book-counselling'; break;
    }

    // 1. Send to Web3Forms (Direct Email API)
    const web3formsPayload = {
      access_key: 'dd47b9cf-86c0-46cc-9250-699c07bc1233',
      subject: `🚨 RVGHS Lead: ${payload.formType || 'General Inquiry'}`,
      from_name: 'RVGHS Chatbot',
      botcheck: '', // Honeypot
      ...payload
    };

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(web3formsPayload)
    })
    .then(async (response) => {
      let json = await response.json();
      if (response.status === 200) {
        console.log('[RVGHS Chatbot] Lead sent successfully to your email via Web3Forms!', json);
      } else {
        console.error('[RVGHS Chatbot] Failed to send email via Web3Forms:', json);
      }
    })
    .catch(error => {
      console.error('[RVGHS Chatbot] Request failed when sending lead:', error);
    });
  }

  // ─── User Text Input Handling ─────────────────────────────
  function handleUserInput() {
    const text = chatInput.value.trim();
    if (!text) return;

    addUserMessage(text);
    chatInput.value = '';
    clearButtons();
    clearForms();

    // Match intent
    const matchedAction = matchIntent(text);
    if (matchedAction) {
      if (window.rvghsTrackEvent) window.rvghsTrackEvent('message', { query: text, intent: matchedAction });
      setTimeout(() => navigateTo(matchedAction), 400);
    } else {
      // Fallback
      if (window.rvghsTrackEvent) window.rvghsTrackEvent('message', { query: text, intent: 'unmatched' });
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        addBotMessage(
          `I'm not sure I understood that. 🤔 Let me show you what I can help with!\n\nYou can ask about:\n• <strong>B.Sc. Nursing</strong> or <strong>M.Sc. Nursing</strong>\n• <strong>NPCC</strong> or <strong>Ph.D.</strong> programmes\n• <strong>Scholarships</strong>, <strong>Fees</strong> and <strong>Hostel</strong>\n• <strong>Placements</strong> and <strong>Career</strong>\n• <strong>Campus Visit</strong> booking\n• <strong>Contact</strong> information\n\nOr choose from the options below:`
        );
        setTimeout(() => {
          renderButtons(CHAT_FLOWS.welcome.buttons);
        }, 400);
      }, 800);
    }

    resetInactivityTimer();
  }

  function matchIntent(text) {
    const lower = text.toLowerCase().trim();

    for (const intent of INTENT_MAP) {
      for (const keyword of intent.keywords) {
        if (lower.includes(keyword)) {
          return intent.action;
        }
      }
    }

    return null;
  }

  // ─── Inactivity Prompt ────────────────────────────────────
  function resetInactivityTimer() {
    clearInactivityTimer();
    if (isOpen) {
      inactivityTimer = setTimeout(() => {
        addBotMessage(
          `Hello 👋\n\nJust checking if you would like assistance regarding B.Sc. / M.Sc. Nursing admission.\n\n<strong>Seats are filling under RVGHS.</strong>`
        );
        renderButtons([
          { label: "🎓 B.Sc. Nursing", action: "bsc_main" },
          { label: "📚 M.Sc. Nursing", action: "msc_main" },
          { label: "📞 Contact Us", action: "contact" },
          { label: "← Main Menu", action: "welcome" }
        ]);
      }, INACTIVITY_TIMEOUT);
    }
  }

  function clearInactivityTimer() {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
  }

  // ─── Utilities ────────────────────────────────────────────
  function scrollToBottom() {
    requestAnimationFrame(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  function getTimeString() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  // ─── Start ────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
