let fazendas = JSON.parse(localStorage.getItem("fazendas")) || [];
let producoes = JSON.parse(localStorage.getItem("producoes")) || [];

const fazendaForm = document.getElementById("fazendaForm");
const producaoForm = document.getElementById("producaoForm");
const fazendaSelect = document.getElementById("fazendaSelect");
const tabelaBody = document.querySelector("#tabela tbody");
const fazendaMessage = document.getElementById("fazendaMessage");
const producaoMessage = document.getElementById("producaoMessage");
const graficoCanvas = document.getElementById("grafico").getContext("2d");
let chart;

// Fatores por tipo de cana
const fatoresCana = {
  "RB867515": { acucar: 120, etanol: 70 },
  "IAC": { acucar: 100, etanol: 60 },
  "CTC": { acucar: 110, etanol: 65 }
};

// Atualiza select de fazendas
function atualizarSelect() {
  fazendaSelect.innerHTML = "";
  fazendas.forEach(f => {
    const option = document.createElement("option");
    option.value = f.nome;
    option.textContent = f.nome;
    fazendaSelect.appendChild(option);
  });
}

// Função para excluir fazenda
function excluirFazenda(nome) {
  fazendas = fazendas.filter(f => f.nome !== nome);
  producoes = producoes.filter(p => p.fazenda !== nome);
  localStorage.setItem("fazendas", JSON.stringify(fazendas));
  localStorage.setItem("producoes", JSON.stringify(producoes));
  atualizarSelect();
  renderTabela();
}

// Renderiza tabela
function renderTabela() {
  tabelaBody.innerHTML = "";
  fazendas.forEach(fazenda => {
    const producoesFazenda = producoes.filter(p => p.fazenda === fazenda.nome);
    const totalToneladas = producoesFazenda.reduce((acc,p)=>acc+p.toneladas,0);
    const totalAcucar = producoesFazenda.reduce((acc,p)=>acc+p.acucar,0);
    const totalEtanol = producoesFazenda.reduce((acc,p)=>acc+p.etanol,0);
    const totalCo2 = producoesFazenda.reduce((acc,p)=>acc+p.co2,0);
    const totalEnergia = producoesFazenda.reduce((acc,p)=>acc+p.energia,0);
    const produtividade = (totalToneladas / fazenda.hectares || 0).toFixed(2);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${fazenda.nome}</td>
      <td>${fazenda.hectares}</td>
      <td>${produtividade}</td>
      <td>${totalAcucar}</td>
      <td>${totalEtanol}</td>
      <td>${totalCo2}</td>
      <td>${totalEnergia}</td>
      <td><button class="excluir-btn" onclick="excluirFazenda('${fazenda.nome}')">🗑️</button></td>
    `;
    tabelaBody.appendChild(row);
  });
  renderGrafico();
}

// Renderiza gráfico
function renderGrafico() {
  const labels = producoes.map(p=>p.fazenda);
  const dados = producoes.map(p=>p.toneladas);

  if(chart) chart.destroy();
  chart = new Chart(graficoCanvas, {
    type:'bar',
    data:{
      labels:labels,
      datasets:[{
        label:'Produção (t)',
        data:dados,
        backgroundColor:'#00a65a'
      }]
    },
    options:{responsive:true}
  });
}

// Evento de cadastro de fazenda (COM VALIDAÇÃO DE DUPLICADA)
fazendaForm.addEventListener("submit", e => {
  e.preventDefault();

  const nome = document.getElementById("nomeFazenda").value.trim();
  const hectares = parseFloat(document.getElementById("hectares").value);
  const tipoCana = document.getElementById("tipoCana").value;
  const umidade = parseFloat(document.getElementById("umidade").value);

  if(!nome || !hectares || !tipoCana || !umidade){
    fazendaMessage.textContent = "Preencha todos os campos!";
    fazendaMessage.style.color = "#e53935"; // vermelho para erro
    return;
  }

  // VALIDAÇÃO: fazenda já cadastrada
  const fazendaExistente = fazendas.find(f => f.nome.toLowerCase() === nome.toLowerCase());
  if(fazendaExistente){
    fazendaMessage.textContent = `A fazenda "${nome}" já está cadastrada!`;
    fazendaMessage.style.color = "#e53935"; // vermelho
    return;
  }

  // Cadastrar fazenda
  fazendas.push({nome, hectares, tipoCana, umidade});
  localStorage.setItem("fazendas", JSON.stringify(fazendas));
  fazendaForm.reset();
  atualizarSelect();
  renderTabela();

  fazendaMessage.textContent = `Fazenda "${nome}" cadastrada com sucesso!`;
  fazendaMessage.style.color = "#006837"; // verde para sucesso
});

// Evento de registro de produção
producaoForm.addEventListener("submit", e=>{
  e.preventDefault();
  const fazendaNome = fazendaSelect.value;
  const toneladas = parseFloat(document.getElementById("toneladas").value);
  if(!fazendaNome||!toneladas){
    producaoMessage.textContent="Preencha todos os campos!";
    producaoMessage.style.color="#e53935";
    return;
  }

  const fazenda = fazendas.find(f=>f.nome===fazendaNome);
  const acucar = Math.round(toneladas * fatoresCana[fazenda.tipoCana].acucar);
  const etanol = Math.round(toneladas * fatoresCana[fazenda.tipoCana].etanol);
  const co2 = Math.round(etanol * 2.3);
  const energia = Math.round(toneladas * 0.3);

  producoes.push({fazenda:fazendaNome,hectares:fazenda.hectares,toneladas,acucar,etanol,co2,energia});
  localStorage.setItem("producoes",JSON.stringify(producoes));
  producaoForm.reset();
  renderTabela();
  producaoMessage.textContent=`Produção registrada para "${fazendaNome}"!`;
  producaoMessage.style.color="#006837";
});

// Inicialização
atualizarSelect();
renderTabela();
