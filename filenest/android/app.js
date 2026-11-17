const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.15,
  }
);

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

const legacyPhrases = [
  ['Google Material inspired PDF workstation', 'Filenest PDF workstation'],
  ['offline queue', 'Direct Drive upload'],
  ['3 files ready', 'Fast cloud handoff'],
  ['Protect', 'Protect'],
  ['Unlock', 'Unlock'],
  ['Rearrange', 'Rearrange'],
  ['PDF to Image', 'PDF to Image'],
  ['Image to PDF', 'Image to PDF'],
];

document.querySelectorAll('*').forEach((element) => {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  legacyPhrases.forEach(([oldText, newText]) => {
    if (element.children.length === 0 && element.textContent?.trim() === oldText) {
      element.textContent = newText;
    }
  });
});

const logo = document.querySelector('.brand-logo');
const fallback = document.querySelector('.brand-fallback');

if (logo && fallback) {
  logo.addEventListener('error', () => {
    logo.style.display = 'none';
    fallback.style.display = 'grid';
  });
}

const year = new Date().getFullYear();
const footer = document.querySelector('.footer span:last-child');

if (footer) {
  footer.textContent = `Live site · ${year}`;
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch {
      // Ignore environments that block service-worker APIs.
    }
  });
}