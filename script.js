const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    siteNav.classList.toggle("is-open", !isOpen);
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
    }
  });
}

const year = document.querySelector("[data-year]");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (!prefersReducedMotion) {
  const typewriterHeadings = [];
  const prepareTypewriter = (heading, startImmediately = false) => {
    const visualHeading = document.createElement("span");
    const accessibleText = document.createElement("span");
    accessibleText.className = "visually-hidden";
    accessibleText.textContent = heading.textContent;
    visualHeading.className = "typewriter-visual";
    visualHeading.setAttribute("aria-hidden", "true");
    for (const child of heading.childNodes) {
      visualHeading.append(child.cloneNode(true));
    }

    const textNodes = [];
    const walker = document.createTreeWalker(
      visualHeading,
      NodeFilter.SHOW_TEXT,
    );

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    let characterIndex = 0;

    for (const textNode of textNodes) {
      const fragment = document.createDocumentFragment();
      const tokens = textNode.textContent.match(/\s+|\S+/g) ?? [];

      for (const token of tokens) {
        if (/^\s+$/.test(token)) {
          fragment.append(document.createTextNode(token));
          continue;
        }

        const word = document.createElement("span");
        word.className = "typewriter-word";

        for (const character of Array.from(token)) {
          const letter = document.createElement("span");
          letter.className = "typewriter-character";
          letter.style.setProperty(
            "--type-delay",
            `${characterIndex * 24}ms`,
          );
          letter.textContent = character;
          word.append(letter);
          characterIndex += 1;
        }

        fragment.append(word);
      }

      textNode.replaceWith(fragment);
    }

    heading.replaceChildren(accessibleText, visualHeading);
    typewriterHeadings.push(heading);
    if (startImmediately) {
      heading.classList.add("is-typing");
    }
  };

  const heroHeading = document.querySelector(".hero h1");
  if (heroHeading) {
    prepareTypewriter(heroHeading, true);
  }

  document
    .querySelectorAll(
      ".section-heading h2, .story h2, .history h2, .contact h2",
    )
    .forEach((heading) => prepareTypewriter(heading));

  if ("IntersectionObserver" in window) {
    const revealGroups = [
      [".hero__visual", ".hero__meta"],
      [".intro-band__inner > *"],
      [".section-heading > *"],
      [".service"],
      [".impact-item"],
      [".impact-footnote"],
      [".story__label", ".story__content > *"],
      [".history__copy > *", ".history__credits"],
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
    const typewriterObserver = new IntersectionObserver(
      (entries, currentObserver) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-typing");
            currentObserver.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0.35,
        rootMargin: "0px 0px -4% 0px",
      },
    );

    for (const group of revealGroups) {
      const elements = document.querySelectorAll(group.join(", "));

      elements.forEach((element, index) => {
        element.classList.add("scroll-reveal");
        element.style.setProperty(
          "--reveal-delay",
          `${Math.min(index, 3) * 100}ms`,
        );
        observer.observe(element);
      });
    }

    typewriterHeadings
      .filter((heading) => heading !== heroHeading)
      .forEach((heading) => typewriterObserver.observe(heading));

    document.documentElement.classList.add("motion-ready");
  } else {
    typewriterHeadings.forEach((heading) =>
      heading.classList.add("is-typing"),
    );
  }
}
