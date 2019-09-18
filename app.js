const { createCanvas, loadImage } = require("canvas");
const GIFEncoder = require("gifencoder");
const colors = require("colors");
const fs = require("fs");
const twit = require("twit");
const config = require("./config.js");

const T = new twit(config);

const GifDimensions = [800, 600];
const LogoDimensions = [225, 129];

try {
    var save = JSON.parse(fs.readFileSync("./save.json"));
    if (typeof save.coordinates.x == "undefined" || typeof save.coordinates.y == "undefined" || typeof save.speed.x == "undefined" || typeof save.speed.y == "undefined" || typeof save.cornerHits == "undefined" || typeof save.cornerHits == "undefined")
        throw Error();
} catch (e) {
    var save = {
        "coordinates": { x: random(0, GifDimensions[0] - LogoDimensions[0]), y: random(0, GifDimensions[1] - LogoDimensions[1]) },
        "speed": { x: 5, y: 5 },
        "cornerHits": 0,
        "edgeHits": 0
    }
    console.log(colors.bgBlue.white("Created a new save."));
} finally {
    var coordinates = [save.coordinates.x, save.coordinates.y];
    var speed = [save.speed.x, save.speed.y];
    var edgeHits = save.edgeHits;
}


var edgeHits = save.edgeHits || 0;
var cornerHits = save.cornerHits || 0;

const canvas = createCanvas(GifDimensions[0], GifDimensions[1]);
const ctx = canvas.getContext("2d");

var DVDLogo;

loadImage("./img/dvdlogo.png").then(img => {
    DVDLogo = img;
}).then(function () {
    console.log(colors.bgRed.red.white("Started interval"));
    encodeGif(100);
    setInterval(function () {
        encodeGif(100);
    }, 30 * 60000);
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
    setTimeout(postGif, 1000);
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
        console.log(`\n${colors.bgBlue.white("Saved new data")} : Coos. : [${colors.blue(_save.coordinates.x)},${colors.blue(_save.coordinates.y)}]
            \nSpeed : [${colors.blue(_save.speed.x)},${colors.blue(_save.speed.y)}]
            \nCorner hits : ${colors.blue(_save.cornerHits)} | Edge hits : ${colors.blue(_save.edgeHits)}
        `);
    });
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function postGif() {
    var b64content = fs.readFileSync('./img/rendered.gif', { encoding: 'base64' });
    T.post("media/upload", { media_data: b64content }, function (err, data, response) {
        if (err) { console.log(error); }
        var mediaIdstr = data.media_id_string;
        var altText = "Bounce lol";
        var meta_params = { media_id: mediaIdstr, alt_text: { text: altText } };
        T.post("media/metadata/create", meta_params, function (err, data, response) {
            if (err) console.log(err);
            if (!err) {
                var params = { status: `Edge hits : ${edgeHits}\nCorner hits : ${cornerHits}`, media_ids: [mediaIdstr] };

                T.post("statuses/update", params, function (err, data, response) {
                    console.log(colors.bgCyan.white("Tweet posted"));
                });
            }
        });

    });

}
