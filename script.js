/* ===========================
   Last Man Standing — Script
   (full replacement)
   =========================== */

// ---------- Core UI helpers ----------
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

const loader = {
  show(msg="Working…"){
    const overlay = $("#overlay");
    const loading = $("#loading");
    if (overlay) overlay.style.display = "flex";
    if (loading) {
      loading.style.display = "flex";
      const p = loading.querySelector("p");
      if (p) p.textContent = msg;
    }
  },
  hide(){
    const overlay = $("#overlay");
    const loading = $("#loading");
    if (overlay) overlay.style.display = "none";
    if (loading) loading.style.display = "none";
  }
};

const toasts = {
  wrap(){
    let w = $(".toast-wrap");
    if(!w){ w = document.createElement("div"); w.className = "toast-wrap"; document.body.appendChild(w); }
    return w;
  },
  ok(title="Saved", msg=""){
    const t = document.createElement("div");
    t.className = "toast ok";
    t.innerHTML = `<div><div class="title">${title}</div><div class="msg">${msg}</div></div>`;
    this.wrap().appendChild(t); setTimeout(()=>t.remove(), 3500);
  },
  err(title="Error", msg="Try again."){
    const t = document.createElement("div");
    t.className = "toast err";
    t.innerHTML = `<div><div class="title">${title}</div><div class="msg">${msg}</div></div>`;
    this.wrap().appendChild(t); setTimeout(()=>t.remove(), 5500);
  }
};

const session = {
  set(k,v){ sessionStorage.setItem(k, JSON.stringify(v)); },
  get(k,fb=null){ try{ return JSON.parse(sessionStorage.getItem(k)) ?? fb; } catch { return fb; } },
  del(k){ sessionStorage.removeItem(k); },
  clear(){ sessionStorage.clear(); }
};

// ---------- API wrapper (adjust endpoints/headers) ----------
async function apiFetch(url, {method="GET", body=null, headers={}}={}){
  const opts = { method, headers: { "Content-Type":"application/json", ...headers } };
  if(body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if(!res.ok){
    const text = await res.text().catch(()=> "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  try { return await res.json(); } catch { return {}; }
}

// ---------- Routing ----------
function bindPage(map){
  const page = document.body.getAttribute("data-page");
  if (page && typeof map[page] === "function") map[page]();
}

// ---------- Shared: Sign out ----------
function handleSignOut(){
  session.clear();
  window.location.href = "index.html";
}
document.addEventListener("click", e=>{
  const btn = e.target.closest("#signOutButton");
  if(btn){ e.preventDefault(); handleSignOut(); }
});

// ---------- Constants / helpers for picks ----------
const NFL_WEEKS = Array.from({length: 18}, (_,i)=> i+1); // 1..18

// Derive last selected week & counts
function summarizeEntry(entry){
  // expects entry.picks as object { [weekNo]: "TEAM" | null }
  const picks = entry?.picks || {};
  let completed = 0;
  let lastWeek = null, lastTeam = null;
  NFL_WEEKS.forEach(w=>{
    const t = picks[w];
    if (t) { completed += 1; lastWeek = w; lastTeam = t; }
  });
  return {completed, lastWeek, lastTeam};
}

// Optional: week lock source (you can override with your own data)
function isWeekLocked(weekNo){
  // If you store locks in sessionStorage, support it:
  const locks = session.get("weeks_lock", {}); // e.g., {"1":true,"2":false}
  if (locks && typeof locks === "object" && String(weekNo) in locks) {
    return !!locks[String(weekNo)];
  }
  return false; // default unlocked
}

// ---------- Page: Login ----------
function pageLogin(){
  const form = $("#loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const email = $("#email")?.value?.trim();
    const pin   = $("#pin")?.value?.trim();
    if(!email || !pin){
      toasts.err("Missing info","Enter your email and PIN.");
      return;
    }

    // UI state
    const btn = form.querySelector("button[type=submit]");
    const spin = btn?.querySelector(".spinner");
    if (spin) spin.style.display = "inline-block";
    btn?.setAttribute("disabled","true");
    loader.show("Verifying your access…");

    try{
      // TODO: replace with your Flow URL
      const VERIFY_URL = "YOUR_FLOW_VERIFY_URL";
      const payload = { email, pin };
      const data = await apiFetch(VERIFY_URL, { method:"POST", body: payload });

      // expected return (adapt these if your keys differ)
      // {
      //   approved_status: "approved" | "pending" | "rejected" | "invalid",
      //   email_address, first_name, last_name, phone_number,
      //   pool_entries: [ { dvuid, entry_name, disqualified:false, picks:{1:"KC",...} } ],
      //   team_options: [ "KC","BUF","PHI", ... ]  or { 1:[...], 2:[...] }
      //   weeks_lock: { "1": true, "2": false, ... } (optional)
      // }

      sessionStorage.setItem("approved", data.approved_status === "approved" ? "true":"false");
      sessionStorage.setItem("email", data.email_address || email);
      if (data.first_name) sessionStorage.setItem("first_name", data.first_name);
      if (data.last_name)  sessionStorage.setItem("last_name", data.last_name);
      if (data.phone_number) sessionStorage.setItem("phone_number", data.phone_number);

      if (data.pool_entries) sessionStorage.setItem("pool_entries", JSON.stringify(data.pool_entries));
      if (data.team_options) sessionStorage.setItem("team_options", JSON.stringify(data.team_options));
      if (data.weeks_lock)   sessionStorage.setItem("weeks_lock", JSON.stringify(data.weeks_lock));

      switch (data.approved_status){
        case "approved":
          window.location.href = "home.html";
          break;
        case "pending":
          toasts.ok("Registration pending","We’ll email you when you’re approved.");
          break;
        case "rejected":
          toasts.err("Registration rejected","Contact the commissioner if this seems wrong.");
          break;
        default:
          toasts.err("Invalid credentials","Check your email and PIN.");
      }
    }catch(err){
      console.error(err);
      toasts.err("Login failed","Please try again.");
    }finally{
      if (spin) spin.style.display = "none";
      btn?.removeAttribute("disabled");
      loader.hide();
    }
  });
}

// ---------- Page: Inquiry / Registration ----------
function pageInquiry(){
  const form = $("#registrationForm");
  if (!form) return;

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    const btn = form.querySelector("button[type=submit]");
    const spin = btn?.querySelector(".spinner");
    if (spin) spin.style.display = "inline-block";
    btn?.setAttribute("disabled","true");
    loader.show("Submitting your registration…");

    try{
      // TODO: replace with your Flow URL
      const INQUIRY_URL = "YOUR_FLOW_SUBMIT_INQUIRY_URL";
      const data = await apiFetch(INQUIRY_URL, { method:"POST", body: payload });

      // Expected: { inquiry_status: "submitted" | "pending" | "existing" }
      if (data.inquiry_status === "submitted"){
        toasts.ok("Submitted","We’ll review and email you soon.");
        form.reset();
      } else if (data.inquiry_status === "pending"){
        toasts.ok("Already pending","We’re still reviewing your request.");
      } else if (data.inquiry_status === "existing"){
        toasts.err("Account exists","Try signing in on the login page.");
      } else {
        toasts.ok("Submitted","We’ll review your request.");
        form.reset();
      }
    }catch(err){
      console.error(err);
      toasts.err("Could not submit", "Please try again.");
    }finally{
      if (spin) spin.style.display = "none";
      btn?.removeAttribute("disabled");
      loader.hide();
    }
  });
}

// ---------- Page: Home (Dashboard & Picks) ----------
function pageHome(){
  // gate
  const approved = sessionStorage.getItem("approved") === "true";
  if (!approved) { window.location.href = "index.html"; return; }

  // welcome name
  const first = sessionStorage.getItem("first_name") || "";
  const last  = sessionStorage.getItem("last_name") || "";
  const welcome = $("#welcomeName");
  if (welcome) welcome.textContent = ["Welcome", [first,last].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  // ensure entries
  let poolEntries = session.get("pool_entries", []);
  if (!Array.isArray(poolEntries)) poolEntries = [];

  renderEntriesTable(poolEntries);

  // modal controls
  const modal = $("#picksModal");
  $("#closeModal")?.addEventListener("click", ()=> hideModal(modal));
  $("#cancelModalBtn")?.addEventListener("click", ()=> hideModal(modal));
  $("#saveAllBtn")?.addEventListener("click", async ()=> {
    // Saves all changed weeks for the active entry
    await saveAllWeeksForActiveEntry();
  });
}

function renderEntriesTable(entries){
  const tbody = $("#entriesTbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!entries.length){
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" class="subtle">No entries yet.</td>`;
    tbody.appendChild(tr);
    return;
  }

  entries.forEach((entry, idx)=>{
    const {completed, lastWeek, lastTeam} = summarizeEntry(entry);
    const disq = !!entry.disqualified;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(entry.entry_name || `Entry ${idx+1}`)}</td>
      <td>${disq ? `<span class="pill red">DISQUALIFIED</span>` : `<span class="pill green">ACTIVE</span>`}</td>
      <td>${lastWeek ? `W${lastWeek}: ${escapeHtml(lastTeam)}` : `<span class="subtle">—</span>`}</td>
      <td>${completed}</td>
      <td>
        <button class="btn btn-outline" data-action="edit" data-index="${idx}">Edit Picks</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // bind edit buttons
  tbody.addEventListener("click", e=>{
    const btn = e.target.closest("[data-action='edit']");
    if(!btn) return;
    const index = parseInt(btn.getAttribute("data-index"), 10);
    openPicksModal(index);
  }, { once: true }); // re-bound each re-render
}

// modal open/close
function showModal(modal){ if (modal){ modal.style.display = "flex"; modal.setAttribute("aria-hidden","false"); } }
function hideModal(modal){ if (modal){ modal.style.display = "none"; modal.setAttribute("aria-hidden","true"); activeModalState = null; } }

// active modal state
let activeModalState = null; 
// { entryIndex, entryClone, changed:{ [weekNo]: "TEAM" }, teamOptions: string[]|{[week]:string[]} }

function openPicksModal(entryIndex){
  const modal = $("#picksModal");
  const grid  = $("#weeksGrid");
  const modalTitle = $("#modalTitle");
  const statusRow  = $("#entryStatusRow");
  if (!modal || !grid) return;

  let poolEntries = session.get("pool_entries", []);
  if (!Array.isArray(poolEntries)) poolEntries = [];
  const entry = poolEntries[entryIndex];
  if (!entry) return;

  // clone entry for editing
  const entryClone = JSON.parse(JSON.stringify(entry));
  const teamOptions = session.get("team_options", []); // can be array or per-week obj

  activeModalState = { entryIndex, entryClone, changed: {}, teamOptions };

  modalTitle.textContent = `Edit Picks — ${entry.entry_name || `Entry ${entryIndex+1}`}`;
  statusRow.innerHTML = entry.disqualified ? `<span class="pill red">DISQUALIFIED</span>` : `<span class="pill green">ACTIVE</span>`;

  // Build weeks grid
  grid.innerHTML = "";
  NFL_WEEKS.forEach(weekNo=>{
    const locked = isWeekLocked(weekNo);
    const current = entryClone?.picks?.[weekNo] || "";

    const wrapper = document.createElement("div");
    wrapper.className = "week";
    wrapper.dataset.week = String(weekNo);

    const label = `
      <div class="week-hd">
        <strong>Week ${weekNo}</strong>
        <div class="week-ctls">
          ${locked ? `<span class="pill amber">LOCKED</span>` : ``}
        </div>
      </div>`;

    // options
    const opts = buildTeamOptionsForWeek(weekNo, teamOptions, current);

    wrapper.innerHTML = `
      ${label}
      <select class="select week-select" ${locked || entry.disqualified ? "disabled": ""}>
        <option value="">— Select team —</option>
        ${opts}
      </select>
      <div style="display:flex; align-items:center; gap:10px;">
        <button class="btn btn-primary save-week-btn" ${locked || entry.disqualified ? "disabled": ""}>
          Save
        </button>
        <div class="success-msg">Successfully Updated</div>
      </div>
    `;

    // select change handler — hide success on change & mark changed
    const select = $(".week-select", wrapper);
    select.addEventListener("change", ()=>{
      $(".success-msg", wrapper).style.display = "none";
      const val = select.value || "";
      activeModalState.changed[weekNo] = val;
    });

    // Save single week
    const saveBtn = $(".save-week-btn", wrapper);
    saveBtn.addEventListener("click", async ()=>{
      await saveOneWeek(entryClone, weekNo, select.value || "");
      $(".success-msg", wrapper).style.display = "inline-block";
      saveBtn.setAttribute("disabled","true");
      // Re-enable on next change:
      select.addEventListener("change", ()=> saveBtn.removeAttribute("disabled"), { once:true });
    });

    grid.appendChild(wrapper);
  });

  showModal(modal);
}

function buildTeamOptionsForWeek(weekNo, teamOptions, currentValue){
  // Supports array ["KC","BUF"...] or object { "1":["KC",...], "2":[...] }
  let list = [];
  if (Array.isArray(teamOptions)) list = teamOptions;
  else if (teamOptions && typeof teamOptions === "object" && teamOptions[String(weekNo)]) list = teamOptions[String(weekNo)];
  else if (teamOptions && typeof teamOptions === "object" && teamOptions[weekNo]) list = teamOptions[weekNo];

  if (!Array.isArray(list)) list = [];

  return list.map(t=>{
    const val = String(t);
    const sel = (val === currentValue) ? "selected" : "";
    return `<option value="${escapeHtml(val)}" ${sel}>${escapeHtml(val)}</option>`;
  }).join("");
}

async function saveOneWeek(entryClone, weekNo, team){
  // submit to Flow
  try{
    loader.show(`Saving Week ${weekNo}…`);

    // TODO: replace with your Flow URL for saving a single pick
    const SAVE_URL = "YOUR_FLOW_SAVE_PICK_URL";
    const payload = {
      dvuid: entryClone.dvuid,   // required by your API
      week_no: weekNo,
      selection: team || null
    };
    const res = await apiFetch(SAVE_URL, { method:"POST", body: payload });

    // If ok, update entryClone + session
    if (!entryClone.picks) entryClone.picks = {};
    entryClone.picks[weekNo] = team || null;

    // write back to sessionStorage pool_entries
    let poolEntries = session.get("pool_entries", []);
    if (!Array.isArray(poolEntries)) poolEntries = [];
    poolEntries[activeModalState.entryIndex] = entryClone;
    session.set("pool_entries", poolEntries);

    toasts.ok("Saved", `Week ${weekNo} updated.`);
  }catch(err){
    console.error(err);
    toasts.err("Save failed", `Week ${weekNo} not saved.`);
    throw err;
  }finally{
    loader.hide();
  }
}

async function saveAllWeeksForActiveEntry(){
  const s = activeModalState;
  if (!s || !s.entryClone) return;
  const changes = s.changed || {};
  const weekNos = Object.keys(changes);
  if (!weekNos.length){
    toasts.ok("No changes","Nothing to save.");
    return;
  }

  try{
    loader.show("Saving all changes…");

    // Batch save one by one (simple & safe for your Flows)
    for (const key of weekNos){
      const w = parseInt(key,10);
      const team = changes[key] || "";
      await saveOneWeek(s.entryClone, w, team);
    }

    // Reset "changed" map
    s.changed = {};
    toasts.ok("All set","Your picks are up to date.");

    // Re-render entries list summary
    renderEntriesTable(session.get("pool_entries", []));
    hideModal($("#picksModal"));
  }catch(err){
    console.error(err);
    // leave modal open so user can retry
  }finally{
    loader.hide();
  }
}

// ---------- Utilities ----------
function escapeHtml(str){
  return String(str ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

// ---------- Boot ----------
document.addEventListener("DOMContentLoaded", ()=>{
  bindPage({
    login: pageLogin,
    inquiry: pageInquiry,
    home: pageHome
  });
});
