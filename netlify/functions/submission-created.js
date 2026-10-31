// Auto-reply to website form submissions.
// Netlify runs this automatically after every verified form submission (spam caught by the honeypot never reaches it).
// It sends a short, branded thank-you from hello@conferencemedia.ca through Resend.
// Needs one environment variable in Netlify: RESEND_API_KEY (Site configuration > Environment variables).

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
<tr><td style="background:#000;padding:22px 28px;border-radius:6px 6px 0 0"><img src="${SITE}/img/logo.png" alt="Conference Media" height="26" style="display:block;height:26px;width:auto"></td></tr>
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

exports.handler = async (event) => {
  try {
    const { payload } = JSON.parse(event.body || '{}');
    const form = payload && payload.form_name;
    const d = (payload && payload.data) || {};
    const to = (d.email || payload.email || '').trim();
    const build = MESSAGES[form];
    if (!build || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { statusCode: 200, body: 'skipped' };
    if (!process.env.RESEND_API_KEY) { console.log('RESEND_API_KEY not set; auto-reply skipped'); return { statusCode: 200, body: 'no key' }; }

    const hi = firstName(d);
    const { subject, lines } = build(d, hi);
    const { html, text } = render(hi, lines);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject, html, text, tags: [{ name: 'form', value: form.replace(/[^a-zA-Z0-9_-]/g, '_') }] }),
    });
    if (!res.ok) console.log('Resend error', res.status, await res.text());
    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    console.log('auto-reply failed', e && e.message);
    return { statusCode: 200, body: 'error' };
  }
};
