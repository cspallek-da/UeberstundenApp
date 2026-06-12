let eintraege = JSON.parse(localStorage.getItem("timebalance_eintraege")) || [];
let bearbeitungsIndex = null;

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
anzeigen();
