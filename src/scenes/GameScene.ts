import Phaser from 'phaser';
import { coopSession, type PartyWorld } from '../network/CoopSession';
import { PartyExpedition, type PartyBridge } from '../network/PartyExpedition';
import { characterProfiles } from '../systems/CharacterProfiles';
import { HUNTER, type PlayableClass } from '../config/classes';
import { HunterCombat } from '../combat/HunterCombat';
import { HunterArt, preloadHunterArt } from '../visual/HunterArt';
import { SaberAttack } from '../combat/Attack';
import { applyDamage } from '../combat/Damage';
import { KineticCharge } from '../combat/KineticCharge';
import { PLAYER, CRAWLER, KINETIC_CHARGE, WORLD_HEIGHT, WORLD_WIDTH } from '../config/game';
import { PROGRESSION } from '../config/progression';
import { FOREST_ENTRY, FOREST_PATROLS, FOREST_SPAWNS } from '../config/forest';
import { CAVERN_DEPTH_OPENING, CAVERN_ENTRY, CAVERN_HOLLOWS, DEEP_AREA, DEEP_HOLLOWS } from '../config/cavern';
import { FOREST_ECHOES, NORTHERN_DISCOVERY, SIGNAL_THRESHOLD } from '../config/discovery';
import { HollowCrawler } from '../entities/HollowCrawler';
import { DanteCreature } from '../entities/DanteCreature';
import type { Enemy, EnemyImpact } from '../entities/Enemy';
import { EXPANSION, EXPANSION_ENCOUNTERS } from '../config/expansion';
import { WARDEN_PREPARATION as W } from '../config/wardenPreparation';
import { Player } from '../entities/Player';
import { Warden, type WardenCue, type WardenAttack } from '../entities/Warden';
import { WardenArena } from '../systems/WardenArena';
import { WardenHud } from '../ui/WardenHud';
import { VALLEY, VALLEY_ENCOUNTERS, VALLEY_RENEWAL, VALLEY_ROUTES } from '../config/valley';
import { SIROCCO, SIROCCO_ENCOUNTERS, SIROCCO_RENEWAL, SIROCCO_ROUTES, type SiroccoKind } from '../config/sirocco';
import { DUNES, DUNES_ENCOUNTERS, DUNES_ROUTES } from '../config/dunes';
import { FROST, FROST_ENCOUNTERS, FROST_ROUTES, type FrostKind } from '../config/frost';
import { FrozenReach } from '../systems/FrozenReach';
import { GLACIER, GLACIER_ENCOUNTERS, GLACIER_ROUTES, VESPER } from '../config/glacier';
import { GlacierRegion } from '../systems/GlacierRegion';
import { Vesper, type IceCue } from '../entities/Vesper';
import { DunesInterior } from '../systems/DunesInterior';
import { SANDPIT, SOTERRADO, type SoterradoAttack } from '../config/soterrado';
import { Soterrado, type SoterradoCue } from '../entities/Soterrado';
import { SandpitArena } from '../systems/SandpitArena';
import type { SpeciesId } from '../config/bestiary';
import { Bestiary } from '../systems/Bestiary';
import { LocalJourney, JOURNEY_FLAGS, type JourneyFlags, type JourneyArea } from '../systems/LocalJourney';
import { RecordsPanel } from '../ui/RecordsPanel';
import { AbilityUpgradeDialog } from '../ui/AbilityUpgradeDialog';
import { ValleyCreature } from '../entities/ValleyCreature';
import { ResonanceValley } from '../systems/ResonanceValley';
import { SignalPortal } from '../systems/SignalPortal';
import { ChapterPortal } from '../systems/ChapterPortal';
import { SiroccoBasin } from '../systems/SiroccoBasin';
import { Controls } from '../input/Controls';
import { Arena } from '../systems/Arena';
import { preloadEnvironment, resetEnvironmentOcclusion, updateEnvironmentOcclusion } from '../visual/EnvironmentArt';
import { CavernArea } from '../systems/CavernArea';
import { MineralPulse } from '../systems/MineralPulse';
import { AudioManager, type MusicRegion } from '../systems/Sound';
import { NorthernDiscovery } from '../systems/NorthernDiscovery';
import { ForestEcho, type EchoSite } from '../systems/EchoSite';
import { Progression } from '../systems/Progression';
import { SignalThreshold } from '../systems/SignalThreshold';
import { PassageMechanism } from '../systems/PassageMechanism';
import type { MovementBounds, Obstacle } from '../systems/Movement';
import { Hud } from '../ui/Hud';
import { ExplorationGuide, type ExplorationTarget } from '../ui/ExplorationGuide';
import { WorldNavigator } from '../ui/WorldNavigator';
import { distance, normalized, type Vec2 } from '../utils/math';
import { ReferenceArea } from '../experiments/quality-reference/ReferenceArea';
import { ReferenceImpacts } from '../experiments/quality-reference/ReferenceImpacts';
import { preloadWarriorArt } from '../visual/WarriorArt';

export class GameScene extends Phaser.Scene {
  private classId: PlayableClass = 'warrior';
  private hunter?: HunterCombat;
  private hunterArt?: HunterArt;
  private get characterMaxHp(): number { return this.classId === 'hunter' ? Math.round(this.progression.maxHp * HUNTER.hpRatio) : this.progression.maxHp; }
  private party?: PartyExpedition;
  private coopWorldXp?: number;
  private coopLayout = '';
  private coopMessage = '';
  private coopSoloNoticeAt = -Infinity;
  private visitingCoop = false;
  private player!: Player;
  private controls!: Controls;
  private arena!: Arena | CavernArea | WardenArena | ResonanceValley | SiroccoBasin | ReferenceArea;
  private referenceImpacts?: ReferenceImpacts;
  private valley?: ResonanceValley;
  private signalPortal?: SignalPortal;
  private chapterPortal?: ChapterPortal;
  private sirocco?: SiroccoBasin;
  private valleyVisited = false;
  private valleyLandmarkSeen = false;
  private valleyEndSeen = false;
  private valleyCheckpointReached = false;
  private valleyFrontierReached = false;
  private valleyFrontierSignalSeen = false;
  private valleyFrontierEndSeen = false;
  private aridVisited = false;
  private aridSignalSeen = false;
  private aridFrontierEntered = false;
  private aridFrontierReached = false;
  private frost?: FrozenReach;
  private glacier?: GlacierRegion;
  private vesper?: Vesper;
  private vesperHud?: WardenHud;
  private icecaveVisited = false;
  private icecaveSignalSeen = false;
  private icenestVisited = false;
  private vesperReached = false;
  private vesperDefeated = false;
  private vesperClueSeen = false;
  private glacierArrival?: Vec2;
  private coldPortal?: ChapterPortal;
  private frostVisited = false;
  private frostSignalSeen = false;
  private frostEndSeen = false;
  private returnFromFrost = false;
  private dunes?: DunesInterior;
  private dunesVisited = false;
  private dunesRuinsSeen = false;
  private dunesDepthSeen = false;
  private returnFromDunes = false;
  private returnFromSandpit = false;
  private soterradoReached = false;
  private soterradoDefeated = false;
  private soterradoClueSeen = false;
  private soterrado?: Soterrado;
  private sandpit?: SandpitArena;
  private soterradoHud?: WardenHud;
  private returnFromValley = false;
  private returnToValleyPortal = false;
  private returnToFrontierPortal = false;
  private cavern?: CavernArea;
  private wardenArena?: WardenArena;
  private warden?: Warden;
  private wardenHud?: WardenHud;
  private wardenGateOpen = false;
  private wardenDefeated = false;
  private wardenEndingSeen = false;
  private returnToThreshold = false;
  private readonly bossTargets: Enemy[] = [];
  private readonly playerObstacles: Obstacle[] = [];
  private readonly bossFootprint: Obstacle = { x: 0, y: 0, radius: 65 };
  private movementBounds?: MovementBounds;
  private area: JourneyArea = 'forest';
  private transferHp?: number;
  private transitioning = false;
  private cavernDepthSeen = false;
  private deepOpening = false;
  private deepPassageOpen = false;
  private deepAreaSeen = false;
  private deepCavernEntered = false;
  private inDeepCavern = false;
  private deepEndSeen = false;
  private deeperEntered = false;
  private exteriorEntered = false;
  private fragmentSeen = false;
  private approachSeen = false;
  private firstEchoSeen = false;
  private wardenReached = false;
  private continuationRegion: 'deep' | 'deeper' | 'exterior' = 'deep';
  private spawnedEncounters = new Set<number>();
  private gateObstacle?: Obstacle;
  private enemies: Enemy[] = [];
  private hollowSpawnIds = new Map<Enemy, number>();
  private enemySpecies = new WeakMap<Enemy, SpeciesId>();
  private readonly bestiary = new Bestiary();
  private readonly journey = new LocalJourney();
  private journeyLoaded = false;
  private resettingJourney = false;
  private readonly valleyRoutes = new Set<string>();
  private readonly valleyHabitatCooldowns = new Map<number, number>();
  private readonly valleyResidents = new Map<number, Enemy>();
  private readonly siroccoHabitatCooldowns = new Map<number, number>();
  private readonly siroccoResidents = new Map<number, Enemy>();
  private records!: RecordsPanel;
  private abilityUpgradeDialog?: AbilityUpgradeDialog;
  private recordsPausedAt = 0;
  private recordsTimeOffset = 0;
  private readonly progression = new Progression();
  private attack = new SaberAttack();
  private charge = new KineticCharge();
  private sounds = new AudioManager();
  private musicRegion?: MusicRegion;
  private audioCleanupBound = false;
  private hud!: Hud;
  private explorationGuide!: ExplorationGuide;
  private navigation?: WorldNavigator;
  private echoSites: EchoSite[] = [];
  private threshold?: SignalThreshold;
  private mechanism?: PassageMechanism;
  private kineticWave!: Phaser.GameObjects.Graphics;
  private waveDrawn = false;
  private lastDashTrail = 0;

  constructor(private readonly qualityReference: false | 'baseline' | 'reference' = false,
    private readonly originalWarrior = false, private readonly shellReady?: (scene: GameScene) => void,
    private readonly glacierPlaytest?: { area: 'icecave' | 'icenest'; classId: 'warrior' | 'hunter' }) { super('Game'); }

  preload(): void {
    preloadHunterArt(this);
    if (!this.textures.exists('glacier-ground')) this.load.image('glacier-ground', `${import.meta.env.BASE_URL}assets/visual/environment/glacier-ground.webp`);
    for (const [key, file] of [['vesper-motion', 'vesper-motion'], ['dante-iceCarapace-motion', 'ice-carapace-motion']]) if (!this.textures.exists(key)) this.load.spritesheet(key, `${import.meta.env.BASE_URL}assets/visual/characters/${file}.png`, { frameWidth: 256, frameHeight: 256 });
    if (!this.textures.exists('frost-ground')) this.load.image('frost-ground', `${import.meta.env.BASE_URL}assets/visual/environment/frost-ground.webp`);
    for (const kind of ['pouncer', 'spitter']) if (!this.textures.exists(`dante-frost-${kind}-motion`)) this.load.spritesheet(`dante-frost-${kind}-motion`, `${import.meta.env.BASE_URL}assets/visual/characters/frost-${kind}-motion.png`, { frameWidth: 256, frameHeight: 256 });
    const assetBase = `${import.meta.env.BASE_URL}assets/visual/characters/`;
    const art = [
      'warrior-body',
      'warrior-body-back',
      'warrior-body-side',
      'warrior-boot',
      'warrior-support-arm',
      'warrior-saber-arm',
      'hollow-body',
      'hollow-rear-limbs',
      'hollow-forelimbs',
    ] as const;
    for (const key of art) {
      // Both hands share a painted sleeve; transparent padding preserves the existing rig.
      const file = key === 'warrior-support-arm' ? 'warrior-saber-arm' : key;
      if (!this.textures.exists(key)) this.load.image(key, `${assetBase}${file}.png`);
    }
    for (const key of ['dante-skitter-motion', 'dante-spitter-motion', 'dante-carapace-motion', 'dante-thorn-motion',
      'dante-dune-pouncer-motion', 'dante-glass-spitter-motion']) {
      if (!this.textures.exists(key)) this.load.spritesheet(key, `${assetBase}${key}.png`, { frameWidth: 256, frameHeight: 256 });
    }
    if (!this.textures.exists('warden-motion')) this.load.spritesheet('warden-motion', `${assetBase}warden-motion.png`, { frameWidth: 512, frameHeight: 512 });
    if (!this.textures.exists('soterrado-motion')) this.load.spritesheet('soterrado-motion', `${assetBase}soterrado-motion.png`, { frameWidth: 384, frameHeight: 384 });
    for (const name of ['soterrado-burrow', 'soterrado-burrow-lip', 'soterrado-dust']) {
      if (!this.textures.exists(name)) this.load.image(name, `${import.meta.env.BASE_URL}assets/visual/environment/${name}.png`);
    }
    if (!this.textures.exists('sandpit-ground')) this.load.image('sandpit-ground', `${import.meta.env.BASE_URL}assets/visual/environment/sandpit-ground.webp`);
    preloadEnvironment(this);
    if (!this.textures.exists('cavern-entry-floor')) this.load.image('cavern-entry-floor',
      `${import.meta.env.BASE_URL}assets/visual/environment/cavern-entry-floor.webp`);
    if (!this.textures.exists('sirocco-ground')) this.load.image('sirocco-ground',
      `${import.meta.env.BASE_URL}assets/visual/environment/sirocco-ground.webp`);
    if (!this.textures.exists('sirocco-east-ground')) this.load.image('sirocco-east-ground',
      `${import.meta.env.BASE_URL}assets/visual/environment/sirocco-east-ground.webp`);
    if (!this.textures.exists('dunes-ground')) this.load.image('dunes-ground',
      `${import.meta.env.BASE_URL}assets/visual/environment/dunes-ground.webp`);
    if (this.qualityReference !== 'baseline' && !this.originalWarrior) preloadWarriorArt(this);
    if (this.qualityReference === 'reference' && !this.textures.exists('reference-basin-floor')) {
      this.load.image('reference-basin-floor', `${import.meta.env.BASE_URL}assets/experiments/quality-reference/basin-floor.webp`);
    }
  }

  create(): void {
    if (!this.audioCleanupBound) {
      this.audioCleanupBound = true;
      this.game.events.once(Phaser.Core.Events.DESTROY, () => this.sounds.destroy());
    }
    this.recordsTimeOffset = 0;
    // Phaser pauses timers/tweens, but its absolute clock jumps on resume.
    // Keep Player getters and all existing combat timestamps on the same clock.
    const syncCombatClock = (time: number) => { this.time.now = time - this.recordsTimeOffset; };
    this.events.on(Phaser.Scenes.Events.UPDATE, syncCombatClock);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.UPDATE, syncCombatClock));
    if (!this.journeyLoaded) { this.journeyLoaded = true; this.restoreJourney(); }
    resetEnvironmentOcclusion(this);
    this.classId = this.glacierPlaytest?.classId ?? (this.qualityReference ? 'warrior' : characterProfiles.active.classId);
    this.hunter = undefined; this.hunterArt = undefined;
    this.attack = new SaberAttack(id => this.progression.upgradeRank(id));
    this.charge = new KineticCharge(id => this.progression.upgradeRank(id));
    this.waveDrawn = false;
    this.enemies = [];
    this.enemySpecies = new WeakMap();
    this.valleyResidents.clear();
    this.siroccoResidents.clear();
    this.spawnedEncounters.clear();
    this.hollowSpawnIds.clear();
    this.transitioning = false;
    this.deepOpening = false;
    this.cavern = undefined;
    this.valley = undefined;
    this.sirocco = undefined;
    this.dunes = undefined;
    this.frost = undefined;
    this.glacier = undefined; this.vesper = undefined; this.vesperHud = undefined;
    this.coldPortal = undefined;
    this.soterrado = undefined;
    this.sandpit = undefined;
    this.soterradoHud = undefined;
    this.signalPortal = undefined;
    this.chapterPortal = undefined;
    this.wardenArena = undefined;
    this.warden = undefined;
    this.wardenHud = undefined;
    this.bossTargets.length = 0;
    this.playerObstacles.length = 0;
    this.gateObstacle = undefined;
    this.threshold = undefined;
    this.mechanism = undefined;
    this.referenceImpacts = undefined;
    this.echoSites = [];
    if (this.area === 'forest') {
      this.arena = new Arena(this);
      this.movementBounds = undefined;
      if (!this.progression.passageOpen) {
        this.gateObstacle = { x: SIGNAL_THRESHOLD.x, y: SIGNAL_THRESHOLD.y, radius: SIGNAL_THRESHOLD.obstacleRadius };
        this.arena.obstacles.push(this.gateObstacle);
      }
      new MineralPulse(this);
      this.echoSites = [
        new NorthernDiscovery(this, this.progression.echoes.has('northern-ruin')),
        new ForestEcho(this, FOREST_ECHOES.mineral, this.progression.echoes.has(FOREST_ECHOES.mineral.id)),
        new ForestEcho(this, FOREST_ECHOES.trace, this.progression.echoes.has(FOREST_ECHOES.trace.id)),
      ];
      this.threshold = new SignalThreshold(this, this.progression.signalSynchronized, this.progression.sourceLocated, this.progression.passageOpen);
      this.mechanism = new PassageMechanism(this, this.progression.sourceLocated, this.progression.passageOpen);
    } else if (this.area === 'warden') {
      this.wardenArena = new WardenArena(this);
      this.arena = this.wardenArena;
      this.movementBounds = this.arena.bounds;
      if (this.wardenDefeated) this.wardenArena.resolve();
    } else if (this.area === 'valley') {
      this.valley = new ResonanceValley(this, this.valleyLandmarkSeen);
      this.arena = this.valley;
      this.movementBounds = this.valley.bounds;
    } else if (this.area === 'arid') {
      this.sirocco = new SiroccoBasin(this, this.aridSignalSeen, this.aridFrontierReached,
        this.progression.rewardedRoutes.has(SIROCCO_ROUTES[0].id));
      this.arena = this.sirocco;
      this.movementBounds = this.sirocco.bounds;
    } else if (this.area === 'icecave' || this.area === 'icenest') {
      this.glacier = new GlacierRegion(this, this.area, this.icecaveSignalSeen, this.vesperDefeated);
      this.arena = this.glacier; this.movementBounds = this.glacier.bounds;
    } else if (this.area === 'frost') {
      this.frost = new FrozenReach(this, this.frostSignalSeen);
      this.arena = this.frost;
      this.movementBounds = this.frost.bounds;
    } else if (this.area === 'sandpit') {
      this.sandpit = new SandpitArena(this, this.soterradoDefeated);
      this.arena = this.sandpit;
      this.movementBounds = this.sandpit.bounds;
    } else if (this.area === 'dunes') {
      this.dunes = new DunesInterior(this, this.dunesRuinsSeen);
      this.arena = this.dunes;
      this.movementBounds = this.dunes.bounds;
    } else if (this.qualityReference === 'reference') {
      this.arena = new ReferenceArea(this);
      this.movementBounds = this.arena.bounds;
    } else {
      this.cavern = new CavernArea(this, this.deepPassageOpen, this.fragmentSeen, this.firstEchoSeen, this.wardenGateOpen);
      this.arena = this.cavern;
      this.movementBounds = this.arena.bounds;
    }
    const entry = coopSession.role === 'guest' && coopSession.world?.partner ? coopSession.world.partner : this.area === 'forest' ? FOREST_ENTRY : this.area === 'valley'
      ? this.returnToValleyPortal ? VALLEY.entry : this.returnToFrontierPortal ? VALLEY.frontier.checkpoint : this.valleyFrontierReached ? VALLEY.frontier.checkpoint : this.valleyCheckpointReached ? VALLEY.checkpoint : VALLEY.entry
      : this.area === 'arid' ? this.returnFromDunes ? { x: 4770, y: 805 } : this.aridSignalSeen ? SIROCCO.frontierCheckpoint : this.aridVisited ? SIROCCO.checkpoint : SIROCCO.entry
      : this.area === 'icecave' || this.area === 'icenest' ? this.glacierArrival ?? (this.area === 'icenest' && this.vesperReached ? GLACIER.icenest.checkpoint : this.area === 'icecave' && this.icecaveSignalSeen ? GLACIER.icecave.checkpoint : GLACIER[this.area].entry)
      : this.area === 'frost' ? this.glacierArrival ?? (this.frostSignalSeen ? FROST.checkpoint : FROST.entry)
      : this.area === 'sandpit' ? this.returnFromFrost ? { x: 1320, y: 790 } : SANDPIT.entry
      : this.area === 'dunes' ? this.returnFromSandpit ? { x: 2390, y: 1160 } : this.dunesRuinsSeen ? DUNES.checkpoint : DUNES.entry
      : this.area === 'warden' ? this.returnFromValley ? { x: 1420, y: 830 } : { x: 650, y: 760 }
      : this.returnToThreshold ? { x: 6060, y: 740 } : this.firstEchoSeen ? W.respawn
      : this.exteriorEntered ? EXPANSION.exteriorRespawn : this.deeperEntered ? EXPANSION.deeperRespawn
      : this.deepCavernEntered ? DEEP_AREA.entry : CAVERN_ENTRY;
    this.returnToThreshold = false;
    this.returnFromValley = false;
    this.returnToValleyPortal = false;
    this.returnToFrontierPortal = false;
    this.returnFromDunes = false;
    this.returnFromSandpit = false;
    this.returnFromFrost = false;
    this.glacierArrival = undefined;
    this.player = new Player(this, entry.x, entry.y, this.characterMaxHp, this.qualityReference === 'reference',
      this.qualityReference !== 'baseline' && !this.originalWarrior, id => this.progression.upgradeRank(id), this.classId);
    if (this.classId === 'hunter') {
      this.hunter = new HunterCombat(this, id => this.progression.upgradeRank(id));
      this.hunterArt = new HunterArt(this, this.player.view, entry.x, entry.y);
    }
    if (this.transferHp !== undefined) this.player.health.current = Math.min(this.transferHp, this.player.maxHp);
    this.transferHp = undefined;
    this.kineticWave = this.add.graphics().setDepth(14999);
    this.controls = new Controls(this, () => this.sounds.unlock(), () => {
      if (!this.player.isDead && !this.records?.isOpen) this.beginStrike(this.time.now);
    });
    this.controls.setCombatPresentation(this.classId === 'hunter');
    this.updateMusicRegion(true);
    this.sounds.setMusicFocus(1);
    const spawns = this.area === 'forest' ? FOREST_SPAWNS : CAVERN_HOLLOWS;
    if (this.area === 'forest' || this.area === 'cavern') spawns.forEach((point, index) => {
      const enemy = new HollowCrawler(this, point.x, point.y, this.area === 'forest' ? FOREST_PATROLS[index] : undefined, this.qualityReference === 'reference');
      this.enemies.push(enemy);
      this.enemySpecies.set(enemy, 'crawler');
      this.hollowSpawnIds.set(enemy, this.area === 'forest' ? index : FOREST_SPAWNS.length + index);
    });
    if (this.area === 'cavern' && this.deepPassageOpen) this.spawnDeepHollows();
    if (this.area === 'valley') for (const habitat of VALLEY_ENCOUNTERS) {
      this.spawnValleyResident(habitat);
    }
    if (this.area === 'arid') for (const habitat of SIROCCO_ENCOUNTERS) this.spawnSiroccoResident(habitat);
    if (this.area === 'dunes') for (const habitat of DUNES_ENCOUNTERS) this.spawnSiroccoResident(habitat);
    if (this.area === 'icecave') for (const habitat of GLACIER_ENCOUNTERS) this.spawnSiroccoResident(habitat);
    if (this.area === 'frost') for (const habitat of FROST_ENCOUNTERS) this.spawnSiroccoResident(habitat);
    if (this.area === 'icenest') {
      this.icenestVisited = true; this.vesperHud = new WardenHud(this, 'VÉSPER · SOPRO BRANCO');
      if (!this.vesperDefeated) {
        this.vesper = new Vesper(this, cue => this.vesperCue(cue), () => { this.glacier?.resolve(); this.hud.showDiscovery('O GELO SILENCIOU\nINVESTIGUE O REGISTRO DO NINHO'); this.sounds.signal(); });
        this.enemies.push(this.vesper); this.enemySpecies.set(this.vesper, 'vesper');
      } else this.sounds.stopMusic();
    }
    if (this.area === 'sandpit') {
      this.soterradoReached = true;
      this.soterradoHud = new WardenHud(this, 'O SOTERRADO');
      if (!this.soterradoDefeated) {
        this.soterrado = new Soterrado(this, SANDPIT.spawn.x, SANDPIT.spawn.y, this.sandpit!.bounds,
          (cue, attack) => this.soterradoCue(cue, attack), () => this.finishSoterrado());
        this.enemies.push(this.soterrado);
        this.enemySpecies.set(this.soterrado, 'soterrado');
      } else this.sounds.stopMusic();
    }
    this.hud = new Hud(this, () => this.restart(), this.classId === 'hunter');
    if (this.qualityReference === 'reference') this.referenceImpacts = new ReferenceImpacts(this);
    this.navigation = this.qualityReference ? undefined : new WorldNavigator(this, () => ({ bounds: this.movementBounds, obstacles: this.arena.obstacles }));
    this.explorationGuide = new ExplorationGuide(this, this.navigation);
    if (this.area === 'warden') {
      this.signalPortal = new SignalPortal(this, { x: 1500, y: 830 }, this.wardenDefeated);
      this.wardenHud = new WardenHud(this);
      if (!this.wardenDefeated) {
        this.warden = new Warden(this, 1170, 735, this.wardenArena!.bounds, (cue, attack) => this.wardenCue(cue, attack), () => this.finishWarden());
        this.enemies.push(this.warden);
        this.enemySpecies.set(this.warden, 'warden');
      } else {
        this.sounds.stopMusic();
        this.hud.showDiscovery('TRANSMISSÃO LIBERADA\nFRAGMENTO: RETORNO CONFIRMADO\nDESTINO: ILEGÍVEL');
      }
    }
    if (this.area === 'valley') {
      this.signalPortal = new SignalPortal(this, VALLEY.portal, true);
      this.chapterPortal = new ChapterPortal(this, VALLEY.frontier.portal, this.valleyFrontierEndSeen);
      if (!this.valleyVisited) this.hud.showDiscovery('VALE DA RESSONÂNCIA\nOUTRA MARGEM DE DANTE');
      this.valleyVisited = true;
    }
    if (this.area === 'arid') {
      this.chapterPortal = new ChapterPortal(this, SIROCCO.returnPortal, true);
      if (!this.aridVisited) this.hud.showDiscovery('NOVA REGIÃO\nBACIA DO SIROCO');
      this.aridVisited = true;
    }
    if (this.area === 'dunes') {
      this.chapterPortal = this.dunes!.returnPortal;
      if (!this.dunesVisited) this.hud.showDiscovery('DUNAS INTERIORES\nO SINAL SEGUE SOB A AREIA');
      this.dunesVisited = true;
    }
    this.updateProgressHud();
    this.hud.setSignalObjective(this.progression.signalSynchronized, this.progression.sourceLocated, this.progression.passageOpen, this.area === 'cavern', this.cavernDepthSeen, this.deepAreaSeen);
    if (this.area === 'icecave' || this.area === 'icenest') {
      if (this.area === 'icecave' && (!this.icecaveVisited || entry.x === GLACIER.icecave.entry.x)) this.hud.showDiscovery('GALERIAS DO DEGELO\nA ROCHA GUARDA O CALOR SOB O GELO');
      if (this.area === 'icecave') this.icecaveVisited = true;
      this.hud.setGlacierArea(this.area === 'icenest', this.icecaveSignalSeen, this.vesperDefeated);
    }
    if (this.area === 'warden') this.hud.setWardenArea();
    if (this.area === 'valley') this.hud.setValleyArea(this.valleyFrontierReached);
    if (this.area === 'arid') this.hud.setAridArea(this.aridSignalSeen, this.aridFrontierReached);
    if (this.area === 'dunes') this.hud.setDunesArea(this.dunesRuinsSeen, this.dunesDepthSeen);
    if (this.area === 'frost') {
      if (!this.frostVisited) this.hud.showDiscovery('FRATURA BOREAL\nO SINAL ATRAVESSA O GELO');
      this.frostVisited = true;
      this.hud.setFrostArea(this.frostSignalSeen);
    }
    if (this.area === 'sandpit' && this.soterradoClueSeen) {
      this.coldPortal = new ChapterPortal(this, { x: SANDPIT.clue.x, y: SANDPIT.clue.y + 60 }, true);
      this.sandpit?.hideClueForPortal();
    }
    if (this.area === 'sandpit') this.hud.setSandpitArea(this.soterradoDefeated, this.soterradoClueSeen);
    this.inDeepCavern = this.area === 'cavern' && this.deepCavernEntered;
    if (this.area === 'cavern') this.hud.setCavernDepth(this.inDeepCavern);
    this.continuationRegion = this.exteriorEntered ? 'exterior' : this.deeperEntered ? 'deeper' : 'deep';
    if (this.area === 'cavern' && this.continuationRegion !== 'deep') this.hud.setContinuationArea(this.continuationRegion === 'exterior', this.fragmentSeen, this.firstEchoSeen);
    this.cameras.main.setBounds(0, 0, this.area === 'icecave' || this.area === 'icenest' ? GLACIER[this.area].width : this.area === 'frost' ? FROST.width : this.area === 'sandpit' ? SANDPIT.width : this.area === 'valley' ? VALLEY.cameraWidth : this.area === 'arid' ? SIROCCO.cameraWidth : this.area === 'dunes' ? DUNES.width : this.area === 'cavern' ? W.cameraWidth : WORLD_WIDTH, this.area === 'icecave' || this.area === 'icenest' ? GLACIER[this.area].height : this.area === 'frost' ? FROST.height : this.area === 'dunes' ? DUNES.height : WORLD_HEIGHT)
      .startFollow(this.player.view, false, 0.1, 0.1);
    this.cameras.main.setBackgroundColor(this.area === 'sandpit' || this.area === 'arid' || this.area === 'dunes' ? '#5c3327' : this.area === 'forest' || this.area === 'valley' ? '#102d2c' : '#07151c');
    if (this.area !== 'forest') {
      this.cameras.main.centerOn(entry.x, entry.y);
      this.cameras.main.fadeIn(260, 5, 15, 20);
    }
    this.input.setDefaultCursor('crosshair');
    this.records = new RecordsPanel(this, () => ({
      level: this.progression.level, xp: this.progression.xp, echoes: this.progression.echoes.size,
      nextLevelXp: this.progression.nextLevelXp, maxHp: this.characterMaxHp,
      nextLevelHpGain: this.progression.nextLevelHpGain, upgradePointsAvailable: this.progression.upgradePointsAvailable,
      abilityUpgradeRanks: this.progression.abilityUpgradeRanks,
      area: this.area === 'icecave' || this.area === 'icenest' ? GLACIER[this.area].name : this.area === 'frost' ? 'Fratura Boreal' : this.area === 'sandpit' ? 'Bacia Soterrada' : this.area === 'dunes' ? 'Dunas Interiores' : this.area === 'arid' ? 'Bacia do Siroco' : this.area === 'valley' ? 'Vale da Ressonância' : this.area === 'warden' ? 'Domínio do Guardião' : this.area === 'cavern' ? 'Cavernas de Dante' : 'Floresta de Dante',
      bestiary: this.bestiary.snapshot(), routes: this.valleyRoutes, valleyVisited: this.valleyVisited,
      saveStatus: this.glacierPlaytest ? 'Playtest temporário. Sua jornada e personagens permanecem intactos.' : coopSession.role === 'guest' ? `Kit temporário do anfitrião. XP pessoal +${coopSession.personalXpGained}: ${coopSession.rewardSaved ? 'salvo na sua jornada solo' : 'aguardando armazenamento'}. Descobertas da campanha continuam separadas.` : this.qualityReference ? 'Referência isolada. O progresso do jogo permanece intacto.' : this.journey.status,
      rewardedRoutes: this.progression.rewardedRoutes,
    }), () => { this.pauseForModal(); this.saveProgress(); }, () => this.resumeFromModal(), () => {
      if (coopSession.role === 'guest') return;
      if (coopSession.role === 'host') coopSession.disconnect();
      if (this.qualityReference || this.glacierPlaytest) { location.reload(); return; }
      if (this.journey.clear()) { this.resettingJourney = true; location.reload(); }
      else this.records.setSaveAvailable(false);
    });
    this.records.setResetAllowed(coopSession.role !== 'guest');
    this.abilityUpgradeDialog = new AbilityUpgradeDialog(this, id => {
      const invested = this.progression.investUpgrade(id);
      if (invested) { this.updateProgressHud(); this.saveProgress(); this.sounds.ancient(); }
      return invested;
    }, () => {
      this.resumeFromModal();
      if (this.progression.upgradePointsAvailable > 0) this.time.delayedCall(100, () => this.showAvailableUpgrade());
    }, this.classId === 'hunter');
    const flush = () => this.saveProgress();
    const hidden = () => { if (document.hidden) flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', hidden);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      flush();
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', hidden);
    });
    // Persist chapter access immediately. A mobile browser may suspend or evict
    // the page without sending a reliable later interaction or shutdown event.
    if (this.area === 'icecave' || this.area === 'icenest' || this.area === 'frost' || this.area === 'arid' || this.area === 'dunes' || this.area === 'sandpit') this.saveProgress();
    if (!this.qualityReference && this.progression.upgradePointsAvailable > 0) {
      this.time.delayedCall(350, () => this.showAvailableUpgrade());
    }
    this.party = this.qualityReference || this.glacierPlaytest ? undefined : new PartyExpedition(this, () => this.partyBridge());
    this.shellReady?.(this);
  }

  update(time: number, delta: number): void {
    time -= this.recordsTimeOffset;
    if (this.transitioning) return;
    this.controls.update(this.player.position);
    // Do not simulate an authoritative world while its room is reconnecting.
    if (coopSession.role === 'host' && !coopSession.connected) { this.party?.showConnection(); return; }
    if (coopSession.role === 'guest') {
      this.visitingCoop = true;
      if (this.controls.recordsPressed) { this.records.open(); return; }
      this.party?.updateGuest(time, Math.min(delta / 1000, .04));
      this.hud.setInputMethod(this.controls.inputMethod);
      updateEnvironmentOcclusion(this, this.player.position, Math.min(delta / 1000, .04));
      this.updateMusicRegion(); this.updateExplorationGuide();
      return;
    }
    this.party?.updateHost(time, Math.min(delta / 1000, .04));
    this.referenceImpacts?.update(time);
    if (this.controls.recordsPressed) { this.records.open(); return; }
    this.hud.setInputMethod(this.controls.inputMethod);
    const remoteInteraction = this.party?.takeInteraction();
    const interactionPosition = remoteInteraction ?? this.player.position;
    const interact = this.controls.interactPressed || !!remoteInteraction;
    const nearbyEcho = this.echoSites.find(site => site.canInvestigate(interactionPosition, this.player.isDead));
    const nearDiscovery = nearbyEcho !== undefined;
    const nearThreshold = this.threshold?.canInvestigate(interactionPosition, this.player.isDead) ?? false;
    const nearMechanism = this.mechanism?.canInvestigate(interactionPosition, this.player.isDead) ?? false;
    const nearFragment = this.cavern?.continuation.canInvestigate(interactionPosition, this.player.isDead, this.fragmentSeen) ?? false;
    const nearFirstEcho = this.fragmentSeen && (this.cavern?.wardenApproach.canInvestigate(interactionPosition, this.player.isDead) ?? false);
    const nearWardenGate = this.cavern?.wardenApproach.canOpen(interactionPosition, this.player.isDead) ?? false;
    const nearWardenExit = this.area === 'warden' && this.wardenDefeated && !this.player.isDead && distance(interactionPosition, { x: 540, y: 760 }) < 115;
    const nearPortal = this.signalPortal?.canTraverse(interactionPosition, this.player.isDead) ?? false;
    const nearChapterPortal = this.chapterPortal?.canEnter(interactionPosition, this.player.isDead) ?? false;
    const nearSiroccoExit = this.sirocco?.exitPortal.canEnter(interactionPosition, this.player.isDead) ?? false;
    const nearValleyLandmark = this.valley?.canInvestigate(interactionPosition, this.player.isDead, this.valleyLandmarkSeen) ?? false;
    const nearValleyFrontierSignal = this.valley?.canInvestigateFrontier(interactionPosition, this.player.isDead, this.valleyFrontierSignalSeen) ?? false;
    const nearSiroccoSignal = this.sirocco?.canInvestigate(interactionPosition, this.player.isDead, this.aridSignalSeen) ?? false;
    const nearDunesRuin = this.dunes?.canInvestigate(interactionPosition, this.player.isDead, this.dunesRuinsSeen) ?? false;
    const nearSandpitDescent = this.area === 'dunes' && this.dunesDepthSeen && !this.player.isDead && distance(interactionPosition, DUNES.hollow) < 115;
    const nearSandpitAscent = this.area === 'sandpit' && !this.player.isDead && distance(interactionPosition, SANDPIT.ascent) < SANDPIT.ascent.radius
      && (this.soterradoDefeated || this.soterrado?.state === 'DORMANT');
    const nearColdClue = this.area === 'sandpit' && this.soterradoDefeated && !this.soterradoClueSeen && !this.player.isDead && distance(interactionPosition, SANDPIT.clue) < SANDPIT.clue.radius;
    const nearColdPortal = this.soterradoClueSeen && (this.coldPortal?.canEnter(interactionPosition, this.player.isDead) ?? false);
    const nearFrostReturn = this.frost?.returnPortal.canEnter(interactionPosition, this.player.isDead) ?? false;
    const nearFrostRelay = this.frost?.canInvestigate(interactionPosition, this.player.isDead, this.frostSignalSeen) ?? false;
    const nearIceEntry = this.frost?.onward.canEnter(interactionPosition, this.player.isDead) ?? false;
    const nearIceBack = !this.player.isDead && (this.glacier?.back.canEnter(interactionPosition, false) ?? false)
      && (this.area !== 'icenest' || this.vesperDefeated || this.vesper?.state === 'DORMANT');
    const nearIceExit = this.glacier?.onward?.canEnter(interactionPosition, this.player.isDead) ?? false;
    const nearIceRelay = !!this.glacier && !this.player.isDead && distance(interactionPosition, GLACIER[this.glacier.id].relay) < GLACIER[this.glacier.id].relay.radius
      && (this.area === 'icecave' ? !this.icecaveSignalSeen : this.vesperDefeated && !this.vesperClueSeen);
    if (interact && nearIceEntry) {
      if (this.coopSoloPassage()) return;
      this.icecaveVisited = true; this.glacierArrival = { ...GLACIER.icecave.entry }; this.transitionArea('icecave'); return;
    } else if (interact && nearIceBack) {
      if (this.area === 'icenest') { this.glacierArrival = { x: 2660, y: 980 }; this.transitionArea('icecave'); }
      else { this.glacierArrival = { x: 2500, y: 1000 }; this.transitionArea('frost'); }
      return;
    } else if (interact && nearIceExit) {
      this.icenestVisited = true; this.glacierArrival = { ...GLACIER.icenest.entry }; this.transitionArea('icenest'); return;
    } else if (interact && nearIceRelay) {
      if (this.area === 'icecave') { this.icecaveSignalSeen = true; this.glacier?.respond(); this.hud.showDiscovery('O GELO RESPONDE\nUM SOPRO VEM DO NINHO'); }
      else { this.vesperClueSeen = true; this.hud.showDiscovery('REGISTRO RECUPERADO\nO SINAL ATRAVESSA OUTRAS CAMADAS\nDESTINO AINDA ILEGÍVEL'); }
      this.hud.setGlacierArea(this.area === 'icenest', this.icecaveSignalSeen, this.vesperDefeated); this.sounds.ancient(); this.saveProgress();
    } else if (nearColdPortal && interact) {
      this.transitionArea('frost'); return;
    } else if (nearFrostReturn && interact) {
      this.returnFromFrost = true; this.transitionArea('sandpit'); return;
    } else if (nearFrostRelay && interact) {
      this.frostSignalSeen = true; this.frost?.respond(); this.hud.setFrostArea(true);
      this.hud.showDiscovery('REGISTRO SOB O GELO\nA MESMA ASSINATURA. OUTRA FREQUÊNCIA.\nO SINAL SEGUE A FRATURA');
      this.sounds.signal(); this.records.markDiscovery(); this.saveProgress();
    } else if (nearSandpitDescent && interact) {
      if (this.coopSoloPassage()) return;
      this.soterradoReached = true;
      this.transitionArea('sandpit'); return;
    } else if (nearSandpitAscent && interact) {
      this.returnFromSandpit = true;
      this.transitionArea('dunes'); return;
    } else if (nearColdClue && interact) {
      this.soterradoClueSeen = true;
      this.coldPortal = new ChapterPortal(this, { x: SANDPIT.clue.x, y: SANDPIT.clue.y + 60 }, true);
      this.sandpit?.hideClueForPortal();
      this.hud.setSandpitArea(true, true);
      this.hud.showDiscovery('PASSAGEM REVELADA\nLEITURA AO NORTE: ABAIXO DE ZERO\nO SINAL CONTINUA');
      this.sounds.signal(); this.records.markDiscovery(); this.saveProgress();
    } else if (nearDiscovery && interact) {
      const wasSynchronized = this.progression.signalSynchronized;
      nearbyEcho.activate();
      const leveledUp = this.progression.discover(nearbyEcho.id);
      this.hud.showDiscovery(nearbyEcho.message);
      this.updateProgressHud();
      this.hud.showExperienceAt(nearbyEcho.position.x, nearbyEcho.position.y, PROGRESSION.echoXp);
      if (leveledUp) this.levelUp();
      this.sounds.discovery();
      if (!wasSynchronized && this.progression.signalSynchronized) this.synchronizeSignal();
    } else if (interact && nearThreshold && this.progression.locateSource()) {
      this.threshold?.locateSource();
      this.mechanism?.arm();
      this.hud.showDiscovery(SIGNAL_THRESHOLD.thresholdMessage);
      this.hud.setSignalObjective(true, true);
      this.sounds.signal();
    } else if (interact && nearMechanism && this.progression.openPassage()) {
      this.mechanism?.activate(() => {
        this.threshold?.open(() => {
          if (this.gateObstacle) {
            const index = this.arena.obstacles.indexOf(this.gateObstacle);
            if (index >= 0) this.arena.obstacles.splice(index, 1);
            this.gateObstacle = undefined;
          }
          this.hud.showDiscovery(SIGNAL_THRESHOLD.openedMessage);
        });
      });
      this.hud.showDiscovery(SIGNAL_THRESHOLD.openingMessage);
      this.hud.setSignalObjective(true, true, true);
      this.sounds.ancient();
    } else if (interact && nearFragment) {
      this.fragmentSeen = true;
      this.cavern?.continuation.respond();
      this.hud.showDiscovery('FRAGMENTO DE TRANSMISSÃO\nPADRÃO: RESPOSTA');
      this.hud.setContinuationArea(true, true);
      this.sounds.signal();
    } else if (interact && nearFirstEcho) {
      // Register immediately so a death during the response cannot replay it.
      this.firstEchoSeen = true;
      this.hud.setContinuationArea(true, true, true);
      this.sounds.ancient();
      this.cavern?.wardenApproach.activate(stage => {
        if (this.player.isDead) return;
        this.hud.showDiscovery(stage === 'revelation' ? W.revelation : stage === 'confirmation' ? W.confirmation : W.continuation);
        this.sounds.signal();
      });
    } else if (interact && nearWardenGate) {
      this.hud.showDiscovery('O REGISTRO FOI RECONHECIDO\nO LIMIAR ESTÁ RESPONDENDO');
      this.sounds.ancient();
      this.cavern?.wardenApproach.open(() => {
        this.wardenGateOpen = true;
        const index = this.arena.obstacles.findIndex(o => o.x === 6400 && o.y === 740);
        if (index >= 0) this.arena.obstacles.splice(index, 1);
        if (this.movementBounds) this.movementBounds.right = 6480;
        this.hud.showDiscovery('LIMIAR ABERTO\nATRAVESSE A PASSAGEM');
        this.saveProgress();
      });
    } else if (interact && nearPortal) {
      this.transitionArea(this.area === 'valley' ? 'warden' : 'valley');
      return;
    } else if (interact && nearSiroccoExit) {
      this.transitionArea('dunes');
      return;
    } else if (interact && nearChapterPortal) {
      if (this.area === 'valley' && this.valleyFrontierEndSeen) {
        this.transitionArea('arid');
        return;
      }
      if (this.area === 'arid') {
        this.transitionArea('valley');
        return;
      }
      if (this.area === 'dunes') {
        this.returnFromDunes = true;
        this.transitionArea('arid');
        return;
      }
    } else if (interact && nearDunesRuin) {
      this.dunesRuinsSeen = true;
      this.dunes?.respond();
      this.hud.setDunesArea(true, this.dunesDepthSeen);
      this.hud.showDiscovery('RUÍNAS SOTERRADAS\nO SINAL ATRAVESSA A CAMADA DE AREIA');
      this.sounds.ancient();
      this.saveProgress();
    } else if (interact && nearSiroccoSignal) {
      this.aridSignalSeen = true;
      this.sirocco?.respond();
      this.hud.setAridArea(true, this.aridFrontierReached);
      this.saveProgress();
      this.hud.showDiscovery('RELE MAPEADO\nO SINAL SEGUE A LESTE');
      this.sounds.signal();
    } else if (interact && nearValleyLandmark) {
      this.valleyLandmarkSeen = true;
      this.valley?.respond();
      this.hud.showDiscovery('RESPOSTA DO OUTRO LADO\nO SINAL ATRAVESSOU COM VOCÊ');
      this.sounds.signal();
    } else if (interact && nearValleyFrontierSignal) {
      this.valleyFrontierSignalSeen = true;
      this.valley?.respondFrontier();
      this.saveProgress();
      this.hud.showDiscovery('ECO RECENTE\nORIGEM: ALÉM DA ESCARPA');
      this.sounds.signal();
    } else if (interact && nearWardenExit) {
      this.transitionArea('cavern');
      return;
    } else if (interact && this.area === 'forest' && !this.progression.sourceLocated &&
      distance(this.player.position, { x: SIGNAL_THRESHOLD.mechanismX, y: SIGNAL_THRESHOLD.mechanismY }) <= SIGNAL_THRESHOLD.mechanismRadius) {
      this.hud.showDiscovery(this.progression.signalSynchronized
        ? 'MECANISMO INATIVO\nInvestigue a fissura ao lado primeiro.'
        : 'MECANISMO INATIVO\nEncontre e investigue os 3 Ecos.');
    }
    const canInteract = nearIceEntry || nearIceBack || nearIceExit || nearIceRelay || nearColdPortal || nearFrostReturn || nearFrostRelay || nearSandpitDescent || nearSandpitAscent || nearColdClue || nearDiscovery || nearThreshold || nearMechanism || nearFragment || nearFirstEcho || nearWardenGate || nearWardenExit || nearPortal || nearChapterPortal || nearSiroccoExit || nearSiroccoSignal || nearDunesRuin || nearValleyLandmark || nearValleyFrontierSignal;
    const interactionAction = nearIceEntry || nearIceBack || nearIceExit ? 'ENTRAR' : nearColdPortal || nearFrostReturn ? 'ENTRAR' : nearSandpitDescent ? 'DESCER' : nearSandpitAscent ? 'SUBIR' : nearPortal || nearChapterPortal || nearSiroccoExit ? 'ENTRAR' : 'INVESTIGAR';
    if (interact) this.saveProgress();
    this.hud.setDiscoveryPrompt(canInteract, interactionAction);
    this.controls.setInteractAvailable(canInteract, interactionAction);
    this.controls.setDead(this.player.isDead);
    this.updateExplorationGuide();
    if (this.player.isDead) {
      this.hunter?.clear();
      this.sounds.setMusicFocus(1);
      if (this.controls.restartPressed || this.party?.takeRestart()) this.restart();
      return;
    }
    const dt = Math.min(delta / 1000, 0.04);
    const input = this.controls.movement();
    const aim = this.controls.aimFrom(this.player.position);
    this.charge.tick(time);
    if (this.controls.chargeCancelled) this.charge.stop();
    if (this.controls.chargePressed && !this.player.isDashing && this.attack.pose(time, aim).phase === 'READY' && this.charge.start(time)) {
      this.sounds.charge();
    }
    if ((this.controls.chargeReleased || (this.charge.phase === 'CHARGING' && !this.controls.chargeHeld)) && this.charge.release(time, aim, this.player.position)) {
      this.sounds.swing();
      if (this.hunter) this.hunter.fire(time, this.player.position, aim, this.charge.damage);
      else this.chargeBurst();
    }
    const heavy = this.charge.pose(time);
    const heavyBusy = heavy.phase !== 'READY';
    const facing = heavy.phase === 'RELEASE' ? this.charge.angle : aim;
    if (this.controls.dashPressed && !heavyBusy && this.player.startDash(time, input)) {
      this.sounds.dash();
      this.dashBurst(input);
    }
    if (this.controls.attacking && !heavyBusy) this.beginStrike(time);
    const pose = this.attack.pose(time, facing);
    const wasDashing = this.player.isDashing;
    if (this.area === 'warden' || this.area === 'sandpit' || this.area === 'icenest') {
      this.playerObstacles.length = 0;
      this.playerObstacles.push(...this.arena.obstacles);
      if (this.warden && !this.warden.isDead) {
        Object.assign(this.bossFootprint, this.warden.position, { radius: this.warden.radius });
        this.playerObstacles.push(this.bossFootprint);
      }
      if (this.vesper?.solid) { Object.assign(this.bossFootprint, this.vesper.position, { radius: this.vesper.radius }); this.playerObstacles.push(this.bossFootprint); }
      if (this.soterrado?.solid) {
        Object.assign(this.bossFootprint, this.soterrado.position, { radius: this.soterrado.radius });
        this.playerObstacles.push(this.bossFootprint);
      }
    }
    this.player.update(time, dt, input, facing, this.area === 'warden' || this.area === 'sandpit' || this.area === 'icenest' ? this.playerObstacles : this.arena.obstacles, pose, heavy, this.movementBounds);
    this.updateMusicRegion();
    this.hunterArt?.update(this.player.position.x, this.player.position.y, facing, time < (this.hunter?.firedUntil ?? 0), this.player.isDashing, heavy);
    updateEnvironmentOcclusion(this, this.player.position, dt);
    if (wasDashing && !this.player.isDashing) this.dashEnd();
    if (this.player.isDashing && time - this.lastDashTrail > 30) {
      this.lastDashTrail = time;
      this.dashTrail();
    }
    this.bossTargets.length = 0;
    if (this.warden?.canBeHit) this.bossTargets.push(this.warden);
    if (this.soterrado?.canBeHit) this.bossTargets.push(this.soterrado);
    if (this.vesper?.canBeHit) this.bossTargets.push(this.vesper);
    const targets = this.area === 'warden' || this.area === 'sandpit' || this.area === 'icenest' ? this.bossTargets : this.enemies;
    if (this.charge.wavePending) {
      const waveHits = this.charge.takeHits(time, this.hunter ? [] : targets);
      this.resolvePlayerHits(time, waveHits, this.charge.damage, this.charge.angle, 0x5fe6d8, this.charge.origin, true);
    }
    if (!this.hunter) this.renderKineticWave(time);
    if (this.hunter) {
      this.hunter.update(dt, this.player.position, !heavyBusy && Math.hypot(this.player.velocity.x, this.player.velocity.y) > 1, targets, this.arena.obstacles, this.movementBounds,
        (enemy, damage, angle, precision) => this.resolvePlayerHits(time, [enemy], damage, angle, 0x5fe6d8, this.player.position, precision));
      this.hud.setHunterMomentum(this.hunter.momentum);
    } else {
      const sweep = this.attack.advance(time, this.player.position, facing, targets);
      this.resolveSaberHits(time, sweep.hits, sweep.pose.worldAngle);
    }
    for (const enemy of this.enemies) {
      const species = this.enemySpecies.get(enemy);
      if (species && !enemy.isDead && distance(this.player.position, enemy.position) <= 320 &&
        (species !== 'warden' || this.warden?.state !== 'DORMANT') && (species !== 'soterrado' || this.soterrado?.state !== 'DORMANT') && this.bestiary.see(species)) {
        this.records.markDiscovery();
        this.saveProgress();
      }
      const target = this.party?.targetFor(enemy) ?? this.player;
      enemy.update(time, dt, target.position, target.isDead, this.arena.obstacles, impact => this.enemyStrike(enemy, impact, target), this.movementBounds);
    }
    this.enemies = this.enemies.filter(enemy => !enemy.isDead);
    this.hud.update(this.player.hp, this.player.maxHp, this.player.dashProgress, this.charge.getProgress(time), heavy.phase, heavy.level,
      this.player.dashCooldown, this.charge.cooldown);
    if (this.qualityReference) return;
    if (this.area === 'sandpit') {
      if (this.soterrado?.state === 'DORMANT' && this.player.position.x >= SANDPIT.awakeningX) this.soterrado.beginIntro(time);
      this.soterradoHud?.update(this.soterrado);
      return;
    }
    if (this.area === 'warden') {
      if (!this.wardenDefeated && this.warden?.state === 'DORMANT' && this.player.position.x >= 850) {
        this.warden.beginIntro(time);
        this.wardenArena?.setEncounterActive(true);
      }
      this.wardenHud?.update(this.warden);
      return;
    }
    if (this.area === 'icenest') {
      if (this.vesper?.state === 'DORMANT' && this.player.position.x >= VESPER.awakeningX) { this.vesperReached = true; this.saveProgress(); this.vesper.beginIntro(time); this.glacier?.setEncounterActive(true); }
      this.vesperHud?.update(this.vesper); return;
    }
    if (this.area === 'icecave') {
      this.renewSiroccoHabitats();
      for (const route of GLACIER_ROUTES) if (this.explorationNear(route, route.radius)) {
        const reward = this.progression.discoverSiroccoRoute(route.id);
        if (reward.awarded) { this.updateProgressHud(); this.hud.showExperienceAt(route.x, route.y, PROGRESSION.valleyRouteXp); this.hud.showDiscovery(route.name.toLocaleUpperCase('pt-BR')); if (reward.leveledUp) this.levelUp(); this.saveProgress(); }
      }
      return;
    }
    if (this.area === 'frost') {
      this.renewSiroccoHabitats();
      for (const route of FROST_ROUTES) if (this.explorationNear(route, route.radius)) {
        const reward = this.progression.discoverSiroccoRoute(route.id);
        if (reward.awarded) {
          this.updateProgressHud(); this.hud.showExperienceAt(route.x, route.y, PROGRESSION.valleyRouteXp);
          this.hud.showDiscovery(route.name.toLocaleUpperCase('pt-BR'));
          if (reward.leveledUp) this.levelUp(); this.saveProgress();
        }
      }
      if (this.frostSignalSeen && !this.frostEndSeen && this.explorationNear(FROST.frontier, FROST.frontier.radius)) {
        this.frostEndSeen = true; this.hud.showDiscovery('FRATURA PROFUNDA\nALGO RESPONDE ALÉM DO GELO');
        this.sounds.signal(); this.saveProgress();
      }
      return;
    }
    if (this.area === 'dunes') {
      this.renewSiroccoHabitats();
      for (const route of DUNES_ROUTES) if (this.explorationNear(route, route.radius)) {
        const reward = this.progression.discoverSiroccoRoute(route.id);
        if (reward.awarded) {
          this.updateProgressHud();
          this.hud.showExperienceAt(route.x, route.y, PROGRESSION.valleyRouteXp);
          this.hud.showDiscovery(`${route.name.toLocaleUpperCase('pt-BR')}\nNOVO TRECHO EXPLORADO`);
          if (reward.leveledUp) this.levelUp();
          this.records.markDiscovery();
          this.saveProgress();
        }
      }
      if (this.dunesRuinsSeen && !this.dunesDepthSeen && this.explorationNear(DUNES.hollow, DUNES.hollow.radius)) {
        this.dunesDepthSeen = true;
        this.hud.setDunesArea(true, true);
        this.hud.showDiscovery('DEPRESSÃO DE AREIA\nRASTROS ENORMES. HÁ UMA DESCIDA AQUI.');
        this.dunes?.warnBelow();
        this.sounds.wardenCue('intro');
        this.saveProgress();
      }
      this.sounds.setMusicFocus(distance(this.player.position, DUNES.hollow) < 420 ? .6 : 1);
      return;
    }
    if (this.area === 'arid') {
      this.renewSiroccoHabitats();
      for (const route of SIROCCO_ROUTES) if (!this.progression.rewardedRoutes.has(route.id) && this.explorationNear(route, route.radius)) {
        const reward = this.progression.discoverSiroccoRoute(route.id);
        if (reward.awarded) {
          this.updateProgressHud();
          this.hud.showExperienceAt(route.x, route.y, PROGRESSION.valleyRouteXp);
          this.hud.showDiscovery(`${route.name.toLocaleUpperCase('pt-BR')}\nVESTÍGIO MAPEADO`);
          if (reward.leveledUp) this.levelUp();
          this.records.markDiscovery();
          this.saveProgress();
        }
      }
      if (this.aridSignalSeen && !this.aridFrontierEntered && this.explorationAhead(SIROCCO.frontierEntryX)) {
        this.aridFrontierEntered = true;
        this.hud.setAridArea(true, this.aridFrontierReached);
        this.hud.showDiscovery('MARGEM LESTE\nO SINAL ATRAVESSA AS CRISTAS');
        this.sounds.signal();
        this.saveProgress();
      }
      if (this.aridSignalSeen && !this.aridFrontierReached && this.explorationNear(SIROCCO.end, SIROCCO.end.radius)) {
        this.aridFrontierReached = true;
        this.sirocco?.revealExit();
        this.hud.setAridArea(true, true);
        this.hud.showDiscovery('PASSAGEM PARA O INTERIOR\nO SINAL ATRAVESSA AS DUNAS');
        this.sounds.signal();
        this.saveProgress();
      }
      return;
    }
    if (this.area === 'valley') {
      this.renewValleyHabitats();
      if (this.explorationAhead(1800) && !this.valleyCheckpointReached) { this.valleyCheckpointReached = true; this.saveProgress(); }
      if (this.explorationAhead(VALLEY.frontier.threshold.x) && !this.valleyFrontierReached) {
        this.valleyFrontierReached = true;
        this.hud.setValleyArea(true);
        this.hud.showDiscovery('ESCARPA DA RESSONÂNCIA\nO SINAL SE ESTENDE A LESTE');
        this.sounds.signal();
        this.saveProgress();
      }
      for (const route of VALLEY_ROUTES) if ((!this.valleyRoutes.has(route.id) || !this.progression.rewardedRoutes.has(route.id)) && this.explorationNear(route, route.radius)) {
        this.valleyRoutes.add(route.id);
        const reward = this.progression.discoverValleyRoute(route.id);
        this.updateProgressHud();
        if (reward.awarded) this.hud.showExperienceAt(route.x, route.y, PROGRESSION.valleyRouteXp);
        this.hud.showDiscovery(`${route.name.toLocaleUpperCase('pt-BR')}\n${route.residents}`);
        if (reward.leveledUp) this.levelUp();
        this.records.markDiscovery();
        this.saveProgress();
      }
      if (!this.valleyEndSeen && this.explorationNear(VALLEY.end, VALLEY.end.radius)) {
        this.valleyEndSeen = true;
        this.sounds.signal();
        this.hud.showDiscovery('O SINAL SEGUE ADIANTE\nHÁ OUTRO CAMINHO ALÉM DAS ROCHAS');
        this.saveProgress();
      }
      if (!this.valleyFrontierEndSeen && this.valleyFrontierSignalSeen &&
        this.explorationNear(VALLEY.frontier.end, VALLEY.frontier.end.radius)) {
        this.valleyFrontierEndSeen = true;
        this.chapterPortal?.activate();
        this.sounds.signal();
        this.hud.showDiscovery('MISSÃO CONCLUÍDA\nPORTAL ABERTO: BACIA DO SIROCO');
        this.saveProgress();
      }
      return;
    }
    if (this.area === 'cavern' && this.wardenGateOpen && this.player.position.x >= 6230 && Math.abs(this.player.position.y - 740) < 140) this.transitionArea('warden');
    if (this.area === 'forest' && this.progression.passageOpen && !this.gateObstacle && this.threshold?.isInside(this.player.position)) this.enterCavern();
    if (this.area === 'cavern' && !this.deepPassageOpen && !this.deepOpening && distance(this.player.position, CAVERN_DEPTH_OPENING) <= CAVERN_DEPTH_OPENING.radius) {
      this.cavernDepthSeen = true;
      this.deepOpening = true;
      this.hud.showDiscovery('O SINAL CONTINUA\nA PEDRA ESTÁ RESPONDENDO');
      this.sounds.ancient();
      this.hud.setSignalObjective(true, true, true, true, true, false);
      this.cavern?.revealDeep(() => {
        this.deepOpening = false;
        this.deepPassageOpen = true;
        this.spawnDeepHollows();
        this.hud.showDiscovery('PASSAGEM REVELADA\nO SINAL VEM DE BAIXO');
        this.saveProgress();
      });
    }
    const inDeep = this.area === 'cavern' && this.deepPassageOpen && this.player.position.x >= DEEP_AREA.entryX;
    if (inDeep !== this.inDeepCavern) {
      this.inDeepCavern = inDeep;
      if (this.player.position.x < EXPANSION.deeperX) this.hud.setCavernDepth(inDeep);
      if (inDeep && !this.deepCavernEntered) {
        this.deepCavernEntered = true;
        this.saveProgress();
        if (this.player.position.x < EXPANSION.deeperX) this.hud.showDiscovery('CAVERNA PROFUNDA\nSINAL: PRESENTE');
      }
    }
    if (this.area === 'cavern' && this.deepPassageOpen && !this.deepAreaSeen &&
      Math.hypot(this.player.position.x - DEEP_AREA.signalX, this.player.position.y - DEEP_AREA.signalY) <= DEEP_AREA.signalRadius) {
      this.deepAreaSeen = true;
      this.cavern?.respondToDeepSignal();
      this.hud.showDiscovery('PADRÃO ANCESTRAL\nA FONTE CONTINUA ABAIXO');
      this.sounds.signal();
      this.hud.setSignalObjective(true, true, true, true, true, true);
      this.hud.setCavernDepth(true);
      this.saveProgress();
    }
    if (inDeep && !this.deepEndSeen && distance(this.player.position, DEEP_AREA.end) <= DEEP_AREA.end.radius) {
      this.deepEndSeen = true;
      this.hud.showDiscovery('SINAL: MAIS PROFUNDO\nCAMINHO: DESCONHECIDO');
      this.sounds.signal();
      this.saveProgress();
    }
    if (this.area === 'cavern' && this.deepPassageOpen) this.updateContinuation();
  }

  private updateContinuation(): void {
    const x = this.player.position.x;
    // Spawn habitats shortly before arrival, never clamp distant residents into closed bounds.
    let spawnId = FOREST_SPAWNS.length + CAVERN_HOLLOWS.length + DEEP_HOLLOWS.length;
    EXPANSION_ENCOUNTERS.forEach((encounter, index) => {
      if (x >= encounter.x - 500 && !this.spawnedEncounters.has(index)) {
        this.spawnedEncounters.add(index);
        encounter.residents.forEach((resident, offset) => {
          const enemy: Enemy = resident.kind === 'crawler'
            ? new HollowCrawler(this, resident.x, resident.y)
            : new DanteCreature(this, resident.kind, resident.x, resident.y);
          this.enemies.push(enemy); this.hollowSpawnIds.set(enemy, spawnId + offset);
          this.enemySpecies.set(enemy, resident.kind);
        });
      }
      spawnId += encounter.residents.length;
    });
    if (x >= EXPANSION.deeperX && !this.deeperEntered) { this.deeperEntered = true; this.saveProgress(); }
    if (x >= EXPANSION.exteriorX && !this.exteriorEntered) {
      this.exteriorEntered = true;
      this.hud.showDiscovery('EXTERIOR DA CAVERNA\nO SINAL CONTINUA PRESENTE');
      this.saveProgress();
    }
    const region = x >= EXPANSION.exteriorX ? 'exterior' : x >= EXPANSION.deeperX ? 'deeper' : 'deep';
    if (region !== this.continuationRegion) {
      this.continuationRegion = region;
      if (region === 'deep') this.hud.setCavernDepth(this.inDeepCavern);
      else this.hud.setContinuationArea(region === 'exterior', this.fragmentSeen, this.firstEchoSeen);
    }
    if (!this.approachSeen && distance(this.player.position, EXPANSION.approach) <= EXPANSION.approach.radius) {
      this.approachSeen = true;
      this.hud.showDiscovery('VESTÍGIO MONUMENTAL\nFONTE: ALÉM');
      this.sounds.ancient();
    }
    const approach = this.cavern?.wardenApproach;
    approach?.showRecord(this.player.position);
    const nearArchive = distance(this.player.position, W.echo) <= W.echo.approachRadius;
    this.sounds.setMusicFocus(approach?.responding ? 0.2 : nearArchive ? 0.55 : this.player.position.x > 5830 ? 0.45 : 1);
    if (this.fragmentSeen && approach?.approach(this.player.position)) this.sounds.signal();
    if (this.firstEchoSeen && !approach?.responding && !this.wardenReached && distance(this.player.position, W.threshold) <= W.threshold.radius) {
      this.wardenReached = true;
      approach?.presence();
      this.hud.showDiscovery(W.presence);
      this.sounds.ancient();
      this.saveProgress();
    }
  }

  private updateExplorationGuide(): void {
    this.navigation?.update(this.player.position, this.player.rotation, this.player.isDead, this.time.now);
    if (this.glacier) {
      const c = GLACIER[this.glacier.id];
      const target: ExplorationTarget = distance(this.player.position, c.back) < 170 && (this.area !== 'icenest' || this.vesperDefeated || this.vesper?.state === 'DORMANT')
        ? { ...c.back, radius: 116, name: 'Retornar', instruction: 'Volte pela passagem.', action: 'enter' }
        : this.area === 'icecave' ? !this.icecaveSignalSeen
          ? { ...c.relay, name: 'Registro do degelo', instruction: 'Investigue as inscrições.', action: 'investigate' }
          : { ...c.exit, radius: 116, name: 'Ninho da Geada', instruction: 'Atravesse a passagem revelada.', action: 'enter' }
        : this.vesperDefeated ? { ...c.relay, name: 'Registro do ninho', instruction: this.vesperClueSeen ? 'Expedição concluída. Você pode retornar.' : 'Recupere o fragmento.', action: this.vesperClueSeen ? 'walk' : 'investigate' }
        : { ...VESPER.spawn, radius: 100, name: 'Vésper, o Sopro Branco', instruction: 'Saia das marcas. Ataque na recuperação.', action: 'walk' };
      this.explorationGuide.update(this.player.position, this.player.isDead, this.controls.inputMethod, c.name.toLocaleUpperCase('pt-BR'), target, this.hud); return;
    }
    if (this.area === 'frost') {
      const route = FROST_ROUTES.find(r => !this.progression.rewardedRoutes.has(r.id) && distance(this.player.position, r) < 260);
      const target: ExplorationTarget | undefined = distance(this.player.position, FROST.returnPortal) < 170
        ? { ...FROST.returnPortal, radius: 115, name: 'Retorno ao Siroco', instruction: 'Volte pela passagem.', action: 'enter' }
        : route ? { ...route, instruction: 'Explore este desvio.', action: 'walk' }
        : !this.frostSignalSeen ? { ...FROST.relay, name: 'Registro sob o gelo', instruction: 'As inscrições atravessam a formação.', action: 'investigate' }
        : { ...FROST.frontier, name: 'Galerias do Degelo', instruction: 'Entre pela fratura.', action: 'enter' };
      if (target) this.explorationGuide.update(this.player.position, this.player.isDead, this.controls.inputMethod, 'EXPLORE A FRATURA BOREAL', target, this.hud);
      else { this.explorationGuide.hide(); this.hud.setExplorationGuide('ALÉM DO GELO', 'A fratura continuará em uma próxima expedição.', ''); }
      return;
    }
    if (this.area === 'sandpit') {
      const resting = this.soterrado?.state === 'DORMANT';
      if (!resting && !this.soterradoDefeated) {
        this.explorationGuide.hide();
        this.hud.setExplorationGuide('O SOTERRADO', 'Saia das marcas. Ataque na recuperação.', '');
        return;
      }
      const target = this.soterradoDefeated
        ? { ...SANDPIT.clue, name: 'Passagem sob a areia', instruction: this.soterradoClueSeen ? 'Atravesse o portal para a Fratura Boreal.' : 'O desabamento expôs uma leitura do sinal.', action: this.soterradoClueSeen ? 'enter' as const : 'investigate' as const }
        : { ...SANDPIT.spawn, radius: 220, name: 'Algo sob a areia', instruction: resting ? 'Aproxime-se da bacia com cuidado.' : 'Saia das marcas. Ataque quando o corpo ficar exposto.', action: 'observe' as const };
      if (distance(this.player.position,SANDPIT.ascent)<110 && (resting||this.soterradoDefeated)) {
        this.explorationGuide.update(this.player.position,this.player.isDead,this.controls.inputMethod,'SUBIDA PARA AS DUNAS',
          {...SANDPIT.ascent,name:'Subida para as Dunas',instruction:'Volte pelo caminho de entrada.',action:'enter',interactionLabel:'SUBIR'},this.hud);
      } else this.explorationGuide.update(this.player.position,this.player.isDead,this.controls.inputMethod,
        this.soterradoDefeated?'O SINAL SEGUE AO NORTE':'BACIA SOTERRADA',target,this.hud);
      return;
    }
    if (this.qualityReference) {
      this.explorationGuide.hide();
      this.hud.setExplorationGuide('CÂMARA DE REFERÊNCIA', 'Compare o movimento e os impactos.', '');
      return;
    }
    let title: string, target: ExplorationTarget;
    if (this.area === 'warden') {
      if (this.signalPortal?.active) {
        this.explorationGuide.update(this.player.position, this.player.isDead, this.controls.inputMethod,
          'ATRAVESSE O PORTAL DO SINAL', { ...this.signalPortal.position, radius: 105, name: 'Portal do sinal',
            instruction: 'A fenda revelou outro destino.', action: 'investigate' }, this.hud);
        return;
      }
      this.explorationGuide.hide();
      this.hud.setExplorationGuide(this.wardenDefeated ? 'O SINAL FOI LIBERADO' : 'DOMÍNIO DO GUARDIÃO',
        this.wardenDefeated ? 'Há outro destino sob Dante.' : this.warden?.state === 'DORMANT' ? 'A presença está adiante.' : 'Observe as marcas e as janelas de ataque.',
        this.wardenDefeated ? 'Você pode voltar pela passagem a oeste.' : 'Use a esquiva para se reposicionar.');
      return;
    }
    if (this.area === 'dunes') {
      const nearbyRoute = DUNES_ROUTES.find(route => !this.progression.rewardedRoutes.has(route.id) && distance(this.player.position, route) < 330);
      const target = this.chapterPortal?.canEnter(this.player.position, this.player.isDead)
        ? { ...DUNES.returnPortal, radius: 116, name: 'Portal para a Bacia', instruction: 'Retorne à entrada do Siroco.', action: 'enter' as const }
        : nearbyRoute ? { ...nearbyRoute, instruction: 'Contorne a crista e explore este trecho.', action: 'walk' as const }
        : !this.dunesRuinsSeen ? { ...DUNES.ruin, name: 'Ruínas soterradas', instruction: 'As inscrições respondem ao sinal.', action: 'investigate' as const }
        : { ...DUNES.hollow, radius: 115, name: 'Descida da depressão', instruction: 'Rastros enormes levam à bacia. Desça para investigar.', action: 'enter' as const, interactionLabel: 'DESCER' };
      this.explorationGuide.update(this.player.position, this.player.isDead, this.controls.inputMethod,
        this.dunesDepthSeen ? 'DESÇA À BACIA' : this.dunesRuinsSeen ? 'SIGA A DESCIDA' : 'EXPLORE AS DUNAS', target, this.hud);
      return;
    }
    if (this.area === 'arid') {
      if (this.chapterPortal?.canEnter(this.player.position, this.player.isDead)) {
        this.explorationGuide.update(this.player.position, this.player.isDead, this.controls.inputMethod,
          'PORTAL PARA A ESCARPA', { ...SIROCCO.returnPortal, radius: 116, name: 'Portal de retorno',
            instruction: 'Volte à região anterior.', action: 'enter' }, this.hud);
        return;
      }
      if (this.sirocco?.exitPortal.canEnter(this.player.position, this.player.isDead)) {
        this.explorationGuide.update(this.player.position, this.player.isDead, this.controls.inputMethod,
          'DUNAS INTERIORES', { ...SIROCCO.exitPortal, radius: 116, name: 'Portal para as Dunas',
            instruction: 'Atravesse para seguir pelo interior do Siroco.', action: 'enter' }, this.hud);
        return;
      }
      const optionalRoute = SIROCCO_ROUTES.find(route => !this.progression.rewardedRoutes.has(route.id));
      if (this.aridSignalSeen && optionalRoute && distance(this.player.position, optionalRoute) < 520) {
        this.explorationGuide.update(this.player.position, this.player.isDead, this.controls.inputMethod,
          'DESVIO MINERAL', { ...optionalRoute, name: optionalRoute.name, instruction: optionalRoute.hint, action: 'walk' }, this.hud);
        return;
      }
      if (this.aridFrontierReached) {
        this.explorationGuide.update(this.player.position, this.player.isDead, this.controls.inputMethod,
          'SIGA PARA AS DUNAS', { ...SIROCCO.exitPortal, radius: 116, name: 'Portal para as Dunas',
            instruction: 'O sinal continua no interior do Siroco.', action: 'enter' }, this.hud);
      } else if (this.aridSignalSeen) {
        this.explorationGuide.update(this.player.position, this.player.isDead, this.controls.inputMethod,
          'SIGA A MARGEM LESTE', { ...SIROCCO.end, name: 'Passagem entre as cristas',
            instruction: 'O relé abriu a continuação da bacia. Atravesse as formações.', action: 'walk' }, this.hud);
      } else {
        this.explorationGuide.update(this.player.position, this.player.isDead, this.controls.inputMethod,
          'SIGA O SINAL', { ...SIROCCO.signal, name: 'Relé no mar de areia',
            instruction: 'Siga as formações âmbar e investigue o sinal.', action: 'investigate' }, this.hud);
      }
      return;
    }
    if (this.area === 'valley') {
      if (this.signalPortal?.canTraverse(this.player.position, this.player.isDead)) {
        this.explorationGuide.update(this.player.position, false, this.controls.inputMethod,
          'VOLTAR PELO PORTAL', { ...VALLEY.portal, radius: 105, name: 'Portal de retorno',
            instruction: 'Retorne ao domínio do guardião.', action: 'investigate' }, this.hud);
        return;
      }
      if (this.chapterPortal?.canEnter(this.player.position, this.player.isDead)) {
        this.explorationGuide.update(this.player.position, false, this.controls.inputMethod,
          'MISSÃO CONCLUÍDA', { ...VALLEY.frontier.portal, radius: 116, name: 'Portal para a Bacia do Siroco',
            instruction: 'Atravesse para iniciar a próxima expedição.', action: 'enter' }, this.hud);
        return;
      }
      if (this.valleyFrontierReached) {
        if (!this.valleyFrontierSignalSeen) {
          this.explorationGuide.update(this.player.position, this.player.isDead, this.controls.inputMethod,
            'SIGA O ECO', { ...VALLEY.frontier.signal, name: 'Estrutura de escuta', instruction: 'Aproxime-se da resposta violeta.', action: 'investigate' }, this.hud);
        } else if (!this.valleyFrontierEndSeen) {
          this.explorationGuide.update(this.player.position, this.player.isDead, this.controls.inputMethod,
            'SIGA A RESSONÂNCIA', { ...VALLEY.frontier.end, name: 'Fenda na escarpa', instruction: 'O sinal aponta para além das rochas.', action: 'walk' }, this.hud);
        } else {
          this.explorationGuide.update(this.player.position, this.player.isDead, this.controls.inputMethod,
            'MISSÃO CONCLUÍDA', { ...VALLEY.frontier.portal, radius: 116, name: 'Portal para a Bacia do Siroco',
              instruction: 'Siga até o portal recém-aberto.', action: 'enter' }, this.hud);
        }
        return;
      }
      if (this.valleyEndSeen) {
        this.explorationGuide.update(this.player.position, this.player.isDead, this.controls.inputMethod,
          'EXPLORE ALÉM DAS ROCHAS', { ...VALLEY.frontier.threshold, radius: 115, name: 'Passagem na crista',
            instruction: 'Siga pelo vão entre as formações.', action: 'walk' }, this.hud);
        return;
      }
      const unexplored = VALLEY_ROUTES.filter(route => !this.valleyRoutes.has(route.id) || !this.progression.rewardedRoutes.has(route.id));
      if (this.valleyLandmarkSeen && unexplored.length) {
        const next = unexplored.reduce((a, b) => distance(this.player.position, a) <= distance(this.player.position, b) ? a : b);
        this.explorationGuide.update(this.player.position, this.player.isDead, this.controls.inputMethod,
          `EXPLORE OS DESVIOS  ${this.progression.rewardedRoutes.size}/3`,
          { ...next, instruction: next.hint, action: 'walk' }, this.hud);
        return;
      }
      if (this.valleyLandmarkSeen && this.valleyEndSeen && !unexplored.length) {
        this.explorationGuide.hide();
        this.hud.setExplorationGuide('EXPEDIÇÃO LIVRE',
          this.progression.nextLevelXp === null ? 'Conheça os hábitos das criaturas.' : `Nível ${this.progression.level + 1}: faltam ${this.progression.nextLevelXp - this.progression.xp} XP.`,
          'Registros mostra os habitats e suas ameaças.');
        return;
      }
      this.explorationGuide.update(this.player.position, this.player.isDead, this.controls.inputMethod,
        this.valleyEndSeen ? 'EXPLORE A OUTRA MARGEM' : this.valleyLandmarkSeen ? 'SIGA A RESSONÂNCIA' : 'EXPLORE O VALE',
        this.valleyLandmarkSeen ? { ...VALLEY.end, name: 'Sinal além das rochas', instruction: 'O portal a oeste permite retornar.', action: 'walk' }
          : { ...VALLEY.landmark, name: 'Crescimento ancestral', instruction: 'Explore os desvios e investigue a resposta.', action: 'investigate' }, this.hud);
      return;
    }
    if (this.area === 'forest') {
      const sites = [
        { id: 'northern-ruin', ...NORTHERN_DISCOVERY, name: 'Ruína do norte', instruction: 'Procure as inscrições na pedra.' },
        { ...FOREST_ECHOES.mineral, name: 'Sinal mineral', instruction: 'Procure o brilho âmbar.' },
        { ...FOREST_ECHOES.trace, name: 'Vestígio desconhecido', instruction: 'Procure o brilho violeta.' },
      ].filter(site => !this.progression.echoes.has(site.id));
      if (sites.length) {
        const nearest = sites.reduce((a, b) => distance(this.player.position, a) <= distance(this.player.position, b) ? a : b);
        title = `INVESTIGUE OS ECOS  ${this.progression.echoes.size}/3`;
        target = { ...nearest, action: 'investigate' };
        if (distance(this.player.position, SIGNAL_THRESHOLD) <= SIGNAL_THRESHOLD.radius + 50) {
          title = 'PASSAGEM SELADA';
          target.instruction = 'Investigue os 3 Ecos antes de voltar.';
        }
      } else if (!this.progression.sourceLocated) {
        title = 'SIGA O SINAL AO NORTE';
        target = { ...SIGNAL_THRESHOLD, name: 'Fissura ancestral', instruction: 'Siga a trilha e investigue a fissura.', action: 'investigate' };
      } else if (!this.progression.passageOpen) {
        title = 'ATIVE O MECANISMO';
        target = { x: SIGNAL_THRESHOLD.mechanismX, y: SIGNAL_THRESHOLD.mechanismY, radius: SIGNAL_THRESHOLD.mechanismRadius,
          name: 'Mecanismo ancestral', instruction: 'As inscrições ao lado da fissura reagiram.', action: 'investigate' };
      } else {
        title = this.gateObstacle ? 'A PASSAGEM ESTÁ SE ABRINDO' : 'ENTRE NA CAVERNA';
        target = { ...SIGNAL_THRESHOLD, name: this.gateObstacle ? 'Passagem reagindo' : 'Passagem aberta', instruction: 'Caminhe para dentro da fissura.', action: 'walk' };
      }
    } else if (!this.deepPassageOpen) {
      title = 'EXPLORE A CAVERNA';
      target = { ...CAVERN_DEPTH_OPENING, name: 'Sinal entre as pedras', instruction: 'Aproxime-se do brilho no desabamento.', action: 'walk' };
    } else if (this.player.position.x < EXPANSION.deeperX) {
      title = 'SIGA O SINAL MAIS FUNDO';
      target = { ...DEEP_AREA.end, name: 'Túnel profundo', instruction: 'Siga pelo túnel além da estrutura.', action: 'walk' };
    } else if (this.player.position.x < EXPANSION.exteriorX) {
      title = 'ATRAVESSE AS PROFUNDEZAS';
      target = { x: 4400, y: 740, radius: 130, name: 'Luz além da caverna', instruction: 'Explore os desvios e siga para leste.', action: 'walk' };
    } else if (!this.fragmentSeen) {
      title = 'INVESTIGUE O FRAGMENTO';
      target = { ...EXPANSION.fragment, name: 'Fragmento ancestral', instruction: 'Procure a estrutura com luz violeta.', action: 'investigate' };
    } else if (!this.firstEchoSeen) {
      title = 'INVESTIGUE A RESPOSTA';
      target = { ...W.echo, name: 'Arquivo ancestral', instruction: 'Atravesse o arco; siga pelo lado norte.', action: 'investigate' };
    } else if (this.cavern?.wardenApproach.responding) {
      title = 'PRIMEIRO ECO';
      target = { ...W.echo, name: 'Registro humano encontrado', instruction: 'A data e a origem estão ilegíveis.', action: 'observe' };
    } else {
      title = this.wardenGateOpen ? 'ATRAVESSE O LIMIAR' : this.cavern?.wardenApproach.opening ? 'O LIMIAR ESTÁ RESPONDENDO' : this.wardenReached ? 'INVESTIGUE O LIMIAR' : 'SIGA AS INSCRIÇÕES';
      target = { ...W.threshold, name: 'Limiar do guardião', instruction: this.wardenGateOpen ? 'Caminhe pela abertura para leste.' : 'O registro acendeu o caminho; investigue a passagem.', action: this.wardenGateOpen ? 'walk' : 'investigate' };
    }
    this.explorationGuide.update(this.player.position, this.player.isDead, this.controls.inputMethod, title, target, this.hud);
  }

  private spawnDeepHollows(): void {
    DEEP_HOLLOWS.forEach((patrol,index) => {
      const enemy = new HollowCrawler(this,patrol[0].x,patrol[0].y,patrol);
      this.enemies.push(enemy);
      this.enemySpecies.set(enemy, 'crawler');
      this.hollowSpawnIds.set(enemy,FOREST_SPAWNS.length+CAVERN_HOLLOWS.length+index);
    });
  }

  private enterCavern(): void {
    if (this.coopSoloPassage()) return;
    this.transitioning = true;
    this.transferHp = this.player.hp;
    this.cameras.main.fadeOut(220, 5, 15, 20);
    this.time.delayedCall(240, () => {
      this.area = 'cavern';
      this.saveProgress();
      this.scene.restart();
    });
  }

  private updateMusicRegion(force = false): void {
    const x = this.player.position.x;
    const region = this.area === 'sandpit' ? 'soterrado' : this.area === 'arid' ? 'sirocco' : this.area !== 'cavern' ? this.area
      : x >= EXPANSION.exteriorX ? 'exterior' : x >= EXPANSION.deeperX ? 'deeper'
      : this.deepPassageOpen && x >= DEEP_AREA.entryX ? 'deep' : 'cavern';
    if (force || region !== this.musicRegion) {
      this.musicRegion = region;
      this.sounds.setArea(region);
    }
  }

  coopArea(): JourneyArea { return this.area; }

  private coopSoloPassage(): boolean {
    if (coopSession.role !== 'host') return false;
    if (performance.now() - this.coopSoloNoticeAt > 3500) {
      this.coopSoloNoticeAt = performance.now();
      this.hud.showDiscovery('PASSAGEM SOLO\nA DUPLA CONTINUA AQUI\nPARA SEGUIR SOZINHO, SAIA DA SALA NO MENU');
    }
    return true;
  }

  private partyBridge(): PartyBridge {
    return {
      area: this.area, player: this.player, controls: this.controls, enemies: this.enemies,
      obstacles: this.arena.obstacles, bounds: this.movementBounds, hud: this.hud, hunter: this.hunter,
      progression: this.progression.snapshot(),
      flags: Object.fromEntries(JOURNEY_FLAGS.map(key => [key, this[key]])) as JourneyFlags,
      phase: this.charge.phase, chargeLevel: this.charge.level(this.time.now),
      wave: !this.hunter && this.charge.waveVisible(this.time.now) ? {
        x: this.charge.origin.x + Math.cos(this.charge.angle) * (KINETIC_CHARGE.waveStart + KINETIC_CHARGE.waveTravel * this.charge.waveProgress(this.time.now)),
        y: this.charge.origin.y + Math.sin(this.charge.angle) * (KINETIC_CHARGE.waveStart + KINETIC_CHARGE.waveTravel * this.charge.waveProgress(this.time.now)),
        rotation: this.charge.angle, width: KINETIC_CHARGE.waveThickness, height: this.charge.waveHalfWidth * 2,
      } : undefined,
      firing: this.hunter ? this.time.now < this.hunter.firedUntil : this.attack.pose(this.time.now, this.player.rotation).phase !== 'READY',
      id: enemy => this.hollowSpawnIds.get(enemy), species: enemy => this.enemySpecies.get(enemy),
      hit: (targets, damage, angle, from, heavy) => this.resolvePlayerHits(this.time.now, targets, damage, angle, 0x5fe6d8, from, heavy),
      prompt: position => {
        const dead = false;
        const portal = this.chapterPortal?.canEnter(position, dead) || this.sirocco?.exitPortal.canEnter(position, dead) || this.frost?.returnPortal.canEnter(position, dead);
        const investigate = this.echoSites.some(site => site.canInvestigate(position, dead)) || this.threshold?.canInvestigate(position, dead) ||
          this.mechanism?.canInvestigate(position, dead) || this.valley?.canInvestigate(position, dead, this.valleyLandmarkSeen) ||
          this.valley?.canInvestigateFrontier(position, dead, this.valleyFrontierSignalSeen) ||
          this.sirocco?.canInvestigate(position, dead, this.aridSignalSeen) ||
          this.dunes?.canInvestigate(position, dead, this.dunesRuinsSeen) || this.frost?.canInvestigate(position, dead, this.frostSignalSeen);
        return { available: !!(portal || investigate), action: portal ? 'ENTRAR' : 'INVESTIGAR' };
      },
      sync: world => this.syncCoopWorld(world),
      render: pose => {
        const previousDead = this.player.isDead;
        this.player.health.max = pose.maxHp; this.player.health.current = pose.hp;
        this.player.renderRemote(pose, pose.aim, { phase: pose.firing ? 'SWING' : 'READY', relativeAngle: 0, worldAngle: pose.aim, swingProgress: .5 },
          { phase: pose.phase as 'READY' | 'CHARGING' | 'RELEASE', level: pose.level, swingProgress: 0 }, pose.dash, pose.dead);
        this.hunterArt?.update(pose.x, pose.y, pose.aim, pose.firing, pose.dash, { phase: pose.phase as 'READY' | 'CHARGING' | 'RELEASE', level: pose.level });
        this.hunter?.beamView.render(pose.beam);
        if (pose.dead && !previousDead) this.hud.showDeath();
      },
    };
  }

  private syncCoopWorld(world: PartyWorld): boolean {
    this.visitingCoop = true;
    this.progression.restore(world.progression);
    for (const key of JOURNEY_FLAGS) this[key] = world.flags[key] === true;
    const layout = world.area + JSON.stringify(world.flags) + world.progression.echoes.join(',') + this.progression.level;
    const refresh = layout !== this.coopLayout || this.player.isDead && !world.partner?.dead;
    this.coopLayout = layout;
    this.area = world.area;
    if (refresh) { this.scene.restart(); return true; }
    if (this.coopWorldXp !== undefined && this.progression.xp > this.coopWorldXp)
      this.hud.showExperienceAt(this.player.position.x, this.player.position.y, this.progression.xp - this.coopWorldXp);
    this.coopWorldXp = this.progression.xp;
    this.updateProgressHud();
    if (world.message !== this.coopMessage) {
      this.coopMessage = world.message;
      if (world.message) { this.hud.showDiscovery(world.message); this.sounds.signal(); }
    }
    return false;
  }

  private explorationNear(point: Vec2, radius: number): boolean {
    const peer = this.party?.partner?.player;
    return distance(this.player.position, point) < radius || !!peer && !peer.isDead && distance(peer.position, point) < radius;
  }

  private transitionArea(area: Exclude<JourneyArea, 'forest'>): void {
    if (this.transitioning) return;
    if (coopSession.role === 'host' && !coopSession.travel(this.area, area)) {
      this.coopSoloPassage(); return;
    }
    this.transitioning = true;
    this.transferHp = this.player.hp;
    this.returnToThreshold = area === 'cavern';
    this.returnFromValley = this.area === 'valley' && area === 'warden';
    this.returnToValleyPortal = this.area === 'warden' && area === 'valley';
    this.returnToFrontierPortal = this.area === 'arid' && area === 'valley';
    this.cameras.main.fadeOut(220, 5, 15, 20);
    const arrive = () => {
      if (coopSession.role === 'host' && coopSession.area !== area) { this.time.delayedCall(80, arrive); return; }
      this.area = area; this.saveProgress(); this.scene.restart();
    };
    this.time.delayedCall(240, arrive);
  }

  private wardenCue(cue: WardenCue, attack?: WardenAttack): void {
    if (cue === 'execute' && attack) this.sounds.wardenCue(attack);
    else if (cue === 'intro') { this.sounds.wardenCue('intro'); this.sounds.setMusicFocus(0.45); }
    else if (cue === 'phase') { this.sounds.wardenCue('phase'); this.wardenArena?.setPhase(this.warden?.phase ?? 1); }
    else if (cue === 'death') {
      // Persist on the lethal hit; a restart cannot resurrect a defeated guardian.
      this.wardenDefeated = true;
      this.saveProgress();
      this.sounds.stopMusic();
      this.sounds.wardenCue('death');
      this.wardenArena?.setEncounterActive(false);
    }
    else if (cue === 'telegraph') this.sounds.setMusicFocus(1);
  }

  private soterradoCue(cue: SoterradoCue, attack?: SoterradoAttack): void {
    if (cue === 'intro') { this.sounds.wardenCue('intro'); this.sounds.setMusicFocus(.55); }
    else if (cue === 'warning') { this.sounds.setMusicFocus(1); this.sounds.wardenCue(attack === 'burrow' ? 'echoes' : 'signal'); }
    else if (cue === 'strike') this.sounds.wardenCue(attack === 'rush' ? 'rush' : attack === 'sweep' ? 'sweep' : 'slam');
    else if (cue === 'phase') { this.sounds.wardenCue('phase'); this.hud.showDiscovery('A AREIA CEDE\nOBSERVE AS MARCAS EM SEQUÊNCIA'); }
    else if (cue === 'death') {
      this.soterradoDefeated = true;
      const reward = this.progression.defeatSoterrado();
      this.updateProgressHud();
      if (reward.awarded) this.hud.showExperienceAt(this.soterrado!.position.x,this.soterrado!.position.y,SOTERRADO.xp);
      if (reward.leveledUp) this.levelUp(false);
      this.sounds.stopMusic(); this.sounds.wardenCue('death'); this.saveProgress();
    }
  }

  private vesperCue(cue: IceCue): void {
    if (cue === 'intro') { this.sounds.wardenCue('intro'); this.sounds.setMusicFocus(.55); this.hud.showDiscovery('VÉSPER · O SOPRO BRANCO'); }
    else if (cue === 'warning') { this.sounds.setMusicFocus(1); this.sounds.wardenCue('signal'); }
    else if (cue === 'strike') this.sounds.wardenCue(this.vesper?.attackName === 'rush' ? 'rush' : 'slam');
    else if (cue === 'phase') { this.sounds.wardenCue('phase'); this.hud.showDiscovery(this.vesper?.phase === 3 ? 'O NINHO RESSOA\nAS ERUPÇÕES VOLTAM EM SEQUÊNCIA' : 'O GELO SE ROMPE\nOBSERVE AS TRÊS MARCAS'); }
    else if (cue === 'death') {
      this.vesperDefeated = true; const reward = this.progression.defeatVesper(); this.updateProgressHud();
      if (reward.awarded) this.hud.showExperienceAt(this.vesper!.position.x, this.vesper!.position.y, VESPER.xp);
      if (reward.leveledUp) this.levelUp(false);
      this.sounds.stopMusic(); this.sounds.wardenCue('death'); this.glacier?.setEncounterActive(false); this.saveProgress();
    }
  }

  private finishSoterrado(): void {
    this.sandpit?.resolve();
    this.hud.setSandpitArea(true,this.soterradoClueSeen);
    this.hud.showDiscovery('O SOTERRADO CAIU\nAPERFEIÇOAMENTO CONQUISTADO\nUMA PASSAGEM FOI EXPOSTA');
    this.sounds.ancient();
    if (this.progression.upgradePointsAvailable>0) this.time.delayedCall(1400,()=>this.showAvailableUpgrade());
  }

  private finishWarden(): void {
    this.wardenArena?.resolve();
    if (this.wardenEndingSeen) return;
    this.wardenEndingSeen = true;
    this.saveProgress();
    this.sounds.wardenCue('victory');
    this.hud.showDiscovery('GUARDIÃO SILENCIADO\nO SINAL NÃO SE APAGOU');
    this.time.delayedCall(3000, () => {
      this.signalPortal?.activate();
      this.sounds.signal();
      this.hud.showDiscovery('TRANSMISSÃO LIBERADA\nFRAGMENTO: RETORNO CONFIRMADO\nDESTINO: ILEGÍVEL');
    });
    this.time.delayedCall(7000, () => this.hud.showDiscovery('PORTAL DO SINAL ABERTO\nOUTRA MARGEM: DESCONHECIDA\nATRAVESSE A FENDA'));
  }

  private beginStrike(now: number): void {
    if (coopSession.role === 'guest') { this.party?.queueAttack(); return; }
    if (this.charge.phase !== 'READY') return;
    if (this.hunter) {
      if (this.hunter.fire(now, this.player.position, this.controls.aimFrom(this.player.position))) this.sounds.swing();
      return;
    }
    if (!this.attack.start(now)) return;
    const facing = this.controls.aimFrom(this.player.position);
    this.player.setAim(facing);
    this.player.renderWeapon(facing, this.attack.pose(now, facing), this.charge.pose(now));
    this.sounds.swing();
  }

  private resolveSaberHits(now: number, hits: Enemy[], saberAngle: number): void {
    this.resolvePlayerHits(now, hits, this.player.attackDamage, saberAngle, 0xaafce1, this.player.position, false);
  }

  private resolvePlayerHits(now: number, hits: Enemy[], damage: number, angle: number, color: number, from: Vec2, chargeHit: boolean): void {
    if (hits.length) this.cameras.main.shake(chargeHit ? 75 : 55, chargeHit ? 0.003 : 0.0024);
    for (const enemy of hits) {
      const result = applyDamage(enemy.health, damage);
      if (!result.applied) continue;
      this.sounds.hit();
      this.impact(enemy.position, color, result.amount, angle);
      if (chargeHit) {
        const wave = this.add.circle(enemy.position.x, enemy.position.y, 14).setStrokeStyle(3, 0x5fe6d8, 0.82).setDepth(15001);
        this.tweens.add({ targets: wave, scale: 2.4, alpha: 0, duration: 190, onComplete: () => wave.destroy() });
      }
      if (result.died) {
        const species = this.enemySpecies.get(enemy);
        if (species && this.bestiary.defeat(species)) this.records.markDiscovery();
        if (enemy !== this.warden && enemy !== this.soterrado && enemy !== this.vesper) this.deathEffect(enemy.position);
        enemy.die();
        const spawnIndex = this.hollowSpawnIds.get(enemy);
        if (spawnIndex !== undefined) {
          const isValley = this.area === 'valley' && this.valleyResidents.get(spawnIndex) === enemy;
          const isSirocco = (this.area === 'arid' || this.area === 'dunes' || this.area === 'frost' || this.area === 'icecave') && this.siroccoResidents.get(spawnIndex) === enemy;
          const reward = isValley || isSirocco
            ? { awarded: true, leveledUp: this.progression.defeatRenewableResident() }
            : this.progression.defeatHollow(spawnIndex);
          if (isValley) {
            this.valleyResidents.delete(spawnIndex);
            this.valleyHabitatCooldowns.set(spawnIndex, Date.now() + VALLEY_RENEWAL.delayMs);
          } else if (isSirocco) {
            this.siroccoResidents.delete(spawnIndex);
            this.siroccoHabitatCooldowns.set(spawnIndex, Date.now() + SIROCCO_RENEWAL.delayMs);
          }
          if (reward.awarded) {
            this.updateProgressHud();
            this.hud.showExperienceAt(enemy.position.x, enemy.position.y, PROGRESSION.hollowXp);
          }
          if (reward.leveledUp) this.levelUp();
          this.hollowSpawnIds.delete(enemy);
        }
        this.saveProgress();
      } else enemy.hurt(now, from, chargeHit ? KINETIC_CHARGE.knockback : 300);
    }
  }

  private enemyStrike(enemy: Enemy, impact?: EnemyImpact, target: Player = this.player): void {
    if (target !== this.player) {
      if (target.isDead || target.invulnerable || (!impact?.ranged && distance(enemy.position, target.position) > (enemy.attackRange ?? CRAWLER.attackRange) + PLAYER.radius)) return;
      const result = applyDamage(target.health, impact?.damage ?? enemy.attackDamage ?? CRAWLER.attackDamage);
      if (result.applied) { target.flashHurt(); target.setHurtGrace(this.time.now + PLAYER.hurtCooldown); this.impact(target.position, 0xff8f82, result.amount); }
      if (result.died) target.die();
      return;
    }
    if (this.player.isDead || this.player.invulnerable || (!impact?.ranged && distance(enemy.position, this.player.position) > (enemy.attackRange ?? CRAWLER.attackRange) + PLAYER.radius)) return;
    const result = applyDamage(this.player.health, impact?.damage ?? enemy.attackDamage ?? CRAWLER.attackDamage);
    if (!result.applied) return;
    this.sounds.hurt();
    this.player.flashHurt();
    this.impact(this.player.position, 0xff8f82, result.amount);
    const hurtRing = this.add.circle(this.player.position.x, this.player.position.y, 19).setStrokeStyle(4, 0xffa087, 0.8).setDepth(15001);
    this.tweens.add({ targets: hurtRing, scale: 2.2, alpha: 0, duration: 210, onComplete: () => hurtRing.destroy() });
    this.cameras.main.shake(90, 0.004);
    // Enemy swings are spaced by cooldown; this short grace period stops overlap bursts.
    this.player.setHurtGrace(this.time.now + PLAYER.hurtCooldown);
    if (result.died) {
      this.warden?.suspend();
      this.soterrado?.suspend(); this.vesper?.suspend();
      this.charge.stop();
      this.kineticWave.clear();
      this.waveDrawn = false;
      this.player.die();
      this.sounds.death();
      this.time.delayedCall(550, () => this.hud.showDeath());
    }
    this.saveProgress();
  }

  private impact(position: Vec2, color: number, damage: number, saberAngle?: number): void {
    if (this.referenceImpacts) {
      this.referenceImpacts.hit(this.time.now, position, color, damage, saberAngle);
      return;
    }
    const saberHit = saberAngle !== undefined;
    const burst = this.add.ellipse(position.x, position.y, saberHit ? 34 : 20, saberHit ? 9 : 20, color, 0.85).setDepth(15001);
    if (saberHit) burst.setRotation(saberAngle + Math.PI / 2);
    this.tweens.add({ targets: burst, scaleX: saberHit ? 1.25 : 2.6, scaleY: saberHit ? 0.55 : 2.6, alpha: 0, duration: saberHit ? 140 : 170, onComplete: () => burst.destroy() });
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2 + Math.PI / 4;
      const spark = this.add.ellipse(position.x, position.y, 11, 3, color, 0.9).setRotation(angle).setDepth(15002);
      this.tweens.add({ targets: spark, x: position.x + Math.cos(angle) * 28, y: position.y + Math.sin(angle) * 28, alpha: 0, scaleX: 0.35, duration: 180, onComplete: () => spark.destroy() });
    }
    const label = this.add.text(position.x, position.y - 31, `${damage}`, { fontFamily: 'Barlow Condensed, sans-serif', fontSize: '24px', fontStyle: 'bold', color: color === 0xff8f82 ? '#ff968a' : '#d4ffe9', stroke: '#14312d', strokeThickness: 4 }).setOrigin(0.5).setDepth(15002);
    this.tweens.add({ targets: label, y: label.y - 32, alpha: 0, duration: 520, onComplete: () => label.destroy() });
  }

  private deathEffect(position: Vec2): void {
    const ring = this.add.circle(position.x, position.y, 16).setStrokeStyle(3, 0x9ddcca, 0.7).setDepth(15000);
    this.tweens.add({ targets: ring, scale: 3.1, alpha: 0, duration: 330, onComplete: () => ring.destroy() });
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      const fragment = this.add.triangle(position.x, position.y, 0, 0, 5, 3, 0, 7, i % 2 ? 0x668b84 : 0xb5dece, 0.9).setDepth(15001);
      this.tweens.add({ targets: fragment, x: position.x + Math.cos(angle) * 40, y: position.y + Math.sin(angle) * 35, alpha: 0, angle: 110, duration: 390, onComplete: () => fragment.destroy() });
    }
  }

  private dashTrail(): void {
    const ghost = this.add.ellipse(this.player.position.x, this.player.position.y, 50, 30, 0x8de5e5, 0.25).setRotation(this.player.rotation).setDepth(this.player.position.y - 1);
    this.tweens.add({ targets: ghost, scaleX: 1.3, scaleY: 0.25, alpha: 0, duration: 210, onComplete: () => ghost.destroy() });
  }

  private chargeBurst(): void {
    const x = this.player.position.x;
    const y = this.player.position.y;
    const burst = this.add.ellipse(x, y, 54, 18, 0x5fe6d8, 0.28).setRotation(this.charge.angle).setDepth(y - 1);
    this.tweens.add({ targets: burst, scaleX: 2.1, scaleY: 0.65, alpha: 0, duration: 190, onComplete: () => burst.destroy() });
  }

  private renderKineticWave(now: number): void {
    if (!this.charge.waveVisible(now)) {
      if (this.waveDrawn) this.kineticWave.clear();
      this.waveDrawn = false;
      return;
    }
    this.kineticWave.clear();
    this.waveDrawn = true;
    const progress = this.charge.waveProgress(now);
    const angle = this.charge.angle;
    const radius = 80;
    const spread = Math.asin(Math.min(0.95, this.charge.waveHalfWidth / radius));
    const travel = KINETIC_CHARGE.waveStart + KINETIC_CHARGE.waveTravel * progress - radius + 8;
    const x = this.charge.origin.x + Math.cos(angle) * travel;
    const y = this.charge.origin.y + Math.sin(angle) * travel;
    const fade = Math.min(1, (1 - progress) / 0.22);
    this.kineticWave.lineStyle(18, 0x5fe6d8, 0.22 * fade);
    this.kineticWave.beginPath().arc(x, y, radius, angle - spread, angle + spread).strokePath();
    this.kineticWave.lineStyle(7, 0x70e9e2, 0.68 * fade);
    this.kineticWave.beginPath().arc(x, y, radius, angle - spread, angle + spread).strokePath();
    this.kineticWave.lineStyle(2, 0xe2fffa, 0.9 * fade);
    this.kineticWave.beginPath().arc(x, y, radius, angle - spread, angle + spread).strokePath();
  }

  private dashBurst(input: Vec2): void {
    const direction = input.x || input.y ? input : normalized(Math.cos(this.player.rotation), Math.sin(this.player.rotation));
    const ring = this.add.circle(this.player.position.x - direction.x * 15, this.player.position.y - direction.y * 15, 15).setStrokeStyle(3, 0xa1e9ee, 0.8).setDepth(15000);
    this.tweens.add({ targets: ring, scale: 2.6, alpha: 0, duration: 230, onComplete: () => ring.destroy() });
  }

  private dashEnd(): void {
    const ring = this.add.circle(this.player.position.x, this.player.position.y, 18).setStrokeStyle(2, 0x9ed9e1, 0.55).setDepth(this.player.position.y + 1);
    this.tweens.add({ targets: ring, scale: 1.8, alpha: 0, duration: 180, onComplete: () => ring.destroy() });
  }

  private updateProgressHud(): void {
    this.hud.setProgress(this.progression.level, this.progression.xp, this.progression.nextLevelXp, this.progression.echoes.size);
  }

  private synchronizeSignal(): void {
    this.threshold?.activate();
    // Give the third site's own discovery a moment before the shared response.
    this.time.delayedCall(1150, () => {
      if (this.player.isDead || this.progression.sourceLocated) return;
      this.echoSites.forEach(site => site.respond());
      this.hud.showDiscovery(SIGNAL_THRESHOLD.synchronizedMessage);
      this.hud.setSignalObjective(true, false);
      this.sounds.signal();
    });
  }

  private levelUp(showUpgrade = true): void {
    const gainedHp = this.characterMaxHp - this.player.maxHp;
    this.player.health.setMaxAndRestore(this.characterMaxHp);
    this.hud.showLevelUp(this.progression.level, this.characterMaxHp, gainedHp, this.progression.upgradePointsAvailable > 0);
    this.updateProgressHud();
    this.saveProgress();
    const ring = this.add.circle(this.player.position.x, this.player.position.y, 25)
      .setStrokeStyle(3, 0xffbd54, 0.8).setDepth(15000);
    this.tweens.add({ targets: ring, scale: 2.6, alpha: 0, duration: 450, onComplete: () => ring.destroy() });
    if (showUpgrade && this.progression.upgradePointsAvailable > 0) this.time.delayedCall(380, () => this.showAvailableUpgrade());
  }

  private showAvailableUpgrade(): void {
    if (coopSession.role === 'guest' || this.player.isDead || !this.abilityUpgradeDialog || this.abilityUpgradeDialog.isOpen || this.records?.isOpen || this.progression.upgradePointsAvailable <= 0) return;
    this.pauseForModal();
    this.abilityUpgradeDialog.open(this.progression.level, this.progression.abilityUpgradeRanks, this.progression.upgradePointsAvailable);
  }

  private pauseForModal(): void {
    coopSession.setMenu(true);
    this.controls.cancelForRecords();
    if (coopSession.role === 'host') this.party?.cancelPartnerCharge();
    if (coopSession.role === 'guest') coopSession.send('input', { x: 0, y: 0, aim: 0, attack: false, dash: false, charge: false, held: false, release: false, cancel: true, interact: false, restart: false });
    this.charge.stop();
    this.hunter?.clear();
    this.kineticWave.clear(); this.waveDrawn = false;
    this.recordsPausedAt = this.game.loop.now;
    this.input.enabled = false;
    if (this.input.keyboard) this.input.keyboard.enabled = false;
    this.scene.pause();
  }

  private resumeFromModal(): void {
    coopSession.setMenu(false);
    if (coopSession.role === 'host') { coopSession.consumeEdges(); coopSession.inputAt = 0; }
    this.recordsTimeOffset += this.game.loop.now - this.recordsPausedAt;
    this.time.now = this.game.loop.now - this.recordsTimeOffset;
    this.controls.cancelForRecords();
    if (coopSession.role === 'guest') coopSession.send('input', { x: 0, y: 0, aim: 0, attack: false, dash: false, charge: false, held: false, release: false, cancel: true, interact: false, restart: false });
    this.input.enabled = true;
    if (this.input.keyboard) this.input.keyboard.enabled = true;
    this.scene.resume();
  }

  private restart(): void {
    if (coopSession.role === 'guest') { this.party?.queueRestart(); return; }
    this.scene.restart();
  }

  private explorationAhead(x: number): boolean {
    const peer = this.party?.partner?.player;
    return this.player.position.x >= x || !!peer && !peer.isDead && peer.position.x >= x;
  }

  pauseForShell(): boolean {
    if (this.player.isDead || this.records?.isOpen || this.abilityUpgradeDialog?.isOpen || this.transitioning || this.scene.isPaused()) return false;
    this.pauseForModal(); this.saveProgress(); this.sounds.setMusicFocus(0); return true;
  }
  resumeFromShell(): void { if (this.scene.isPaused()) this.resumeFromModal(); this.sounds.setMusicFocus(1); this.sounds.unlock(); }
  setShellVolumes(master: number, music: number, sfx: number): void { this.sounds.setVolumes(master, music, sfx); }
  flushForShell(): boolean { return this.saveProgress(); }
  shellPlayerDead(): boolean { return this.player?.isDead ?? false; }

  private spawnValleyResident(habitat: typeof VALLEY_ENCOUNTERS[number]): boolean {
    if (this.valleyResidents.has(habitat.id)) return false;
    const readyAt = this.valleyHabitatCooldowns.get(habitat.id);
    if (readyAt !== undefined && (Date.now() < readyAt || this.explorationNear(habitat, VALLEY_RENEWAL.safeDistance))) return false;
    const enemy = new ValleyCreature(this, habitat.kind, habitat.x, habitat.y);
    this.enemies.push(enemy);
    this.enemySpecies.set(enemy, habitat.kind);
    this.hollowSpawnIds.set(enemy, habitat.id);
    this.valleyResidents.set(habitat.id, enemy);
    this.valleyHabitatCooldowns.delete(habitat.id);
    return true;
  }

  private spawnSiroccoResident(habitat: { id: number; kind: SiroccoKind | FrostKind | 'iceCarapace'; x: number; y: number }): boolean {
    if (this.siroccoResidents.has(habitat.id)) return false;
    const readyAt = this.siroccoHabitatCooldowns.get(habitat.id);
    if (readyAt !== undefined && (Date.now() < readyAt || this.explorationNear(habitat, SIROCCO_RENEWAL.safeDistance))) return false;
    const enemy = habitat.kind === 'iceCarapace' ? new ValleyCreature(this, 'iceCarapace', habitat.x, habitat.y) : new DanteCreature(this, habitat.kind, habitat.x, habitat.y);
    this.enemies.push(enemy);
    this.enemySpecies.set(enemy, habitat.kind);
    this.hollowSpawnIds.set(enemy, habitat.id);
    this.siroccoResidents.set(habitat.id, enemy);
    this.siroccoHabitatCooldowns.delete(habitat.id);
    return true;
  }

  private renewValleyHabitats(): void {
    if (this.player.isDead) return;
    let renewed = false;
    for (const habitat of VALLEY_ENCOUNTERS) if (this.spawnValleyResident(habitat)) renewed = true;
    if (renewed) this.saveProgress();
  }

  private renewSiroccoHabitats(): void {
    if (this.player.isDead) return;
    let renewed = false;
    for (const habitat of this.area === 'icecave' ? GLACIER_ENCOUNTERS : this.area === 'frost' ? FROST_ENCOUNTERS : this.area === 'dunes' ? DUNES_ENCOUNTERS : SIROCCO_ENCOUNTERS) if (this.spawnSiroccoResident(habitat)) renewed = true;
    if (renewed) this.saveProgress();
  }

  private restoreJourney(): void {
    if (this.glacierPlaytest) {
      // Session-only setup: never load, select, create or overwrite real heroes.
      for (const key of JOURNEY_FLAGS) this[key] = !key.startsWith('vesper');
      this.icecaveSignalSeen = this.glacierPlaytest.area === 'icenest';
      this.icenestVisited = this.glacierPlaytest.area === 'icenest';
      this.area = this.glacierPlaytest.area;
      this.progression.restore({ xp: 1000, echoes: ['northern-ruin', 'mineral-signal', 'unknown-trace'],
        sourceLocated: true, passageOpen: true, rewardedHollows: [], rewardedRoutes: [], bossRewards: ['soterrado'] });
      const choices = this.glacierPlaytest.classId === 'hunter'
        ? ['chargePower', 'dashDuration', 'chargeWidth'] as const
        : ['saberReach', 'saberArc', 'chargePower'] as const;
      for (const id of choices) this.progression.investUpgrade(id);
      return;
    }
    if (this.qualityReference) { this.area = 'cavern'; return; }
    const saved = this.journey.load();
    if (!saved) return;
    this.progression.restore(saved.progression);
    this.bestiary.restore(saved.bestiary);
    for (const key of JOURNEY_FLAGS) this[key] = saved.flags[key];
    this.area = saved.area;
    this.transferHp = saved.hp > 0 ? saved.hp : this.progression.maxHp;
    saved.valleyRoutes.forEach(id => this.valleyRoutes.add(id));
    saved.valleyHabitats.forEach(([id, readyAt]) => this.valleyHabitatCooldowns.set(id, readyAt));
    saved.aridHabitats.forEach(([id, readyAt]) => this.siroccoHabitatCooldowns.set(id, readyAt));
  }

  private saveProgress(): boolean {
    if (this.visitingCoop || coopSession.role === 'guest' || this.qualityReference || this.glacierPlaytest || !this.player || this.resettingJourney) return false;
    const flags = Object.fromEntries(JOURNEY_FLAGS.map(key => [key, this[key]])) as JourneyFlags;
    const available = this.journey.save({ schema: 1, updatedAt: Date.now(), area: this.area,
      hp: this.player.isDead ? this.characterMaxHp : this.player.hp, progression: this.progression.snapshot(),
      flags, bestiary: this.bestiary.snapshot(), valleyRoutes: [...this.valleyRoutes], valleyHabitats: [...this.valleyHabitatCooldowns],
      aridHabitats: [...this.siroccoHabitatCooldowns] });
    this.records?.setSaveAvailable(available);
    return available;
  }
}
