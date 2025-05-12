const firebaseConfig = {
  apiKey: "AIzaSyCip7YLsjtLstoDP9pP4psY9D0FYNsBA_o",
  authDomain: "cenrto-prove.firebaseapp.com",
  projectId: "cenrto-prove",
  storageBucket: "cenrto-prove.firebasestorage.app",
  messagingSenderId: "179347785658",
  appId: "1:179347785658:web:c4c3ba5e56cc17e9f87f83"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const aree = ["Rettilineo", "Officina", "Handling", "Paddock"];
const slotLabel = ["Mattina", "Pausa", "Pomeriggio"];
const giorniNomi = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

function generaSettimana() {
  const grid = document.getElementById("grid");
  const celle = document.querySelectorAll("td[data-giorno]");
  let inizio = new Date();

  if (celle.length === 0) {
    const oggi = new Date();
    const giornoSettimana = oggi.getDay();
    const offset = giornoSettimana === 0 ? -6 : 1 - giornoSettimana;
    inizio.setDate(oggi.getDate() + offset);
  } else {
    const dateEsistenti = Array.from(celle).map(td => new Date(td.getAttribute("data-giorno")));
    const maxData = new Date(Math.max(...dateEsistenti.map(d => d.getTime())));
    inizio = new Date(maxData);
    inizio.setDate(inizio.getDate() + 1);
  }

  for (let i = 0; i < 7; i++) {
    const data = new Date(inizio);
    data.setDate(inizio.getDate() + i);
    const dataStr = data.toISOString().split("T")[0];
    const giornoNome = giorniNomi[data.getDay()];

    slotLabel.forEach(slot => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${giornoNome}</td>
        <td>${dataStr}</td>
        <td>${slot}</td>
      `;
      aree.forEach(area => {
        const cell = document.createElement("td");
        cell.setAttribute("data-giorno", dataStr);
        cell.setAttribute("data-slot", slot);
        cell.setAttribute("data-area", area);
        cell.ondrop = drop;
        cell.ondragover = allowDrop;
        row.appendChild(cell);
      });
      grid.appendChild(row);
    });
  }
}

function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.id); }
function drop(ev) {
  ev.preventDefault();
  const id = ev.dataTransfer.getData("text");
  const el = document.getElementById(id);
  const cell = ev.target.closest("td");
  if (cell && el) {
    cell.appendChild(el);
    const attivitaId = el.dataset.id;
    db.collection("attivita").doc(attivitaId).update({
      giorno: cell.getAttribute("data-giorno"),
      slot: cell.getAttribute("data-slot"),
      area: cell.getAttribute("data-area")
    });
  }
}

function creaAttivita() {
  const veicolo = document.getElementById("veicolo").value;
  const test = document.getElementById("test").value;
  const giorno = document.getElementById("giorno").value;
  const slot = document.getElementById("slot").value;
  const area = document.getElementById("area").value;

  if (!veicolo || !test || !giorno || !slot || !area) {
    alert("Compila tutti i campi");
    return;
  }

  const attività = { veicolo, test, giorno, slot, area, timestamp: new Date() };
  db.collection("attivita").add(attività)
    .then(() => console.log("Attività salvata:", attività))
    .catch(error => console.error("Errore salvataggio:", error));

  document.getElementById("veicolo").value = "";
  document.getElementById("test").value = "";
  document.getElementById("giorno").value = "";
  document.getElementById("slot").selectedIndex = 0;
  document.getElementById("area").selectedIndex = 0;
}

function mostraAttività() {
  db.collection("attivita").orderBy("timestamp").onSnapshot(snapshot => {
    document.querySelectorAll(".activity").forEach(e => e.remove());
    snapshot.forEach(doc => {
      const dati = doc.data();
      const cella = document.querySelector(`td[data-giorno='${dati.giorno}'][data-slot='${dati.slot}'][data-area='${dati.area}']`);
      if (cella) {
        const div = document.createElement("div");
        div.className = "activity";
        div.id = `attivita-${doc.id}`;
        div.textContent = `${dati.veicolo} - ${dati.test}`;
        div.setAttribute("draggable", "true");
        div.setAttribute("ondragstart", "drag(event)");
        div.dataset.id = doc.id;

        const delBtn = document.createElement("button");
        delBtn.textContent = "❌";
        delBtn.onclick = () => {
          if (confirm("Eliminare questa attività?")) {
            db.collection("attivita").doc(doc.id).delete();
          }
        };
        div.appendChild(delBtn);
        cella.appendChild(div);
      } else {
        console.warn("Cella non trovata per:", dati);
      }
    });
  });
}

mostraAttività();
