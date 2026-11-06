
"use strict";

const sidebar = document.getElementById("sidebar");
const mobileMenu = document.getElementById("mobile-menu");
const menuOverlay = document.getElementById("menu-overlay");
const pageTitle = document.getElementById("page-title");
const content = document.getElementById("admin-content");

const DB_ADI = "GunSporPaneli";
const DB_SURUMU = 3;

const MAGAZALAR = [
    "fotograflar",
    "duyurular",
    "videolar",
    "basarilar",
    "takvim",
    "antrenorler",
    "basvurular",
    "ayarlar"
];

const SAYFALAR = {
    genel: "Genel Bakış",
    fotograflar: "Fotoğraf Galerisi",
    videolar: "Video Galerisi",
    basarilar: "Başarılarımız",
    duyurular: "Duyurular",
    takvim: "Antrenman Takvimi",
    antrenorler: "Antrenörler",
    basvurular: "Ön Kayıt Başvuruları",
    ayarlar: "Site Ayarları",
    guvenlik: "Kullanıcı ve Güvenlik"
};

// Aynı veritabanını ve sürümünü kullan.
// Var olan fotoğraf ve duyuru depoları silinmez.
function veritabaniAc() {
    return new Promise((resolve, reject) => {
        if (!("indexedDB" in window)) {
            reject(new Error("Bu tarayıcı IndexedDB desteklemiyor."));
            return;
        }

        const istek = indexedDB.open(DB_ADI, DB_SURUMU);

        istek.onupgradeneeded = () => {
            const db = istek.result;

            MAGAZALAR.forEach(magaza => {
                if (!db.objectStoreNames.contains(magaza)) {
                    db.createObjectStore(magaza, {
                        keyPath: "id",
                        autoIncrement: true
                    });
                }
            });
        };

        istek.onsuccess = () => resolve(istek.result);
        istek.onerror = () => reject(istek.error);
        istek.onblocked = () => {
            reject(new Error(
                "Veritabanı güncellemesi engellendi. Diğer açık panel sekmelerini kapatıp yeniden dene."
            ));
        };
    });
}

async function tumKayitlariGetir(magaza) {
    const db = await veritabaniAc();

    return new Promise((resolve, reject) => {
        if (!db.objectStoreNames.contains(magaza)) {
            db.close();
            reject(new Error("Veri deposu bulunamadı: " + magaza));
            return;
        }

        const istek = db.transaction(magaza, "readonly")
            .objectStore(magaza)
            .getAll();

        istek.onsuccess = () => {
            resolve(istek.result || []);
            db.close();
        };

        istek.onerror = () => {
            reject(istek.error);
            db.close();
        };
    });
}

async function kayitEkle(magaza, kayit) {
    const db = await veritabaniAc();

    return new Promise((resolve, reject) => {
        const istek = db.transaction(magaza, "readwrite")
            .objectStore(magaza)
            .add(kayit);

        istek.onsuccess = () => {
            resolve(istek.result);
            db.close();
        };

        istek.onerror = () => {
            reject(istek.error);
            db.close();
        };
    });
}

async function kayitGuncelle(magaza, kayit) {
    const db = await veritabaniAc();

    return new Promise((resolve, reject) => {
        const istek = db.transaction(magaza, "readwrite")
            .objectStore(magaza)
            .put(kayit);

        istek.onsuccess = () => {
            resolve();
            db.close();
        };

        istek.onerror = () => {
            reject(istek.error);
            db.close();
        };
    });
}

async function kayitSil(magaza, id) {
    const db = await veritabaniAc();

    return new Promise((resolve, reject) => {
        const istek = db.transaction(magaza, "readwrite")
            .objectStore(magaza)
            .delete(Number(id));

        istek.onsuccess = () => {
            resolve();
            db.close();
        };

        istek.onerror = () => {
            reject(istek.error);
            db.close();
        };
    });
}

function guvenliMetin(deger) {
    return String(deger ?? "").replace(/[&<>"']/g, karakter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[karakter]);
}

function tarihBugun() {
    const simdi = new Date();
    const yerel = new Date(simdi.getTime() - simdi.getTimezoneOffset() * 60000);
    return yerel.toISOString().slice(0, 10);
}

function menuDurumunuAyarla(acik) {
    sidebar?.classList.toggle("acik", acik);
    menuOverlay?.classList.toggle("acik", acik);
    mobileMenu?.setAttribute("aria-expanded", String(acik));
    mobileMenu?.setAttribute("aria-label", acik ? "Menüyü kapat" : "Menüyü aç");
}

function mesajGoster(element, metin, hata = false) {
    if (!element) return;
    element.textContent = metin;
    element.style.color = hata ? "#ff9999" : "#46c37b";
}

function bolumBasligi(baslik, aciklama) {
    return `
        <div class="section-heading">
            <div>
                <h2>${guvenliMetin(baslik)}</h2>
                <p>${guvenliMetin(aciklama)}</p>
            </div>
        </div>
    `;
}

function bosDurum(metin) {
    return `
        <div class="empty-state">
            <i class="fa-regular fa-folder-open"></i>
            <p>${guvenliMetin(metin)}</p>
        </div>
    `;
}

function sayfayiSec(sayfa) {
    if (!SAYFALAR[sayfa] || !content) return;

    document.querySelectorAll(".menu-link").forEach(buton => {
        buton.classList.toggle("active", buton.dataset.page === sayfa);
    });

    if (pageTitle) pageTitle.textContent = SAYFALAR[sayfa];
    menuDurumunuAyarla(false);

    if (sayfa === "genel") {
        genelBakisiGoster();
    } else if (sayfa === "fotograflar") {
        fotograflarSayfasi();
    } else if (sayfa === "duyurular") {
        duyurularSayfasi();
    } else if (sayfa === "videolar") {
        kayitYonetimSayfasi("videolar");
    } else if (sayfa === "basarilar") {
        kayitYonetimSayfasi("basarilar");
    } else if (sayfa === "takvim") {
        kayitYonetimSayfasi("takvim");
    } else if (sayfa === "antrenorler") {
        kayitYonetimSayfasi("antrenorler");
    } else if (sayfa === "basvurular") {
        basvurularSayfasi();
    } else if (sayfa === "ayarlar") {
        siteAyarlariSayfasi();
    } else if (sayfa === "guvenlik") {
        guvenlikSayfasi();
    }
}

async function genelBakisiGoster() {
    content.innerHTML = `
        <div class="welcome">
            <div>
                <p class="eyebrow">YÖNETİM MERKEZİ</p>
                <h2>Hoş geldin!</h2>
                <p>Kulüp içeriklerini bu panelden yönetebilirsin.</p>
            </div>
            <i class="fa-solid fa-bullseye"></i>
        </div>

        ${bolumBasligi("Genel durum", "Bu tarayıcıda kayıtlı içeriklerin özeti.")}

        <div class="stats-grid">
            ${istatistikKarti("fa-regular fa-images", "Fotoğraflar", "stat-fotograflar")}
            ${istatistikKarti("fa-solid fa-video", "Videolar", "stat-videolar")}
            ${istatistikKarti("fa-solid fa-bullhorn", "Duyurular", "stat-duyurular")}
            ${istatistikKarti("fa-solid fa-medal", "Başarı kayıtları", "stat-basarilar")}
        </div>

        ${bolumBasligi("Hızlı işlemler", "Sık kullanılan bölümlere hızlıca ulaş.")}

        <div class="quick-actions">
            <button class="quick-action" data-page="fotograflar"><i class="fa-solid fa-cloud-arrow-up"></i> Fotoğraf ekle</button>
            <button class="quick-action" data-page="duyurular"><i class="fa-solid fa-bullhorn"></i> Duyuru yönet</button>
            <button class="quick-action" data-page="basarilar"><i class="fa-solid fa-medal"></i> Başarı ekle</button>
            <button class="quick-action" data-page="takvim"><i class="fa-regular fa-calendar"></i> Takvimi düzenle</button>
        </div>

        <div class="notice">
            <i class="fa-solid fa-circle-info"></i>
            <div>
                <strong>Önemli bilgi</strong>
                <p>Bu sürüm verileri yalnızca bu tarayıcıda tutar. Gerçek giriş ve çevrim içi ortak kullanım henüz etkin değildir.</p>
            </div>
        </div>
    `;

    try {
        const [fotograflar, videolar, duyurular, basarilar] = await Promise.all([
            tumKayitlariGetir("fotograflar"),
            tumKayitlariGetir("videolar"),
            tumKayitlariGetir("duyurular"),
            tumKayitlariGetir("basarilar")
        ]);

        sayacGuncelle("stat-fotograflar", fotograflar.length);
        sayacGuncelle("stat-videolar", videolar.length);
        sayacGuncelle("stat-duyurular", duyurular.length);
        sayacGuncelle("stat-basarilar", basarilar.length);
    } catch (hata) {
        console.error(hata);
    }
}

function istatistikKarti(simge, baslik, id) {
    return `
        <article class="stat-card">
            <span class="stat-icon"><i class="${simge}"></i></span>
            <div>
                <p>${baslik}</p>
                <strong id="${id}">0</strong>
            </div>
        </article>
    `;
}

function sayacGuncelle(id, sayi) {
    const alan = document.getElementById(id);
    if (alan) alan.textContent = String(sayi);
}

/* FOTOĞRAFLAR */

async function fotograflarSayfasi() {
    content.innerHTML = `
        ${bolumBasligi("Fotoğraf Galerisi", "Fotoğraf ekle, açıklamasını düzenle veya sil.")}

        <form id="fotograf-formu" class="admin-form">
            <label for="fotograf-dosyasi">Fotoğraf seç</label>
            <input id="fotograf-dosyasi" type="file" accept="image/*" multiple required>

            <label for="fotograf-aciklama">Fotoğraf açıklaması</label>
            <textarea id="fotograf-aciklama" maxlength="300" rows="3"
                placeholder="Örn. Kulüp antrenmanından bir kare..."></textarea>

            <button class="admin-button" type="submit">
                <i class="fa-solid fa-cloud-arrow-up"></i> Fotoğrafları kaydet
            </button>
            <p class="form-message" id="fotograf-mesaji" role="status"></p>
        </form>

        ${bolumBasligi("Kayıtlı fotoğraflar", "Bu tarayıcıya kaydedilmiş fotoğraflar.")}
        <div id="fotograf-listesi" class="photo-grid"></div>
    `;

    const form = document.getElementById("fotograf-formu");
    const dosyaAlani = document.getElementById("fotograf-dosyasi");
    const aciklamaAlani = document.getElementById("fotograf-aciklama");
    const mesaj = document.getElementById("fotograf-mesaji");

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const dosyalar = Array.from(dosyaAlani.files || []);
        if (!dosyalar.length) {
            mesajGoster(mesaj, "Lütfen en az bir fotoğraf seç.", true);
            return;
        }

        if (dosyalar.some(d => !d.type.startsWith("image/"))) {
            mesajGoster(mesaj, "Yalnızca fotoğraf dosyaları seçebilirsin.", true);
            return;
        }

        if (dosyalar.some(d => d.size > 8 * 1024 * 1024)) {
            mesajGoster(mesaj, "Her fotoğraf en fazla 8 MB olmalı.", true);
            return;
        }

        const buton = form.querySelector("button[type='submit']");
        buton.disabled = true;
        mesajGoster(mesaj, "Fotoğraflar kaydediliyor...");

        try {
            for (const dosya of dosyalar) {
                await kayitEkle("fotograflar", {
                    ad: dosya.name,
                    aciklama: aciklamaAlani.value.trim(),
                    dosya,
                    tarih: new Date().toISOString()
                });
            }

            form.reset();
            mesajGoster(mesaj, "Fotoğraflar bu tarayıcıya kaydedildi.");
            await fotograflariListele();
        } catch (hata) {
            console.error(hata);
            mesajGoster(mesaj, "Kayıt başarısız oldu. Depolama alanını kontrol et.", true);
        } finally {
            buton.disabled = false;
        }
    });

    await fotograflariListele();
}

async function fotograflariListele() {
    const liste = document.getElementById("fotograf-listesi");
    if (!liste) return;

    try {
        const fotograflar = await tumKayitlariGetir("fotograflar");

        if (!fotograflar.length) {
            liste.innerHTML = bosDurum("Henüz fotoğraf eklenmedi.");
            return;
        }

        liste.innerHTML = fotograflar.map(f => `
            <article class="photo-card">
                <img src="${URL.createObjectURL(f.dosya)}"
                     alt="${guvenliMetin(f.aciklama || f.ad)}">
                <div class="photo-card-body">
                    <strong>${guvenliMetin(f.ad)}</strong>
                    <p>${guvenliMetin(f.aciklama || "Açıklama eklenmemiş.")}</p>
                    <div class="photo-card-actions">
                        <button class="admin-button secondary" data-edit-photo="${f.id}">Düzenle</button>
                        <button class="admin-button danger" data-delete-photo="${f.id}">Sil</button>
                    </div>
                </div>
            </article>
        `).join("");

        liste.querySelectorAll("[data-edit-photo]").forEach(buton => {
            buton.addEventListener("click", async () => {
                const foto = fotograflar.find(f => f.id === Number(buton.dataset.editPhoto));
                if (!foto) return;

                const yeni = prompt("Fotoğraf açıklaması:", foto.aciklama || "");
                if (yeni === null) return;

                foto.aciklama = yeni.trim();

                try {
                    await kayitGuncelle("fotograflar", foto);
                    await fotograflariListele();
                } catch (hata) {
                    console.error(hata);
                    alert("Açıklama kaydedilemedi.");
                }
            });
        });

        liste.querySelectorAll("[data-delete-photo]").forEach(buton => {
            buton.addEventListener("click", async () => {
                if (!confirm("Bu fotoğrafı silmek istediğine emin misin?")) return;

                try {
                    await kayitSil("fotograflar", buton.dataset.deletePhoto);
                    await fotograflariListele();
                } catch (hata) {
                    console.error(hata);
                    alert("Fotoğraf silinemedi.");
                }
            });
        });
    } catch (hata) {
        console.error(hata);
        liste.innerHTML = bosDurum("Fotoğraflar yüklenemedi. Sayfayı yeniden açıp dene.");
    }
}

/* DUYURULAR */

async function duyurularSayfasi() {
    content.innerHTML = `
        ${bolumBasligi("Duyuru Yönetimi", "Kulüp duyurularını buradan oluşturabilirsin.")}

        <form id="duyuru-formu" class="admin-form">
            <label for="duyuru-baslik">Duyuru başlığı</label>
            <input id="duyuru-baslik" maxlength="120" required
                   placeholder="Örn. Yeni dönem kayıtları başladı">

            <label for="duyuru-tarih">Duyuru tarihi</label>
            <input id="duyuru-tarih" type="date" required value="${tarihBugun()}">

            <label for="duyuru-aciklama">Açıklama</label>
            <textarea id="duyuru-aciklama" rows="5" maxlength="3000" required
                      placeholder="Duyuru detaylarını yaz..."></textarea>

            <button class="admin-button" type="submit">
                <i class="fa-solid fa-plus"></i> Duyuru ekle
            </button>
            <p id="duyuru-mesaj" class="form-message" role="status"></p>
        </form>

        ${bolumBasligi("Yayımlanan duyurular", "Kayıtlı duyuruları düzenle veya sil.")}
        <div id="duyuru-listesi" class="announcement-list"></div>
    `;

    const form = document.getElementById("duyuru-formu");
    const mesaj = document.getElementById("duyuru-mesaj");

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const duyuru = {
            baslik: document.getElementById("duyuru-baslik").value.trim(),
            tarih: document.getElementById("duyuru-tarih").value,
            aciklama: document.getElementById("duyuru-aciklama").value.trim(),
            olusturulma: new Date().toISOString()
        };

        if (!duyuru.baslik || !duyuru.tarih || !duyuru.aciklama) {
            mesajGoster(mesaj, "Lütfen bütün alanları doldur.", true);
            return;
        }

        try {
            await kayitEkle("duyurular", duyuru);
            form.reset();
            document.getElementById("duyuru-tarih").value = tarihBugun();
            mesajGoster(mesaj, "Duyuru bu tarayıcıya kaydedildi.");
            await duyurulariListele();
        } catch (hata) {
            console.error(hata);
            mesajGoster(mesaj, "Duyuru kaydedilemedi.", true);
        }
    });

    await duyurulariListele();
}

async function duyurulariListele() {
    const liste = document.getElementById("duyuru-listesi");
    if (!liste) return;

    try {
        const duyurular = await tumKayitlariGetir("duyurular");
        duyurular.sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)));

        if (!duyurular.length) {
            liste.innerHTML = bosDurum("Henüz duyuru eklenmedi.");
            return;
        }

        liste.innerHTML = duyurular.map(d => `
            <article class="announcement-card">
                <div class="announcement-date">
                    <i class="fa-regular fa-calendar"></i> ${guvenliMetin(d.tarih)}
                </div>
                <h3>${guvenliMetin(d.baslik)}</h3>
                <p>${guvenliMetin(d.aciklama).replace(/\n/g, "<br>")}</p>
                <div class="photo-card-actions">
                    <button class="admin-button secondary" data-edit-announcement="${d.id}">Düzenle</button>
                    <button class="admin-button danger" data-delete-announcement="${d.id}">Sil</button>
                </div>
            </article>
        `).join("");

        liste.querySelectorAll("[data-edit-announcement]").forEach(buton => {
            buton.addEventListener("click", async () => {
                const d = duyurular.find(x => x.id === Number(buton.dataset.editAnnouncement));
                if (!d) return;

                const baslik = prompt("Duyuru başlığı:", d.baslik);
                if (baslik === null) return;
                const tarih = prompt("Tarih (YYYY-AA-GG):", d.tarih);
                if (tarih === null) return;
                const aciklama = prompt("Duyuru açıklaması:", d.aciklama);
                if (aciklama === null) return;

                if (!baslik.trim() || !aciklama.trim() ||
                    !/^\d{4}-\d{2}-\d{2}$/.test(tarih.trim()) ||
                    Number.isNaN(Date.parse(tarih.trim()))) {
                    alert("Alanları doğru doldur. Tarih YYYY-AA-GG biçiminde olmalı.");
                    return;
                }

                try {
                    d.baslik = baslik.trim();
                    d.tarih = tarih.trim();
                    d.aciklama = aciklama.trim();
                    await kayitGuncelle("duyurular", d);
                    await duyurulariListele();
                } catch (hata) {
                    console.error(hata);
                    alert("Duyuru güncellenemedi.");
                }
            });
        });

        liste.querySelectorAll("[data-delete-announcement]").forEach(buton => {
            buton.addEventListener("click", async () => {
                if (!confirm("Bu duyuruyu silmek istediğine emin misin?")) return;

                try {
                    await kayitSil("duyurular", buton.dataset.deleteAnnouncement);
                    await duyurulariListele();
                } catch (hata) {
                    console.error(hata);
                    alert("Duyuru silinemedi.");
                }
            });
        });
    } catch (hata) {
        console.error(hata);
        liste.innerHTML = bosDurum("Duyurular yüklenemedi.");
    }
}

/* DİĞER KAYIT BÖLÜMLERİ */

const KAYIT_AYARLARI = {
    videolar: {
        baslik: "Video Galerisi",
        aciklama: "Video başlığını ve bağlantısını ekle.",
        alanlar: [
            { id: "baslik", etiket: "Video başlığı", tur: "text", zorunlu: true },
            { id: "url", etiket: "Video bağlantısı (https:// ile başlamalı)", tur: "url", zorunlu: true },
            { id: "aciklama", etiket: "Açıklama", tur: "textarea", zorunlu: false }
        ]
    },
    basarilar: {
        baslik: "Başarılarımız",
        aciklama: "Yarışma derecelerini ve sporcu başarılarını kaydet.",
        alanlar: [
            { id: "baslik", etiket: "Başarı / yarışma adı", tur: "text", zorunlu: true },
            { id: "sporcu", etiket: "Sporcu adı", tur: "text", zorunlu: false },
            { id: "derece", etiket: "Derece / madalya", tur: "text", zorunlu: false },
            { id: "tarih", etiket: "Tarih", tur: "date", zorunlu: false },
            { id: "aciklama", etiket: "Açıklama", tur: "textarea", zorunlu: false }
        ]
    },
    takvim: {
        baslik: "Antrenman Takvimi",
        aciklama: "Antrenman, etkinlik ve yarışma tarihlerini kaydet.",
        alanlar: [
            { id: "baslik", etiket: "Etkinlik adı", tur: "text", zorunlu: true },
            { id: "tarih", etiket: "Tarih", tur: "date", zorunlu: true },
            { id: "saat", etiket: "Saat", tur: "time", zorunlu: false },
            { id: "yer", etiket: "Yer", tur: "text", zorunlu: false },
            { id: "aciklama", etiket: "Açıklama", tur: "textarea", zorunlu: false }
        ]
    },
    antrenorler: {
        baslik: "Antrenör Yönetimi",
        aciklama: "Antrenör bilgilerini kaydet. Bu kayıtlar şimdilik yalnızca panelde tutulur.",
        alanlar: [
            { id: "ad", etiket: "Ad soyad", tur: "text", zorunlu: true },
            { id: "unvan", etiket: "Görev / unvan", tur: "text", zorunlu: true },
            { id: "aciklama", etiket: "Kısa tanıtım", tur: "textarea", zorunlu: false }
        ]
    }
};

async function kayitYonetimSayfasi(tur) {
    const ayar = KAYIT_AYARLARI[tur];
    if (!ayar) return;

    const alanHTML = ayar.alanlar.map(alan => {
        const etiket = `<label for="alan-${alan.id}">${guvenliMetin(alan.etiket)}</label>`;
        const required = alan.zorunlu ? "required" : "";

        if (alan.tur === "textarea") {
            return `${etiket}<textarea id="alan-${alan.id}" ${required} maxlength="3000"></textarea>`;
        }

        return `${etiket}<input id="alan-${alan.id}" type="${alan.tur}" ${required} maxlength="1000">`;
    }).join("");

    content.innerHTML = `
        ${bolumBasligi(ayar.baslik, ayar.aciklama)}
        <form id="kayit-formu" class="admin-form">
            ${alanHTML}
            <button class="admin-button" type="submit">
                <i class="fa-solid fa-plus"></i> Kaydet
            </button>
            <p id="kayit-mesaji" class="form-message" role="status"></p>
        </form>
        ${bolumBasligi("Kayıtlı içerikler", "Kayıtları buradan düzenleyebilir veya silebilirsin.")}
        <div id="kayit-listesi" class="record-grid"></div>
    `;

    const form = document.getElementById("kayit-formu");
    const mesaj = document.getElementById("kayit-mesaji");

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const kayit = { olusturulma: new Date().toISOString() };
        for (const alan of ayar.alanlar) {
            kayit[alan.id] = document.getElementById("alan-" + alan.id).value.trim();
        }

        if (tur === "videolar") {
            try {
                const url = new URL(kayit.url);
                if (!["http:", "https:"].includes(url.protocol)) throw new Error("URL");
            } catch {
                mesajGoster(mesaj, "Geçerli bir http veya https bağlantısı gir.", true);
                return;
            }
        }

        try {
            await kayitEkle(tur, kayit);
            form.reset();
            mesajGoster(mesaj, "Kayıt bu tarayıcıya kaydedildi.");
            await kayitlariGoster(tur);
        } catch (hata) {
            console.error(hata);
            mesajGoster(mesaj, "Kayıt kaydedilemedi.", true);
        }
    });

    await kayitlariGoster(tur);
}

async function kayitlariGoster(tur) {
    const liste = document.getElementById("kayit-listesi");
    if (!liste) return;

    const ayar = KAYIT_AYARLARI[tur];

    try {
        const kayitlar = await tumKayitlariGetir(tur);
        kayitlar.sort((a, b) =>
            String(b.tarih || b.olusturulma || "").localeCompare(
                String(a.tarih || a.olusturulma || "")
            )
        );

        if (!kayitlar.length) {
            liste.innerHTML = bosDurum("Henüz kayıt eklenmedi.");
            return;
        }

        liste.innerHTML = kayitlar.map(k => {
            const baslik = k.baslik || k.ad || "Kayıt";
            const satirlar = ayar.alanlar
                .filter(a => k[a.id] && a.id !== "baslik")
                .map(a => `<p><strong>${guvenliMetin(a.etiket)}:</strong> ${guvenliMetin(k[a.id])}</p>`)
                .join("");

            const videoLink = tur === "videolar" && k.url
                ? `<p><a href="${guvenliMetin(k.url)}" target="_blank" rel="noopener noreferrer">Videoyu aç ↗</a></p>`
                : "";

            return `
                <article class="record-card">
                    <div class="record-card-body">
                        <h3>${guvenliMetin(baslik)}</h3>
                        ${videoLink}
                        ${satirlar}
                        <div class="photo-card-actions">
                            <button class="admin-button secondary" data-edit-record="${k.id}">Düzenle</button>
                            <button class="admin-button danger" data-delete-record="${k.id}">Sil</button>
                        </div>
                    </div>
                </article>
            `;
        }).join("");

        liste.querySelectorAll("[data-edit-record]").forEach(buton => {
            buton.addEventListener("click", async () => {
                const kayit = kayitlar.find(k => k.id === Number(buton.dataset.editRecord));
                if (!kayit) return;

                const yeni = { ...kayit };

                for (const alan of ayar.alanlar) {
                    const cevap = prompt(alan.etiket + ":", kayit[alan.id] || "");
                    if (cevap === null) return;
                    if (alan.zorunlu && !cevap.trim()) {
                        alert(alan.etiket + " boş bırakılamaz.");
                        return;
                    }
                    yeni[alan.id] = cevap.trim();
                }

                if (tur === "videolar") {
                    try {
                        const url = new URL(yeni.url);
                        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
                    } catch {
                        alert("Geçerli bir video bağlantısı gir.");
                        return;
                    }
                }

                try {
                    await kayitGuncelle(tur, yeni);
                    await kayitlariGoster(tur);
                } catch (hata) {
                    console.error(hata);
                    alert("Kayıt güncellenemedi.");
                }
            });
        });

        liste.querySelectorAll("[data-delete-record]").forEach(buton => {
            buton.addEventListener("click", async () => {
                if (!confirm("Bu kaydı silmek istediğine emin misin?")) return;
                try {
                    await kayitSil(tur, buton.dataset.deleteRecord);
                    await kayitlariGoster(tur);
                } catch (hata) {
                    console.error(hata);
                    alert("Kayıt silinemedi.");
                }
            });
        });
    } catch (hata) {
        console.error(hata);
        liste.innerHTML = bosDurum("Kayıtlar yüklenemedi.");
    }
}

/* ÖN KAYITLAR */

async function basvurularSayfasi() {
    content.innerHTML = `
        ${bolumBasligi("Ön Kayıt Başvuruları", "Bu tarayıcıya kaydedilen başvuruları görüntüle.")}

        <div class="notice">
            <i class="fa-solid fa-circle-info"></i>
            <div>
                <strong>Henüz form bağlantısı kurulmadı</strong>
                <p>Ana sitedeki ön kayıt formu şu anda başvuruları bu panele göndermiyor. Ortak kayıt sistemi kurulduğunda başvurular burada listelenebilir.</p>
            </div>
        </div>

        <div id="basvuru-listesi" class="record-grid"></div>
    `;

    const liste = document.getElementById("basvuru-listesi");

    try {
        const basvurular = await tumKayitlariGetir("basvurular");

        if (!basvurular.length) {
            liste.innerHTML = bosDurum("Henüz yerel başvuru kaydı yok.");
            return;
        }

        liste.innerHTML = basvurular.map(b => `
            <article class="record-card">
                <div class="record-card-body">
                    <h3>${guvenliMetin(b.ad || "İsimsiz başvuru")}</h3>
                    <p>Telefon: ${guvenliMetin(b.telefon || "Belirtilmemiş")}</p>
                    <p>Yaş: ${guvenliMetin(b.yas || "Belirtilmemiş")}</p>
                    <p>Deneyim: ${guvenliMetin(b.deneyim || "Belirtilmemiş")}</p>
                    <p>Not: ${guvenliMetin(b.not || "Yok")}</p>
                    <p>Durum: ${guvenliMetin(b.durum || "Yeni")}</p>
                    <div class="photo-card-actions">
                        <button class="admin-button secondary" data-status-application="${b.id}">Durumu değiştir</button>
                        <button class="admin-button danger" data-delete-application="${b.id}">Sil</button>
                    </div>
                </div>
            </article>
        `).join("");

        liste.querySelectorAll("[data-status-application]").forEach(buton => {
            buton.addEventListener("click", async () => {
                const basvuru = basvurular.find(b => b.id === Number(buton.dataset.statusApplication));
                if (!basvuru) return;

                const durum = prompt("Başvuru durumu (Yeni / İletişime geçildi / Tamamlandı):",
                    basvuru.durum || "Yeni");
                if (durum === null || !durum.trim()) return;

                basvuru.durum = durum.trim();
                await kayitGuncelle("basvurular", basvuru);
                basvurularSayfasi();
            });
        });

        liste.querySelectorAll("[data-delete-application]").forEach(buton => {
            buton.addEventListener("click", async () => {
                if (!confirm("Bu başvuruyu silmek istediğine emin misin?")) return;
                await kayitSil("basvurular", buton.dataset.deleteApplication);
                basvurularSayfasi();
            });
        });
    } catch (hata) {
        console.error(hata);
        liste.innerHTML = bosDurum("Başvurular yüklenemedi.");
    }
}

/* SİTE AYARLARI */

async function siteAyarlariSayfasi() {
    content.innerHTML = `
        ${bolumBasligi("Site Ayarları", "Ana sayfada kullanmak istediğin metinleri yerel olarak kaydet.")}

        <form id="ayar-formu" class="admin-form">
            <label for="ayar-baslik">Ana sayfa başlığı</label>
            <input id="ayar-baslik" maxlength="160" placeholder="GÜN SPOR KULÜBÜ">

            <label for="ayar-altbaslik">Ana sayfa alt başlığı</label>
            <input id="ayar-altbaslik" maxlength="200" placeholder="Hedefe Odaklan!">

            <label for="ayar-aciklama">Ana sayfa açıklaması</label>
            <textarea id="ayar-aciklama" maxlength="2000" rows="4"
                placeholder="Kulübün kısa tanıtımı"></textarea>

            <button class="admin-button" type="submit">Ayarları kaydet</button>
            <p id="ayar-mesaji" class="form-message" role="status"></p>
        </form>

        <div class="notice">
            <i class="fa-solid fa-circle-info"></i>
            <div>
                <strong>Şimdilik yerel kayıt</strong>
                <p>Bu ayarlar şu anda ana sitedeki metinleri otomatik değiştirmez. Ana siteyle ortak çalışması için ayrıca bağlantı kurulmalıdır.</p>
            </div>
        </div>
    `;

    try {
        const kayitlar = await tumKayitlariGetir("ayarlar");
        const ayar = kayitlar[0];

        if (ayar) {
            document.getElementById("ayar-baslik").value = ayar.baslik || "";
            document.getElementById("ayar-altbaslik").value = ayar.altbaslik || "";
            document.getElementById("ayar-aciklama").value = ayar.aciklama || "";
        }
    } catch (hata) {
        console.error(hata);
    }

    document.getElementById("ayar-formu").addEventListener("submit", async event => {
        event.preventDefault();

        const mesaj = document.getElementById("ayar-mesaji");
        const kayit = {
            baslik: document.getElementById("ayar-baslik").value.trim(),
            altbaslik: document.getElementById("ayar-altbaslik").value.trim(),
            aciklama: document.getElementById("ayar-aciklama").value.trim()
        };

        try {
            const mevcut = await tumKayitlariGetir("ayarlar");

            if (mevcut.length) {
                kayit.id = mevcut[0].id;
                await kayitGuncelle("ayarlar", kayit);
            } else {
                await kayitEkle("ayarlar", kayit);
            }

            mesajGoster(mesaj, "Ayarlar bu tarayıcıya kaydedildi.");
        } catch (hata) {
            console.error(hata);
            mesajGoster(mesaj, "Ayarlar kaydedilemedi.", true);
        }
    });
}

/* GÜVENLİK BİLGİSİ */

function guvenlikSayfasi() {
    content.innerHTML = `
        ${bolumBasligi("Kullanıcı ve Güvenlik", "Yönetim panelinin mevcut güvenlik durumu.")}

        <div class="notice">
            <i class="fa-solid fa-shield-halved"></i>
            <div>
                <strong>Gerçek giriş sistemi henüz kurulmadı</strong>
                <p>Bu sayfa bir parola oluşturmaz veya kullanıcı doğrulaması yapmaz. HTML ve JavaScript içinde saklanan bir parola güvenli değildir. Paneli internete açmadan önce sunucu tarafında kimlik doğrulaması eklenmelidir.</p>
            </div>
        </div>

        <div class="record-grid">
            <article class="record-card">
                <div class="record-card-body">
                    <h3><i class="fa-solid fa-user-lock"></i> Kullanıcı doğrulaması</h3>
                    <p>Emre Gündüz ve Beyzanur Gündüz için ayrı kullanıcı hesapları sunucu tarafında oluşturulmalıdır.</p>
                </div>
            </article>
            <article class="record-card">
                <div class="record-card-body">
                    <h3><i class="fa-solid fa-cloud"></i> Ortak veri</h3>
                    <p>Verilerin farklı cihazlarda görünmesi için çevrim içi veritabanı ve erişim kuralları gerekir.</p>
                </div>
            </article>
            <article class="record-card">
                <div class="record-card-body">
                    <h3><i class="fa-solid fa-database"></i> Yerel kayıtlar</h3>
                    <p>Bu prototipteki veriler bu tarayıcıya aittir. Tarayıcı verilerini silmek kayıtları kaybettirebilir.</p>
                </div>
            </article>
        </div>
    `;
}

/* MENÜ OLAYLARI */

document.querySelectorAll("[data-page]").forEach(buton => {
    buton.addEventListener("click", () => sayfayiSec(buton.dataset.page));
});

mobileMenu?.addEventListener("click", () => {
    menuDurumunuAyarla(!sidebar?.classList.contains("acik"));
});

menuOverlay?.addEventListener("click", () => menuDurumunuAyarla(false));

document.addEventListener("keydown", event => {
    if (event.key === "Escape") menuDurumunuAyarla(false);
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 700) menuDurumunuAyarla(false);
});

genelBakisiGoster();
