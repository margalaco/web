const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

if (menuToggle && siteNav) {
  const setMenu = (isOpen) => {
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    siteNav.classList.toggle("is-open", isOpen);
  };

  menuToggle.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      setMenu(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && siteNav.classList.contains("is-open")) {
      setMenu(false);
      menuToggle.focus();
    }
  });
}

// Email links are assembled at runtime so the address never appears in the
// HTML for scrapers. Without JavaScript they fall back to LinkedIn.
document.querySelectorAll("[data-mail]").forEach((link) => {
  const address = `${link.dataset.mail}@${"margaritacolombo.com"}`;
  const subject = link.dataset.subject;
  link.href = `mailto:${address}${
    subject ? `?subject=${encodeURIComponent(subject)}` : ""
  }`;
});

const year = document.querySelector("[data-year]");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const revealGroups = [
    [".viewpoint__inner > *"],
    [".section-head > *"],
    [".discipline"],
    [".offer"],
    [".route"],
    [".impact-item"],
    [".about__content > *", ".about__photo"],
    [".history__copy", ".history__figure"],
    [".faq__item"],
    [".contact__inner > *"],
  ];

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      }
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -6% 0px",
    },
  );

  for (const group of revealGroups) {
    const elements = document.querySelectorAll(group.join(", "));

    elements.forEach((element, index) => {
      element.classList.add("scroll-reveal");
      element.style.setProperty(
        "--reveal-delay",
        `${Math.min(index, 3) * 90}ms`,
      );
      observer.observe(element);
    });
  }

  document.documentElement.classList.add("motion-ready");
}
