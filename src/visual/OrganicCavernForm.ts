import Phaser from 'phaser';

// Visual Prototype 02: one authored 180 x 170 patch around the existing (885, 595)
// rock and (865, 626) mineral seam. Draw once into CavernArea's existing bake.
// Raised stone stays over the radius-56 footprint; the outer apron is low soil.
export function drawOrganicCavernForm(art: Phaser.GameObjects.Graphics): void {
  const x = 885;
  const y = 595;
  const path = (px: number, py: number) => new Phaser.Curves.Path(x + px, y + py);
  const fill = (shape: Phaser.Curves.Path, color: number, alpha = 1) => {
    art.fillStyle(color, alpha).fillPoints(shape.getPoints(8), true);
  };

  // Background: a quiet, uneven contact apron joins stone, soil and growth.
  fill(path(-76, 19)
    .cubicBezierTo(-43 + x, -56 + y, -78 + x, -18 + y, -68 + x, -49 + y)
    .cubicBezierTo(44 + x, -49 + y, -15 + x, -74 + y, 27 + x, -64 + y)
    .cubicBezierTo(86 + x, 37 + y, 71 + x, -29 + y, 85 + x, 5 + y)
    .cubicBezierTo(6 + x, 76 + y, 91 + x, 62 + y, 43 + x, 74 + y)
    .cubicBezierTo(-76 + x, 19 + y, -37 + x, 82 + y, -77 + x, 60 + y), 0x243936, 0.7);
  fill(path(-60, 26)
    .cubicBezierTo(49 + x, 5 + y, -53 + x, -11 + y, 20 + x, -6 + y)
    .cubicBezierTo(62 + x, 54 + y, 78 + x, 22 + y, 72 + x, 47 + y)
    .cubicBezierTo(-60 + x, 26 + y, 27 + x, 79 + y, -69 + x, 65 + y), 0x0b1b20, 0.6);

  // A root descends into a rear fracture, vanishing under the main mass.
  art.lineStyle(7, 0x294b3e, 0.9);
  path(-13, -66).cubicBezierTo(-28 + x, -39 + y, -21 + x, -58 + y, -22 + x, -52 + y)
    .cubicBezierTo(-36 + x, 8 + y, -29 + x, -20 + y, -45 + x, -11 + y).draw(art, 12);
  art.lineStyle(2, 0x668968, 0.55);
  path(-12, -65).cubicBezierTo(-30 + x, -39 + y, -20 + x, -57 + y, -25 + x, -51 + y).draw(art, 12);

  // Midground: one asymmetrical silhouette, with broad strata instead of a block.
  fill(path(-54, 18)
    .cubicBezierTo(-43 + x, -30 + y, -59 + x, -3 + y, -59 + x, -18 + y)
    .lineTo(x - 31, y - 34).lineTo(x - 35, y - 39)
    .cubicBezierTo(-8 + x, -56 + y, -31 + x, -38 + y, -20 + x, -57 + y)
    .cubicBezierTo(24 + x, -42 + y, 6 + x, -59 + y, 10 + x, -42 + y)
    .cubicBezierTo(55 + x, -3 + y, 41 + x, -35 + y, 49 + x, -17 + y)
    .lineTo(x + 47, y + 4).lineTo(x + 54, y + 12)
    .cubicBezierTo(36 + x, 37 + y, 60 + x, 13 + y, 49 + x, 30 + y)
    .cubicBezierTo(-18 + x, 53 + y, 16 + x, 53 + y, -1 + x, 47 + y)
    .cubicBezierTo(-54 + x, 18 + y, -38 + x, 48 + y, -48 + x, 40 + y), 0x465751);
  // Unequal cap and shoulder share the outer contour and a continuous lower face.
  fill(path(-53, 6)
    .cubicBezierTo(-8 + x, -54 + y, -59 + x, -22 + y, -28 + x, -47 + y)
    .cubicBezierTo(24 + x, -40 + y, 7 + x, -56 + y, 13 + x, -41 + y)
    .cubicBezierTo(38 + x, -7 + y, 31 + x, -27 + y, 23 + x, -17 + y)
    .cubicBezierTo(-53 + x, 6 + y, 11 + x, 12 + y, -14 + x, -7 + y), 0x5a6860);
  fill(path(22, -36)
    .cubicBezierTo(54 + x, -1 + y, 38 + x, -28 + y, 47 + x, -15 + y)
    .cubicBezierTo(35 + x, 35 + y, 60 + x, 14 + y, 47 + x, 28 + y)
    .cubicBezierTo(5 + x, 43 + y, 24 + x, 47 + y, 14 + x, 36 + y)
    .cubicBezierTo(22 + x, -36 + y, 28 + x, 18 + y, 18 + x, -9 + y), 0x3b4e4b);
  fill(path(-50, 22)
    .cubicBezierTo(-15 + x, 50 + y, -37 + x, 17 + y, -18 + x, 28 + y)
    .cubicBezierTo(-45 + x, 38 + y, -17 + x, 58 + y, -36 + x, 44 + y)
    .cubicBezierTo(-50 + x, 22 + y, -52 + x, 31 + y, -47 + x, 28 + y), 0x566456);

  // One broken seam unifies the strata and the exposed mineral pocket.
  art.lineStyle(3, 0x223732, 0.8);
  path(9, -34).lineTo(x - 3, y - 17).lineTo(x + 2, y - 7)
    .lineTo(x - 16, y + 12).lineTo(x - 19, y + 35).draw(art);
  art.lineStyle(1.5, 0x8b9b85, 0.5).lineBetween(x - 35, y - 25, x - 14, y - 39);

  // Foreground: roots reappear at the foot, tying the mass to its soil apron.
  art.lineStyle(5, 0x365c50, 0.85);
  path(-41, 28).cubicBezierTo(-23 + x, 50 + y, -35 + x, 31 + y, -35 + x, 46 + y)
    .cubicBezierTo(-60 + x, 65 + y, -23 + x, 61 + y, -45 + x, 55 + y).draw(art, 12);
  art.lineStyle(2, 0x6bb464, 0.35);
  path(-39, 30).cubicBezierTo(-26 + x, 50 + y, -35 + x, 36 + y, -34 + x, 44 + y).draw(art, 10);
  art.fillStyle(0x3c5945, 0.8).fillEllipse(x - 37, y + 49, 33, 11).fillEllipse(x + 27, y + 45, 23, 7);

  // Mineral grows out of the same fracture; faceted but unequal and partly buried.
  art.fillStyle(0x2d3435).fillPoints([
    { x: x - 39, y: y + 48 }, { x: x - 28, y: y + 34 }, { x: x - 14, y: y + 29 },
    { x: x + 9, y: y + 46 }, { x: x - 6, y: y + 57 },
  ], true);
  art.fillStyle(0x7b6d61).fillPoints([
    { x: x - 27, y: y + 50 }, { x: x - 25, y: y + 31 }, { x: x - 11, y: y + 10 },
    { x: x - 8, y: y + 30 }, { x: x - 3, y: y + 52 },
  ], true);
  art.fillStyle(0xb49064, 0.85).fillPoints([
    { x: x - 19, y: y + 42 }, { x: x - 11, y: y + 10 }, { x: x - 8, y: y + 30 }, { x: x - 10, y: y + 49 },
  ], true);
  art.fillStyle(0x6e6965).fillPoints([
    { x: x - 37, y: y + 51 }, { x: x - 40, y: y + 32 }, { x: x - 34, y: y + 27 },
    { x: x - 24, y: y + 48 }, { x: x - 28, y: y + 55 },
  ], true);
  art.fillStyle(0x856f65).fillPoints([
    { x: x - 7, y: y + 51 }, { x: x + 2, y: y + 35 }, { x: x + 8, y: y + 39 }, { x: x + 12, y: y + 52 },
  ], true);
  art.lineStyle(1.5, 0xffbd54, 0.65).lineBetween(x - 11, y + 16, x - 15, y + 37);
  art.lineStyle(1.5, 0xa98cff, 0.42).lineBetween(x + 2, y + 39, x - 2, y + 46);
  art.fillStyle(0xffbd54, 0.07).fillEllipse(x - 15, y + 51, 31, 9);
}
