let eintraege = JSON.parse(localStorage.getItem("ueberstunden")) || [];
let bearbeitungsIndex = null;

function zeitInMinuten(zeit) {
    const teile = zeit.split(":");
    return parseInt(teile[0]) * 60 + parseInt(teile[1]);
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
    const kommen = document.getElementById("kommen").value;
    const gehen = document.getElementById("gehen").value;
    const pause = parseInt(document.getElementById("pause").value);
    const sollzeit = parseFloat(document.getElementById("sollzeit").value);
    const bemerkung = document.getElementById("bemerkung").value;

    if (!datum || !kommen || !gehen || isNaN(pause) || isNaN(sollzeit)) {
        alert("Bitte Datum, Kommen, Gehen, Pause und Sollzeit ausfüllen.");
        return;
    }

    const arbeitsMinuten =
        zeitInMinuten(gehen) -
        zeitInMinuten(kommen) -
        pause;

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
    const stunden = parseFloat(document.getElementById("nachtragStunden").value);
    const bemerkung = document.getElementById("nachtragBemerkung").value;

    if (!monat || isNaN(stunden)) {
        alert("Bitte Monat und Überstunden eingeben.");
        return;
    }

    const eintrag = {
        typ: "nachtrag",
        datum: monat + "-01",
        kommen: "-",
        gehen: "-",
        pause: 0,
        sollzeit: 0,
        arbeitsstunden: 0,
        ueberstunden: stunden,
        bemerkung: bemerkung || "Monats-Nachtrag"
    };

    eintraege.push(eintrag);

    speichernInBrowser();

    document.getElementById("nachtragStunden").value = "";
    document.getElementById("nachtragBemerkung").value = "";

    anzeigen();
}

function speichernInBrowser() {
    localStorage.setItem("ueberstunden", JSON.stringify(eintraege));
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
                <span class="${klasse}">
                    ${formatZeit(wert)}
                </span><br>
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
                <span class="${klasse}">
                    Überstunden: ${formatZeit(wert)}
                </span><br>
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
            <span class="${klasse}">
                ${formatZeit(wert)}
            </span>
        `;

        monatsuebersicht.appendChild(div);
    });

    saldoAnzeige.textContent = formatZeit(saldo);
}

anzeigen();
