/*
 * SDG PRINT & Design JavaScript
 *
 * This script powers the interactive behaviour across the SDG PRINT & Design
 * website. It enables the mobile navigation toggle, testimonial slider,
 * before/after comparison control, portfolio filtering and lightbox,
 * FAQ accordion functionality and a basic contact form handler. All
 * interactions are kept intentionally lightweight to maintain a fa-solidt and
 * responsive user experience on both mobile and desktop devices. The
 * functions are only executed when the relevant elements exist on the page
 * to avoid errors on pages that don't include certain sections.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Mobile navigation toggle
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  // Before/after comparison slider
  // Before/after comparison slider (CodePen style - no range bar)
  const baSliders = document.querySelectorAll(".ba-slider");

  const initBASlider = (slider) => {
    const handle = slider.querySelector(".ba-handle");
    const line = slider.querySelector(".ba-line");
    const before = slider.querySelector(".ba-before");
    const after = slider.querySelector(".ba-after");

    if (!handle || !line || !before || !after) return;

    let isDragging = false;

    const setToPercentage = (percentage, withTransition = false) => {
      const p = Math.max(0, Math.min(100, percentage));

      if (withTransition) {
        handle.style.transition = "left 0.3s ease";
        line.style.transition = "left 0.3s ease";
      } else {
        handle.style.transition = "none";
        line.style.transition = "none";
      }

      handle.style.left = `${p}%`;
      line.style.left = `${p}%`;

      // clip-path: before shows left part, after shows right part
      before.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
      after.style.clipPath = `inset(0 0 0 ${p}%)`;
    };

    const move = (clientX) => {
      const rect = slider.getBoundingClientRect();
      let x = clientX - rect.left;
      x = Math.max(0, Math.min(rect.width, x));
      const percentage = Math.round((x / rect.width) * 100);
      setToPercentage(percentage, false);
    };

    const startDragging = () => {
      isDragging = true;
      handle.style.transition = "none";
      line.style.transition = "none";
    };

    const stopDragging = () => {
      isDragging = false;
      handle.style.transition = "left 0.3s ease";
      line.style.transition = "left 0.3s ease";
    };

    // Start position (default 50)
    const start = Number(slider.getAttribute("data-start")) || 50;
    // init after images load/layout
    window.addEventListener("load", () => setToPercentage(start, true));

    // mouse
    handle.addEventListener("mousedown", startDragging);
    line.addEventListener("mousedown", startDragging);

    window.addEventListener("mousemove", (e) => {
      if (isDragging) move(e.clientX);
    });
    window.addEventListener("mouseup", stopDragging);

    // touch
    handle.addEventListener("touchstart", startDragging, { passive: true });
    line.addEventListener("touchstart", startDragging, { passive: true });

    window.addEventListener(
      "touchmove",
      (e) => {
        if (isDragging) move(e.touches[0].clientX);
      },
      { passive: true },
    );

    window.addEventListener("touchend", stopDragging);

    // Optional: click to jump
    slider.addEventListener("click", (e) => {
      // nu sari când e drag
      if (isDragging) return;
      move(e.clientX);
    });
  };

  baSliders.forEach(initBASlider);

  // Services filter (interactive chips)
  const chips = document.querySelectorAll(".services-filter .chip");
  const serviceCards = document.querySelectorAll(".service-card-modern");

  if (chips.length && serviceCards.length) {
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");

        const filter = chip.getAttribute("data-filter");
        serviceCards.forEach((card) => {
          const category = card.getAttribute("data-category");
          const shouldShow = filter === "all" || category === filter;
          card.classList.toggle("is-hidden", !shouldShow);
        });
      });
    });
  }

  // Products spotlight (interactive preview)
  const spotItems = document.querySelectorAll(".spot-item");
  const previewTitle = document.getElementById("previewTitle");
  const previewDesc = document.getElementById("previewDesc");
  const previewTag = document.getElementById("previewTag");
  const previewLink = document.getElementById("previewLink");
  const previewIconWrap = document.getElementById("previewIcon");

  const setPreviewFromItem = (item) => {
    if (
      !item ||
      !previewTitle ||
      !previewDesc ||
      !previewTag ||
      !previewLink ||
      !previewIconWrap
    )
      return;

    const title = item.getAttribute("data-title") || "";
    const desc = item.getAttribute("data-desc") || "";
    const tag = item.getAttribute("data-tag") || "";
    const icon = item.getAttribute("data-icon") || "fa-star";
    const link = item.getAttribute("data-link") || "#";

    // Active state
    spotItems.forEach((i) => i.classList.remove("is-active"));
    item.classList.add("is-active");

    // Animate text update
    [previewTitle, previewDesc, previewTag, previewIconWrap].forEach((el) => {
      el.classList.remove("preview-fade");
      // force reflow
      void el.offsetWidth;
      el.classList.add("preview-fade");
    });

    previewTitle.textContent = title;
    previewDesc.textContent = desc;
    previewTag.textContent = tag;
    previewLink.setAttribute("href", link);

    // swap icon
    previewIconWrap.innerHTML = `<i class="fa-solid ${icon}"></i>`;
  };

  // Hover + click
  if (spotItems.length) {
    spotItems.forEach((item) => {
      item.addEventListener("mouseenter", () => setPreviewFromItem(item));
      item.addEventListener("click", () => setPreviewFromItem(item));
    });

    // init from first active
    const initial =
      document.querySelector(".spot-item.is-active") || spotItems[0];
    setPreviewFromItem(initial);
  }

  // Portfolio filter
  const filterButtons = document.querySelectorAll(".filter-button");
  const portfolioItems = document.querySelectorAll(".portfolio-item");
  if (filterButtons.length > 0 && portfolioItems.length > 0) {
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // remove active class from currently active button
        const activeBtn = document.querySelector(".filter-button.active");
        if (activeBtn) activeBtn.classList.remove("active");
        button.classList.add("active");
        const filter = button.getAttribute("data-filter");
        portfolioItems.forEach((item) => {
          const categories = (item.getAttribute("data-category") || "").split(
            " ",
          );
          if (filter === "all" || categories.includes(filter)) {
            item.style.display = "block";
          } else {
            item.style.display = "none";
          }
        });
      });
    });
  }

  // Portfolio lightbox
  const lightbox = document.querySelector(".lightbox");
  if (lightbox && portfolioItems.length > 0) {
    const lightboxImg = lightbox.querySelector("img");
    const caption = lightbox.querySelector(".lightbox-caption");
    const closeBtn = lightbox.querySelector(".close");
    portfolioItems.forEach((item) => {
      item.addEventListener("click", () => {
        const img = item.querySelector("img");
        const infoTitle = item.querySelector(".portfolio-info h4");
        if (img) {
          lightboxImg.src = img.src;
          if (infoTitle) {
            caption.textContent = infoTitle.textContent;
          } else {
            caption.textContent = "";
          }
          lightbox.classList.add("open");
        }
      });
    });
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        lightbox.classList.remove("open");
      });
    }
    lightbox.addEventListener("click", (e) => {
      // close when clicking outside the image
      if (e.target === lightbox) {
        lightbox.classList.remove("open");
      }
    });
  }

  // FAQ accordion
  const accordionItems = document.querySelectorAll(".accordion-item");
  accordionItems.forEach((item) => {
    const header = item.querySelector(".accordion-header");
    if (header) {
      header.addEventListener("click", () => {
        // Close any other open item
        const currentlyOpen = document.querySelector(".accordion-item.open");
        if (currentlyOpen && currentlyOpen !== item) {
          currentlyOpen.classList.remove("open");
        }
        item.classList.toggle("open");
      });
    }
  });

  // Contact form submission (simple alert)
  const contactForm = document.querySelector(".contact-section form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Mulțumim pentru mesaj! Vă vom contacta în curând.");
      contactForm.reset();
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  /* ====== TIMELINE SCROLL ANIMATION ====== */
  const timeline = document.querySelector(".timeline-line");
  const blocks = document.querySelectorAll(".timeline-block");

  const revealTimeline = () => {
    const trigger = window.innerHeight * 0.8;

    blocks.forEach((block) => {
      const top = block.getBoundingClientRect().top;
      if (top < trigger) {
        block.classList.add("visible");
      }
    });

    const timelineHeight =
      document.querySelector(".timeline-wrapper").offsetHeight;
    if (window.scrollY > 300) {
      timeline.style.height = timelineHeight + "px";
    }
  };

  window.addEventListener("scroll", revealTimeline);

  /* ====== IMPACT COUNTER ANIMATION ====== */
  const counters = document.querySelectorAll(".impact-card h3");

  counters.forEach((counter) => {
    const updateCount = () => {
      const target = parseInt(counter.innerText.replace(/\D/g, ""));
      if (!target) return;

      let count = 0;
      const step = target / 100;

      const interval = setInterval(() => {
        count += step;
        if (count >= target) {
          counter.innerText = target + "+";
          clearInterval(interval);
        } else {
          counter.innerText = Math.floor(count) + "+";
        }
      }, 20);
    };

    updateCount();
  });
});

// Reveal on scroll (pentru .reveal)
const reveals = document.querySelectorAll(".reveal");
if (reveals.length) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("is-visible");
      });
    },
    { threshold: 0.18 },
  );

  reveals.forEach((el) => io.observe(el));
}

// Animate process connector line when section enters
const processLine = document.querySelector(".process-line");
const processWrap = document.querySelector(".process-pro");

if (processLine && processWrap) {
  const ioLine = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) processLine.classList.add("is-animated");
      });
    },
    { threshold: 0.25 },
  );

  ioLine.observe(processWrap);
}

// Premium tilt hover (subtle 3D) for any [data-tilt-group]
const tiltGroups = document.querySelectorAll("[data-tilt-group]");
tiltGroups.forEach((group) => {
  const cards = group.querySelectorAll(
    ".step-pro, .why-pro-card, .floating-card",
  );

  cards.forEach((card) => {
    let rect = null;

    const onMove = (e) => {
      rect = rect || card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width; // 0..1
      const y = (e.clientY - rect.top) / rect.height; // 0..1

      const rotateY = (x - 0.5) * 8; // -4..4
      const rotateX = (0.5 - y) * 8; // -4..4

      card.style.transform = `translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const onEnter = () => {
      rect = card.getBoundingClientRect();
      card.style.transition = "transform 120ms ease";
      // after initial tick allow smooth
      setTimeout(() => (card.style.transition = "transform 80ms linear"), 120);
    };

    const onLeave = () => {
      card.style.transition = "transform 220ms ease";
      card.style.transform = "";
      rect = null;
    };

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
  });
});
