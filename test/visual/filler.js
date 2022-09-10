
const matrices = [
    [0, 0, 0, 0, 0, 0],
    [1, 0, 0, 1, 0, 0],
    [2, 0, 0, 2, 0, 0],
    [0.5, 0, 0, 0.5, 0, 0],
    [2, 0, 0, 0.5, 0, 0],
    [0.5, 0, 0, 2, 0, 0],
    [1, 0.25, 0, 1, 0, 0],
    [1, -0.25, 0, 1, 0, 0],
    [1, 0, 0.25, 1, 0, 0],
    [1, 0, -0.25, 1, 0, 0],
    [1, 0.25, 0.25, 1, 0, 0],
    [1, 0.25, -0.25, 1, 0, 0],
    [1, -0.25, -0.25, 1, 0, 0],
    [1, -0.25, 0.25, 1, 0, 0],
];

let patternSource;

QUnit.module('Pattern transform', {
    before() {
        return new Promise(resolve => {
            getFixture('diet.jpeg', false, resolve);
        }).then(img => {
            patternSource = img;
        });
    }
});

const runner = visualTestLoop(QUnit);

function createPattern([a, b, c, d, e, f], offset = new fabric.Point(), fakeOffset = new fabric.Point()) {
    return new fabric.Pattern({
        source: patternSource,
        repeat: 'repeat',
        offsetX: offset.x + fakeOffset.x,
        offsetY: offset.y + fakeOffset.y,
        patternTransform: [a, b * Math.PI, c * Math.PI, d, e - fakeOffset.x, f - fakeOffset.y]
    });
}

function createGradient([a, b, c, d, e, f], offset = new fabric.Point(), fakeOffset = new fabric.Point()) {
    return new fabric.Gradient({
        type: 'linear',
        offsetX: offset.x + fakeOffset.x,
        offsetY: offset.y + fakeOffset.y,
        gradientTransform: [a, b * Math.PI, c * Math.PI, d, e - fakeOffset.x, f - fakeOffset.y],
        coords: {
            x1: 0,
            y1: 0,
            x2: 200,
            y2: 0
        },
        colorStops: [{
            offset: 0,
            color: 'green'
        },
        {
            offset: 0.5,
            color: 'white'
        },
        {
            offset: 1,
            color: 'blue'
        }],
    });
}

matrices.forEach((m) => {
    [new fabric.Point(), new fabric.Point(-120, 50)]
        .forEach(offset => {
            runner({
                test: `pattern transform matrix(${m}), offset(${offset})`,
                code: (canvas, callback) => {
                    const rect = new fabric.Rect({
                        width: canvas.width,
                        height: canvas.height,
                        fill: createPattern(m, new fabric.Point(), offset),
                        strokeWidth: 0
                    });
                    canvas.add(rect);
                    canvas.renderAll();
                    callback(canvas.lowerCanvasEl);
                },
                golden: `pattern/matrix(${m}).png`,
                percentage: 0.09,
                width: 200,
                height: 200,
            });
            runner({
                test: `canvas bg pattern transform matrix(${m}), offset(${offset})`,
                code: (canvas, callback) => {
                    canvas.backgroundColor = createPattern(m, new fabric.Point(), offset);
                    canvas.renderAll();
                    callback(canvas.lowerCanvasEl);
                },
                golden: `pattern/matrix(${m}).png`,
                percentage: 0.09,
                width: 200,
                height: 200,
            });
        });
});

QUnit.module('Gradient transform');

matrices.forEach((m) => {
    [new fabric.Point(), new fabric.Point(-120, 50)]
        .forEach(offset => {
            runner({
                test: `gradient transform matrix(${m}), offset(${offset})`,
                code: (canvas, callback) => {
                    const rect = new fabric.Rect({
                        width: canvas.width,
                        height: canvas.height,
                        fill: createGradient(m, new fabric.Point(), offset),
                        strokeWidth: 0
                    });
                    canvas.add(rect);
                    canvas.renderAll();
                    callback(canvas.lowerCanvasEl);
                },
                golden: `gradient/matrix(${m}).png`,
                percentage: 0.09,
                width: 200,
                height: 200,
            });
            runner({
                test: `canvas bg gradient transform matrix(${m}), offset(${offset})`,
                code: (canvas, callback) => {
                    canvas.backgroundColor = createGradient(m, new fabric.Point(canvas.width / 2, canvas.height / 2), offset);
                    canvas.renderAll();
                    callback(canvas.lowerCanvasEl);
                },
                golden: `gradient/matrix(${m}).png`,
                percentage: 0.09,
                width: 200,
                height: 200,
            });
        });

});