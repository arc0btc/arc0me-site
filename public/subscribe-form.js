// arc-demand-flywheel P6 — attributed capture-form client script for /subscribe.
// Static asset (public/), never processed by the MDX/Astro compiler — avoids any risk of
// MDX's JSX-brace parsing mangling raw JS inside an inline <script> tag.
(function () {
  var form = document.getElementById('arc-subscribe-form');
  var status = document.getElementById('arc-subscribe-status');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('arc-subscribe-email').value;
    // Attribution: carry whatever ?a= tag brought the visitor to this page (daily-read
    // footer, article CTA, etc); fall back to a fixed page-level tag if none is present.
    var params = new URLSearchParams(window.location.search);
    var source = params.get('a') || 'arc0me-subscribe-page';

    status.textContent = 'Sending...';
    fetch('https://mail.arc0.me/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, source: source }),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (result) {
        if (result.ok && result.body.ok) {
          status.textContent =
            result.body.data.status === 'already_confirmed'
              ? "You're already subscribed."
              : 'Check your inbox for a confirmation link.';
        } else {
          status.textContent = 'Something went wrong — try again in a moment.';
        }
      })
      .catch(function () {
        status.textContent = 'Something went wrong — try again in a moment.';
      });
  });
})();
