
const whatsappAc = document.getElementById("whatsapp-ac");
const whatsappPencere = document.getElementById("whatsapp-pencere");
const whatsappKapat = document.getElementById("whatsapp-kapat");

whatsappAc.addEventListener("click", () => {
    const aciliyor = whatsappPencere.hidden;

    whatsappPencere.hidden = !aciliyor;
    whatsappAc.setAttribute("aria-expanded", String(aciliyor));
});

whatsappKapat.addEventListener("click", () => {
    whatsappPencere.hidden = true;
    whatsappAc.setAttribute("aria-expanded", "false");
});

document.addEventListener("keydown", (olay) => {
    if (olay.key === "Escape") {
        whatsappPencere.hidden = true;
        whatsappAc.setAttribute("aria-expanded", "false");
    }
});
