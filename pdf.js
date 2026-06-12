function pdfAuswahlAktualisieren() {
    const zeitraum = document.getElementById("pdfZeitraum").value;
    const jahrBox = document.getElementById("pdfJahrBox");
    const monatBox = document.getElementById("pdfMonatBox");
    const heute = new Date();

    document.getElementById("pdfJahr").value =
        document.getElementById("pdfJahr").value || heute.getFullYear();

    document.getElementById("pdfMonat").value =
        document.getElementById("pdfMonat").value ||
        `${heute.getFullYear()}-${String(heute.getMonth() + 1).padStart(2, "0")}`;

    jahrBox.style.display = zeitraum === "jahr" ? "block" : "none";
    monatBox.style.display = zeitraum === "monat" ? "block" : "none";
}

function htmlEscapen(wert) {
    return String(wert || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
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
            titel: `Monat ${monat}`,
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
            <p><b>${monat}</b>: <span class="${klasse}">${formatZeit(wert)}</span></p>
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
                <td>${htmlEscapen(e.datum)}</td>
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

document.addEventListener("DOMContentLoaded", pdfAuswahlAktualisieren);
