import * as _ from 'lodash';

interface Vector { x: number; y: number; }
interface Size { width: number; height: number; }
interface Field { size: Size; }
interface Car { size: Size; pos: Vector; speed: Vector; maxSpeed: Vector }
interface Road { width: number, y: number }
interface Game { field: Field; car: Car; road: Road; }

function move(vector1: Vector, vector2: Vector): Vector {
    return {
        x: vector1.x + vector2.x,
        y: vector1.y + vector2.y,
    };
}

function updateCar(car: Car, delta: number): Car {
    return {
        ...car,
        pos: move(car.pos, {x: car.speed.x * delta, y: 0}),
        // speed: getNewSpeedForCar(field, car),
    }
}

function updateRoad(road: Road, car: Car, delta: number): Road {
    return {
        ...road,
        y: road.y - car.speed.y * delta,
    }
}

const keyToValue: {[s: string]: number} = {"ArrowRight": +1, "ArrowLeft": -1};

function update(game: Game, action: Action): Game {
    const {field, car, road} = game;

    switch (action.kind) {
        case "deltaTime":
            return {
                ...game,
                road: updateRoad(road, car, action.elapsed),
                car: updateCar(car, action.elapsed),
            };
        case "key":
            const value =
                (action.keyMap["ArrowLeft"] ? -1 : 0) +
                (action.keyMap["ArrowRight"] ? 1 : 0);

            return {
                ...game,
                car: {
                    ...car,
                    speed: {...car.speed, x: value * car.maxSpeed.x}
                }
            };
    }
};

function mod(n: number, m: number): number {
    return ((n % m) + m) % m;
}

function render(context: CanvasRenderingContext2D, game: Game) {
    const {field, car, road} = game;

    // background
    context.fillStyle = '#EEE';
    context.fillRect(0, 0, field.size.width, field.size.height);

    // road
    const band: Size = {width: 5, height: 30};
    const roadX = (field.size.width - road.width) / 2;

    context.fillStyle = '#CCC';
    context.fillRect(roadX, 0, road.width, field.size.height);
    const offsetY = mod(road.y, 2 * band.height);

    _(0).range(Math.ceil(field.size.height / band.height) + 1).each((index: number) => {
        const posY = index * band.height - offsetY;
        context.fillStyle = index % 2 === 0 ? '#444' : '#FFF';
        context.fillRect(roadX, posY, band.width, band.height);
        context.fillRect(roadX + road.width, posY, band.width, band.height);
    });

    // car
    context.fillStyle = '#36A';
    context.fillRect(
        car.pos.x - car.size.width / 2,
        car.pos.y - car.size.height / 2,
        car.size.width,
        car.size.height,
    );
};

type KeyMap = {[s: string]: boolean};

type Action =
    {kind: "deltaTime"; elapsed: number} |
    {kind: "key", keyMap: KeyMap};

function runGameInCanvas<T>(
    canvasId: string,
    initialState: T,
    updateGame: (state: T, action: Action) => T,
    canvasRender: (context: CanvasRenderingContext2D,  state: T) => void,
): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    const context = canvas ? canvas.getContext("2d") : null;
    let previousTime = Date.now();
    let state: T = initialState;
    let keyMap: KeyMap = {}; // Use grouped stacks. Example: {directionX: ["KeyLeft", "KeyRight"]} and use the first

    if (!context) {
        alert("No canvas found");
    } else {
        const loop = (action: Action): void => {
            const newState = updateGame(state, action);

            if (action.kind === "deltaTime") {
                if (state !== newState) {
                    canvasRender(context, newState);
                }

                requestAnimationFrame(() => {
                    const now = Date.now();
                    const elapsed = now - previousTime;
                    const timeDeltaAction: Action = {kind: "deltaTime", elapsed: 10 * (elapsed / 1e3)};
                    previousTime = now;
                    loop(timeDeltaAction);
                });
            }

            state = newState;
        };

        window.addEventListener('keydown', (event) => {
            Object.assign(keyMap, {[event.key]: true});
            loop({kind: "key", keyMap});
        });

        window.addEventListener('keyup', (event) => {
            Object.assign(keyMap, {[event.key]: false});
            loop({kind: "key", keyMap});
        });

        loop({kind: "deltaTime", elapsed: 0});
    }
}

function main() {
    const initialGame = {
        field: {
            size: {width: 600, height: 400},
        },
        car: {
            size: {width: 40, height: 50},
            pos: {x: 300, y: 350},
            speed: {x: 0, y: 10},
            maxSpeed: {x: 15, y: 0},
        },
        road: {width: 100, y: 10},
    };

    runGameInCanvas<Game>("canvas", initialGame, update, render);
}

main();