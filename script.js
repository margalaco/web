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
    [".viewpoint__inner > :not(.viewpoint__statement)"],
    [".section-head > *"],
    [".discipline"],
    [".offer"],
    [".route"],
    [".impact-item"],
    [".case"],
    [".about__content > *", ".about__photo"],
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

// Scroll progress: a fine line at the top of the page that fills as the
// visitor reads. It follows the scroll position directly, so it stays on
// when reduced motion is requested.
const progressBar = document.createElement("div");
progressBar.className = "scroll-progress";
progressBar.setAttribute("aria-hidden", "true");
document.body.prepend(progressBar);

let progressQueued = false;
const updateProgress = () => {
  progressQueued = false;
  const scrollable =
    document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
  progressBar.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
};
const queueProgress = () => {
  if (!progressQueued) {
    progressQueued = true;
    requestAnimationFrame(updateProgress);
  }
};
window.addEventListener("scroll", queueProgress, { passive: true });
window.addEventListener("resize", queueProgress);
updateProgress();

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  // Number ticker: figures count up once when they scroll into view. The
  // original text is restored at the end, so the final value is exact.
  const figures = document.querySelectorAll(
    ".impact-item__figure:not([data-static]), .case__results dt",
  );

  const findNumberNode = (element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (/\d/.test(walker.currentNode.nodeValue)) {
        return walker.currentNode;
      }
    }
    return null;
  };

  const runTicker = (node) => {
    const original = node.nodeValue;
    const match = original.match(/\d[\d,]*/);
    const target = match ? Number(match[0].replace(/,/g, "")) : 0;
    if (!match || target < 10) {
      return;
    }
    const grouped = match[0].includes(",");
    const duration = 1400;
    const start = performance.now();

    const frame = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      if (t >= 1) {
        node.nodeValue = original;
        return;
      }
      const value = Math.round(target * eased);
      node.nodeValue = original.replace(
        match[0],
        grouped ? value.toLocaleString("en-US") : String(value),
      );
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  const tickerObserver = new IntersectionObserver(
    (entries, currentObserver) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const node = findNumberNode(entry.target);
          if (node) {
            runTicker(node);
          }
          currentObserver.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.6 },
  );
  figures.forEach((figure) => tickerObserver.observe(figure));

  // Text reveal: the statement lights up word by word as it moves up the
  // viewport. Words stay in the document as normal text.
  const statement = document.querySelector(".viewpoint__statement");
  if (statement) {
    const words = [];
    const wrapWords = (parent) => {
      for (const child of [...parent.childNodes]) {
        if (child.nodeType === Node.TEXT_NODE) {
          const fragment = document.createDocumentFragment();
          for (const part of child.nodeValue.split(/(\s+)/)) {
            if (!part) {
              continue;
            }
            if (/^\s+$/.test(part)) {
              fragment.append(" ");
            } else {
              const word = document.createElement("span");
              word.className = "reveal-word";
              word.textContent = part;
              words.push(word);
              fragment.append(word);
            }
          }
          child.replaceWith(fragment);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          wrapWords(child);
        }
      }
    };
    wrapWords(statement);
    statement.classList.add("is-revealing");

    let revealQueued = false;
    const updateReveal = () => {
      revealQueued = false;
      const rect = statement.getBoundingClientRect();
      const viewport = window.innerHeight;
      const from = viewport * 0.9;
      const to = viewport * 0.45;
      const progress = Math.min(
        Math.max((from - rect.top) / (from - to), 0),
        1,
      );
      const lit = Math.round(progress * words.length);
      words.forEach((word, index) => {
        word.classList.toggle("is-lit", index < lit);
      });
    };
    const queueReveal = () => {
      if (!revealQueued) {
        revealQueued = true;
        requestAnimationFrame(updateReveal);
      }
    };
    window.addEventListener("scroll", queueReveal, { passive: true });
    window.addEventListener("resize", queueReveal);
    updateReveal();
  }
}

// Analytics consent: Google Analytics is only loaded after the visitor
// accepts. The choice is remembered and can be changed from the footer.
const GA_ID = "G-QPVLEL4L8Q";
const CONSENT_KEY = "analytics-consent";
const cookieBanner = document.querySelector("[data-cookie-banner]");

const readConsent = () => {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
};

const storeConsent = (value) => {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Storage unavailable: the choice applies to this visit only.
  }
};

let analyticsLoaded = false;

const loadAnalytics = () => {
  window[`ga-disable-${GA_ID}`] = false;
  if (analyticsLoaded) {
    return;
  }
  analyticsLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);

  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.append(tag);
};

const removeAnalytics = () => {
  window[`ga-disable-${GA_ID}`] = true;
  const domains = ["", location.hostname, `.${location.hostname.replace(/^www\./, "")}`];
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (name === "_ga" || name.startsWith("_ga_")) {
      for (const domain of domains) {
        document.cookie = `${name}=; Max-Age=0; path=/${
          domain ? `; domain=${domain}` : ""
        }`;
      }
    }
  }
};

if (cookieBanner) {
  const consent = readConsent();

  if (consent === "granted") {
    loadAnalytics();
  } else if (consent !== "denied") {
    cookieBanner.hidden = false;
  }

  cookieBanner.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cookie-choice]");
    if (!button) {
      return;
    }
    const choice = button.dataset.cookieChoice;
    storeConsent(choice);
    if (choice === "granted") {
      loadAnalytics();
    } else {
      removeAnalytics();
    }
    cookieBanner.hidden = true;
  });

  document
    .querySelector("[data-cookie-settings]")
    ?.addEventListener("click", () => {
      cookieBanner.hidden = false;
      cookieBanner.querySelector("button")?.focus();
    });
}
