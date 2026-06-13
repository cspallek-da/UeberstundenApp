function ladeEinstellungen() {
    const einstellungen = JSON.parse(localStorage.getItem("timebalance_einstellungen")) || {};

    return {
        name: einstellungen.name || "",
        firma: einstellungen.firma || "",
        abteilung: einstellungen.abteilung || "",
        personalnummer: einstellungen.personalnummer || "",
        vorgesetzter: einstellungen.vorgesetzter || ""
    };
}

function speichereEinstellungen() {
    const einstellungen = {
        name: document.getElementById("einstellungName").value.trim(),
        firma: document.getElementById("einstellungFirma").value.trim(),
        abteilung: document.getElementById("einstellungAbteilung").value.trim(),
        personalnummer: document.getElementById("einstellungPersonalnummer").value.trim(),
        vorgesetzter: document.getElementById("einstellungVorgesetzter").value.trim()
    };

    localStorage.setItem("timebalance_einstellungen", JSON.stringify(einstellungen));
    alert("Einstellungen wurden gespeichert.");
}

function fuelleEinstellungenFormular() {
    const einstellungen = ladeEinstellungen();

    const name = document.getElementById("einstellungName");
    const firma = document.getElementById("einstellungFirma");
    const abteilung = document.getElementById("einstellungAbteilung");
    const personalnummer = document.getElementById("einstellungPersonalnummer");
    const vorgesetzter = document.getElementById("einstellungVorgesetzter");

    if (!name || !firma || !abteilung || !personalnummer || !vorgesetzter) {
        return;
    }

    name.value = einstellungen.name;
    firma.value = einstellungen.firma;
    abteilung.value = einstellungen.abteilung;
    personalnummer.value = einstellungen.personalnummer;
    vorgesetzter.value = einstellungen.vorgesetzter;
}

function erstelleMitarbeiterBlockHtml() {
    const einstellungen = ladeEinstellungen();
    const zeilen = [];

    if (einstellungen.name) {
        zeilen.push(`<p><b>Name:</b> ${htmlEscapen(einstellungen.name)}</p>`);
    }

    if (einstellungen.firma) {
        zeilen.push(`<p><b>Firma:</b> ${htmlEscapen(einstellungen.firma)}</p>`);
    }

    if (einstellungen.abteilung) {
        zeilen.push(`<p><b>Abteilung:</b> ${htmlEscapen(einstellungen.abteilung)}</p>`);
    }

    if (einstellungen.personalnummer) {
        zeilen.push(`<p><b>Personalnummer:</b> ${htmlEscapen(einstellungen.personalnummer)}</p>`);
    }

    if (einstellungen.vorgesetzter) {
        zeilen.push(`<p><b>Vorgesetzter:</b> ${htmlEscapen(einstellungen.vorgesetzter)}</p>`);
    }

    if (zeilen.length === 0) {
        return "";
    }

    return `<div class="mitarbeiter-block">${zeilen.join("")}</div>`;
}

function erstelleUnterschriftenBlockHtml() {
    const einstellungen = ladeEinstellungen();
    const mitarbeiterName = einstellungen.name ? `<p class="unterschrift-name">${htmlEscapen(einstellungen.name)}</p>` : "";
    const vorgesetzterName = einstellungen.vorgesetzter ? `<p class="unterschrift-name">${htmlEscapen(einstellungen.vorgesetzter)}</p>` : "";

    return `
        <div class="unterschriften">
            <p>Ort, Datum: __________________________________________</p>

            <div class="unterschriften-grid">
                <div>
                    <p>__________________________________________</p>
                    ${mitarbeiterName}
                    <p>Mitarbeiter</p>
                </div>
                <div>
                    <p>__________________________________________</p>
                    ${vorgesetzterName}
                    <p>Vorgesetzter</p>
                </div>
            </div>
        </div>
    `;
}

async function exportieren() {
    const daten = {
        app: "TimeBalance",
        version: "1.6",
        exportiertAm: new Date().toISOString(),
        einstellungen: ladeEinstellungen(),
        eintraege: eintraege
    };

    const json = JSON.stringify(daten, null, 2);
    const dateiname = `timebalance-backup-${new Date().toISOString().substring(0, 10)}.json`;

    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        try {
            const file = new File(
                [json],
                dateiname,
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
    a.download = dateiname;

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

            if (daten.einstellungen) {
                localStorage.setItem("timebalance_einstellungen", JSON.stringify(daten.einstellungen));
                fuelleEinstellungenFormular();
            }

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

function pdfAnsichtMitAuswahl() {
    const auswahl = gefiltertePdfEintraege();

    if (!auswahl) {
        return;
    }

    const gefiltert = auswahl.eintraege.sort((a, b) => a.datum.localeCompare(b.datum));

    if (gefiltert.length === 0) {
        alert("Für diesen Zeitraum gibt es keine Einträge.");
        return;
    }

    let saldo = 0;
    let monate = {};

    gefiltert.forEach(e => {
        const wert = e.ueberstunden || 0;
        const monat = e.datum.substring(0, 7);

        saldo += wert;

        if (!monate[monat]) {
            monate[monat] = 0;
        }

        monate[monat] += wert;
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

            .mitarbeiter-block {
                border: 1px solid #ccc;
                padding: 12px;
                margin: 15px 0;
                background: #f8f8f8;
            }

            .mitarbeiter-block p {
                margin: 4px 0;
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

            .plus {
                color: green;
                font-weight: bold;
            }

            .minus {
                color: red;
                font-weight: bold;
            }

            .unterschriften {
                margin-top: 50px;
                page-break-inside: avoid;
            }

            .unterschriften-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-top: 40px;
            }

            .unterschrift-name {
                margin: 6px 0 0 0;
                font-weight: bold;
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
        ${erstelleMitarbeiterBlockHtml()}
        <h2>${htmlEscapen(auswahl.titel)}</h2>
        <h2>Saldo im Zeitraum: ${formatZeit(saldo)}</h2>

        <h2>Monatsübersicht</h2>
    `;

    Object.keys(monate).sort().forEach(monat => {
        const wert = monate[monat];
        const klasse = wert >= 0 ? "plus" : "minus";

        bericht += `
            <p><b>${formatMonatDeutsch(monat)}</b>: <span class="${klasse}">${formatZeit(wert)}</span></p>
        `;
    });

    bericht += `
        <h2>Einträge</h2>

        <table>
            <tr>
                <th>Datum</th>
                <th>Typ</th>
                <th>Kommen</th>
                <th>Gehen</th>
                <th>Überstunden</th>
                <th>Bemerkung</th>
            </tr>
    `;

    gefiltert.forEach(e => {
        const wert = e.ueberstunden || 0;
        const klasse = wert >= 0 ? "plus" : "minus";
        const typ = e.typ === "nachtrag" ? "Nachtrag" : "Tag";

        bericht += `
            <tr>
                <td>${htmlEscapen(formatDatumDeutsch(e.datum))}</td>
                <td>${typ}</td>
                <td>${htmlEscapen(e.kommen || "-")}</td>
                <td>${htmlEscapen(e.gehen || "-")}</td>
                <td class="${klasse}">${formatZeit(wert)}</td>
                <td>${htmlEscapen(e.bemerkung || "")}</td>
            </tr>
        `;
    });

    bericht += `
        </table>

        <p>Erstellt am: ${new Date().toLocaleString("de-DE")}</p>
        ${erstelleUnterschriftenBlockHtml()}

    </body>
    </html>
    `;

    const fenster = window.open("", "_self");

    fenster.document.open();
    fenster.document.write(bericht);
    fenster.document.close();
}

document.addEventListener("DOMContentLoaded", fuelleEinstellungenFormular);
