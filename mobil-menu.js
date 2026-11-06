
const mobilMenuAc = document.getElementById("mobil-menu-ac");
const siteNav = document.getElementById("site-nav");

if (mobilMenuAc && siteNav) {
    function menuDurumunuAyarla(acik) {
        siteNav.classList.toggle("acik", acik);

        mobilMenuAc.setAttribute("aria-expanded", String(acik));
        mobilMenuAc.setAttribute(
            "aria-label",
            acik ? "Menüyü kapat" : "Menüyü aç"
        );

        mobilMenuAc.innerHTML = acik
            ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
            : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
    }

    mobilMenuAc.addEventListener("click", () => {
        const acik = !siteNav.classList.contains("acik");
        menuDurumunuAyarla(acik);
    });

    siteNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            menuDurumunuAyarla(false);
        });
    });

    document.addEventListener("keydown", (olay) => {
        if (olay.key === "Escape") {
            menuDurumunuAyarla(false);
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            menuDurumunuAyarla(false);
        }
    });
}
