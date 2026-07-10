import {
  useEffect,
  useRef,
} from "react";
import {
  Link,
} from "react-router-dom";

import {
  ArrowLeft,
} from "lucide-react";

type Net = {
  x: number;
  gapY: number;
  scored: boolean;
};

const width = 420;
const height = 620;
const blue = "#1d4ed8";

export default function FlappyBat() {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef({
    batY: 260,
    velocity: 0,
    nets: [
      {
        x: 500,
        gapY: 250,
        scored: false,
      },
    ] as Net[],
    score: 0,
    best: 0,
    over: false,
    started: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const maybeContext = canvas.getContext("2d");

    if (!maybeContext) {
      return;
    }

    const context = maybeContext;

    let frame = 0;
    let animationId = 0;

    function reset() {
      gameRef.current = {
        batY: 260,
        velocity: 0,
        nets: [
          {
            x: 500,
            gapY: 250,
            scored: false,
          },
        ],
        score: 0,
        best: gameRef.current.best,
        over: false,
        started: false,
      };
      frame = 0;
    }

    function flap() {
      const game = gameRef.current;

      if (game.over) {
        reset();
        gameRef.current.started = true;
        gameRef.current.velocity = -8;
        return;
      }

      game.started = true;
      game.velocity = -8;
    }

    function drawBat(y: number) {
      context.save();
      context.translate(112, y);
      context.rotate(-0.18);
      context.strokeStyle = blue;
      context.lineWidth = 4;
      context.beginPath();
      context.roundRect(-20, -26, 38, 52, 12);
      context.stroke();
      context.beginPath();
      context.moveTo(16, 21);
      context.lineTo(45, 50);
      context.stroke();
      context.beginPath();
      context.arc(-8, -8, 4, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }

    function drawNet(
      x: number,
      top: number,
      bottom: number
    ) {
      context.strokeStyle = blue;
      context.lineWidth = 4;
      context.strokeRect(x, 0, 48, top);
      context.strokeRect(
        x,
        bottom,
        48,
        height - bottom
      );

      context.lineWidth = 1.5;

      for (let line = 8; line < 48; line += 10) {
        context.beginPath();
        context.moveTo(x + line, 0);
        context.lineTo(x + line, top);
        context.moveTo(x + line, bottom);
        context.lineTo(x + line, height);
        context.stroke();
      }

      for (let line = 16; line < top; line += 18) {
        context.beginPath();
        context.moveTo(x, line);
        context.lineTo(x + 48, line);
        context.stroke();
      }

      for (
        let line = bottom + 16;
        line < height;
        line += 18
      ) {
        context.beginPath();
        context.moveTo(x, line);
        context.lineTo(x + 48, line);
        context.stroke();
      }
    }

    function drawText() {
      const game = gameRef.current;

      context.fillStyle = blue;
      context.font = "700 28px Inter, sans-serif";
      context.fillText(String(game.score), 24, 48);
      context.font = "600 13px Inter, sans-serif";
      context.fillText(`Best ${game.best}`, 24, 72);

      if (!game.started && !game.over) {
        context.font = "700 24px Inter, sans-serif";
        context.fillText("Flappy Bat", 136, 250);
        context.font = "600 14px Inter, sans-serif";
        context.fillText(
          "Space, click, or tap",
          145,
          280
        );
      }

      if (game.over) {
        context.font = "700 28px Inter, sans-serif";
        context.fillText("Game Over", 134, 260);
        context.font = "600 14px Inter, sans-serif";
        context.fillText(
          "Press Enter or tap to restart",
          121,
          290
        );
      }
    }

    function tick() {
      const game = gameRef.current;

      context.clearRect(0, 0, width, height);
      context.fillStyle = "white";
      context.fillRect(0, 0, width, height);

      context.strokeStyle = blue;
      context.lineWidth = 3;
      context.strokeRect(1.5, 1.5, width - 3, height - 3);

      if (game.started && !game.over) {
        frame += 1;
        game.velocity += 0.42;
        game.batY += game.velocity;

        if (frame % 105 === 0) {
          game.nets.push({
            x: width + 30,
            gapY:
              145 +
              Math.floor(Math.random() * 260),
            scored: false,
          });
        }

        game.nets = game.nets
          .map((net) => ({
            ...net,
            x: net.x - 2.8,
          }))
          .filter((net) => net.x > -60);
      }

      const bat = {
        x: 112,
        y: game.batY,
        radius: 24,
      };

      game.nets.forEach((net) => {
        const gap = 160;
        const top = net.gapY - gap / 2;
        const bottom = net.gapY + gap / 2;

        drawNet(net.x, top, bottom);

        const overlapsX =
          bat.x + bat.radius > net.x &&
          bat.x - bat.radius < net.x + 48;
        const hitsNet =
          overlapsX &&
          (bat.y - bat.radius < top ||
            bat.y + bat.radius > bottom);

        if (hitsNet) {
          game.over = true;
        }

        if (!net.scored && net.x + 48 < bat.x) {
          net.scored = true;
          game.score += 1;
          game.best = Math.max(
            game.best,
            game.score
          );
        }
      });

      if (
        game.batY < 28 ||
        game.batY > height - 28
      ) {
        game.over = true;
      }

      drawBat(game.batY);
      drawText();

      animationId = requestAnimationFrame(tick);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.code === "Space" ||
        event.code === "Enter"
      ) {
        event.preventDefault();
        flap();
      }
    }

    canvas.addEventListener("pointerdown", flap);
    window.addEventListener("keydown", handleKeyDown);
    tick();

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener("pointerdown", flap);
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-6">
      <div className="w-full">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="max-h-[78vh] w-full max-w-[420px] rounded-xl border border-blue-700 bg-white shadow-sm"
      />
    </div>
  );
}
