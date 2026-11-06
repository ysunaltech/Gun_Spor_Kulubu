
const yukariButonu = document.getElementById("yukari-cik");
const ilerlemeHalkasi = document.querySelector("#yukari-cik .ilerleme-dolgu");

function sayfaIlerlemesiniGuncelle() {
    const kaydirilabilirAlan =
        document.documentElement.scrollHeight - window.innerHeight;

    const ilerleme = kaydirilabilirAlan > 0
        ? window.scrollY / kaydirilabilirAlan
        : 0;

    const cevre = 276.46;

    ilerlemeHalkasi.style.strokeDashoffset = cevre * (1 - ilerleme);

    // Sayfa aşağı kaydırılınca oku göster
    yukariButonu.classList.toggle("gorunur", window.scrollY > 100);
}

yukariButonu.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

window.addEventListener("scroll", sayfaIlerlemesiniGuncelle);
window.addEventListener("resize", sayfaIlerlemesiniGuncelle);

sayfaIlerlemesiniGuncelle();
