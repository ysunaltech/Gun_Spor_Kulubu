
const temaButonu = document.getElementById("tema-degistir");
const temaAnahtari = "gunspor-tema";

function temayiUygula(tema) {
    const aydinlik = tema === "aydinlik";

    document.body.classList.toggle("aydinlik", aydinlik);

    if (temaButonu) {
        temaButonu.innerHTML = aydinlik
            ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
            : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';

        temaButonu.setAttribute(
            "aria-label",
            aydinlik ? "Koyu temaya geç" : "Açık temaya geç"
        );

        temaButonu.setAttribute(
            "title",
            aydinlik ? "Koyu tema" : "Açık tema"
        );
    }
}

let kayitliTema = "koyu";

try {
    kayitliTema = localStorage.getItem(temaAnahtari) || "koyu";
} catch (hata) {
    // Tarayıcı depolaması kapalıysa varsayılan koyu tema kullanılır.
}

temayiUygula(kayitliTema);

if (temaButonu) {
    temaButonu.addEventListener("click", () => {
        const yeniTema = document.body.classList.contains("aydinlik")
            ? "koyu"
            : "aydinlik";

        temayiUygula(yeniTema);

        try {
            localStorage.setItem(temaAnahtari, yeniTema);
        } catch (hata) {
            // Tema değişir; yalnızca kalıcı olarak kaydedilemeyebilir.
        }
    });
}
