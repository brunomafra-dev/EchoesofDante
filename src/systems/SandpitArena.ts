import Phaser from 'phaser';
import { SANDPIT } from '../config/soterrado';
import { EnvironmentPainter, trackEnvironmentOcclusion } from '../visual/EnvironmentArt';

export class SandpitArena {
  readonly bounds = { ...SANDPIT.bounds };
  readonly obstacles = [...SANDPIT.rocks.map(rock => ({ ...rock })),
    { x: SANDPIT.clue.x, y: SANDPIT.clue.y - 35, radius: 35 }];
  private readonly clue: Phaser.GameObjects.Image;
  private readonly light: Phaser.GameObjects.Ellipse;

  constructor(private readonly scene: Phaser.Scene, defeated: boolean) {
    scene.add.image(0, 0, 'sandpit-ground').setOrigin(0).setDisplaySize(SANDPIT.width, SANDPIT.height).setDepth(-10002);
    const layer = scene.add.renderTexture(0, 0, SANDPIT.width, SANDPIT.height).setOrigin(0).setDepth(410);
    const painter = new EnvironmentPainter(scene, layer);
    for (const rock of SANDPIT.rocks) painter.rock(rock.x, rock.y, rock.radius, 0xc2ab8a, true);
    for (const [x,y,width,flipX] of [[500,360,275,0],[1060,345,350,1],[1550,370,250,0],
      [540,1250,290,1],[1030,1250,320,0],[1500,1240,270,1]]) {
      painter.sediment(x,y+25,width,90,0x9e7559,.25);
      painter.contact(x,y+10,width*.8,35,.25);
      painter.stamp({key:'deep-stratum',x,y,width,height:145,flipX:!!flipX,tint:0xb19b7b});
    }
    painter.stamp({key:'root-growth',x:1410,y:1060,width:165,height:48,tint:0xa9946c,angle:-12});
    painter.sediment(SANDPIT.clue.x,SANDPIT.clue.y,230,64,0x9e7559,.23);
    painter.contact(SANDPIT.clue.x,SANDPIT.clue.y-5,160,30,.35);
    painter.destroy();
    this.clue = scene.add.image(SANDPIT.clue.x, SANDPIT.clue.y - 22, defeated?'open-threshold':'sealed-threshold')
      .setOrigin(.5,.94).setDisplaySize(220,175).setTint(0xbba887).setDepth(705);
    trackEnvironmentOcclusion(scene,this.clue);
    if(!defeated)this.clue.setData('environmentFadeDisabled',true).setAlpha(.45);
    this.light=scene.add.ellipse(SANDPIT.clue.x,SANDPIT.clue.y-30,70,14,0xa98cff,defeated?.5:0).setDepth(706);
  }

  resolve(): void {
    this.scene.tweens.killTweensOf(this.clue);
    this.clue.setTexture('open-threshold').setData('environmentFadeDisabled',true);
    this.scene.tweens.add({targets:this.clue,alpha:1,duration:900,
      onComplete:()=>this.clue.setData('environmentFadeDisabled',false)});
    this.light.setFillStyle(0xa98cff,.5);
  }
}
