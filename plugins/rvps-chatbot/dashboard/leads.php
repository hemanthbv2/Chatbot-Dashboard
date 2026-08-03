<?php if (!defined('ABSPATH')) exit; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Leads — Command Center</title>
<script>
    const token = sessionStorage.getItem('dashboard_token');
    if (!token) window.location.href = '?action=rvps_chatbot_dashboard_view&tab=login';
    const API_URL = "<?php echo esc_js(untrailingslashit(rest_url('rvps/v1'))); ?>";
</script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--primary:#E31E24;--secondary:#6366f1;--success:#10b981;--warning:#f59e0b;--danger:#ef4444;--bg:#030712;--sidebar:rgba(17,24,39,0.8);--card:rgba(30,41,59,0.5);--border:rgba(255,255,255,0.08);--text:#f8fafc;--text-dim:#94a3b8;--dim:#94a3b8}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);color:var(--text);height:100vh;overflow:hidden;display:flex}
.mesh{position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;background:radial-gradient(circle at 10% 20%,rgba(99,102,241,0.1) 0%,transparent 40%),radial-gradient(circle at 90% 80%,rgba(227,30,36,0.08) 0%,transparent 40%),radial-gradient(circle at 50% 50%,rgba(15,23,42,1) 0%,rgba(3,7,18,1) 100%)}
aside{width:260px;background:var(--sidebar);backdrop-filter:blur(20px);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:30px 20px;z-index:10}
.logo{display:flex;align-items:center;gap:12px;margin-bottom:40px}
.logo-box{width:36px;height:36px;background:var(--primary);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;box-shadow:0 0 20px rgba(227,30,36,0.4)}
.logo h2{font-size:18px;font-weight:800}.logo p{font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px}
nav{list-style:none;flex-grow:1}
.nav-item, .ni{padding:14px 16px;border-radius:12px;cursor:pointer;margin-bottom:8px;display:flex;align-items:center;gap:12px;color:var(--dim);transition:all 0.2s;font-size:14px;font-weight:600;text-decoration:none}
.nav-item:hover, .ni:hover{background:rgba(255,255,255,0.05);color:var(--text)}
.nav-item.active, .ni.active{background:rgba(99,102,241,0.1);color:var(--secondary);border:1px solid rgba(99,102,241,0.2)}
.nav-item svg, .ni svg{width:18px;height:18px;opacity:0.7}
.sf{padding-top:20px;border-top:1px solid var(--border)}
main{flex-grow:1;padding:30px;overflow-y:auto}
h1{font-size:24px;font-weight:800;margin-bottom:4px}
.sub{color:var(--dim);font-size:14px;margin-bottom:30px}
.pulse{width:10px;height:10px;background:var(--success);border-radius:50%;box-shadow:0 0 10px var(--success);position:relative}
.pulse::after{content:'';position:absolute;top:-5px;left:-5px;right:-5px;bottom:-5px;border-radius:50%;border:2px solid var(--success);animation:pa 2s infinite}
@keyframes pa{0%{transform:scale(1);opacity:1}100%{transform:scale(2);opacity:0}}
.card {
    background: var(--card); border: 1px solid var(--border); border-radius: 20px;
    padding: 24px; backdrop-filter: blur(10px); position: relative;
    transition: border-color 0.3s;
}
.full-width { width: 100%; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.card-header h3 { font-size: 16px; font-weight: 700; color: var(--text); }
.empty-state { text-align: center; color: var(--text-dim); padding: 50px 0; font-style: italic; }
.behavior-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; margin: 2px; }
.behavior-tag.high { background: rgba(16,185,129,0.15); color: #10b981; }

@media print {
    aside, .sf, .mesh, button, .date-filter-container, p.sub { display: none !important; }
    body { background: #fff !important; color: #000 !important; overflow: visible; height: auto; display: block; font-family: 'Times New Roman', Times, serif; }
    main { padding: 0; overflow: visible; margin: 0; }
    .card { background: none !important; border: none !important; padding: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
    .card-header h3 { font-size: 20px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; text-align: center; color: #000 !important; letter-spacing: 1px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
    th, td { border: 1px solid #000 !important; padding: 8px 10px !important; color: #000 !important; font-weight: normal; text-align: left; }
    th { background: #f5f5f5 !important; font-weight: bold !important; text-transform: uppercase; -webkit-print-color-adjust: exact; }
    .behavior-tag { background: none !important; color: #000 !important; padding: 0 !important; font-size: 11px !important; font-weight: normal !important; }
    h1 { text-align: center; font-family: 'Times New Roman', Times, serif; color: #000 !important; font-size: 24px; margin-top: 0px; margin-bottom: 5px; }
    h1::before { content: 'OFFICIAL RECORD\n'; font-size: 12px; display: block; color: #666; margin-bottom: 8px; letter-spacing: 2px; text-transform: uppercase; }
    h1::after { content: '\nLead Generation Summary Report'; font-size: 16px; display: block; font-weight: normal; margin-top: 5px; }
    
    /* Force background colors to print */
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
</style>
</head>
<body>
<div class="mesh"></div>
<aside>
    <div class="logo"><div class="logo-box">R</div><div><h2>COMMAND</h2><p>Chatbot Intelligence</p></div></div>
    <nav class="nav-links">
        <a class="nav-item" href="?action=rvps_chatbot_dashboard_view&tab=index">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Overview
        </a>
        <a class="nav-item" href="?action=rvps_chatbot_dashboard_view&tab=interactions">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            Interactions
        </a>
        <a class="nav-item" href="?action=rvps_chatbot_dashboard_view&tab=sessions">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Sessions
        </a>
        <a class="nav-item active" href="?action=rvps_chatbot_dashboard_view&tab=leads">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Leads
        </a>
        <a class="nav-item" href="?action=rvps_chatbot_dashboard_view&tab=analytics">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            Analytics
        </a>
    </nav>
    <div class="sf"><div style="display:flex;align-items:center;gap:10px;font-size:12px;color:var(--dim)"><div class="pulse"></div>SYSTEM ONLINE</div></div>
</aside>
<main>
    <h1>ðŸ† Lead Generation Analytics</h1>
    <p class="sub">View and track all user submissions captured from the chatbot</p>

    <!-- Leads Generated Data Table -->
    <div class="card full-width">
        <div class="card-header">
            <div style="display:flex; align-items:center; gap:8px;">
                <h3>Submissions Database</h3>
            </div>
            <div class="date-filter-container" style="display:flex; gap:10px; align-items:center;">
                <input type="date" id="startDate" style="padding:6px; font-size:12px; background:var(--bg); color:var(--text); border:1px solid var(--border); border-radius:8px; outline:none; font-family:inherit;">
                <span style="color:var(--dim)">to</span>
                <input type="date" id="endDate" style="padding:6px; font-size:12px; background:var(--bg); color:var(--text); border:1px solid var(--border); border-radius:8px; outline:none; font-family:inherit;">
                <button style="padding:6px 12px; font-size:12px; background:var(--bg); color:var(--text); border:1px solid var(--border); border-radius:8px; cursor:pointer;" onclick="renderLeads()" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='var(--bg)'">ðŸ” Filter</button>
                <button style="padding:6px 12px; font-size:12px; background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3); border-radius:8px; cursor:pointer; font-weight:bold;" onclick="downloadBankSummary()" onmouseover="this.style.background='rgba(16,185,129,0.25)'" onmouseout="this.style.background='rgba(16,185,129,0.15)'">ðŸ“„ Download PDF</button>
            </div>
        </div>
        <div style="overflow-x: auto;">
            <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--border); color: var(--text-dim);">
                        <th style="padding: 10px;">Date/Time</th>
                        <th style="padding: 10px;">Name</th>
                        <th style="padding: 10px;">Phone</th>
                        <th style="padding: 10px;">Email</th>
                        <th style="padding: 10px;">Type</th>
                        <th style="padding: 10px;">Other Details</th>
                    </tr>
                </thead>
                <tbody id="leadsTableBody">
                    <tr><td colspan="6" class="empty-state">Loading leads...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</main>
<script>
    async function fetchLeadsData() {
        try {
            const res = await fetch(API_URL + '/leads-data');
            return await res.json();
        } catch (err) { return []; }
    }

    async function renderLeads() {
        const tbody = document.getElementById('leadsTableBody');
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Loading leads...</td></tr>';
        
        let leadsData = await fetchLeadsData();
        
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (startDate) {
            leadsData = leadsData.filter(l => new Date(l.timestamp) >= new Date(startDate));
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23,59,59,999);
            leadsData = leadsData.filter(l => new Date(l.timestamp) <= end);
        }
        
        if (leadsData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No leads found yet. Wait for a user to submit the form.</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        leadsData.forEach(lead => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.style.transition = 'background 0.2s';
            tr.onmouseover = () => tr.style.background = 'rgba(255,255,255,0.03)';
            tr.onmouseout = () => tr.style.background = 'transparent';
            
            const date = new Date(lead.timestamp).toLocaleString();
            const data = lead.data?.leadData || lead.data || {};
            
            tr.innerHTML = `
                <td style="padding: 10px;">${date}</td>
                <td style="padding: 10px; font-weight: bold; color: var(--text);">${data.name || '-'}</td>
                <td style="padding: 10px;">${data.phone || '-'}</td>
                <td style="padding: 10px;">${data.email || '-'}</td>
                <td style="padding: 10px;">
                    <span class="behavior-tag high">${data.formType || data.extra3 || 'General Enquiry'}</span>
                </td>
                <td style="padding: 10px; font-size: 11px; color: var(--text-dim);">
                    ${data.city ? `City: ${data.city}<br>` : ''}
                    ${data.programme ? `Prog: ${data.programme}<br>` : ''}
                    ${data.timeSlot ? `Time: ${data.timeSlot}` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function downloadBankSummary() {
        // Automatically hide the first <h1> title in print to use the styled one
        document.querySelector('h1').style.display = 'none';
        
        const headerTitle = document.querySelector('.card-header h3');
        const oldText = headerTitle.textContent;
        headerTitle.textContent = "Detailed Statement of Leads";
        
        window.print();
        
        // Restore
        document.querySelector('h1').style.display = 'block';
        headerTitle.textContent = oldText;
    }

    // Load immediately
    window.onload = renderLeads;
</script>
</body>
</html>



