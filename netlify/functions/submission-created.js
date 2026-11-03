// Auto-reply to website form submissions.
// Netlify runs this automatically after every verified form submission (spam caught by the honeypot never reaches it).
// It sends a short, branded thank-you from hello@conferencemedia.ca through Resend.
// It also files every submission in the Conference Media Airtable base (see the Airtable section below).
// Environment variables in Netlify (Site configuration > Environment variables):
//   RESEND_API_KEY  - sends the auto-reply
//   AIRTABLE_TOKEN  - personal access token with data.records:read and data.records:write on the base

const FROM = 'Conference Media <hello@conferencemedia.ca>';
const REPLY_TO = 'hello@conferencemedia.ca';
const SITE = 'https://conferencemedia.ca';

const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function firstName(d) {
  const n = d.first_name || (d.name || '').trim().split(/\s+/)[0] || d['first-name'] || '';
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : '';
}

function niceDate(v) {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return '';
  const d = new Date(v + 'T12:00:00Z');
  return d.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

// One message per form. Each returns { subject, lines } where lines are plain paragraphs.
const MESSAGES = {
  'request-pricing': (d, hi) => {
    const when = niceDate(d.event_date);
    return {
      subject: hi ? `Thanks, ${hi}. We got your request` : 'Thanks. We got your request',
      lines: [
        `Thanks for reaching out about your event${when ? ` on ${when}` : ''}. We have your details and we'll get back to you as soon as we can with next steps.`,
        'If you have anything else to share in the meantime, like the run of show, the venue or your speakers, just reply to this email.',
      ],
    };
  },
  contact: (d, hi) => ({
    subject: hi ? `Thanks for your message, ${hi}` : 'Thanks for your message',
    lines: [
      "We got your message and we'll get back to you as soon as we can.",
      'If you need to add anything, just reply to this email.',
    ],
  }),
  careers: (d, hi) => ({
    subject: hi ? `Thanks for sharing your work, ${hi}` : 'Thanks for sharing your work',
    lines: [
      "We've received your details and your work. We look at every submission, and we'll reach out when there's a fit for an upcoming event.",
      `In the meantime, you can see the kind of events we cover at ${SITE}/work/.`,
    ],
  }),
  'shot-list': (d, hi) => ({
    subject: 'Your Conference Shot List',
    lines: [
      `Here's your copy of The Conference Shot List: ${SITE}/downloads/conference-shot-list.pdf`,
      "Hand it to your photographer, your videographer or the intern with a phone, and everyone shoots the same list. If you'd like us to shoot it for you, just reply to this email.",
    ],
  }),
};

function render(hi, lines) {
  const greet = hi ? `Hi ${esc(hi)},` : 'Hi there,';
  const linkify = (t) => esc(t).replace(/(https:\/\/[^\s<]+?)([.,]?)(?=\s|$)/g, '<a href="$1" style="color:#E8392F">$1</a>$2');
  const html = `<!doctype html><html><body style="margin:0;background:#F2EFE9">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2EFE9;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:6px;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a">
<tr><td style="background:#ffffff;padding:24px 28px 8px;border-radius:6px 6px 0 0"><img src="${SITE}/img/email-logo.png" alt="Conference Media" width="113" height="26" style="display:block;height:26px;width:113px;border:0"></td></tr>
<tr><td style="padding:28px 28px 8px;font-size:16px;line-height:1.6">
<p style="margin:0 0 16px">${greet}</p>
${lines.map((l) => `<p style="margin:0 0 16px">${linkify(l)}</p>`).join('\n')}
<p style="margin:24px 0 4px">Talk soon,</p>
<p style="margin:0 0 4px;font-family:Georgia,serif;font-size:20px">Conference Media<span style="color:#E8392F">.</span></p>
<p style="margin:0 0 24px;font-size:14px;color:#6b6760">Toronto Based, North America wide</p>
</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #ece8e1;font-size:13px;color:#6b6760;line-height:1.6">
<a href="mailto:hello@conferencemedia.ca" style="color:#6b6760">hello@conferencemedia.ca</a> · (647) 505-4585 · <a href="${SITE}" style="color:#6b6760">conferencemedia.ca</a>
</td></tr>
</table></td></tr></table></body></html>`;
  const text = [greet, '', ...lines.flatMap((l) => [l, '']), 'Talk soon,', 'Conference Media', 'Toronto Based, North America wide', '', 'hello@conferencemedia.ca · (647) 505-4585 · conferencemedia.ca'].join('\n');
  return { html, text };
}


/* ---------- Airtable ----------
   request-pricing, contact -> find or create the person in Organizers (by email), then log an Interaction linked to them
                               with a follow-up for Javon. Existing Organizers records are never changed.
   shot-list                -> find or create the person in Organizers (Source: Shot List Download), log the download
   careers                  -> Crew, Status: Applicant (an existing applicant gets a note instead of a duplicate)
   Field and option names must match the base exactly; typecast is off so a mismatch is logged instead of creating a new option. */
const AT_BASE = 'appST8czKLLJkEuK2';
const LEAD_OWNER = ['Javon'];

async function at(path, method = 'GET', body) {
  const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Airtable ${method} ${path.split('?')[0]} ${res.status} ${JSON.stringify(json.error || json)}`);
  return json;
}
const tbl = (name) => encodeURIComponent(name);
const formulaStr = (v) => `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

async function findByEmail(table, email) {
  const f = encodeURIComponent(`LOWER({Email})=${formulaStr(email.toLowerCase())}`);
  const r = await at(`${tbl(table)}?maxRecords=1&filterByFormula=${f}`);
  return r.records && r.records[0];
}

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' }); // YYYY-MM-DD
const money = (v) => (v && !isNaN(+v) ? '$' + Number(v).toLocaleString('en-CA') : '');
// Tidies all-lowercase names ("jane smith" -> "Jane Smith"); leaves names people typed with their own capitals alone
const fullName = (d) => { const n = (d.name || [d.first_name, d.last_name].filter(Boolean).join(' ')).trim().replace(/\s+/g, ' '); return n === n.toLowerCase() ? n.replace(/(^|[\s'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()) : n; };
const isPaid = (via) => /google ads|\bcpc\b|\bppc\b|paid|\bads?\b/i.test(via || '');

// The careers form asks for a free-typed city; file it under the Crew Geography regions when it clearly matches
function geography(city) {
  const c = (city || '').toLowerCase();
  if (/toronto|mississauga|brampton|markham|vaughan|oakville|richmond hill|scarborough|etobicoke|north york|pickering|ajax|whitby|oshawa|milton|burlington|newmarket|aurora|\bgta\b/.test(c)) return 'GTA';
  if (/ottawa/.test(c)) return 'Ottawa';
  if (/new york|\bnyc\b|brooklyn|manhattan|queens/.test(c)) return 'NYC';
  if (/niagara|st\.? catharines|buffalo|welland/.test(c)) return 'Niagara / Buffalo';
  return '';
}

async function organizer(d, email, { source, relationship }) {
  const found = await findByEmail('Organizers', email);
  if (found) return found.id;
  const created = await at(tbl('Organizers'), 'POST', {
    fields: { Name: fullName(d) || email, Email: email, Source: source, Relationship: [relationship] },
  });
  return created.id;
}

async function toAirtable(form, d, email) {
  if (!process.env.AIRTABLE_TOKEN) { console.log('AIRTABLE_TOKEN not set; Airtable skipped'); return; }
  const name = fullName(d) || email;
  const via = d['found-us-via'] || '';

  if (form === 'request-pricing' || form === 'contact') {
    const orgId = await organizer(d, email, { source: isPaid(via) ? 'Paid Ads' : 'Web Form', relationship: 'Warm' });
    const pricing = form === 'request-pricing';
    const notes = [
      pricing ? 'Pricing request from the website.' : 'Contact message from the website.',
      d.event_date && `Event date: ${niceDate(d.event_date) || d.event_date}`,
      d.budget && `Budget: ${money(d.budget)}`,
      d.company && `Company: ${d.company}`,
      (d.about || d.description || d.message) && `\nMessage:\n${d.about || d.description || d.message}`,
      via && `\nFound us via: ${via}`,
    ].filter(Boolean).join('\n');
    await at(tbl('Interactions'), 'POST', {
      fields: {
        Description: `${pricing ? 'Website pricing request' : 'Website contact message'}: ${name}`,
        Direction: 'Inbound',
        'Interaction Type': 'Form Submission',
        'Interaction Date': today(),
        'Organizer Name': [orgId],
        Notes: notes,
        'Next Action': pricing ? 'Send quote' : 'Reply',
        'Next Action Date': today(),
        'Next Action Status': 'Open',
        'Responsible for Next Action': LEAD_OWNER,
      },
    });
    return;
  }

  if (form === 'shot-list') {
    const orgId = await organizer(d, email, { source: 'Shot List Download', relationship: "Haven't Met" });
    await at(tbl('Interactions'), 'POST', {
      fields: {
        Description: `Shot list download: ${name}`,
        Direction: 'Inbound',
        'Interaction Type': 'Form Submission',
        'Interaction Date': today(),
        'Organizer Name': [orgId],
        Notes: ['Downloaded The Conference Shot List from the website.', via && `Found us via: ${via}`].filter(Boolean).join('\n'),
        'Next Action Status': 'Complete',
      },
    });
    return;
  }

  if (form === 'careers') {
    const file = d.attachment && (d.attachment.url || d.attachment.filename) ? 'Attached a CV/portfolio file (see Netlify > Forms > careers).' : '';
    const geo = geography(d.city);
    const notes = [
      `Applied via website on ${today()}.`,
      d.applied_for && `Applied for: ${d.applied_for}`,
      d.city && !geo && `City: ${d.city}`,
      d.social && `Social: ${d.social}`,
      file,
      d.message && `\nMessage:\n${d.message}`,
      via && `\nFound us via: ${via}`,
    ].filter(Boolean).join('\n');
    const found = await findByEmail('Crew', email);
    if (found) {
      const old = (found.fields && found.fields.Notes) || '';
      await at(`${tbl('Crew')}/${found.id}`, 'PATCH', { fields: { Notes: (old ? old + '\n\n' : '') + 'Applied again. ' + notes } });
      return;
    }
    const fields = { Name: name, Email: email, Status: 'Applicant', Notes: notes };
    if (d.portfolio) fields['Portfolio Link'] = d.portfolio;
    if (geo) fields.Geography = geo;
    await at(tbl('Crew'), 'POST', { fields });
  }
}

exports.handler = async (event) => {
  let payload;
  try { ({ payload } = JSON.parse(event.body || '{}')); } catch (e) { return { statusCode: 200, body: 'bad body' }; }
  const form = payload && payload.form_name;
  const d = (payload && payload.data) || {};
  const to = (d.email || payload.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { statusCode: 200, body: 'skipped' };

  // The auto-reply and the Airtable filing run side by side; one failing never stops the other
  const results = await Promise.allSettled([sendReply(form, d, to), toAirtable(form, d, to)]);
  results.forEach((r, i) => { if (r.status === 'rejected') console.log(i ? 'airtable failed' : 'auto-reply failed', r.reason && r.reason.message); });
  return { statusCode: 200, body: 'ok' };
};

async function sendReply(form, d, to) {
  const build = MESSAGES[form];
  if (!build) return;
  if (!process.env.RESEND_API_KEY) { console.log('RESEND_API_KEY not set; auto-reply skipped'); return; }
  const hi = firstName(d);
  const { subject, lines } = build(d, hi);
  const { html, text } = render(hi, lines);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject, html, text, tags: [{ name: 'form', value: form.replace(/[^a-zA-Z0-9_-]/g, '_') }] }),
  });
  if (!res.ok) console.log('Resend error', res.status, await res.text());
}
