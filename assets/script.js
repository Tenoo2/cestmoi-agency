(() => {
  const nav = document.querySelector("#site-nav");
  const toggle = document.querySelector(".nav-toggle");
  const backdrop = document.querySelector(".nav-backdrop");
  const form = document.querySelector("form[data-form]");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let lastFocus = null;

  const navLinks = nav ? Array.from(nav.querySelectorAll("a, button")) : [];

  function setNav(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    document.body.classList.toggle("nav-open", open);
    if (backdrop) backdrop.hidden = !open;
    if (open) {
      lastFocus = document.activeElement;
      const first = navLinks[0];
      if (first) first.focus();
    } else if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      setNav(!nav.classList.contains("is-open"));
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", () => setNav(false));
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav && nav.classList.contains("is-open")) {
      setNav(false);
      return;
    }
    if (event.key !== "Tab" || !nav || !nav.classList.contains("is-open")) return;
    const focusable = navLinks.filter((el) => !el.hasAttribute("disabled"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860 && nav && nav.classList.contains("is-open")) {
      setNav(false);
    }
  });

  if (nav) {
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 860) setNav(false);
      });
    });
  }

  if (!prefersReduced.matches && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-in");
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function setFieldError(input, message) {
    const holder = input.closest("label");
    if (!holder) return;
    let error = holder.querySelector(".field-error");
    if (!error) {
      error = document.createElement("span");
      error.className = "field-error";
      error.id = `${input.id || input.name}-error`;
      holder.appendChild(error);
    }
    error.textContent = message || "";
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (message) input.setAttribute("aria-describedby", error.id);
    else input.removeAttribute("aria-describedby");
  }

  if (form) {
    const status = form.querySelector(".form-status");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const required = Array.from(form.querySelectorAll("[required]"));
      let firstInvalid = null;
      required.forEach((field) => {
        const value = String(data.get(field.name) || "").trim();
        let message = "";
        if (!value) message = "Dieses Feld wird benötigt.";
        else if (field.type === "email" && !validateEmail(value)) {
          message = "Bitte eine gültige E-Mail-Adresse angeben.";
        }
        setFieldError(field, message);
        if (message && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        if (status) {
          status.dataset.state = "error";
          status.textContent = "Bitte prüfe die markierten Felder.";
        }
        return;
      }
      if (status) {
        status.dataset.state = "info";
        status.textContent =
          "Ein Versanddienst ist noch nicht angebunden. Deine Angaben wurden nicht übermittelt. Bitte sende die Anfrage über Instagram @cestmoiagency_.";
      }
    });
  }

  const filterButtons = document.querySelectorAll("[data-filter]");
  const cards = document.querySelectorAll("[data-category]");
  if (filterButtons.length && cards.length) {
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.getAttribute("data-filter");
        filterButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        cards.forEach((card) => {
          const match = value === "all" || card.getAttribute("data-category").includes(value);
          card.hidden = !match;
        });
      });
    });
  }

  document.querySelectorAll("[data-select-talent]").forEach((button) => {
    button.addEventListener("click", () => {
      const select = document.querySelector("#talent");
      const value = button.getAttribute("data-select-talent");
      if (select && value) {
        select.value = value;
        select.focus();
        const formEl = document.querySelector("#booking-form");
        if (formEl) formEl.scrollIntoView({ behavior: prefersReduced.matches ? "auto" : "smooth", block: "start" });
      }
    });
  });
})();
