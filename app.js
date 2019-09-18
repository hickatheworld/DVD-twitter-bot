const { createCanvas, loadImage } = require("canvas");
const GIFEncoder = require("gifencoder");
const colors = require("colors");
const fs = require("fs");

const save = require("./save.json");

const GifDimensions = [800, 600];
const LogoDimensions = [225, 129];

var coordinates = [save.coordinates.x || random(0, GifDimensions[0] - LogoDimensions[0]), save.coordinates.y || random(0, GifDimensions[1] - LogoDimensions[1])];
var speed = [save.speed.x || 5, save.speed.y || 5];

var edgeHits = save.edgeHits || 0;
var cornerHits = save.cornerHits || 0;

const canvas = createCanvas(GifDimensions[0], GifDimensions[1]);
const ctx = canvas.getContext("2d");

var DVDLogo;

loadImage("./img/dvdlogo.png").then(img => {
    DVDLogo = img;
}).then(function () {
    encodeGif(60);
});


function draw() {
    ctx.fillRect(0, 0, GifDimensions[0], GifDimensions[1]);
    ctx.drawImage(DVDLogo, coordinates[0], coordinates[1], LogoDimensions[0], LogoDimensions[1]);

    coordinates[0] += speed[0];
    coordinates[1] += speed[1];

    let hits = 0;

    if (coordinates[0] + LogoDimensions[0] >= GifDimensions[0] || coordinates[0] <= 0) {
        speed[0] = -speed[0];
        hits++;
    }
    if (coordinates[1] + LogoDimensions[1] >= GifDimensions[1] || coordinates[1] <= 0) {
        speed[1] = -speed[1];
        hits++;
    }
    if (hits == 2) {
        cornerHits++;
    }
    else if (hits == 1) {
        edgeHits++;
    }
}

function encodeGif(images) {
    let encoder = new GIFEncoder(GifDimensions[0], GifDimensions[1]);
    encoder.createReadStream().pipe(fs.createWriteStream("./img/rendered.gif"));
    encoder.setDelay(0);
    encoder.start();

    var firstTimestamp = lastTimestamp = Date.now();

    for (let x = 0; x < images; x++) {
        draw();
        encoder.addFrame(ctx);
        console.log(`Add new frame (${colors.red(`${x + 1} / ${images}`)}), took ${colors.bgYellow(Date.now() - lastTimestamp + "ms")} from the last one.`);
        lastTimestamp = Date.now();
    }
    encoder.finish();
    console.log(`Fully encoded new gif, took ${colors.bgYellow(Date.now() - firstTimestamp + "ms")}.`);
    saveData();
}


function saveData() {
    let _save = {
        coordinates: {
            x: coordinates[0],
            y: coordinates[1]
        },
        speed: {
            x: speed[0],
            y: speed[1]
        },
        cornerHits: cornerHits,
        edgeHits: edgeHits
    }

    fs.writeFile("save.json", JSON.stringify(_save), "utf8", function (err) {
        if (err) {
            console.log(colors.bgRed.white("An error occured : "))
            console.log(colors.bgRed.white(err));
            return;
        }
        console.log(`\nSaved new data : Coos. : [${colors.blue(_save.coordinates.x)},${colors.blue(_save.coordinates.y)}]
            \nSpeed : [${colors.blue(_save.speed.x)},${colors.blue(_save.speed.y)}]
            \nCorner hits : ${colors.blue(_save.cornerHits)} | Edge hits : ${colors.blue(_save.edgeHits)}
        `);
    });
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}