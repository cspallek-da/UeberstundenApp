let eintraege = JSON.parse(localStorage.getItem("timebalance_eintraege")) || [];
let bearbeitungsIndex = null;
let aktuellerKalenderMonat = new Date();

function setTheme(theme) {
    localStorage.setItem("timebalance_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    updateThemeButtons();
}

function updateThemeButtons() {
    const aktuellesTheme =
        localStorage.getItem("timebalance_theme") || "system";

    document.querySelectorAll(".theme-btn").forEach(btn => {
        btn.classList.remove("theme-active");

        if (btn.dataset.themeBtn === aktuellesTheme) {
            btn.classList.add("theme-active");
        }
    });
}

function themeLaden() {
    const theme =
        localStorage.getItem("timebalance_theme") || "system";

    document.documentElement.setAttribute("data-theme", theme);
    updateThemeButtons();
}

document.addEventListener("DOMContentLoaded", themeLaden);

function switchTab(tabId, button) {
    document.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.remove("active");
    });

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    document.getElementById(tabId).classList.add("active");
    button.classList.add("active");

    if (tabId === "kalender-tab") {
        renderKalender();
    }
}

function hilfeAnzeigen() {
    document.getElementById("hilfeBox").style.display = "block";
}

function hilfeAusblenden() {
    document.getElementById("hilfeBox").style.display = "none";
}

function zeitInMinuten(zeit) {
    const teile = zeit.split(":");
    return parseInt(teile[0]) * 60 + parseInt(teile[1]);
}

function istUhrzeitGueltig(zeit) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(zeit);
}

function formatZeit(stunden) {
    const negativ = stunden < 0;
    const gesamtMinuten = Math.round(Math.abs(stunden) * 60);
    const h = Math.floor(gesamtMinuten / 60);
    const m = gesamtMinuten % 60;

    return `${negativ ? "-" : ""}${h}h ${m}min`;
}

function speichern() {
    const datum = document.getElementById("datum").value;
    const kommen = document.getElementById("kommen").value.trim();
    const gehen = document.getElementById("gehen").value.trim();
    const pause = parseInt(document.getElementById("pause").value);
    const sollzeit = parseFloat(document.getElementById("sollzeit").value);
    const bemerkung = document.getElementById("bemerkung").value;

    if (!datum || !kommen || !gehen || isNaN(pause) || isNaN(sollzeit)) {
        alert("Bitte Datum, Kommen, Gehen, Pause und Sollzeit ausfüllen.");
        return;
    }

    if (!istUhrzeitGueltig(kommen) || !istUhrzeitGueltig(gehen)) {
        alert("Bitte Uhrzeiten im Format HH:MM eingeben.");
        return;
    }

    const arbeitsMinuten = zeitInMinuten(gehen) - zeitInMinuten(kommen) - pause;

    if (arbeitsMinuten < 0) {
        alert("Gehen-Zeit muss nach Kommen-Zeit liegen.");
        return;
    }

    const arbeitsstunden = arbeitsMinuten / 60;
    const ueberstunden = arbeitsstunden - sollzeit;

    const eintrag = {
        typ: "tag",
        datum,
        kommen,
        gehen,
        pause,
        sollzeit,
        arbeitsstunden,
        ueberstunden,
        bemerkung
    };

    if (bearbeitungsIndex === null) {
        eintraege.push(eintrag);
    } else {
        eintraege[bearbeitungsIndex] = eintrag;
        bearbeitungsIndex = null;
        document.getElementById("speichernButton").textContent = "Speichern";
    }

    speichernInBrowser();
    formularLeeren();
    anzeigen();
}

function speichernAusKalender() {
    const datum = document.getElementById("quickDatum").value;
    const kommen = document.getElementById("quickKommen").value.trim();
    const gehen = document.getElementById("quickGehen").value.trim();
    const pause = parseInt(document.getElementById("quickPause").value);
    const sollzeit = parseFloat(document.getElementById("quickSollzeit").value);
    const bemerkung = document.getElementById("quickBemerkung").value;

    if (!datum || !kommen || !gehen || isNaN(pause) || isNaN(sollzeit)) {
        alert("Bitte Kommen, Gehen, Pause und Sollzeit ausfüllen.");
        return;
    }

    if (!istUhrzeitGueltig(kommen) || !istUhrzeitGueltig(gehen)) {
        alert("Bitte Uhrzeiten im Format HH:MM eingeben.");
        return;
    }

    const arbeitsMinuten = zeitInMinuten(gehen) - zeitInMinuten(kommen) - pause;

    if (arbeitsMinuten < 0) {
        alert("Gehen-Zeit muss nach Kommen-Zeit liegen.");
        return;
    }

    const arbeitsstunden = arbeitsMinuten / 60;
    const ueberstunden = arbeitsstunden - sollzeit;

    const eintrag = {
        typ: "tag",
        datum,
        kommen,
        gehen,
        pause,
        sollzeit,
        arbeitsstunden,
        ueberstunden,
        bemerkung
    };

    eintraege.push(eintrag);
    speichernInBrowser();
    anzeigen();
    renderKalender();
    closeDetails();

    alert("Eintrag erfolgreich erstellt!");
}

function monatsNachtragSpeichern() {
    const monat = document.getElementById("nachtragMonat").value;
    const stunden = parseInt(document.getElementById("nachtragStunden").value);
    const minuten = parseInt(document.getElementById("nachtragMinuten").value);
    const bemerkung = document.getElementById("nachtragBemerkung").value;

    if (!monat || isNaN(stunden) || isNaN(minuten)) {
        alert("Bitte Monat, Stunden und Minuten eingeben.");
        return;
    }

    if (minuten < 0 || minuten > 59) {
        alert("Minuten müssen zwischen 0 und 59 liegen.");
        return;
    }

    let ueberstunden;

    if (stunden < 0) {
        ueberstunden = stunden - (minuten / 60);
    } else {
        ueberstunden = stunden + (minuten / 60);
    }

    const eintrag = {
        typ: "nachtrag",
        datum: monat + "-01",
        kommen: "-",
        gehen: "-",
        pause: 0,
        sollzeit: 0,
        arbeitsstunden: 0,
        ueberstunden: ueberstunden,
        bemerkung: bemerkung || "Monats-Nachtrag"
    };

    eintraege.push(eintrag);
    speichernInBrowser();

    document.getElementById("nachtragStunden").value = "";
    document.getElementById("nachtragMinuten").value = "0";
    document.getElementById("nachtragBemerkung").value = "";

    anzeigen();
}

function speichernInBrowser() {
    localStorage.setItem("timebalance_eintraege", JSON.stringify(eintraege));
}

function formularLeeren() {
    document.getElementById("kommen").value = "";
    document.getElementById("gehen").value = "";
    document.getElementById("bemerkung").value = "";
}

function bearbeiten(index) {
    const eintrag = eintraege[index];

    if (eintrag.typ === "nachtrag") {
        alert("Monats-Nachträge bitte löschen und neu anlegen.");
        return;
    }

    document.getElementById("datum").value = eintrag.datum;
    document.getElementById("kommen").value = eintrag.kommen;
    document.getElementById("gehen").value = eintrag.gehen;
    document.getElementById("pause").value = eintrag.pause;
    document.getElementById("sollzeit").value = eintrag.sollzeit;
    document.getElementById("bemerkung").value = eintrag.bemerkung || "";

    bearbeitungsIndex = index;
    document.getElementById("speichernButton").textContent = "Änderung speichern";

    switchTab("eintrag-tab", document.querySelectorAll(".tab-btn")[0]);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function loeschen(index) {
    if (!confirm("Eintrag wirklich löschen?")) {
        return;
    }

    eintraege.splice(index, 1);
    speichernInBrowser();
    anzeigen();
}

async function exportieren() {
    const daten = {
        app: "TimeBalance",
        exportiertAm: new Date().toISOString(),
        eintraege: eintraege
    };

    const json = JSON.stringify(daten, null, 2);

    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        try {
            const file = new File(
                [json],
                "timebalance-backup.json",
                { type: "application/json" }
            );

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: "TimeBalance Backup"
                });
                return;
            }
        } catch (e) {
            console.log(e);
        }
    }

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `timebalance-backup-${new Date().toISOString().substring(0, 10)}.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}

function importieren(event) {
    const datei = event.target.files[0];

    if (!datei) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const daten = JSON.parse(e.target.result);

            if (!daten.eintraege || !Array.isArray(daten.eintraege)) {
                alert("Ungültige Backup-Datei.");
                return;
            }

            if (!confirm("Vorhandene Daten werden ersetzt. Fortfahren?")) {
                return;
            }

            eintraege = daten.eintraege;
            speichernInBrowser();
            anzeigen();

            document.getElementById("importDatei").value = "";

            alert("Backup wurde erfolgreich importiert.");
        } catch (fehler) {
            alert("Backup konnte nicht gelesen werden.");
        }
    };

    reader.readAsText(datei);
}

function anzeigen() {
    const liste = document.getElementById("liste");
    const saldoAnzeige = document.getElementById("saldo");
    const monatsuebersicht = document.getElementById("monatsuebersicht");

    if (!liste || !saldoAnzeige || !monatsuebersicht) {
        return;
    }

    liste.innerHTML = "";
    monatsuebersicht.innerHTML = "";

    let saldo = 0;
    let monate = {};

    eintraege.forEach((eintrag, index) => {
        const wert = eintrag.ueberstunden || 0;
        saldo += wert;

        const monat = eintrag.datum.substring(0, 7);

        if (!monate[monat]) {
            monate[monat] = 0;
        }

        monate[monat] += wert;

        const div = document.createElement("div");
        div.className = "eintrag";

        const klasse = wert >= 0 ? "plus" : "minus";

        if (eintrag.typ === "nachtrag") {
            div.innerHTML = `
                <strong>${eintrag.datum.substring(0, 7)} - Monats-Nachtrag</strong><br>
                <span class="${klasse}">${formatZeit(wert)}</span><br>
                ${eintrag.bemerkung || ""}
                <br><br>
                <button onclick="loeschen(${index})">Löschen</button>
            `;
        } else {
            div.innerHTML = `
                <strong>${eintrag.datum}</strong><br>
                Kommen: ${eintrag.kommen} | Gehen: ${eintrag.gehen}<br>
                Pause: ${eintrag.pause} Minuten<br>
                Arbeitszeit: ${formatZeit(eintrag.arbeitsstunden)}<br>
                Sollzeit: ${formatZeit(eintrag.sollzeit)}<br>
                <span class="${klasse}">Überstunden: ${formatZeit(wert)}</span><br>
                ${eintrag.bemerkung || ""}
                <br><br>
                <button onclick="bearbeiten(${index})">Bearbeiten</button>
                <button onclick="loeschen(${index})">Löschen</button>
            `;
        }

        liste.appendChild(div);
    });

    Object.keys(monate).sort().forEach(monat => {
        const wert = monate[monat];

        const div = document.createElement("div");
        div.className = "eintrag";

        const klasse = wert >= 0 ? "plus" : "minus";

        div.innerHTML = `
            <strong>${monat}</strong><br>
            <span class="${klasse}">${formatZeit(wert)}</span>
        `;

        monatsuebersicht.appendChild(div);
    });

    saldoAnzeige.textContent = formatZeit(saldo);
}

function pdfAnsicht() {
    let monate = {};

    eintraege.forEach(e => {
        const monat = e.datum.substring(0, 7);

        if (!monate[monat]) {
            monate[monat] = 0;
        }

        monate[monat] += e.ueberstunden;
    });

    let bericht = `
    <html>
    <head>
        <title>TimeBalance Bericht</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 20px;
                color: #000;
                background: #fff;
            }

            h1, h2 {
                text-align: center;
            }

            .actions {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }

            button {
                flex: 1;
                padding: 12px;
                font-size: 16px;
                border: none;
                border-radius: 8px;
                background: #007aff;
                color: white;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }

            th, td {
                border: 1px solid #ccc;
                padding: 8px;
                text-align: left;
            }

            th {
                background: #f0f0f0;
            }

            @media print {
                .actions {
                    display: none;
                }
            }
        </style>
    </head>

    <body>

        <div class="actions">
            <button onclick="location.href='index.html'">⬅️ Zurück zur App</button>
            <button onclick="window.print()">🖨️ Drucken / PDF</button>
        </div>

        <h1>TimeBalance Bericht</h1>

        <h2>Gesamtsaldo: ${document.getElementById("saldo").textContent}</h2>

        <h2>Monatsübersicht</h2>
    `;

    Object.keys(monate).sort().forEach(monat => {
        bericht += `
            <p><b>${monat}</b>: ${formatZeit(monate[monat])}</p>
        `;
    });

    bericht += `
        <h2>Einträge</h2>

        <table>
            <tr>
                <th>Datum</th>
                <th>Überstunden</th>
                <th>Bemerkung</th>
            </tr>
    `;

    eintraege.forEach(e => {
        bericht += `
            <tr>
                <td>${e.datum}</td>
                <td>${formatZeit(e.ueberstunden)}</td>
                <td>${e.bemerkung || ""}</td>
            </tr>
        `;
    });

    bericht += `
        </table>

        <p>Erstellt am: ${new Date().toLocaleString("de-DE")}</p>

    </body>
    </html>
    `;

    const fenster = window.open("", "_self");

    fenster.document.open();
    fenster.document.write(bericht);
    fenster.document.close();
}

function renderKalender() {
    closeDetails();

    const jahr = aktuellerKalenderMonat.getFullYear();
    const monat = aktuellerKalenderMonat.getMonth();

    const monate = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
    ];

    document.getElementById("kalenderTitel").textContent =
        `${monate[monat]} ${jahr}`;

    const eintraegeProTag = {};

    eintraege.forEach((eintrag, index) => {
        const monatKey =
            `${jahr}-${String(monat + 1).padStart(2, "0")}`;

        if (eintrag.datum.startsWith(monatKey)) {
            eintraegeProTag[eintrag.datum] = {
                eintrag: eintrag,
                index: index
            };
        }
    });

    const ersterTag = new Date(jahr, monat, 1);
    const letzterTag = new Date(jahr, monat + 1, 0);

    let ersterWochentag = ersterTag.getDay();

    if (ersterWochentag === 0) {
        ersterWochentag = 7;
    }

    const anzahlTage = letzterTag.getDate();

    const kalenderGrid = document.getElementById("kalender");
    kalenderGrid.innerHTML = "";

    for (let i = 1; i < ersterWochentag; i++) {
        const leerDiv = document.createElement("div");
        leerDiv.className = "kalender-tag leer";
        kalenderGrid.appendChild(leerDiv);
    }

    const heute = new Date();
    const heuteString =
        `${heute.getFullYear()}-${String(heute.getMonth() + 1).padStart(2, "0")}-${String(heute.getDate()).padStart(2, "0")}`;

    for (let tag = 1; tag <= anzahlTage; tag++) {
        const datum =
            `${jahr}-${String(monat + 1).padStart(2, "0")}-${String(tag).padStart(2, "0")}`;

        const div = document.createElement("div");

        let className = "kalender-tag";
        let wert = "";
        let wertKlasse = "";

        if (datum === heuteString) {
            className += " heute";
        }

        if (eintraegeProTag[datum]) {
            const eintrag = eintraegeProTag[datum].eintrag;
            const ueberstunden = eintrag.ueberstunden || 0;

            if (eintrag.typ === "nachtrag") {
                className += " nachtrag";
                wert = formatZeit(ueberstunden);
            } else {
                if (ueberstunden > 0) {
                    className += " plus";
                    wertKlasse = "plus";
                } else if (ueberstunden < 0) {
                    className += " minus";
                    wertKlasse = "minus";
                } else {
                    className += " neutral";
                }

                wert = formatZeit(ueberstunden);
            }
        } else {
            className += " neutral";
        }

        div.className = className;

        div.innerHTML = `
            <span class="tag-nummer">${tag}</span>
            ${wert ? `<span class="tag-wert ${wertKlasse}">${wert}</span>` : ""}
        `;

        div.onclick = () => {
            if (eintraegeProTag[datum]) {
                zeigeDetailsTag(datum, eintraegeProTag[datum]);
            } else {
                zeigeQuickAddForm(datum);
            }
        };

        kalenderGrid.appendChild(div);
    }
}

function zeigeDetailsTag(datum, eintragData) {
    if (!eintragData) {
        return;
    }

    const eintrag = eintragData.eintrag;
    const index = eintragData.index;

    const detailsDiv = document.getElementById("kalenderDetails");
    const dateSpan = document.getElementById("selectedDate");
    const detailsContent = document.getElementById("selectedDateDetails");

    dateSpan.textContent = datum;

    let html = `<div style="margin: 15px 0;">`;

    if (eintrag.typ === "nachtrag") {
        html += `
            <p><strong>Typ:</strong> Monats-Nachtrag</p>
            <p><strong>Überstunden:</strong> <span class="${eintrag.ueberstunden >= 0 ? 'plus' : 'minus'}">${formatZeit(eintrag.ueberstunden)}</span></p>
            <p><strong>Bemerkung:</strong> ${eintrag.bemerkung || "-"}</p>
            <button style="width: 100%; margin-top: 10px;" onclick="loeschen(${index}); renderKalender();">Löschen</button>
        `;
    } else {
        html += `
            <p><strong>Kommen:</strong> ${eintrag.kommen}</p>
            <p><strong>Gehen:</strong> ${eintrag.gehen}</p>
            <p><strong>Pause:</strong> ${eintrag.pause} Minuten</p>
            <p><strong>Arbeitszeit:</strong> ${formatZeit(eintrag.arbeitsstunden)}</p>
            <p><strong>Sollzeit:</strong> ${formatZeit(eintrag.sollzeit)}</p>
            <p><strong>Überstunden:</strong> <span class="${eintrag.ueberstunden >= 0 ? 'plus' : 'minus'}">${formatZeit(eintrag.ueberstunden)}</span></p>
            <p><strong>Bemerkung:</strong> ${eintrag.bemerkung || "-"}</p>
            <button style="width: 100%; margin-top: 10px;" onclick="bearbeiten(${index}); closeDetails();">Bearbeiten</button>
            <button style="width: 100%; margin-top: 10px; background: #dc3545;" onclick="loeschen(${index}); renderKalender();">Löschen</button>
        `;
    }

    html += `</div>`;

    detailsContent.innerHTML = html;
    detailsDiv.style.display = "block";
}

function zeigeQuickAddForm(datum) {
    const detailsDiv = document.getElementById("kalenderDetails");
    const dateSpan = document.getElementById("selectedDate");
    const detailsContent = document.getElementById("selectedDateDetails");

    dateSpan.textContent = datum;

    const html = `
        <div style="margin: 15px 0;">
            <p><strong>Neuer Eintrag für ${datum}</strong></p>
            
            <label style="display: block; margin-top: 10px;">Kommen</label>
            <input type="time" id="quickKommen" style="width: 100%; padding: 8px; box-sizing: border-box;">
            
            <label style="display: block; margin-top: 10px;">Gehen</label>
            <input type="time" id="quickGehen" style="width: 100%; padding: 8px; box-sizing: border-box;">
            
            <label style="display: block; margin-top: 10px;">Pause (Minuten)</label>
            <input type="number" id="quickPause" value="30" style="width: 100%; padding: 8px; box-sizing: border-box;">
            
            <label style="display: block; margin-top: 10px;">Sollzeit (Stunden)</label>
            <input type="number" id="quickSollzeit" step="0.01" value="6" style="width: 100%; padding: 8px; box-sizing: border-box;">
            
            <label style="display: block; margin-top: 10px;">Bemerkung</label>
            <input type="text" id="quickBemerkung" placeholder="Optional" style="width: 100%; padding: 8px; box-sizing: border-box;">
            
            <input type="hidden" id="quickDatum" value="${datum}">
            
            <button style="width: 100%; margin-top: 10px;" onclick="speichernAusKalender()">✅ Speichern</button>
            <button style="width: 100%; margin-top: 10px; background: #6c757d;" onclick="closeDetails()">❌ Abbrechen</button>
        </div>
    `;

    detailsContent.innerHTML = html;
    detailsDiv.style.display = "block";
}

function closeDetails() {
    const details = document.getElementById("kalenderDetails");

    if (details) {
        details.style.display = "none";
    }
}

function vorherMonat() {
    aktuellerKalenderMonat.setMonth(aktuellerKalenderMonat.getMonth() - 1);
    renderKalender();
}

function naechsterMonat() {
    aktuellerKalenderMonat.setMonth(aktuellerKalenderMonat.getMonth() + 1);
    renderKalender();
}

anzeigen();
