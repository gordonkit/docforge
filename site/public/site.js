// Behaviour for the documentation site: theme, mobile menu, language menu, search and copy buttons.
// Loaded in <head> so the theme is applied before the first paint.
(() => {
  const root = document.documentElement;
  const read = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const write = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage can be unavailable in private windows; the preference then lasts for the visit.
    }
  };

  const stored = read('df-theme');
  root.classList.toggle('dark', stored === 'dark' || (!stored && matchMedia('(prefers-color-scheme: dark)').matches));

  document.addEventListener('DOMContentLoaded', () => {
    const $ = (selector) => document.querySelector(selector);
    const on = (selector, handler) => document.querySelectorAll(selector).forEach((element) => element.addEventListener('click', handler));

    on('[data-theme-toggle]', () => write('df-theme', root.classList.toggle('dark') ? 'dark' : 'light'));

    // Mobile menu
    const overlay = $('.overlay');
    const setMenu = (open) => {
      root.classList.toggle('nav-open', open);
      overlay.hidden = !open;
    };
    on('[data-menu-open]', () => setMenu(true));
    on('[data-menu-close]', () => setMenu(false));
    // Keep the current page visible in a long side menu without scrolling the page itself.
    const sidebar = $('.sidebar');
    const active = sidebar.querySelector('[aria-current="page"]');
    if (active && active.offsetTop + active.offsetHeight > sidebar.clientHeight) sidebar.scrollTop = active.offsetTop - sidebar.clientHeight / 2;

    // Language menu
    const locale = $('.locale');
    const localeButton = locale.querySelector('button');
    const localeMenu = locale.querySelector('.locale-menu');
    const setLocaleMenu = (open) => {
      localeMenu.hidden = !open;
      localeButton.setAttribute('aria-expanded', String(open));
    };
    localeButton.addEventListener('click', () => setLocaleMenu(localeMenu.hidden));
    addEventListener('pointerdown', (event) => {
      if (!locale.contains(event.target)) setLocaleMenu(false);
    });

    // Search
    const search = $('.search');
    const input = search.querySelector('input');
    const results = search.querySelector('.search-results');
    let index;
    const render = () => {
      const needle = input.value.trim().toLowerCase();
      const matches = (index ?? []).filter((page) => page.locale === root.lang && (!needle || page.text.includes(needle)));
      const heading = document.createElement('p');
      heading.textContent = matches.length ? search.dataset.results : search.dataset.empty;
      heading.className = matches.length ? '' : 'empty';
      results.replaceChildren(
        heading,
        ...matches.map((page) => {
          const link = document.createElement('a');
          link.href = page.url;
          const title = document.createElement('strong');
          title.textContent = page.title;
          const summary = document.createElement('span');
          summary.textContent = page.summary;
          link.append(title, summary);
          return link;
        }),
      );
    };
    const setSearch = async (open) => {
      search.hidden = !open;
      if (!open) return;
      input.focus();
      if (!index) {
        index = await fetch('/search-index.json').then((response) => response.json()).catch(() => []);
      }
      render();
    };
    on('[data-search-open]', () => setSearch(true));
    on('[data-search-close]', () => setSearch(false));
    search.addEventListener('mousedown', (event) => {
      if (event.target === search) setSearch(false);
    });
    input.addEventListener('input', render);

    addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      setSearch(false);
      setLocaleMenu(false);
      setMenu(false);
    });

    // Copy buttons on code blocks
    on('.copy', async (event) => {
      const button = event.currentTarget;
      const label = button.querySelector('span');
      await navigator.clipboard.writeText(button.parentElement.querySelector('code').textContent);
      const original = label.textContent;
      label.textContent = button.dataset.copied;
      setTimeout(() => {
        label.textContent = original;
      }, 1500);
    });
  });
})();
