document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const header = document.querySelector("header");
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-links");
  const navOverlay = document.querySelector(".nav-overlay");
  const firstFocusableSelector =
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
  let lastFocusedElement = null;

  const focusTrap = (event) => {
    if (!navMenu?.classList.contains("open") || event.key !== "Tab") return;
    const focusable = Array.from(navMenu.querySelectorAll(firstFocusableSelector));
    if (!focusable.length) return;

    const firstEl = focusable[0];
    const lastEl = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === firstEl) {
      event.preventDefault();
      lastEl.focus();
    } else if (!event.shiftKey && document.activeElement === lastEl) {
      event.preventDefault();
      firstEl.focus();
    }
  };

  const closeMenu = () => {
    if (!navMenu || !navToggle || !navOverlay) return;
    navMenu.classList.remove("open");
    navOverlay.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    body.classList.remove("menu-open");
    if (lastFocusedElement) lastFocusedElement.focus();
  };

  const openMenu = () => {
    if (!navMenu || !navToggle || !navOverlay) return;
    lastFocusedElement = document.activeElement;
    navMenu.classList.add("open");
    navOverlay.classList.add("open");
    navToggle.setAttribute("aria-expanded", "true");
    body.classList.add("menu-open");
    const firstLink = navMenu.querySelector("a");
    if (firstLink) firstLink.focus();
  };

  if (navToggle && navMenu && navOverlay) {
    navToggle.addEventListener("click", () => {
      if (navMenu.classList.contains("open")) closeMenu();
      else openMenu();
    });

    navOverlay.addEventListener("click", closeMenu);

    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navMenu.classList.contains("open")) closeMenu();
      focusTrap(event);
    });
  }

  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  window.addEventListener("scroll", setHeaderState, { passive: true });
  setHeaderState();

  // Accessible tabs / filters
  const setupTablist = (containerSelector, buttonSelector, panelSelector) => {
    const tablist = document.querySelector(containerSelector);
    if (!tablist) return;
    const tabs = Array.from(tablist.querySelectorAll(buttonSelector));
    const panels = panelSelector ? Array.from(document.querySelectorAll(panelSelector)) : [];

    const activateTab = (tab) => {
      tabs.forEach((t) => {
        const isActive = t === tab;
        t.classList.toggle("active", isActive);
        t.setAttribute("aria-selected", String(isActive));
        t.setAttribute("tabindex", isActive ? "0" : "-1");
      });

      const filter = tab.dataset.filter;
      panels.forEach((panel) => {
        const categories = (panel.dataset.category || "").split(" ");
        const visible = filter === "all" || categories.includes(filter);
        panel.classList.toggle("is-hidden", !visible);
      });
    };

    tabs.forEach((tab, index) => {
      tab.id ||= `${containerSelector.replace(/[^a-z0-9]/gi, "")}-tab-${index}`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", tab.classList.contains("active") ? "true" : "false");
      tab.setAttribute("tabindex", tab.classList.contains("active") ? "0" : "-1");

      tab.addEventListener("click", () => activateTab(tab));
      tab.addEventListener("keydown", (event) => {
        const currentIndex = tabs.indexOf(tab);
        let nextIndex = null;
        if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
        if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        if (nextIndex !== null) {
          event.preventDefault();
          tabs[nextIndex].focus();
          activateTab(tabs[nextIndex]);
        }
      });
    });
  };

  setupTablist(".services-filter", ".chip", ".service-card-modern");
  setupTablist(".filters", ".filter-button", ".portfolio-item");

  // Before / after sliders
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".ba-slider").forEach((slider, sliderIndex) => {
    const before = slider.querySelector(".ba-before");
    const after = slider.querySelector(".ba-after");
    const handle = slider.querySelector(".ba-handle");
    const line = slider.querySelector(".ba-line");
    if (!before || !after || !handle || !line) return;

    let dragging = false;
    let percentage = Number(slider.dataset.start) || 50;

    slider.setAttribute("role", "slider");
    slider.setAttribute("aria-label", "Comparație înainte și după");
    slider.setAttribute("aria-valuemin", "0");
    slider.setAttribute("aria-valuemax", "100");
    slider.setAttribute("tabindex", "0");
    slider.setAttribute("aria-valuenow", String(Math.round(percentage)));
    slider.setAttribute("aria-valuetext", `${Math.round(percentage)}% după`);
    slider.dataset.sliderIndex = String(sliderIndex + 1);

    const setPosition = (next, animate = false) => {
      percentage = Math.max(0, Math.min(100, next));
      const transition = !reduceMotion && animate ? "left 180ms ease" : "none";
      handle.style.transition = transition;
      line.style.transition = transition;
      handle.style.left = `${percentage}%`;
      line.style.left = `${percentage}%`;
      before.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
      after.style.clipPath = `inset(0 0 0 ${percentage}%)`;
      slider.setAttribute("aria-valuenow", String(Math.round(percentage)));
      slider.setAttribute("aria-valuetext", `${Math.round(percentage)}% după`);
    };

    const moveFromClientX = (clientX) => {
      const rect = slider.getBoundingClientRect();
      const next = ((clientX - rect.left) / rect.width) * 100;
      setPosition(next);
    };

    const startDrag = () => {
      dragging = true;
      slider.classList.add("is-dragging");
    };
    const stopDrag = () => {
      dragging = false;
      slider.classList.remove("is-dragging");
    };

    [handle, line].forEach((el) => {
      el.addEventListener("mousedown", startDrag);
      el.addEventListener("touchstart", startDrag, { passive: true });
    });

    window.addEventListener("mousemove", (event) => dragging && moveFromClientX(event.clientX));
    window.addEventListener(
      "touchmove",
      (event) => dragging && moveFromClientX(event.touches[0].clientX),
      { passive: true },
    );
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchend", stopDrag);

    slider.addEventListener("click", (event) => {
      if (!dragging) moveFromClientX(event.clientX);
    });

    slider.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") setPosition(percentage - 5, true);
      if (event.key === "ArrowRight") setPosition(percentage + 5, true);
    });

    setPosition(percentage, true);
  });

  // Portfolio modal with keyboard navigation
  const portfolioItems = Array.from(document.querySelectorAll(".portfolio-item"));
  const lightbox = document.querySelector(".lightbox");
  if (lightbox && portfolioItems.length) {
    const image = lightbox.querySelector("img");
    const caption = lightbox.querySelector(".lightbox-caption");
    const closeBtn = lightbox.querySelector(".close");
    let activeIndex = 0;

    const updateModal = (index) => {
      const item = portfolioItems[index];
      const img = item?.querySelector("img");
      if (!img || !image || !caption) return;
      activeIndex = index;
      image.src = img.src;
      image.alt = img.alt;
      const title = item.dataset.title || item.querySelector("h4")?.textContent || "Proiect";
      const category = item.dataset.categoryLabel || item.dataset.category || "Categorie";
      const description =
        item.dataset.description || "Proiect realizat cu focus pe calitate, detalii și impact vizual.";
      caption.innerHTML = `<strong>${title}</strong><span>${category}</span><p>${description}</p>`;
    };

    const openModal = (index) => {
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      updateModal(index);
      closeBtn?.focus();
      body.classList.add("menu-open");
    };

    const closeModal = () => {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      body.classList.remove("menu-open");
    };

    const goTo = (step) => {
      const next = (activeIndex + step + portfolioItems.length) % portfolioItems.length;
      updateModal(next);
    };

    portfolioItems.forEach((item, index) => {
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", `Deschide detalii pentru ${item.querySelector("h4")?.textContent || "proiect"}`);
      item.addEventListener("click", () => openModal(index));
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openModal(index);
        }
      });
    });

    closeBtn?.addEventListener("click", closeModal);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (!lightbox.classList.contains("open")) return;
      if (event.key === "Escape") closeModal();
      if (event.key === "ArrowRight") goTo(1);
      if (event.key === "ArrowLeft") goTo(-1);
    });
  }

  // FAQ accordion
  document.querySelectorAll(".accordion-item").forEach((item) => {
    const header = item.querySelector(".accordion-header");
    if (!header) return;
    header.setAttribute("tabindex", "0");
    header.setAttribute("role", "button");
    header.setAttribute("aria-expanded", item.classList.contains("open") ? "true" : "false");

    const toggle = () => {
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".accordion-item.open").forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove("open");
          openItem.querySelector(".accordion-header")?.setAttribute("aria-expanded", "false");
        }
      });
      item.classList.toggle("open", !isOpen);
      header.setAttribute("aria-expanded", String(!isOpen));
    };

    header.addEventListener("click", toggle);
    header.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
  });

  // Contact form validation + success/loading state
  const contactForm = document.querySelector(".contact-section form");
  if (contactForm) {
    const status = contactForm.querySelector(".form-status");
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const emailInput = contactForm.querySelector('input[type="email"]');

    const showMessage = (message, type) => {
      if (!status) return;
      status.textContent = message;
      status.className = `form-status ${type}`;
      status.setAttribute("role", "status");
    };

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(contactForm);
      const requiredFields = ["nume", "email", "telefon", "serviciu", "mesaj"];
      let hasError = false;

      requiredFields.forEach((name) => {
        const field = contactForm.querySelector(`[name="${name}"]`);
        if (!field) return;
        const value = String(data.get(name) || "").trim();
        const valid = value.length > 0;
        field.setAttribute("aria-invalid", String(!valid));
        field.classList.toggle("field-error", !valid);
        if (!valid) hasError = true;
      });

      const emailValue = String(data.get("email") || "").trim();
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
      if (emailInput && !emailValid) {
        emailInput.setAttribute("aria-invalid", "true");
        emailInput.classList.add("field-error");
        hasError = true;
      }

      if (hasError) {
        showMessage("Te rugăm completează corect toate câmpurile obligatorii.", "error");
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.dataset.originalLabel = submitButton.textContent;
        submitButton.innerHTML = '<span class="spinner" aria-hidden="true"></span> Se trimite...';
      }

      setTimeout(() => {
        contactForm.reset();
        showMessage("Mulțumim! Mesajul a fost trimis cu succes. Revenim cât mai curând.", "success");
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = submitButton.dataset.originalLabel || "Trimite";
        }
      }, 1000);
    });
  }

  // Lazy loading improvements
  document.querySelectorAll("img").forEach((img) => {
    if (!img.hasAttribute("loading")) img.loading = "lazy";
    if (!img.hasAttribute("decoding")) img.decoding = "async";
  });
});
