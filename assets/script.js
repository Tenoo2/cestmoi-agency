(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const smooth = () => (prefersReduced.matches ? "auto" : "smooth");

  /* ---------- Navigation ---------- */

  const nav = document.querySelector("#site-nav");
  const toggle = document.querySelector(".nav-toggle");
  const backdrop = document.querySelector(".nav-backdrop");
  const navLinks = nav ? Array.from(nav.querySelectorAll("a, button")) : [];
  let lastFocus = null;

  function setNav(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    document.body.classList.toggle("nav-open", open);
    if (backdrop) backdrop.hidden = !open;
    if (open) {
      lastFocus = document.activeElement;
      if (navLinks[0]) navLinks[0].focus();
    } else if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  if (toggle && nav) {
    toggle.addEventListener("click", () => setNav(!nav.classList.contains("is-open")));
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 860) setNav(false);
      });
    });
  }

  if (backdrop) backdrop.addEventListener("click", () => setNav(false));

  document.addEventListener("keydown", (event) => {
    if (!nav || !nav.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      setNav(false);
      return;
    }
    if (event.key !== "Tab") return;
    const first = navLinks[0];
    const last = navLinks[navLinks.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860 && nav && nav.classList.contains("is-open")) setNav(false);
  });

  /* ---------- Sprungziele in horizontalen Wisch-Reihen ---------- */

  function revealHashTarget() {
    if (!location.hash) return;
    let target = null;
    try {
      target = document.querySelector(location.hash);
    } catch (e) {
      return;
    }
    if (!target) return;
    const row = target.closest(".service-grid, .services, .swipe-row");
    if (row && row.scrollWidth > row.clientWidth) {
      row.scrollTo({ left: target.offsetLeft - row.offsetLeft, behavior: "auto" });
    }
  }
  window.addEventListener("load", revealHashTarget);
  window.addEventListener("hashchange", revealHashTarget);

  /* ---------- Formulare ---------- */

  const FALLBACK_MESSAGE =
    "Senden ist gerade nicht möglich. Schreib uns bitte direkt auf Instagram @cestmoiagency_.";

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validatePhone(value) {
    return value.replace(/\D/g, "").length >= 6;
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

  function checkField(field) {
    const value = field.value.trim();
    if (field.required && !value) return "Dieses Feld wird benötigt.";
    if (value && field.type === "email" && !validateEmail(value)) {
      return "Bitte eine gültige E-Mail-Adresse angeben.";
    }
    if (value && field.type === "tel" && !validatePhone(value)) {
      return "Bitte eine gültige Telefonnummer angeben.";
    }
    return "";
  }

  function isConfigured(form) {
    const action = form.getAttribute("action") || "";
    return /^https:\/\//.test(action) && !/DEINE_FORM_ID/.test(action);
  }

  document.querySelectorAll("form[data-form]").forEach((form) => {
    const status = form.querySelector(".form-status");
    const submit = form.querySelector('[type="submit"]');
    const fields = Array.from(form.querySelectorAll("input:not([type=hidden]):not([tabindex='-1']), textarea, select"));

    fields.forEach((field) => {
      field.addEventListener("blur", () => {
        if (field.getAttribute("aria-invalid") === "true") setFieldError(field, checkField(field));
      });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      let firstInvalid = null;
      fields.forEach((field) => {
        const message = checkField(field);
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

      if (!isConfigured(form)) {
        if (status) {
          status.dataset.state = "error";
          status.textContent = FALLBACK_MESSAGE;
        }
        return;
      }

      if (submit) submit.disabled = true;
      if (status) {
        status.dataset.state = "info";
        status.textContent = "Wird gesendet …";
      }

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(String(response.status));
        form.reset();
        if (status) {
          status.dataset.state = "success";
          status.textContent = form.dataset.success || "Danke! Wir melden uns schnellstmöglich bei dir.";
        }
      } catch (error) {
        if (status) {
          status.dataset.state = "error";
          status.textContent = FALLBACK_MESSAGE;
        }
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  });

  /* ---------- Filter (Projekte) ---------- */

  document.querySelectorAll("[data-filter-for]").forEach((group) => {
    const scope = document.querySelector(group.getAttribute("data-filter-for"));
    if (!scope) return;
    const buttons = group.querySelectorAll("[data-filter]");
    const items = scope.querySelectorAll("[data-category]");
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.getAttribute("data-filter");
        buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        items.forEach((item) => {
          const cats = item.getAttribute("data-category").split(/\s+/);
          item.hidden = !(value === "all" || cats.includes(value));
        });
      });
    });
  });

  /* ---------- Case-Galerien (Projekte) ---------- */

  document.querySelectorAll("[data-case-media]").forEach((media) => {
    const track = media.querySelector(".case-track");
    const controls = media.querySelector(".case-controls");
    const dotsHolder = media.querySelector(".case-dots");
    const prev = media.querySelector("[data-case-prev]");
    const next = media.querySelector("[data-case-next]");
    if (!track) return;
    const items = Array.from(track.children);

    if (items.length < 2) {
      if (controls) controls.hidden = true;
      return;
    }

    const dots = items.map(() => {
      const dot = document.createElement("span");
      if (dotsHolder) dotsHolder.appendChild(dot);
      return dot;
    });

    function current() {
      const left = track.scrollLeft;
      let index = 0;
      let best = Infinity;
      items.forEach((item, i) => {
        const distance = Math.abs(item.offsetLeft - track.offsetLeft - left - parseFloat(getComputedStyle(track).paddingLeft || 0));
        if (distance < best) {
          best = distance;
          index = i;
        }
      });
      return index;
    }

    function update() {
      const index = current();
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
      const maxScroll = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= maxScroll;
      if (controls) controls.hidden = track.scrollWidth <= track.clientWidth + 2 && window.innerWidth > 860;
    }

    function go(step) {
      const index = Math.max(0, Math.min(items.length - 1, current() + step));
      const pad = parseFloat(getComputedStyle(track).paddingLeft || 0);
      track.scrollTo({ left: items[index].offsetLeft - track.offsetLeft - pad, behavior: smooth() });
    }

    if (prev) prev.addEventListener("click", () => go(-1));
    if (next) next.addEventListener("click", () => go(1));
    let ticking = false;
    track.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  // Nur ein Video mit Ton gleichzeitig: startet jemand ein Video, pausieren alle anderen.
  // Stumme Vorschau-Loops (data-autoplay) zählen nicht und stoppen nichts.
  document.addEventListener("play", (event) => {
    if (event.target.hasAttribute("data-autoplay")) return;
    document.querySelectorAll("video").forEach((video) => {
      if (video !== event.target) video.pause();
    });
  }, true);

  /* ---------- Stumme Vorschau-Videos (data-autoplay) ---------- */
  // Laufen nur, solange sie im Bild sind. Bei "Bewegung reduzieren" bleibt das Poster stehen.

  const autoVideos = Array.from(document.querySelectorAll("video[data-autoplay]"));
  autoVideos.forEach((video) => {
    video.muted = true;
    video.setAttribute("muted", "");
  });

  function tryPlay(video) {
    if (prefersReduced.matches) return;
    if (video.preload === "none") video.preload = "auto";
    const promise = video.play();
    if (promise && typeof promise.catch === "function") promise.catch(() => {});
  }

  if (autoVideos.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) tryPlay(entry.target);
        else entry.target.pause();
      });
    }, { threshold: 0.35 });
    autoVideos.forEach((video) => observer.observe(video));

    prefersReduced.addEventListener?.("change", () => {
      if (prefersReduced.matches) autoVideos.forEach((video) => video.pause());
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) autoVideos.forEach((video) => video.pause());
    });
  }

  /* ---------- Booking: Story-Viewer ---------- */

  const story = document.querySelector("[data-story]");
  if (story) initStory(story);

  function initStory(root) {
    const frame = root.querySelector(".story-frame");
    const profiles = Array.from(root.querySelectorAll(".story-profile"));
    const progress = root.querySelector(".story-progress");
    const nameEl = root.querySelector(".story-name");
    const catEl = root.querySelector(".story-cat");
    const countEl = root.querySelector(".story-count");
    const avatarsHolder = root.querySelector(".story-avatars");
    const selectBtn = root.querySelector("[data-story-select]");
    const prevProfileBtn = root.querySelector("[data-story-prev-profile]");
    const nextProfileBtn = root.querySelector("[data-story-next-profile]");
    const filterButtons = Array.from(root.querySelectorAll("[data-story-filter]"));
    const live = root.querySelector(".story-live");
    if (!frame || !profiles.length) return;

    frame.classList.remove("no-js");
    frame.setAttribute("tabindex", "-1");

    const labels = { model: "Model", creator: "Creator", influencer: "Influencer" };
    let visible = profiles.slice();
    let p = 0;
    let i = 0;

    // Avatare
    const avatars = profiles.map((profile, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "story-avatar";
      const firstImg = profile.querySelector("img");
      const thumb = document.createElement("img");
      thumb.src = firstImg ? firstImg.getAttribute("src") : "";
      thumb.alt = "";
      thumb.loading = "lazy";
      const label = document.createElement("span");
      label.textContent = profile.dataset.name || `Profil ${index + 1}`;
      button.append(thumb, label);
      button.addEventListener("click", () => {
        p = visible.indexOf(profile);
        i = 0;
        render(true);
      });
      if (avatarsHolder) avatarsHolder.appendChild(button);
      return button;
    });

    function catLabel(profile) {
      const cats = (profile.dataset.category || "").split(/\s+/).filter(Boolean);
      return cats.map((c) => labels[c] || c).join(" · ");
    }

    function render(announce) {
      const empty = root.querySelector(".story-empty");
      if (!visible.length) {
        profiles.forEach((profile) => profile.classList.remove("is-current"));
        if (empty) empty.hidden = false;
        if (nameEl) nameEl.textContent = "";
        if (catEl) catEl.textContent = "";
        if (progress) progress.innerHTML = "";
        if (countEl) countEl.textContent = "";
        if (selectBtn) selectBtn.hidden = true;
        return;
      }
      if (empty) empty.hidden = true;
      if (selectBtn) selectBtn.hidden = false;

      const profile = visible[p];
      const images = Array.from(profile.querySelectorAll("img"));
      i = Math.max(0, Math.min(i, images.length - 1));

      profiles.forEach((item) => item.classList.toggle("is-current", item === profile));
      images.forEach((img, index) => {
        img.classList.toggle("is-shown", index === i);
        if (index === i || index === i + 1) img.loading = "eager";
      });

      // nächstes Profil vorladen
      const nextProfile = visible[(p + 1) % visible.length];
      const nextFirst = nextProfile && nextProfile.querySelector("img");
      if (nextFirst) nextFirst.loading = "eager";

      if (progress) {
        progress.innerHTML = "";
        images.forEach((_, index) => {
          const bar = document.createElement("span");
          if (index <= i) bar.classList.add("is-done");
          progress.appendChild(bar);
        });
      }

      if (nameEl) nameEl.textContent = profile.dataset.name || "";
      if (catEl) catEl.textContent = catLabel(profile);
      if (countEl) countEl.textContent = `Profil ${p + 1} / ${visible.length}`;

      avatars.forEach((avatar, index) => {
        avatar.hidden = !visible.includes(profiles[index]);
        avatar.setAttribute("aria-current", String(profiles[index] === profile));
      });

      if (announce && live) {
        live.textContent = `${profile.dataset.name}, Bild ${i + 1} von ${images.length}`;
      }
    }

    function nextImage() {
      if (!visible.length) return;
      const count = visible[p].querySelectorAll("img").length;
      if (i < count - 1) {
        i += 1;
      } else {
        p = (p + 1) % visible.length;
        i = 0;
      }
      render(true);
    }

    function prevImage() {
      if (!visible.length) return;
      if (i > 0) {
        i -= 1;
      } else {
        p = (p - 1 + visible.length) % visible.length;
        i = 0;
      }
      render(true);
    }

    function stepProfile(step) {
      if (!visible.length) return;
      p = (p + step + visible.length) % visible.length;
      i = 0;
      render(true);
    }

    // Tippen links/rechts
    let swiped = false;
    const tapPrev = root.querySelector(".story-tap-prev");
    const tapNext = root.querySelector(".story-tap-next");
    if (tapPrev) tapPrev.addEventListener("click", () => {
      if (swiped) return;
      prevImage();
    });
    if (tapNext) tapNext.addEventListener("click", () => {
      if (swiped) return;
      nextImage();
    });

    // Wischen
    let startX = 0;
    let startY = 0;
    let tracking = false;
    frame.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      tracking = true;
      swiped = false;
      startX = event.clientX;
      startY = event.clientY;
    });
    frame.addEventListener("pointerup", (event) => {
      if (!tracking) return;
      tracking = false;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        swiped = true;
        if (dx < 0) nextImage();
        else prevImage();
        setTimeout(() => {
          swiped = false;
        }, 60);
      }
    });
    frame.addEventListener("pointercancel", () => {
      tracking = false;
    });

    // Tastatur, wenn der Viewer fokussiert ist
    root.addEventListener("keydown", (event) => {
      if (event.target.closest("input, textarea, select")) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        nextImage();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        prevImage();
      }
    });

    if (prevProfileBtn) prevProfileBtn.addEventListener("click", () => stepProfile(-1));
    if (nextProfileBtn) nextProfileBtn.addEventListener("click", () => stepProfile(1));

    // Kategorien
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.getAttribute("data-story-filter");
        filterButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        visible = profiles.filter((profile) => {
          const cats = (profile.dataset.category || "").split(/\s+/);
          return value === "all" || cats.includes(value);
        });
        p = 0;
        i = 0;
        render(false);
      });
    });

    // Für Anfrage wählen
    if (selectBtn) {
      selectBtn.addEventListener("click", () => {
        const profile = visible[p];
        const select = document.querySelector("#talent");
        const formEl = document.querySelector("#booking-form");
        if (select && profile) {
          const name = profile.dataset.name;
          if (!Array.from(select.options).some((o) => o.value === name)) {
            select.add(new Option(name, name), select.options[select.options.length - 1]);
          }
          select.value = name;
        }
        if (formEl) {
          formEl.scrollIntoView({ behavior: smooth(), block: "start" });
          const nameField = formEl.querySelector("input[name='name']");
          if (nameField) setTimeout(() => nameField.focus({ preventScroll: true }), prefersReduced.matches ? 0 : 450);
        }
      });
    }

    // Auswahlliste im Formular aus den Profilen befüllen
    const select = document.querySelector("#talent");
    if (select) {
      const keep = Array.from(select.options);
      const firstOption = keep[0];
      const lastOption = keep[keep.length - 1];
      select.innerHTML = "";
      select.add(firstOption);
      profiles.forEach((profile) => {
        const name = profile.dataset.name;
        select.add(new Option(`${name} (${catLabel(profile)})`, name));
      });
      select.add(lastOption);
    }

    render(false);
  }
})();
