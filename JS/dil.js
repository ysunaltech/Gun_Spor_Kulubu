
const metinler = {
    tr: {
        anaSayfa: "Ana Sayfa",
        hakkimizda: "Hakkımızda",
        antrenorler: "Antrenörlerimiz",
        galeri: "Galeri",
        basarilar: "Başarılarımız",
        duyurular: "Duyurular",
        onKayit: "Ön Kayıt",
        iletisim: "İletişim"
    },
    en: {
        anaSayfa: "Home",
        hakkimizda: "About Us",
        antrenorler: "Our Coaches",
        galeri: "Gallery",
        basarilar: "Our Achievements",
        duyurular: "Announcements",
        onKayit: "Registration",
        iletisim: "Contact"
    }
};

let aktifDil = "tr";

const dilButonu = document.getElementById("dil-degistir");

function diliUygula(dil) {
    aktifDil = dil;

    document.querySelectorAll("[data-dil]").forEach((oge) => {
        const anahtar = oge.dataset.dil;
        const ceviri = metinler[aktifDil][anahtar];

        if (ceviri) {
            oge.textContent = ceviri;
        }
    });

    if (dilButonu) {
        dilButonu.textContent = aktifDil === "tr" ? "EN" : "TR";
        dilButonu.setAttribute(
            "aria-label",
            aktifDil === "tr"
                ? "İngilizceye geç"
                : "Türkçeye geç"
        );
    }

    document.documentElement.lang = aktifDil;
}

if (dilButonu) {
    dilButonu.addEventListener("click", () => {
        diliUygula(aktifDil === "tr" ? "en" : "tr");
    });
}

diliUygula("tr");
