const transition = document.querySelector(".page-transition");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const form = document.querySelector("#contact-form");
const status = document.querySelector(".form-status");

document.body.classList.add("is-ready");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
}

document.querySelectorAll('a[href$=".html"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return;
    event.preventDefault();
    if (transition) transition.classList.add("is-active");
    window.setTimeout(() => {
      window.location.href = link.href;
    }, 280);
  });
});

if (form && status) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    if (!name || !email || !message) {
      status.textContent = "Bitte fülle alle Felder aus.";
      return;
    }

    status.textContent = "Danke. Wir melden uns mit dem nächsten Schritt.";
    form.reset();
  });
}
