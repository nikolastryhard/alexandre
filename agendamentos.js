const STORAGE_KEY = "consultorio_agendamentos_v2";

const dadosIniciais = [
  { id: 5, paciente: "JOAO VITOR", medico: "Dra. Aparecida da Silva", especialidade: "Radiologista", data: "2026-11-17", hora: "15:15", status: "Aguardando", telefone: "(41) 99955-5555" },
  { id: 4, paciente: "Laura", medico: "Marcel Oliveira", especialidade: "Dentista", data: "2026-11-10", hora: "15:28", status: "Aguardando", telefone: "(41) 99955-5555" },
  { id: 3, paciente: "Maria Oliveira", medico: "Dra. Aparecida da Silva", especialidade: "Radiologista", data: "2026-10-20", hora: "14:33", status: "Aguardando", telefone: "(41) 99124-1170" },
  { id: 2, paciente: "João Silva", medico: "Dr. Nélson Santos", especialidade: "Cardiologista", data: "2026-09-05", hora: "10:00", status: "Confirmado", telefone: "(41) 98765-4321" },
  { id: 1, paciente: "João Silva", medico: "Dra. Laura Costa", especialidade: "Pediatra", data: "2026-09-05", hora: "09:00", status: "Finalizado", telefone: "(41) 98765-4321" }
];

let agendamentos = carregarAgendamentos();
let toastTimer;

const elementos = {
  lista: document.getElementById("appointmentList"),
  busca: document.getElementById("searchInput"),
  filtro: document.getElementById("statusFilter"),
  modal: document.getElementById("editModal"),
  form: document.getElementById("editForm"),
  vazio: document.getElementById("emptyState"),
  toast: document.getElementById("toast")
};

function carregarAgendamentos() {
  try {
    const salvos = localStorage.getItem(STORAGE_KEY);
    return salvos ? JSON.parse(salvos) : [...dadosIniciais];
  } catch {
    return [...dadosIniciais];
  }
}

function salvarNoNavegador() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agendamentos));
}

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[caractere]);
}

function formatarData(data) {
  if (!data || !data.includes("-")) return data || "—";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function classeStatus(status) {
  return {
    "Aguardando": "status-aguardando",
    "Confirmado": "status-confirmado",
    "Finalizado": "status-finalizado",
    "Cancelado": "status-cancelado"
  }[status] || "status-aguardando";
}

function atualizarResumo() {
  document.getElementById("totalCount").textContent = agendamentos.length;
  document.getElementById("waitingCount").textContent = agendamentos.filter(a => a.status === "Aguardando").length;
  document.getElementById("confirmedCount").textContent = agendamentos.filter(a => a.status === "Confirmado").length;
  document.getElementById("finishedCount").textContent = agendamentos.filter(a => a.status === "Finalizado").length;
}

function renderizarAgendamentos() {
  const termo = elementos.busca.value.trim().toLocaleLowerCase("pt-BR");
  const statusSelecionado = elementos.filtro.value;

  const filtrados = agendamentos
    .filter(a => !statusSelecionado || a.status === statusSelecionado)
    .filter(a => [a.paciente, a.medico, a.telefone, a.especialidade, String(a.id)]
      .some(valor => String(valor).toLocaleLowerCase("pt-BR").includes(termo)))
    .sort((a, b) => b.id - a.id);

  elementos.lista.innerHTML = filtrados.map(a => `
    <tr>
      <td>#${escaparHTML(a.id)}</td>
      <td class="patient-name">${escaparHTML(a.paciente)}</td>
      <td>${escaparHTML(a.medico)}</td>
      <td>${escaparHTML(a.especialidade)}</td>
      <td>${formatarData(escaparHTML(a.data))}</td>
      <td>${escaparHTML(a.hora)}</td>
      <td><span class="status ${classeStatus(a.status)}">${escaparHTML(a.status)}</span></td>
      <td>${escaparHTML(a.telefone)}</td>
      <td>
        <div class="actions">
          <button class="action-button edit-button" type="button" data-action="edit" data-id="${a.id}" aria-label="Editar agendamento ${a.id}" title="Editar">✎</button>
          <button class="action-button delete-button" type="button" data-action="delete" data-id="${a.id}" aria-label="Excluir agendamento ${a.id}" title="Excluir">⌫</button>
        </div>
      </td>
    </tr>
  `).join("");

  elementos.vazio.hidden = filtrados.length !== 0;
  document.getElementById("recordCount").textContent =
    `${filtrados.length} ${filtrados.length === 1 ? "registro" : "registros"}`;
  atualizarResumo();
}

function abrirModal(id) {
  const agendamento = agendamentos.find(a => a.id === id);
  if (!agendamento) return;

  document.getElementById("editId").value = agendamento.id;
  document.getElementById("editPatient").value = agendamento.paciente;
  document.getElementById("editDoctor").value = agendamento.medico;
  document.getElementById("editSpecialty").value = agendamento.especialidade;
  document.getElementById("editDate").value = agendamento.data;
  document.getElementById("editTime").value = agendamento.hora;
  document.getElementById("editStatus").value = agendamento.status;
  document.getElementById("editPhone").value = agendamento.telefone;

  elementos.modal.classList.add("open");
  elementos.modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.getElementById("editPatient").focus();
}

function fecharModal() {
  elementos.modal.classList.remove("open");
  elementos.modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function mostrarMensagem(mensagem) {
  elementos.toast.textContent = mensagem;
  elementos.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elementos.toast.classList.remove("show"), 2800);
}

function excluirAgendamento(id) {
  const agendamento = agendamentos.find(a => a.id === id);
  if (!agendamento) return;

  if (!confirm(`Deseja realmente excluir o agendamento de ${agendamento.paciente}?`)) return;

  agendamentos = agendamentos.filter(a => a.id !== id);
  salvarNoNavegador();
  renderizarAgendamentos();
  mostrarMensagem("Agendamento excluído com sucesso.");
}

elementos.lista.addEventListener("click", evento => {
  const botao = evento.target.closest("button[data-action]");
  if (!botao) return;

  const id = Number(botao.dataset.id);
  if (botao.dataset.action === "edit") abrirModal(id);
  if (botao.dataset.action === "delete") excluirAgendamento(id);
});

elementos.form.addEventListener("submit", evento => {
  evento.preventDefault();

  const id = Number(document.getElementById("editId").value);
  const agendamento = agendamentos.find(a => a.id === id);
  if (!agendamento) return;

  const data = document.getElementById("editDate").value;
  const hora = document.getElementById("editTime").value;

  if (!data || !hora) {
    mostrarMensagem("Preencha a data e o horário.");
    return;
  }

  Object.assign(agendamento, {
    paciente: document.getElementById("editPatient").value.trim(),
    medico: document.getElementById("editDoctor").value.trim(),
    especialidade: document.getElementById("editSpecialty").value.trim(),
    data,
    hora,
    status: document.getElementById("editStatus").value,
    telefone: document.getElementById("editPhone").value.trim()
  });

  salvarNoNavegador();
  renderizarAgendamentos();
  fecharModal();
  mostrarMensagem("Agendamento atualizado com sucesso!");
});

elementos.busca.addEventListener("input", renderizarAgendamentos);
elementos.filtro.addEventListener("change", renderizarAgendamentos);

document.querySelectorAll(".close-modal").forEach(botao => {
  botao.addEventListener("click", fecharModal);
});

elementos.modal.addEventListener("click", evento => {
  if (evento.target === elementos.modal) fecharModal();
});

document.addEventListener("keydown", evento => {
  if (evento.key === "Escape" && elementos.modal.classList.contains("open")) fecharModal();
});

renderizarAgendamentos();
