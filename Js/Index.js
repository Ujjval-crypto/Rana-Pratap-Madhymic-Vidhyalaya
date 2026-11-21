const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  navLinks.addEventListener("click", event => {
    if (event.target.closest("a")) {
      navLinks.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && navLinks.classList.contains("open")) {
      navLinks.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.focus();
    }
  });
  document.addEventListener("click", event => {
    if (!navLinks.classList.contains("open")) return;
    if (!navLinks.contains(event.target) && !menuButton.contains(event.target)) {
      navLinks.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900 && navLinks.classList.contains("open")) {
      navLinks.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
}

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach(element => revealObserver.observe(element));
} else {
  revealElements.forEach(element => element.classList.add("visible"));
}

document.querySelectorAll(".counter").forEach(counter => {
  const target = Number(counter.dataset.target);
  if (!Number.isFinite(target) || target < 0) return;
  const run = () => {
    if (counter.dataset.animated === "true") return;
    counter.dataset.animated = "true";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      counter.textContent = target.toLocaleString();
      return;
    }
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 50));
    const timer = setInterval(() => {
      current = Math.min(target, current + step);
      counter.textContent = current.toLocaleString();
      if (current >= target) clearInterval(timer);
    }, 30);
  };
  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        run();
        counterObserver.unobserve(counter);
      }
    }, { threshold: 0.5 });
    counterObserver.observe(counter);
  } else {
    run();
  }
});

async function submitForm(form, endpoint) {
  const status = form.querySelector(".form-status");
  const submit = form.querySelector('button[type="submit"]');
  if (!status || !submit) return;
  const defaultLabel = form.dataset.submitLabel || submit.textContent;
  submit.disabled = true;
  submit.textContent = "Submitting...";
  try {
    const data = Object.fromEntries(new FormData(form).entries());
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(data)
    });
    let result;
    try {
      result = await response.json();
    } catch {
      result = {};
    }
    status.textContent = result.message || (response.ok
      ? "Thank you! Your request has been received."
      : "We could not send your request. Please try again.");
    status.className = `form-status ${response.ok ? "success" : "error"}`;
    if (response.ok) form.reset();
  } catch {
    status.textContent = "We could not send your request. Please try again.";
    status.className = "form-status error";
  } finally {
    submit.disabled = false;
    submit.textContent = defaultLabel;
  }
}

document.querySelectorAll("[data-api-form]").forEach(form => {
  const submit = form.querySelector('button[type="submit"]');
  if (submit) form.dataset.submitLabel = submit.textContent;
  form.addEventListener("submit", event => {
    event.preventDefault();
    submitForm(form, form.dataset.apiForm);
  });
});