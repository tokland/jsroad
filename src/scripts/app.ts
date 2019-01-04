import * as _ from 'lodash';

interface Vector { x: number; y: number; }
interface Size { width: number; height: number; }
interface Field { size: Size; }
interface Car { size: Size; pos: Vector; speed: Vector; }
interface Road { width: number, y: number }
interface Game { field: Field; car: Car; road: Road; }

function move(vector1: Vector, vector2: Vector): Vector {
    return {
        x: vector1.x + vector2.x,
        y: vector1.y + vector2.y,
    };
}

function updateCar(car: Car): Car {
    return {
        ...car,
        // pos: move(car.pos, car.speed),
        // speed: getNewSpeedForCar(field, car),
    }
}

function updateRoad(road: Road, car: Car, delta: number): Road {
    return {
        ...road,
        y: road.y - car.speed.y * delta,
    }
}

function update(game: Game, delta: number): Game {
    const {field, car, road} = game;

    return {
        ...game,
        road: updateRoad(road, car, delta),
        car: updateCar(car),
    };
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

function runGameInCanvas<T>(
    canvasId: string,
    initialState: T,
    updateGame: (state: T, delta: number) => T,
    canvasRender: (context: CanvasRenderingContext2D,  state: T) => void,
): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    const context = canvas ? canvas.getContext("2d") : null;

    if (!context) {
        alert("No canvas found");
    } else {
        const loop = (state: T): void => {
            canvasRender(context, state);
            const newState = updateGame(state, 0.1);
            requestAnimationFrame(() => loop(newState));
        };
        loop(initialState);
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
        },
        road: {width: 100, y: 10},
    };

    runGameInCanvas<Game>("canvas", initialGame, update, render);
}

main();