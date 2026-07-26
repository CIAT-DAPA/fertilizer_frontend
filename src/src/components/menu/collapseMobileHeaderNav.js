/** Close Bootstrap mobile header nav after route change or link tap. */
export function collapseMobileHeaderNav(collapseId = 'navbarCollapseDash') {
    const collapseEl = document.getElementById(collapseId);
    if (collapseEl?.classList.contains('show')) {
        collapseEl.classList.remove('show');
    }
    const toggler = document.querySelector(`[data-bs-target="#${collapseId}"]`);
    if (toggler) {
        toggler.setAttribute('aria-expanded', 'false');
        toggler.classList.add('collapsed');
    }
}
