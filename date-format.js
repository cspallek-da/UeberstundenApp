function formatDatumDeutsch(datum) {
    if (!datum || typeof datum !== "string") {
        return "";
    }

    const teile = datum.split("-");

    if (teile.length !== 3) {
        return datum;
    }

    return `${teile[2]}.${teile[1]}.${teile[0]}`;
}

function formatMonatDeutsch(monat) {
    if (!monat || typeof monat !== "string") {
        return "";
    }

    const teile = monat.split("-");

    if (teile.length !== 2) {
        return monat;
    }

    return `${teile[1]}.${teile[0]}`;
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
                <strong>${formatMonatDeutsch(eintrag.datum.substring(0, 7))} - Monats-Nachtrag</strong><br>
                <span class="${klasse}">${formatZeit(wert)}</span><br>
                ${eintrag.bemerkung || ""}
                <br><br>
                <button onclick="loeschen(${index})">Löschen</button>
            `;
        } else {
            div.innerHTML = `
                <strong>${formatDatumDeutsch(eintrag.datum)}</strong><br>
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
            <strong>${formatMonatDeutsch(monat)}</strong><br>
            <span class="${klasse}">${formatZeit(wert)}</span>
        `;

        monatsuebersicht.appendChild(div);
    });

    saldoAnzeige.textContent = formatZeit(saldo);
}

function gefiltertePdfEintraege() {
    const zeitraum = document.getElementById("pdfZeitraum").value;

    if (zeitraum === "jahr") {
        const jahr = document.getElementById("pdfJahr").value;

        if (!jahr) {
            alert("Bitte ein Jahr eingeben.");
            return null;
        }

        return {
            titel: `Jahr ${jahr}`,
            eintraege: eintraege.filter(e => e.datum.startsWith(`${jahr}-`))
        };
    }

    if (zeitraum === "monat") {
        const monat = document.getElementById("pdfMonat").value;

        if (!monat) {
            alert("Bitte einen Monat auswählen.");
            return null;
        }

        return {
            titel: `Monat ${formatMonatDeutsch(monat)}`,
            eintraege: eintraege.filter(e => e.datum.startsWith(monat))
        };
    }

    return {
        titel: "Alle Einträge",
        eintraege: [...eintraege]
    };
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

    </body>
    </html>
    `;

    const fenster = window.open("", "_self");

    fenster.document.open();
    fenster.document.write(bericht);
    fenster.document.close();
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

    dateSpan.textContent = formatDatumDeutsch(datum);

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

    dateSpan.textContent = formatDatumDeutsch(datum);

    const html = `
        <div style="margin: 15px 0;">
            <p><strong>Neuer Eintrag für ${formatDatumDeutsch(datum)}</strong></p>

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

document.addEventListener("DOMContentLoaded", anzeigen);
anzeigen();
