const inputDiametro = document.getElementById('diametro');
const selectForma = document.getElementById('forma');
const selectTipo = document.getElementById('tipo');
const poly = document.getElementById('hexagono');
const labelsContainer = document.getElementById('labels');

/**
 * Raio utilizado visualmente no SVG para manter o desenho em uma escala confortável
 * @type {number}
 */
const RAIO_VISUAL = 80;

/**
 * Calcula os parâmetros geométricos (seno, cosseno e raio real)
 * com base no diâmetro, forma e tipo de usinagem.
 * Atualiza os valores na interface e redesenha a representação no SVG.
 */
function calcular() {
    const d = parseFloat(inputDiametro.value) || 0;
    const lados = parseInt(selectForma.value);
    const tipo = selectTipo.value;

    // Cálculos trigonométricos baseados na geometria
    const anguloPasso = (360 / lados) * Math.PI / 180;
    const anguloMeio = anguloPasso / 2;

    document.getElementById('valSeno').textContent = Math.sin(anguloMeio).toFixed(4);
    document.getElementById('valCosseno').textContent = Math.cos(anguloMeio).toFixed(4);

    // Definição do raio do círculo circunscrito (que passa pelos vértices)
    let raio;
    if (tipo === 'externa') {
        // Na externa, o diâmetro nominal toca os vértices
        raio = d / 2;
    } else {
        // Na interna, o diâmetro nominal toca o centro das faces (apótema)
        // R = r / cos(180/n)
        raio = (d / 2) / Math.cos(Math.PI / lados);
    }

    document.getElementById('valRaio').textContent = raio.toFixed(2);

    // Limpar labels antigos
    labelsContainer.innerHTML = '';

    // Define a rotação inicial: 45° para quadrado, 90° para sextavado (45 original + 45 solicitado)
    const rotacaoBase = (lados === 6) ? 90 : 45;

    // Gerar pontos e labels
    let pontos = "";
    for (let i = 0; i < lados; i++) {
        // Ângulo base distribuído pelos lados + a rotação específica da forma
        const anguloDeg = (i * (360 / lados)) + rotacaoBase;
        const anguloRad = anguloDeg * Math.PI / 180;

        // Coordenadas para o desenho (estáticas)
        const x_vis = 200 + RAIO_VISUAL * Math.cos(anguloRad);
        const y_vis = 200 + RAIO_VISUAL * Math.sin(anguloRad);
        pontos += `${x_vis},${y_vis} `;

        // Coordenadas reais calculadas (para exibição nos pontos)
        const x_real = raio * Math.cos(anguloRad);
        const y_real = raio * Math.sin(anguloRad);

        // Adicionar label de coordenada no SVG
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");

        // Alinhamento inteligente baseado na posição do ponto
        if (Math.abs(x_vis - 200) < 1) {
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("x", x_vis);
        } else {
            label.setAttribute("text-anchor", x_vis > 200 ? "start" : "end");
            label.setAttribute("x", x_vis > 200 ? x_vis + 12 : x_vis - 12);
        }

        // Ajuste vertical para não sobrepor a linha
        label.setAttribute("y", y_vis > 200 ? y_vis + 22 : y_vis - 12);

        label.textContent = `X:${x_real.toFixed(2)} Y:${y_real.toFixed(2)}`;
        labelsContainer.appendChild(label);
    }

    poly.setAttribute('points', pontos.trim());
}

// Elementos Adicionais
const modalInfo = document.getElementById('modalInfo');
const conteudoTexto = document.getElementById('conteudoTexto');

// 1. Animação do Botão Hambúrguer e Menu
botaoMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdownMenu.classList.toggle('show');
    botaoMenu.classList.toggle('open', isOpen); // Adiciona/remove classe para animação
});

// Ajuste no clique fora para resetar o botão
window.addEventListener('click', () => {
    dropdownMenu.classList.remove('show');
    botaoMenu.classList.remove('open');
});

// 2. Lógica PWA (Instalação)
let deferredPrompt;
// Escondido por padrão
menuInstalar.style.display = 'none';

window.addEventListener('beforeinstallprompt', (e) => {
    // Detecta se é dispositivo móvel (Android/iOS)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
        e.preventDefault();
        deferredPrompt = e;
        menuInstalar.style.display = 'block';
    }
});

menuInstalar.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') menuInstalar.style.display = 'none';
        deferredPrompt = null;
    }
});

// 3. Função "Como Usar" - Lendo arquivo .txt
menuComoUsar.addEventListener('click', async (e) => {
    e.preventDefault();
    dropdownMenu.classList.remove('show');
    botaoMenu.classList.remove('open');

    try {
        const response = await fetch('info.txt');
        let texto = await response.text();

        // Adiciona a versão no final do texto
        texto += `\n\n-------------------\nVersão: 1.0.1`;

        conteudoTexto.innerText = texto;
        modalInfo.style.display = 'flex';
    } catch (error) {
        conteudoTexto.innerText = "Erro ao carregar instruções. Verifique o arquivo info.txt.";
        modalInfo.style.display = 'flex';
    }
});

function fecharModal() {
    modalInfo.style.display = 'none';
}

// Escuta o evento de sucesso quando a instalação é concluída
window.addEventListener('appinstalled', () => {
    menuInstalar.style.display = 'none';
    deferredPrompt = null;
    console.log('PWA instalada com sucesso!');
});

// Oculta opção caso abra diretamente no modo standalone
if (window.matchMedia('(display-mode: standalone)').matches) {
    menuInstalar.style.display = 'none';
}

// Listeners para atualização em tempo real
[inputDiametro, selectForma, selectTipo].forEach(el => {
    el.addEventListener('input', calcular);
});

// Atualizar ano no rodapé
document.getElementById('currentYear').textContent = new Date().getFullYear();

// Cálculo inicial
calcular();

/**
 * Registra o Service Worker para habilitar funcionalidades PWA offline
 * e permitir que o evento beforeinstallprompt seja disparado.
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado com sucesso:', reg.scope))
            .catch(err => console.error('Falha ao registrar Service Worker:', err));
    });
}