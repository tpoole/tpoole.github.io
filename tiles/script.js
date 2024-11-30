const imageData = [
    [ "https://img.tile.expert/img_lb/aleluia/color-art/per_sito/minimali/b_aleluia_color_art_pf011_color_art_yellow.webp?64", 30 ],
    [ "https://img.tile.expert/img_lb/aleluia/color-art/per_sito/minimali/b_aleluia_color_art_pf015_color_art_yellow_stripes.webp?64", 40 ],
    [ "https://img.tile.expert/img_lb/aleluia/color-art/per_sito/minimali/b_aleluia_color_art_pf014_color_art_white_stripes.webp?64", 30 ],
    [ "https://img.tile.expert/img_lb/aleluia/color-art/per_sito/minimali/b_aleluia_color_art_pm038_color_art_white.webp?64", 40 ],
    [ "https://img.tile.expert/img_lb/aleluia/color-art/per_sito/minimali/b_aleluia_color_art_pf016_color_art_green_stripes.webp?64", 30 ],
    [ "https://img.tile.expert/img_lb/aleluia/color-art/per_sito/minimali/b_aleluia_color_art_pf012_color_art_green.webp?64", 30, ],
    [ "https://img.tile.expert/img_lb/aleluia/color-art/per_sito/minimali/b_aleluia_color_art_pf017_color_art_blue_stripes.webp?64", 30, ],
    [ "https://img.tile.expert/img_lb/aleluia/color-art/per_sito/minimali/b_aleluia_color_art_pf013_color_art_blue.webp?64", 30, ],
];

const tilesContainer = document.getElementById("tiles");
const resetTilesAvailable = () => {
    tilesContainer.innerHTML = "";
    imageData.forEach((img, i) => {
        const container = tilesContainer.appendChild(document.createElement("div"));
        container.style = "display: inline-block;";
        const elem = container.appendChild(document.createElement("img"));
        elem.style = "width: 50px; margin: 5px;";
        elem.src = img[0];
        elem.id = `image-${i}`;
        const index = container.appendChild(document.createElement("p"));
        index.style = "text-align: center;";
        index.innerHTML = i;
        const remaining = container.appendChild(document.createElement("p"));
        remaining.id = `remaining-${i}`;
        remaining.style = "text-align: center; color: DarkRed";
        remaining.innerHTML = img[1];
    });
};
resetTilesAvailable();

const getRemaining = (index) => {
    const elem = document.getElementById(`remaining-${index}`)
    const remaining = parseInt(elem.innerHTML);
    return { elem, remaining };
};

const pickTile = (index) => {
    const { elem, remaining } = getRemaining(index);
    if (remaining === 0) return -1;
    elem.innerHTML = remaining - 1;
    return index;
};

const replaceTile = (index) => {
    const { elem, remaining } = getRemaining(index);
    elem.innerHTML = remaining + 1;
};

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const getImageElement = (index, rotation) => {
    return document.getElementById("tiles").childNodes[index].childNodes[0];
};

const selectedTile = { column: -1, row: -1 };
const resetSelectedTile = () => {
    selectedTile.column = -1;
    selectedTile.row = -1;
};

const gridWidth = 18;
const gridHeight = 13;

const renderCanvas = () => {
    const tileData = parseDataFromTextArea();
    if (!tileData[0][0]) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const tileSize = getTileSize();

    const getCoordFromLineIndex = (row, column) => {
        const offset = tileSize*row;
        const x = row < 5 ? offset : offset + tileSize;
        const y = tileSize*column;
        return { x, y };
    };

    for (let row = 0; row < gridHeight; row++) {
        for (let column = 0; column < gridWidth; column++) {
            const { x, y } = getCoordFromLineIndex(column, row);
            const [ index, rotation ] = [...tileData[row][column]];
            ctx.save(); 
            ctx.translate(x + tileSize/2, y + tileSize/2);
            ctx.rotate(rotation*Math.PI/2);
            ctx.translate(-tileSize/2, -tileSize/2); 
            const image = getImageElement(index, rotation);
            ctx.drawImage(image, 0, 0, tileSize, tileSize);
            if (row === selectedTile.row && column === selectedTile.column) {
                ctx.beginPath();
                ctx.strokeStyle = "red";
                ctx.rect(0, 0, tileSize, tileSize);
                ctx.stroke();
            }
            ctx.restore(); 
        }
    }
};

const getTileSize = () => {
    return canvas.width / (gridWidth + 1);
};

const resizeCanvas = () => {
    canvas.style = "width: 70%; margin: 5%";
    canvas.width = canvas.offsetWidth;
    const tileSize = getTileSize();
    canvas.height = tileSize*gridHeight;
    renderCanvas();
};
const observer = new ResizeObserver(resizeCanvas);
observer.observe(document.body);

const parseDataFromCondensed = () => {
    const elem = document.getElementById("condensed-data");
    const stringData = elem.value;
    let index = 0;
    const data = [[]];
    while (index < stringData.length) {
        data[data.length - 1].push(`${stringData[index]}${stringData[index + 1]}`);
        index += 2;
        if (index % (2*gridWidth) === 0) {
            data.push([]);
        }
    }
    return data;
};

const writeDataToCondensed = (inputData) => {
    const condensedData = document.getElementById("condensed-data");
    condensedData.value = inputData.map(row => row.join("")).join("");
};

const parseDataFromTextArea = () => {
    const elem = document.getElementById("data");
    return elem.value.trim().split("\n").map(row => row.split(" "));
};

const writeDataToTextArea = (inputData) => {
    const data = document.getElementById("data");
    data.value = inputData.map(row => row.join(" ")).join("\n");
};

const getIndexFromCoord = (tileSize, x, y) => {
    let [column, row] = [x, y].map(d => parseInt(d/tileSize));
    if (column == 5) return null;
    if (column > 5) column--;
    return { row, column };
};

canvas.addEventListener('mousedown', (event) => {
    const clicked = getIndexFromCoord(getTileSize(), event.offsetX, event.offsetY);
    if (!clicked) return;

    if (event.shiftKey) {
        const data = parseDataFromTextArea();
        const item = data[clicked.row][clicked.column];
        data[clicked.row][clicked.column] = `${item[0]}${(parseInt(item[1]) + 1)%4}`;
        writeDataToTextArea(data);
        writeDataToCondensed(data);
    } else if (selectedTile.column === -1) {
        selectedTile.column = clicked.column;
        selectedTile.row = clicked.row;
    } else {
        if (!(clicked.column === selectedTile.column && clicked.row === selectedTile.row)) {
            const data = parseDataFromTextArea();
            const tmp = data[selectedTile.row][selectedTile.column];
            data[selectedTile.row][selectedTile.column] = data[clicked.row][clicked.column];
            data[clicked.row][clicked.column] = tmp;
            writeDataToTextArea(data);
            writeDataToCondensed(data);
        }
        resetSelectedTile();
    }
    renderCanvas();
});

tilesContainer.addEventListener('mousedown', (event) => {
    if (selectedTile.x === -1) return;
});

const randomise = () => {
    resetTilesAvailable();
    const tileData = [[]];
    for (let row = 0; row < gridHeight; row++) {
        for (let column = 0; column < gridWidth; column++) {
            let imageIndex = -1;
            while (imageIndex === -1) {
                const randomIndex = Math.floor(Math.random() * imageData.length);
                imageIndex = pickTile(randomIndex);
            }
            const rotation = Math.floor(Math.random() * 4);
            tileData[row].push(`${imageIndex}${rotation}`);
        }
        tileData.push([]);
    };

    writeDataToTextArea(tileData);
    writeDataToCondensed(tileData);
    renderCanvas();
}

const useAllWhiteTiles = () => {
    const tileData = parseDataFromTextArea();

    const whiteTileIndex = 3;
    while (pickTile(whiteTileIndex) !== -1) {
        const randomRow = Math.floor(Math.random() * gridHeight);
        const randomColumn = Math.floor(Math.random() * gridWidth);
        replaceTile(tileData[randomRow][randomColumn][0]);
        tileData[randomRow][randomColumn] = `${whiteTileIndex}${tileData[randomRow][randomColumn][1]}`;
    }

    writeDataToTextArea(tileData);
    renderCanvas();
}

const renderCondesnsed = () => {
    const data = parseDataFromCondensed();
    writeDataToTextArea(data);
    renderTextArea();
}

const renderTextArea = () => {
    const tileData = parseDataFromTextArea();
    writeDataToCondensed(tileData);
    resetTilesAvailable();
    tileData.forEach(rowData => {
        rowData.forEach(tileData => {
            const tileIndex = tileData[0];
            if (pickTile(tileIndex) === -1) {
                alert(`You have run out of tile ${tileIndex}`)
            }
        });
    });
    renderCanvas();
}

const controls = document.getElementById("controls");

const randomiseButton = controls.appendChild(document.createElement("button"));
randomiseButton.innerHTML = "Randomise";
randomiseButton.onclick = () => { randomise() };

controls.appendChild(document.createElement("br"));

const whiteButton = controls.appendChild(document.createElement("button"));
whiteButton.innerHTML = "Randomly add all white tiles";
whiteButton.onclick = () => { useAllWhiteTiles() };

controls.appendChild(document.createElement("br"));

const condensedDataDesc = controls.appendChild(document.createElement("p"));
condensedDataDesc.innerHTML = "Condensed data";
const condensedData = controls.appendChild(document.createElement("input"));
condensedData.id = "condensed-data";

controls.appendChild(document.createElement("br"));

const condensedButton = controls.appendChild(document.createElement("button"));
condensedButton.innerHTML = "Render condensed data";
condensedButton.onclick = () => { renderCondesnsed() };

const dataDesc = controls.appendChild(document.createElement("p"));
dataDesc.innerHTML = "Data (first number is tile index, second number is { 0, 1, 2, 3 } for rotation)";
const data = controls.appendChild(document.createElement("textarea"));
data.id = "data";
const style = window.getComputedStyle(data, null).getPropertyValue('font-size');
var fontSize = parseFloat(style); 
data.style = `width: 80%; height: ${Math.round(parseFloat(style)*gridHeight*1.3)}px`;

controls.appendChild(document.createElement("br"));

const textAreaButton = controls.appendChild(document.createElement("button"));
textAreaButton.innerHTML = "Render data";
textAreaButton.onclick = () => { renderTextArea() };
