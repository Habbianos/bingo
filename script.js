// Popula o optgroup com as fontes carregadas (usando document.fonts)
document.addEventListener('DOMContentLoaded', async () => {
    const loadedOptgroup = document.getElementById('loadedFontsOptgroup');
	const faktos = new FontFace('Faktos', 'url(/fonts/Faktos.ttf)');
	await faktos.load().then((font) => {
		document.fonts.add(font)
	})
    if (document.fonts && typeof document.fonts.forEach === 'function') {
        const loadedFonts = new Set();
        document.fonts.forEach(fontFace => {
            let family = fontFace.family;
            // Remove as aspas, se houver
            if (family.startsWith('"') && family.endsWith('"')) {
                family = family.slice(1, -1);
            }
            loadedFonts.add(family);
        });
		let selected = false
        loadedFonts.forEach(family => {
            const option = document.createElement('option');
            option.value = family;
            option.textContent = family;
			option.selected = selected == false
			selected = true
            loadedOptgroup.appendChild(option);
        });
    }
});

async function downloadAll(btn) {
	const initialText = btn.innerHTML
	btn.innerHTML = "Processando..."
    const canvases = document.querySelectorAll('#downloadLinks canvas');
    if (canvases.length === 0) {
        alert('Gere as cartelas primeiro!');
		btn.innerHTML = initialText
        return;
    }
    const zip = new JSZip();
    
    for (let i = 0; i < canvases.length; i++) {
        const blob = await new Promise(resolve => canvases[i].toBlob(resolve, 'image/png'));
        zip.file(`cartela-${i + 1}.png`, blob);
		btn.innerHTML = `Processando ${i+1}/${canvases.length}...`
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.download = 'cartelas-bingo.zip';
    link.href = URL.createObjectURL(content);
    link.click();
	btn.innerHTML = initialText
}

// Atualize o event listener do file input
document.getElementById('bgImage').addEventListener('change', function(e) {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Atualizar dimensões da imagem
            document.getElementById('bgWidth').value = img.width;
            document.getElementById('bgHeight').value = img.height;
            
            // Calcular valores padrão
            const maxWidth = img.width;
            const maxHeight = img.height;
            
            // Atualizar limites dos inputs
			document.getElementById('gridWidth').max = maxWidth
            document.getElementById('maxGridWidth').textContent = maxWidth;
            document.getElementById('gridHeight').max = maxHeight;
            document.getElementById('maxGridHeight').textContent = maxHeight;
            
            // Definir valores padrão
            const gridWidth = Math.min(480, maxWidth);
            const gridHeight = Math.min(480, maxHeight);
            
            document.getElementById('gridWidth').value = gridWidth;
            document.getElementById('gridHeight').value = gridHeight;
            
            // Atualizar células
            updateCellSize();
            updateOffsets();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// Funções para atualizar valores
function updateCellSize() {
    const gridWidth = document.getElementById('gridWidth').value;
    const gridHeight = document.getElementById('gridHeight').value;
    
    document.getElementById('cellWidth').value = Math.floor(gridWidth / 5);
    document.getElementById('cellHeight').value = Math.floor(gridHeight / 5);
}

function updateOffsets() {
    const bgWidth = document.getElementById('bgWidth').value;
    const bgHeight = document.getElementById('bgHeight').value;
    const gridWidth = document.getElementById('gridWidth').value;
    const gridHeight = document.getElementById('gridHeight').value;
            
	// Atualizar limites dos inputs
    document.getElementById('offsetX').max = bgWidth - gridWidth;
	document.getElementById('maxOffsetX').textContent = bgWidth - gridWidth;
    document.getElementById('offsetY').max = bgHeight - gridHeight;
	document.getElementById('maxOffsetY').textContent = bgHeight - gridHeight;
    
    document.getElementById('offsetX').value = Math.min(bgWidth - gridWidth, 58);
    document.getElementById('offsetY').value = Math.min(bgHeight - gridHeight, 174);
}

// Adicione event listeners para os inputs
document.getElementById('gridWidth').addEventListener('input', function() {
    this.value = Math.min(this.value, document.getElementById('bgWidth').value);
    updateCellSize();
    updateOffsets();
});

document.getElementById('gridHeight').addEventListener('input', function() {
    this.value = Math.min(this.value, document.getElementById('bgHeight').value);
    updateCellSize();
    updateOffsets();
});

function generateCards() {
	const maxNumber = parseInt(document.getElementById('maxNumber').value);
	if (maxNumber % 5 !== 0 || maxNumber < 25) {
		alert('O número máximo deve ser múltiplo de 5 e no mínimo 25.');
		return;
	}

	const numCards = parseInt(document.getElementById('numCards').value);
	if (numCards < 1) {
		alert('O número de cartelas deve ser pelo menos 1');
		return;
	}

	const fileInput = document.getElementById('bgImage');
	if (fileInput.files.length === 0) {
		alert('Selecione uma imagem de fundo.');
		return;
	}

	const file = fileInput.files[0];
	const reader = new FileReader();

	reader.onload = function(e) {
		const bgImage = new Image();
		bgImage.onload = function() {
			document.getElementById('downloadLinks').innerHTML = '';
			for (let i = 0; i < numCards; i++) {
				const cardData = generateBingoCard(maxNumber);
				createCanvasCard(bgImage, cardData, i + 1);
			}
		};
		bgImage.onerror = function() {
			alert('Erro ao carregar a imagem de fundo.');
		};
		bgImage.src = e.target.result;
	};

	reader.readAsDataURL(file);
}

function generateBingoCard(maxNumber) {
	const numbersPerColumn = maxNumber / 5;
	const columns = [];

	for (let col = 0; col < 5; col++) {
		const start = col * numbersPerColumn + 1;
		const end = (col + 1) * numbersPerColumn;
		let numbers;

		if (col === 2) { // Coluna do meio (N)
			numbers = generateUniqueNumbers(start, end, 4);
			numbers.sort((a, b) => a - b);
			numbers.splice(2, 0, ''); // Espaço livre no centro
		} else {
			numbers = generateUniqueNumbers(start, end, 5);
			numbers.sort((a, b) => a - b);
		}

		columns.push(numbers);
	}
	return columns;
}

function generateUniqueNumbers(start, end, count) {
	const numbers = new Set();
	while (numbers.size < count) {
		const num = Math.floor(Math.random() * (end - start + 1)) + start;
		numbers.add(num);
	}
	return Array.from(numbers);
}

function createCanvasCard(bgImage, cardData, cardNumber) {
    const bgWidth = document.getElementById('bgWidth').value;
    const bgHeight = document.getElementById('bgHeight').value;
	
	const canvas = document.createElement('canvas');
	canvas.width = bgWidth;
	canvas.height = bgHeight;
	const ctx = canvas.getContext('2d');

	// Desenhar fundo
	ctx.drawImage(bgImage, 0, 0, bgWidth, bgHeight);

	// Configurar estilo
	ctx.strokeStyle = '#000';
	ctx.lineWidth = 2;
	// Recuperar as configurações de fonte dos novos campos:
    const fontSize = parseInt(document.getElementById('fontSize').value, 10) || 40;
    const fontFamily = document.getElementById('fontFamily').value || 'Faktos';
    const fontStyleSelect = document.getElementById('fontStyle');
    const selectedStyles = Array.from(fontStyleSelect.selectedOptions)
                                .map(opt => opt.value)
                                .join(' ');
    // Monta a propriedade font (ex: "italic bold 40px Arial")
	ctx.font = `${selectedStyles} ${fontSize}px ${fontFamily}`.trim();
	ctx.textAlign = 'center';

	// Desenhar grade
	// const cellWidth = 96
	// const cellHeight = 96
	
	// const originX = 58
	// const originY = 174
	
	const gridWidth = parseInt(document.getElementById('gridWidth').value);
    const gridHeight = parseInt(document.getElementById('gridHeight').value);
    const cellWidth = gridWidth / 5;
    const cellHeight = gridHeight / 5;
    const originX = parseInt(document.getElementById('offsetX').value);
    const originY = parseInt(document.getElementById('offsetY').value);

	for (let i = 0; i <= 5; i++) {
		// Linhas verticais
		ctx.beginPath();
		ctx.moveTo(originX + i * cellWidth, originY);
		ctx.lineTo(originX + i * cellWidth, originY + cellHeight * 5);
		ctx.stroke();

		// Linhas horizontais
		ctx.beginPath();
		ctx.moveTo(originX, originY + i * cellHeight);
		ctx.lineTo(originX + cellWidth * 5, originY + i * cellHeight);
		ctx.stroke();
	}

	// Preencher números
	for (let col = 0; col < 5; col++) {
		for (let row = 0; row < 5; row++) {
			const text = cardData[col][row];
			const x = originX + col * cellWidth + cellWidth / 2;

			// const y = originY + row * cellHeight + cellHeight / 2;
			const metrics = ctx.measureText(text);
			const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

			const y = originY + row * cellHeight + cellHeight / 2 + (textHeight / 2);

			ctx.fillStyle = (col === 2 && row === 2) ? '#FF0000' : '#000';
			ctx.fillText(text, x, y);
		}
	}

	// Criar link para download
	const link = document.createElement('a');
	link.download = `bingo-card-${cardNumber}.png`;
	link.href = canvas.toDataURL('image/png');
	link.textContent = `Baixar Cartela ${cardNumber}`;
	document.getElementById('downloadLinks').appendChild(link);
	document.getElementById('downloadLinks').appendChild(canvas);
	document.getElementById('downloadLinks').appendChild(document.createElement('br'));
}