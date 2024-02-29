console.log('Script Started');

const framesPerSecond = 4;
const image_scale = 1;
const canvas_scale = 2;
const fileType = 7;
const max_precision = 2 ** 16 - 1;
const room = 2;

var is_drawing = false;
var is_tracking = false;
var has_drawn = false;
var is_reversed = false;

var prevCoords = { x: 0, y: 0 };
var coords = { x: 0, y: 0 };

var fileDate;
var points = [];
var lastPoint;
var unusedPoints = 0;
var drawIter = 0;
var userType = 0;
var userNum = 0;

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var bounds = canvas.getBoundingClientRect()
ctx.canvas.width = bounds.width * canvas_scale;
ctx.canvas.height = bounds.height * canvas_scale;
ctx.strokeStyle = "magenta";
ctx.lineWidth = 1;

var events = ['Discussed', 'Photo', 'Booklet'];
var event_codes = ['DI', 'PH', 'BL'];

var userType_codes = ['Browser', 'Completionist', 'Goal Oriented', 'Pass Through'];

canvas.addEventListener("mousedown", start, false);
window.addEventListener('mouseup', end, false);
canvas.addEventListener("mousemove", setCoords, false);

canvas.addEventListener('touchstart', touch(start), false);
canvas.addEventListener('touchend', touch(end), false);
canvas.addEventListener('touchmove', touch(setCoords), false);


function start(e) {
    console.log('start drawing');
    is_drawing = true;
    setCoords(e);
    //console.log(coords);
    if (!is_tracking) {
        drawIter = setInterval(draw, 1000 / framesPerSecond);
        draw();
    }
    
}

function end(e) {
    console.log('end drawing');
    is_drawing = false;
}

function setCoords(e) {
    var bounds = canvas.getBoundingClientRect();

    var x_shift = 1 / 2 - 1 / 2 / image_scale;
    var x = (e.pageX - bounds.left) / bounds.width;
    var y = (e.pageY - bounds.top) / bounds.height;
    if (is_reversed) {
        x = 1 - x;
        y = 1 - y;
    }

    coords = {
        x: Math.floor(clamp(x / image_scale + x_shift, 0, 1 - Number.EPSILON) * max_precision),
        y: Math.floor(clamp(y, 0, 1 - Number.EPSILON) * max_precision)
    }
}

function onUserChange(e) {
    userNum = parseInt(e.value);
}

function reverse(self) {
    is_reversed = !is_reversed;
    var image = canvas.parentElement;
    if (is_reversed) {
        image.classList.add("reverse");
        self.classList.add("green");
    } else {
        image.classList.remove("reverse");
        self.classList.remove("green");
    }
}

function draw() {
    if (is_drawing) {
        if (!is_tracking) {
            is_tracking = true;
            startLog();
            startTrack();
            run_type(0);
        }
        drawPoint();
    } else if (is_tracking) {
        unusedPoints++;
        document.getElementById("plus").innerHTML = `Plus ${unusedPoints} more`;
        data.parentElement.scrollBy(0, 1000);
    }
}

function startLog() {
    fileDate = new Date();
    prevCoords = coords;
    // document.getElementById("title").innerHTML =
    //     "Data for person starting at " +
    //     formatDate(fileDate, " - ");
    document.getElementById("data").innerHTML = "";
    addLog(`fileType: ${fileType}`);
    addLog(`start: ${formatDate(fileDate, " - ", 1)}`);
    addLog(`frames: ${framesPerSecond}`);
    addLog(`room: ${room}`);
    addLog(`userNum: ${userNum}`);
}

function startTrack() {
    unusedPoints = 0;
    points = [];
    userType = 0;
    var screenCoords = toScreenCoords(coords);
    ctx.closePath();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.moveTo(screenCoords.x, screenCoords.y);
    ctx.beginPath();
}

function addLog(log) {
    document.getElementById("data").innerHTML += `<log>${log}</log>`;
    data.parentElement.scrollBy(0, 100);
}

function logPoint() {
    addLog(`(${lastPoint.x / max_precision},${lastPoint.y / max_precision}),`);
    points.push([lastPoint.x, lastPoint.y]);
}

function addPointBackLog() {
    var str = '';
    for (var j = 0; j < unusedPoints; j++) {
        str += `<log>${lastPoint.x / max_precision},${lastPoint.y / max_precision}),</log>`;
        points.push([lastPoint.x, lastPoint.y]);
    }
    document.getElementById("data").innerHTML += str;
    data.parentElement.scrollBy(0, unusedPoints * 100);
    unusedPoints = 0;
    document.getElementById("plus").innerHTML = "";
}

function drawPoint() {
    addPointBackLog();
    lastPoint = coords;
    logPoint();
    //console.log(mouse);
    var screenCoords = toScreenCoords(coords);
    ctx.lineTo(screenCoords.x, screenCoords.y);
    ctx.stroke();
}

function toScreenCoords(coords) {
    var x_shift = 1 / 2 - 1 / 2 / image_scale;
    return {
        x: (coords.x / max_precision - x_shift) * image_scale * canvas.clientWidth * canvas_scale,
        y: coords.y / max_precision * canvas.clientHeight * canvas_scale
    };
}

function clamp(num, min, max) {
    return num < min
        ? min
        : num > max
            ? max
            : num;
}

function touch(func) {
    return e => {
        func(e.touches[0]);
        e.preventDefault();
    }
}
function getDateData(date, millis = false) {
    var datas = [date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()]
    if (millis) {
        datas.push(date.getMilliseconds());
    }
    return datas;
}
function formatDate(date, delim, millis = false) {
    var datas = getDateData(date, millis);
    var str = "";
    var delimenator = "";
    for (let j in datas) {
        str += delimenator;
        str += datas[j];
        delimenator = delim;
    }
    return str;
}

function run_event(e) {
    console.log(`add event ${e}`);
    if (e == 0) {
        download();
    } else if (is_tracking) {
        addLog(`[${events[e - 1]}],`);
        points.push(event_codes[e - 1]);
    }

}
function run_type(e) {
    console.log(`add type ${e}`);
    var types = [...document.getElementById("types").children];
    for (j in types) {
        if (j == e) {
            types[j].classList.add("green");
        } else {
            types[j].classList.remove("green");
        }
    }
    if (is_tracking) {
        userType = parseInt(e);
        addLog(`{${userType_codes[userType]}}`);
    }
}

function downloadMetadata(fileData) {
    var text = new TextEncoder().encode("Natenli");
    var fileTimeData = getDateData(fileDate, 1);
    fileData.set(text);
    fileData[7] = fileType;
    fileData[8] = framesPerSecond;
    fileData[9] = userNum & 0xff;
    fileData[10] = userNum >> 8 & 0xff;
    fileData[11] = ((room - 1) & 3) << 6 | (userType & 3) << 4 | (fileTimeData[0] & 0xf);
    var timeMeta = new Uint32Array(1);
    timeMeta[0] |= (fileTimeData[1] & 0x1f) << 0x1b;
    timeMeta[0] |= (fileTimeData[2] & 0x1f) << 0x16;
    timeMeta[0] |= (fileTimeData[3] & 0x3f) << 0x10;
    timeMeta[0] |= (fileTimeData[4] & 0x3f) << 10;
    timeMeta[0] |= fileTimeData[5] & 0x3ff;
    fileData.set(new Int8Array(timeMeta.buffer).reverse(), 12);
}


function downloadData(fileData) {
    var events = [];
    var first_point = true;
    var index = 16;
    for (var j = 0; j < points.length; j++) {
        if (typeof points[j] === 'string') {
            events.push(points[j]);
        } else {
            if (!first_point && events.length != 0) {
                var event = events.shift();
                fileData.set(new TextEncoder().encode(event), index + 2);
                index += 4;
            }
            fileData.set(new Int8Array(new Int16Array(points[j]).buffer), index);
            first_point = false;
            index += 4;
        }
    }
}

function getFile() {
    function* f() {
        for (var j = 0; j < 16 + points.length * 4; j++) {
            yield 255;
        }
    }
    return new Uint8Array(f());
}

function download() {
    is_tracking = false;
    clearInterval(drawIter);

    var fileData = getFile();
    downloadMetadata(fileData);
    downloadData(fileData);

    var file = new Blob([fileData], { type: "application/octet-stream" });

    var a = document.createElement("a");
    var url = URL.createObjectURL(file);
    a.href = url;
    a.download = `room_${room}_visitor_${userNum}.bin`;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);

    document.getElementById("userNum").value++;
    userNum++;
}
