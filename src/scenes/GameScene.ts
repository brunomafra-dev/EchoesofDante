import Phaser from 'phaser';
import { tuneEnemy,regionalThreat,deathCreditLoss } from '../config/threat';
import {BASE} from '../config/base';
import { VOLCANIC,VOLCANIC_ENCOUNTERS,VOLCANIC_CREATURES,type VolcanicKind } from '../config/volcanic';
import { VolcanicRegion } from '../systems/VolcanicRegion';
import { VolcanicCreature } from '../entities/VolcanicCreature';
import { CALDERA, CALDERA_ENCOUNTERS, CALDERA_ROUTES, TITAN } from '../config/caldera';
import { CalderaRegion } from '../systems/CalderaRegion';
import { CalderaTitan, type TitanCue } from '../entities/CalderaTitan';
import {LandingBase} from '../systems/LandingBase';
import {BasePanel} from '../ui/BasePanel';
import {transact,type ServiceAction} from '../systems/BaseEconomy';
import {validEconomy,MATERIAL_NAMES,EQUIPMENT_DROP_INTERVAL,type EconomySnapshot} from '../config/economy';
import {safeExpeditionPosition,validExpeditionReturn,type ExpeditionReturn} from '../systems/ExpeditionReturn';
import {ResourceDrops,type ResourceDrop} from '../systems/ResourceDrops';
import { coopSession, type PartyWorld } from '../network/CoopSession';
import { PartyExpedition, type PartyBridge } from '../network/PartyExpedition';
import { characterSex, type CharacterSex } from '../config/appearance';
import { preloadModularArt } from '../visual/ModularTorso';
import { characterProfiles } from '../systems/CharacterProfiles';
import { HUNTER, type PlayableClass } from '../config/classes';
import { HunterCombat } from '../combat/HunterCombat';
import { AstralCombat } from '../combat/AstralCombat';
import { AstralArt,preloadAstralArt } from '../visual/AstralArt';
import { AstralPanel } from '../ui/AstralPanel';
import { ASTRAL, ASTRAL_ELEMENTS, ELEMENT_COLORS } from '../config/classes';
import type { AstralElement } from '../config/classes';
import { damageText, damageTextColor, elementalMultiplier } from '../config/elementalCombat';
import type { ImpactPose } from '../network/CoopSession';
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
import { Equipment } from '../systems/Equipment';
import { preloadItemIcons,EquipmentDrops } from '../systems/EquipmentDrops';
import { EquipmentDialog } from '../ui/EquipmentDialog';
import { EQUIPMENT, EQUIPMENT_IDS, equipmentStats, type EquipmentId, type EquipmentSnapshot, type EquipmentSlot } from '../config/equipment';

export class GameScene extends Phaser.Scene {
  private clickedInteraction=false;
  private peerBuildKey='';
  private guestUpgradeScheduled=false;
  private deathLoss=0;
  private classId: PlayableClass = 'warrior';
  private hunter?: HunterCombat;
  private hunterArt?: HunterArt;
  private astral?:AstralCombat;
  private astralArt?:AstralArt;
  private astralPanel?:AstralPanel;
  private readonly equipment = new Equipment();
  private economy:EconomySnapshot=validEconomy(undefined,true);
  private base?:LandingBase;
  private basePanel!:BasePanel;
  private resources!:ResourceDrops;
  private resourceAwarded=new Map<string,ResourceDrop>();
  private potionUsed=0;
  private peerPotionReady=0;
  private economyRoom='';
  private returnStation={x:0,y:0};
  private expeditionReturn?:ExpeditionReturn;
  private expeditionArrival?:Vec2;
  private serviceUnpaused=false;
  private loot!:EquipmentDrops;
  private equipmentDialog!:EquipmentDialog;
  private lootKills=0;
  private inventoryUnpaused=false;
  private get characterMaxHp(): number { return (this.classId === 'hunter' ? Math.round(this.progression.maxHp * HUNTER.hpRatio) : this.classId==='astral'?Math.round(this.progression.maxHp*ASTRAL.hpRatio):this.progression.maxHp)+equipmentStats(this.equipment.snapshot().slots).hp; }
  private party?: PartyExpedition;
  private coopWorldXp?: number;
  private coopLayout = '';
  private coopMessage = '';
  private coopBossCue='';
  private coopBossResolved=false;
  private visitingCoop = false;
  private player!: Player;
  private controls!: Controls;
  private arena!: LandingBase | Arena | CavernArea | WardenArena | ResonanceValley | SiroccoBasin | ReferenceArea;
  private referenceImpacts?: ReferenceImpacts;
  private impactHistory: ImpactPose[] = [];
  private impactSequence = 0;
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
  private volcanic?:VolcanicRegion;private cinderVisited=false;private cinderSignalSeen=false;private obsidianVisited=false;private obsidianSignalSeen=false;
  private caldera?:CalderaRegion; private titan?:CalderaTitan; private titanHud?:WardenHud;
  private calderaVisited=false; private calderaRelaySeen=false; private calderaCheckpointReached=false;
  private titanReached=false; private titanDefeated=false; private titanClueSeen=false;
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
    private readonly glacierPlaytest?: { area: 'base' | 'forest' | 'icecave' | 'icenest'; classId: PlayableClass; sex?:CharacterSex; pilot?:boolean; inventory?:boolean; economy?:boolean; look?:import('../config/appearance').EquipmentLook; weaponLook?:import('../config/appearance').WeaponStyle }) { super('Game'); }

  preload(): void {
    preloadItemIcons(this);
    for(const key of ['landing-shuttle','field-shelter','base-medic-civilian','base-smith-civilian','base-expedition-civilian','base-refugee-a','base-refugee-b','resource-1','resource-2','resource-3'])if(!this.textures.exists(key))this.load.image(key,`${import.meta.env.BASE_URL}assets/base/${key}.png`);
    preloadHunterArt(this);preloadAstralArt(this);
    preloadModularArt(this);
    for(const key of ['cinder-ground','obsidian-ground'])if(!this.textures.exists(key))this.load.image(key,`${import.meta.env.BASE_URL}assets/visual/environment/${key}.webp`);
    for(const s of Object.values(VOLCANIC_CREATURES))if(!this.textures.exists(s.texture))this.load.spritesheet(s.texture,`${import.meta.env.BASE_URL}assets/visual/characters/${s.texture}.png`,{frameWidth:256,frameHeight:256});
    if(!this.textures.exists('caldera-ground'))this.load.image('caldera-ground',`${import.meta.env.BASE_URL}assets/visual/environment/caldera-ground.webp`);
    if(!this.textures.exists('titan-motion'))this.load.spritesheet('titan-motion',`${import.meta.env.BASE_URL}assets/visual/characters/titan-motion.png`,{frameWidth:256,frameHeight:256});
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
    this.recordsTimeOffset = 0;this.guestUpgradeScheduled=false;
    // Phaser pauses timers/tweens, but its absolute clock jumps on resume.
    // Keep Player getters and all existing combat timestamps on the same clock.
    const syncCombatClock = (time: number) => { this.time.now = time - this.recordsTimeOffset; };
    this.events.on(Phaser.Scenes.Events.UPDATE, syncCombatClock);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.UPDATE, syncCombatClock));
    if (!this.journeyLoaded) { this.journeyLoaded = true; this.restoreJourney(); }
    resetEnvironmentOcclusion(this);
    this.classId = this.glacierPlaytest?.classId ?? (this.qualityReference ? 'warrior' : characterProfiles.active.classId);
    this.hunter = undefined; this.hunterArt = undefined;this.astral=undefined;this.astralArt=undefined;this.astralPanel=undefined;
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
    this.glacier = undefined; this.vesper = undefined; this.vesperHud = undefined;this.caldera=undefined;this.volcanic=undefined;this.titan=undefined;this.titanHud=undefined;
    this.coopBossResolved=false;this.coopBossCue='';
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
    this.impactHistory = []; // Sequence stays monotonic across same-region retries.
    this.echoSites = [];
    if(this.economyRoom!==coopSession.code){this.economyRoom=coopSession.code;this.resourceAwarded.clear();this.potionUsed=0;this.peerPotionReady=0;}
    this.base=undefined;
    if(this.area==='base'){this.base=new LandingBase(this,this.wardenDefeated);this.arena=this.base;this.movementBounds=this.base.bounds;}else if (this.area === 'forest') {
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
    } else if(this.area==='cinder'||this.area==='obsidian'){
      this.volcanic=new VolcanicRegion(this,this.area,this.area==='cinder'?this.cinderSignalSeen:this.obsidianSignalSeen);this.arena=this.volcanic;this.movementBounds=this.volcanic.bounds;
    } else if(this.area==='caldera'){
      this.caldera=new CalderaRegion(this,this.calderaRelaySeen,this.titanDefeated);this.arena=this.caldera;this.movementBounds=this.caldera.bounds;
    } else if (this.area === 'icecave' || this.area === 'icenest') {
      this.glacier = new GlacierRegion(this, this.area, this.icecaveSignalSeen, this.vesperDefeated,this.vesperClueSeen);
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
    let entry = coopSession.role === 'guest' && coopSession.world?.partner ? coopSession.world.partner : this.area === 'base'?BASE.entry:this.area === 'forest' ? FOREST_ENTRY : this.area === 'valley'
      ? this.returnToValleyPortal ? VALLEY.entry : this.returnToFrontierPortal ? VALLEY.frontier.checkpoint : this.valleyFrontierReached ? VALLEY.frontier.checkpoint : this.valleyCheckpointReached ? VALLEY.checkpoint : VALLEY.entry
      : this.area === 'arid' ? this.returnFromDunes ? { x: 4770, y: 805 } : this.aridSignalSeen ? SIROCCO.frontierCheckpoint : this.aridVisited ? SIROCCO.checkpoint : SIROCCO.entry
      : this.area==='cinder'||this.area==='obsidian'?(this.area==='cinder'?this.cinderSignalSeen:this.obsidianSignalSeen)?VOLCANIC[this.area].checkpoint:VOLCANIC[this.area].entry
      : this.area==='caldera'?this.calderaCheckpointReached||this.titanReached?CALDERA.checkpoint:CALDERA.entry
      : this.area === 'icecave' || this.area === 'icenest' ? this.glacierArrival ?? (this.area === 'icenest' && this.vesperReached ? GLACIER.icenest.checkpoint : this.area === 'icecave' && this.icecaveSignalSeen ? GLACIER.icecave.checkpoint : GLACIER[this.area].entry)
      : this.area === 'frost' ? this.glacierArrival ?? (this.frostSignalSeen ? FROST.checkpoint : FROST.entry)
      : this.area === 'sandpit' ? this.returnFromFrost ? { x: 1320, y: 790 } : SANDPIT.entry
      : this.area === 'dunes' ? this.returnFromSandpit ? { x: 2390, y: 1160 } : this.dunesRuinsSeen ? DUNES.checkpoint : DUNES.entry
      : this.area === 'warden' ? this.returnFromValley ? { x: 1420, y: 830 } : { x: 650, y: 760 }
      : this.returnToThreshold ? { x: 6060, y: 740 } : this.firstEchoSeen ? W.respawn
      : this.exteriorEntered ? EXPANSION.exteriorRespawn : this.deeperEntered ? EXPANSION.deeperRespawn
      : this.deepCavernEntered ? DEEP_AREA.entry : CAVERN_ENTRY;
    this.returnStation=coopSession.role==='guest'&&coopSession.world?.returnStation?{...coopSession.world.returnStation}:this.volcanic?((this.area==='cinder'?this.cinderSignalSeen:this.obsidianSignalSeen)?{...this.volcanic.config.checkpoint}:{x:460,y:830}):this.area==='caldera'?(this.calderaCheckpointReached||this.titanReached?{...CALDERA.checkpoint}:{x:450,y:820}):{x:entry.x,y:entry.y};
    if(this.expeditionArrival&&coopSession.role!=='guest')entry=safeExpeditionPosition(this.expeditionArrival,PLAYER.radius,this.arena.obstacles,this.movementBounds)??entry;
    this.expeditionArrival=undefined;
    if(!this.economy.visited.includes(this.area))this.economy.visited.push(this.area);
    this.returnToThreshold = false;
    this.returnFromValley = false;
    this.returnToValleyPortal = false;
    this.returnToFrontierPortal = false;
    this.returnFromDunes = false;
    this.returnFromSandpit = false;
    this.returnFromFrost = false;
    this.glacierArrival = undefined;
    this.player = new Player(this, entry.x, entry.y, this.characterMaxHp, this.qualityReference === 'reference',
      this.qualityReference !== 'baseline' && !this.originalWarrior, id => this.progression.upgradeRank(id), this.classId, characterSex(this.classId,this.glacierPlaytest?this.glacierPlaytest.sex:this.qualityReference?undefined:characterProfiles.active.sex));
    if (this.classId === 'hunter') {
      this.hunter = new HunterCombat(this, id => this.progression.upgradeRank(id));
      this.hunterArt = new HunterArt(this, this.player.view, entry.x, entry.y,this.player.sex);
    }
    if(this.classId==='astral'){this.astral=new AstralCombat(this,id=>this.progression.upgradeRank(id));this.astralArt=new AstralArt(this,this.player.view,entry.x,entry.y,this.player.sex);this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.astral?.destroy());}
    this.updateEquipmentAppearance();
    if (this.transferHp !== undefined) this.player.health.current = Math.min(this.transferHp, this.player.maxHp);
    this.transferHp = undefined;
    this.kineticWave = this.add.graphics().setDepth(14999);
    this.controls = new Controls(this, () => this.sounds.unlock(), () => {
      if (!this.player.isDead && !this.records?.isOpen && !this.inputModalOpen) this.beginStrike(this.time.now);
    });
    this.controls.setCombatPresentation(this.classId !== 'warrior', this.classId === 'astral');
    if(this.astral){this.astralPanel=new AstralPanel(this,()=>this.controls.queueElement());if(location.pathname.endsWith('/astral-playtest.html')||location.pathname.endsWith('/caldera-playtest.html')){const element=new URLSearchParams(location.search).get('element');if(ASTRAL_ELEMENTS.includes(element as typeof ASTRAL_ELEMENTS[number]))this.astral.element=element as typeof ASTRAL_ELEMENTS[number];}}
    this.updateMusicRegion(true);
    this.sounds.setMusicFocus(1);
    const spawns = this.area === 'forest' ? FOREST_SPAWNS : CAVERN_HOLLOWS;
    if (this.area === 'forest' || this.area === 'cavern') spawns.forEach((point, index) => {
      const enemy = new HollowCrawler(this, point.x, point.y, this.area === 'forest' ? FOREST_PATROLS[index] : undefined, this.qualityReference === 'reference');
      tuneEnemy(enemy,this.area);this.enemies.push(enemy);
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
    if(this.area==='cinder'||this.area==='obsidian'){for(const h of VOLCANIC_ENCOUNTERS[this.area])this.spawnSiroccoResident(h);if(this.area==='cinder')this.cinderVisited=true;else this.obsidianVisited=true;}
    if(this.area==='caldera'){
      for(const h of CALDERA_ENCOUNTERS)this.spawnSiroccoResident(h);
      this.calderaVisited=true;this.titanHud=new WardenHud(this,'O INCANDESCENTE');
      if(!this.titanDefeated){this.titan=new CalderaTitan(this,cue=>this.titanCue(cue),()=>this.finishTitan());tuneEnemy(this.titan,this.area);this.enemies.push(this.titan);this.enemySpecies.set(this.titan,'titan');}
    }
    if (this.area === 'icenest') {
      this.icenestVisited = true; this.vesperHud = new WardenHud(this, 'VÉSPER · SOPRO BRANCO');
      if (!this.vesperDefeated) {
        this.vesper = new Vesper(this, cue => this.vesperCue(cue), () => { this.glacier?.resolve();this.reviveBossSurvivors(); this.hud.showDiscovery('O GELO SILENCIOU\nINVESTIGUE O REGISTRO DO NINHO'); this.sounds.signal(); });
        tuneEnemy(this.vesper,this.area);this.enemies.push(this.vesper); this.enemySpecies.set(this.vesper, 'vesper');
      } else this.sounds.stopMusic();
    }
    if (this.area === 'sandpit') {
      this.soterradoReached = true;
      this.soterradoHud = new WardenHud(this, 'O SOTERRADO');
      if (!this.soterradoDefeated) {
        this.soterrado = new Soterrado(this, SANDPIT.spawn.x, SANDPIT.spawn.y, this.sandpit!.bounds,
          (cue, attack) => this.soterradoCue(cue, attack), () => this.finishSoterrado());
        tuneEnemy(this.soterrado,this.area);this.enemies.push(this.soterrado);
        this.enemySpecies.set(this.soterrado, 'soterrado');
      } else this.sounds.stopMusic();
    }
    this.hud = new Hud(this, () => this.restart(), this.classId === 'hunter',this.classId==='astral');
    if (this.qualityReference === 'reference') this.referenceImpacts = new ReferenceImpacts(this);
    this.navigation = this.qualityReference ? undefined : new WorldNavigator(this, () => ({ bounds: this.movementBounds, obstacles: this.arena.obstacles }));
    this.explorationGuide = new ExplorationGuide(this, this.navigation);
    if (this.area === 'warden') {
      this.signalPortal = new SignalPortal(this, { x: 1500, y: 830 }, this.wardenDefeated);
      this.wardenHud = new WardenHud(this);
      if (!this.wardenDefeated) {
        this.warden = new Warden(this, 1170, 735, this.wardenArena!.bounds, (cue, attack) => this.wardenCue(cue, attack), () => this.finishWarden());
        tuneEnemy(this.warden,this.area);this.enemies.push(this.warden);
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
    this.hud.setSignalObjective(this.progression.signalSynchronized, this.progression.sourceLocated, this.progression.passageOpen, this.area === 'cavern', this.cavernDepthSeen, this.deepAreaSeen);if(this.area==='base')this.hud.setAreaName('DANTE-01 · Base de pouso');
    if (this.area === 'icecave' || this.area === 'icenest') {
      if (this.area === 'icecave' && (!this.icecaveVisited || entry.x === GLACIER.icecave.entry.x)) this.hud.showDiscovery('GALERIAS DO DEGELO\nA ROCHA GUARDA O CALOR SOB O GELO');
      if (this.area === 'icecave') this.icecaveVisited = true;
      this.hud.setGlacierArea(this.area === 'icenest', this.icecaveSignalSeen, this.vesperDefeated);
    }
    if(this.volcanic){this.hud.setAreaName(this.volcanic.config.name);this.hud.showDiscovery(this.volcanic.config.name.toLocaleUpperCase('pt-BR')+'\nSIGA O BASALTO E EXPLORE OS DESVIOS');}
    if(this.area==='caldera'){this.hud.setAreaName(CALDERA.name);this.hud.showDiscovery(this.titanReached?'CALDEIRA ANCESTRAL\nO CALOR CONTINUA SOB A CROSTA':'CALDEIRA DE DANTE\nSIGA OS CAMINHOS DE BASALTO');}
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
    this.cameras.main.setBounds(0, 0, this.volcanic?this.volcanic.config.width:this.area==='caldera'?CALDERA.width:this.area==='base'?BASE.width:this.area === 'icecave' || this.area === 'icenest' ? GLACIER[this.area].width : this.area === 'frost' ? FROST.width : this.area === 'sandpit' ? SANDPIT.width : this.area === 'valley' ? VALLEY.cameraWidth : this.area === 'arid' ? SIROCCO.cameraWidth : this.area === 'dunes' ? DUNES.width : this.area === 'cavern' ? W.cameraWidth : WORLD_WIDTH, this.volcanic?this.volcanic.config.height:this.area==='caldera'?CALDERA.height:this.area==='base'?BASE.height:this.area === 'icecave' || this.area === 'icenest' ? GLACIER[this.area].height : this.area === 'frost' ? FROST.height : this.area === 'dunes' ? DUNES.height : WORLD_HEIGHT)
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
      area: this.volcanic?this.volcanic.config.name:this.area==='caldera'?CALDERA.name:this.area==='base'?'Base de pouso':this.area === 'icecave' || this.area === 'icenest' ? GLACIER[this.area].name : this.area === 'frost' ? 'Fratura Boreal' : this.area === 'sandpit' ? 'Bacia Soterrada' : this.area === 'dunes' ? 'Dunas Interiores' : this.area === 'arid' ? 'Bacia do Siroco' : this.area === 'valley' ? 'Vale da Ressonância' : this.area === 'warden' ? 'Domínio do Guardião' : this.area === 'cavern' ? 'Cavernas de Dante' : 'Floresta de Dante',
      bestiary: this.bestiary.snapshot(), routes: this.valleyRoutes, valleyVisited: this.valleyVisited,
      saveStatus: this.glacierPlaytest ? 'Playtest temporário. Sua jornada e personagens permanecem intactos.' : coopSession.role === 'guest' ? `Seu nível, equipamentos e aprimoramentos. XP pessoal +${coopSession.personalXpGained}: ${coopSession.rewardSaved ? 'salvo na sua jornada solo' : 'aguardando armazenamento'}. Descobertas da campanha continuam separadas.` : this.qualityReference ? 'Referência isolada. O progresso do jogo permanece intacto.' : this.journey.status,
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
      const before=this.progression.snapshot();
      const invested = this.progression.investUpgrade(id);
      if (invested) {
        if(coopSession.role==='guest'){if(!this.journey.saveAbilityUpgrades(this.progression.snapshot())){this.progression.restore(before);return false;}coopSession.updateEquipment(this.equipment.snapshot().slots,this.equipment.free);}
        else this.saveProgress();this.updateProgressHud();this.sounds.ancient();
      }
      return invested;
    }, () => {
      this.resumeFromModal();
      if (this.progression.upgradePointsAvailable > 0) this.time.delayedCall(100, () => this.showAvailableUpgrade());
    }, this.classId === 'hunter',this.classId==='astral');
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
    if (this.volcanic||this.area==='caldera'||this.area === 'icecave' || this.area === 'icenest' || this.area === 'frost' || this.area === 'arid' || this.area === 'dunes' || this.area === 'sandpit') this.saveProgress();
    if (!this.qualityReference && this.progression.upgradePointsAvailable > 0) {
      this.time.delayedCall(350, () => this.showAvailableUpgrade());
    }
    this.party = this.qualityReference || this.glacierPlaytest ? undefined : new PartyExpedition(this, () => this.partyBridge());
    this.loot=new EquipmentDrops(this,coopSession.role==='guest'?'guest':'host');
    this.equipmentDialog=new EquipmentDialog(this,()=>this.equipment.snapshot(),(slot,id,uid)=>this.equipItem(slot,id,uid),()=>this.closeEquipment(),()=>this.openEquipment(),this.classId);
    this.resources=new ResourceDrops(this,coopSession.role==='guest'?'guest':'host');
    this.basePanel=new BasePanel(this,()=>({economy:this.economy,equipment:this.equipment.snapshot(),area:this.area,hp:this.player.hp,maxHp:this.player.maxHp,classId:this.classId,returnAvailable:this.canReturnBase(),returnArea:this.expeditionReturn?.area,canLead:coopSession.role!=='guest'}),a=>this.serviceAction(a),(area,resume)=>this.baseTravel(area,resume),()=>this.usePotion(),()=>{this.serviceUnpaused=coopSession.connected;if(!this.serviceUnpaused)this.pauseForModal();else {this.controls.cancelForRecords();this.charge.stop();this.hunter?.clear();this.astral?.clear();}},()=>{if(!this.serviceUnpaused)this.resumeFromModal();else this.controls.cancelForRecords();this.serviceUnpaused=false});
    if(this.area!=='base'){this.add.image(this.returnStation.x-90,this.returnStation.y,'item-accessory-2').setDisplaySize(30,40).setDepth(this.returnStation.y);this.add.text(this.returnStation.x-90,this.returnStation.y-52,'BASE · MAPA',{fontFamily:'Barlow Condensed',fontSize:'13px',color:'#e0c596',stroke:'#122123',strokeThickness:3}).setOrigin(.5).setDepth(10003);}
    if(this.area==='base')this.saveProgress();
    this.shellReady?.(this);
  }

  update(time: number, delta: number): void {
    time -= this.recordsTimeOffset;
    if (this.transitioning) return;
    if(!this.inputModalOpen)this.controls.update(this.player.position);
    if(this.area==='base'&&!this.inputModalOpen&&(BASE.services.some(s=>distance(this.player.position,s)<100)||coopSession.role!=='guest'&&distance(this.player.position,BASE.exit)<105)&&this.controls.interactPressed){const service=BASE.services.find(s=>distance(this.player.position,s)<100);if(service){this.basePanel.open(service.id);return;}if(coopSession.role!=='guest'&&distance(this.player.position,BASE.exit)<105){this.transitionArea('forest');return;}}
    if(coopSession.role==='guest'&&this.area==='base'){const near=BASE.services.some(s=>distance(this.player.position,s)<100);if(near){this.controls.setInteractAvailable(true,'CONVERSAR');this.hud.setDiscoveryPrompt(true,'CONVERSAR')}}
    // Do not simulate an authoritative world while its room is reconnecting.
    if (coopSession.role === 'host' && !coopSession.connected) { this.party?.showConnection(); return; }
    if (coopSession.role === 'guest') {
      this.visitingCoop = true;
      if (!this.inputModalOpen && this.controls.recordsPressed) { this.records.open(); return; }
      this.party?.updateGuest(time, Math.min(delta / 1000, .04));
      this.hud.setInputMethod(this.controls.inputMethod);
      updateEnvironmentOcclusion(this, this.player.position, Math.min(delta / 1000, .04));
      this.updateMusicRegion(); this.updateExplorationGuide();
      return;
    }
    this.party?.updateHost(time, Math.min(delta / 1000, .04));
    this.referenceImpacts?.update(time);
    if (!this.inputModalOpen && this.controls.recordsPressed) { this.records.open(); return; }
    this.hud.setInputMethod(this.controls.inputMethod);
    if(coopSession.takePotionRequest())this.usePeerPotion();if(coopSession.takeHealRequest()&&this.area==='base'&&this.party?.partner)this.party.partner.player.health.current=this.party.partner.player.maxHp;
    if(coopSession.takeBaseRequest()&&this.party?.partner&&!this.party.partner.player.isDead&&this.canReturnBase()){this.baseTravel('base');return;}
    if(!this.player.isDead)this.resources.collect(this.player.position,'host',p=>this.collectResource(p));
    const peer=this.party?.partner?.player;if(peer&&!peer.isDead)this.resources.collect(peer.position,'guest',p=>{this.resourceAwarded.set(p.uid,p);if(this.resourceAwarded.size>512)this.resourceAwarded.delete(this.resourceAwarded.keys().next().value!);return true});
    const remoteInteraction = this.party?.takeInteraction();
    if(this.area==='base'&&remoteInteraction&&distance(remoteInteraction,BASE.exit)<105){this.transitionArea('forest');return;}
    const interactionPosition = remoteInteraction ?? this.player.position;
    const interactionDead=remoteInteraction?this.party?.partner?.player.isDead??true:this.player.isDead;
    const pickup=this.loot.nearest(interactionPosition,remoteInteraction?'guest':'host');
    const requestedInteract=(!this.inputModalOpen&&this.controls.interactPressed)||this.clickedInteraction||!!remoteInteraction;this.clickedInteraction=false;
    const nearBaseStation=this.area!=='base'&&this.canReturnBase(interactionPosition)&&distance(interactionPosition,{x:this.returnStation.x-90,y:this.returnStation.y})<65;
    if(nearBaseStation&&requestedInteract&&!pickup){this.baseTravel('base');return;}
    if(pickup&&requestedInteract&&!interactionDead)this.pickupEquipment(pickup,!!remoteInteraction);
    const interact = requestedInteract&&!pickup;
    const nearbyEcho = this.echoSites.find(site => site.canInvestigate(interactionPosition, interactionDead));
    const nearDiscovery = nearbyEcho !== undefined;
    const nearThreshold = this.threshold?.canInvestigate(interactionPosition, interactionDead) ?? false;
    const nearMechanism = this.mechanism?.canInvestigate(interactionPosition, interactionDead) ?? false;
    const nearFragment = this.cavern?.continuation.canInvestigate(interactionPosition, interactionDead, this.fragmentSeen) ?? false;
    const nearFirstEcho = this.fragmentSeen && (this.cavern?.wardenApproach.canInvestigate(interactionPosition, interactionDead) ?? false);
    const nearWardenGate = this.cavern?.wardenApproach.canOpen(interactionPosition, interactionDead) ?? false;
    const nearWardenExit = this.area === 'warden' && this.wardenDefeated && !interactionDead && distance(interactionPosition, { x: 540, y: 760 }) < 115;
    const nearPortal = this.signalPortal?.canTraverse(interactionPosition, interactionDead) ?? false;
    const nearChapterPortal = this.chapterPortal?.canEnter(interactionPosition, interactionDead) ?? false;
    const nearSiroccoExit = this.sirocco?.exitPortal.canEnter(interactionPosition, interactionDead) ?? false;
    const nearValleyLandmark = this.valley?.canInvestigate(interactionPosition, interactionDead, this.valleyLandmarkSeen) ?? false;
    const nearValleyFrontierSignal = this.valley?.canInvestigateFrontier(interactionPosition, interactionDead, this.valleyFrontierSignalSeen) ?? false;
    const nearSiroccoSignal = this.sirocco?.canInvestigate(interactionPosition, interactionDead, this.aridSignalSeen) ?? false;
    const nearDunesRuin = this.dunes?.canInvestigate(interactionPosition, interactionDead, this.dunesRuinsSeen) ?? false;
    const nearSandpitDescent = this.area === 'dunes' && this.dunesDepthSeen && !interactionDead && distance(interactionPosition, DUNES.hollow) < 115;
    const nearSandpitAscent = this.area === 'sandpit' && !interactionDead && distance(interactionPosition, SANDPIT.ascent) < SANDPIT.ascent.radius
      && (this.soterradoDefeated || this.soterrado?.state === 'DORMANT');
    const nearColdClue = this.area === 'sandpit' && this.soterradoDefeated && !this.soterradoClueSeen && !interactionDead && distance(interactionPosition, SANDPIT.clue) < SANDPIT.clue.radius;
    const nearColdPortal = this.soterradoClueSeen && (this.coldPortal?.canEnter(interactionPosition, interactionDead) ?? false);
    const nearFrostReturn = this.frost?.returnPortal.canEnter(interactionPosition, interactionDead) ?? false;
    const nearFrostRelay = this.frost?.canInvestigate(interactionPosition, interactionDead, this.frostSignalSeen) ?? false;
    const nearIceEntry = this.frost?.onward.canEnter(interactionPosition, interactionDead) ?? false;
    const volcanicRecorded=this.area==='cinder'?this.cinderSignalSeen:this.obsidianSignalSeen;
    const nearVolcanicBack=this.volcanic?.back.canEnter(interactionPosition,interactionDead)??false;
    const nearVolcanicExit=this.volcanic?.onward.canEnter(interactionPosition,interactionDead)??false;
    const nearVolcanicRelay=!!this.volcanic&&!volcanicRecorded&&!interactionDead&&distance(interactionPosition,this.volcanic.config.relay)<this.volcanic.config.relay.radius;
    if(interact&&nearVolcanicBack){this.transitionArea(this.volcanic!.config.previous as JourneyArea);return;}
    if(interact&&nearVolcanicExit){this.transitionArea(this.volcanic!.config.next as JourneyArea);return;}
    if(interact&&nearVolcanicRelay){if(this.area==='cinder')this.cinderSignalSeen=true;else this.obsidianSignalSeen=true;this.volcanic!.respond();this.returnStation={...this.volcanic!.config.checkpoint};this.hud.showDiscovery('PASSAGEM REVELADA\nDESTINO: '+(this.area==='cinder'?VOLCANIC.obsidian.name:CALDERA.name).toLocaleUpperCase('pt-BR'));this.sounds.ancient();this.saveProgress();}
    const nearCalderaBack=!!this.caldera&&!this.bossActive()&&this.caldera.back.canEnter(interactionPosition,interactionDead);
    const nearCalderaRelay=!!this.caldera&&!this.calderaRelaySeen&&!interactionDead&&distance(interactionPosition,CALDERA.relay)<CALDERA.relay.radius;
    const nearCalderaRecord=!!this.caldera&&this.titanDefeated&&!this.titanClueSeen&&!interactionDead&&distance(interactionPosition,CALDERA.record)<CALDERA.record.radius;
    if(interact&&nearCalderaBack){this.transitionArea('obsidian');return;}
    if(interact&&nearCalderaRelay){this.calderaRelaySeen=true;this.caldera?.respond();this.hud.showDiscovery('O BASALTO RESPONDE\nA PASSAGEM PARA A CALDEIRA CENTRAL FOI ABERTA');this.sounds.ancient();this.saveProgress();}
    if(interact&&nearCalderaRecord){this.titanClueSeen=true;this.hud.showDiscovery('REGISTRO TÉRMICO RECUPERADO\nO SINAL ATRAVESSA A CROSTA\nOUTRAS CÂMARAS RESPONDEM');this.sounds.signal();this.saveProgress();}
    const nearIceBack = !interactionDead && (this.glacier?.back.canEnter(interactionPosition, false) ?? false)
      && (this.area !== 'icenest' || this.vesperDefeated || this.vesper?.state === 'DORMANT');
    const nearIceExit = this.glacier?.onward?.canEnter(interactionPosition, interactionDead) ?? false;
    const nearIceRelay = !!this.glacier && !interactionDead && distance(interactionPosition, GLACIER[this.glacier.id].relay) < GLACIER[this.glacier.id].relay.radius
      && (this.area === 'icecave' ? !this.icecaveSignalSeen : this.vesperDefeated && !this.vesperClueSeen);
    if (interact && nearIceEntry) {
      this.icecaveVisited = true; this.glacierArrival = { ...GLACIER.icecave.entry }; this.transitionArea('icecave'); return;
    } else if (interact && nearIceBack) {
      if (this.area === 'icenest') { this.glacierArrival = { x: 2660, y: 980 }; this.transitionArea('icecave'); }
      else { this.glacierArrival = { x: 2500, y: 1000 }; this.transitionArea('frost'); }
      return;
    } else if (interact && nearIceExit) {
      if(this.area==='icenest'){this.cinderVisited=true;this.transitionArea('cinder');return;}
      this.icenestVisited = true; this.glacierArrival = { ...GLACIER.icenest.entry }; this.transitionArea('icenest'); return;
    } else if (interact && nearIceRelay) {
      if (this.area === 'icecave') { this.icecaveSignalSeen = true; this.glacier?.respond(); this.hud.showDiscovery('O GELO RESPONDE\nUM SOPRO VEM DO NINHO'); }
      else { this.vesperClueSeen = true;this.glacier?.revealCaldera(); this.hud.showDiscovery('REGISTRO RECUPERADO\nPASSAGEM TÉRMICA REVELADA\nDESTINO: CALDEIRA DE DANTE'); }
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
        if (interactionDead) return;
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
    const canInteract = nearVolcanicBack||nearVolcanicExit||nearVolcanicRelay||nearCalderaBack||nearCalderaRelay||nearCalderaRecord|| nearIceEntry || nearIceBack || nearIceExit || nearIceRelay || nearColdPortal || nearFrostReturn || nearFrostRelay || nearSandpitDescent || nearSandpitAscent || nearColdClue || nearDiscovery || nearThreshold || nearMechanism || nearFragment || nearFirstEcho || nearWardenGate || nearWardenExit || nearPortal || nearChapterPortal || nearSiroccoExit || nearSiroccoSignal || nearDunesRuin || nearValleyLandmark || nearValleyFrontierSignal;
    const interactionAction = nearVolcanicBack||nearVolcanicExit?'ENTRAR':nearCalderaBack?'ENTRAR':nearBaseStation?'RETORNAR':this.area==='base'?(BASE.services.some(s=>distance(this.player.position,s)<100)?'CONVERSAR':'SAIR'):nearIceEntry || nearIceBack || nearIceExit ? 'ENTRAR' : nearColdPortal || nearFrostReturn ? 'ENTRAR' : nearSandpitDescent ? 'DESCER' : nearSandpitAscent ? 'SUBIR' : nearPortal || nearChapterPortal || nearSiroccoExit ? 'ENTRAR' : 'INVESTIGAR';
    if (interact) this.saveProgress();
    this.hud.setDiscoveryPrompt(canInteract||!!pickup||nearBaseStation||this.area==='base'&&BASE.services.some(s=>distance(this.player.position,s)<100)||this.area==='base'&&distance(this.player.position,BASE.exit)<105,pickup?'COLETAR':interactionAction);
    this.controls.setInteractAvailable(canInteract||!!pickup||nearBaseStation||this.area==='base'&&BASE.services.some(s=>distance(this.player.position,s)<100)||this.area==='base'&&distance(this.player.position,BASE.exit)<105,pickup?'COLETAR':interactionAction);
    const waiting=this.bossActive()&&!!this.party?.partner&&!this.party.partner.player.isDead&&coopSession.peerConnected;
    this.controls.setDead(this.player.isDead,!waiting);
    this.updateExplorationGuide();
    if (this.player.isDead) {
      this.hunter?.clear();this.astral?.clear();this.charge.stop();this.sounds.setMusicFocus(1);
      this.hud.showDeath(waiting,this.deathLoss);
      if (this.controls.restartPressed || this.party?.takeRestart()) {this.restart();if(!waiting)return;}
      if(!this.party?.partner||this.party.partner.player.isDead||!coopSession.peerConnected)return;
    }
    const dt = Math.min(delta / 1000, 0.04);
    const input = this.inputModalOpen||this.player.isDead?{x:0,y:0}:this.controls.movement();
    const aim = this.controls.aimFrom(this.player.position);
    this.charge.tick(time);
    if(this.controls.elementPressed&&!this.player.isDead&&!this.inputModalOpen&&this.charge.phase==='READY')this.astral?.cycle();
    if (this.controls.chargeCancelled) this.charge.stop();
    if (!this.player.isDead && !this.inputModalOpen && this.controls.chargePressed && (!this.astral||this.astral.canCharge) && !this.player.isDashing && this.attack.pose(time, aim).phase === 'READY' && this.charge.start(time)) {
      this.sounds.charge();
    }
    if ((this.controls.chargeReleased || (this.charge.phase === 'CHARGING' && !this.controls.chargeHeld)) && this.charge.release(time, aim, this.player.position)) {
      this.sounds.swing();
      if (this.hunter) this.hunter.fire(time, this.player.position, aim, this.charge.damage);
      else if(this.astral)this.astral.cast(time,this.player.position,aim,this.charge.level(time));
      else this.chargeBurst();
    }
    const heavy = this.charge.pose(time);
    const heavyBusy = heavy.phase !== 'READY';
    const facing = heavy.phase === 'RELEASE' ? this.charge.angle : aim;
    if (!this.player.isDead && !this.inputModalOpen && this.controls.dashPressed && !heavyBusy && this.player.startDash(time, input)) {
      this.sounds.dash();
      this.dashBurst(input);
    }
    if (!this.player.isDead && !this.inputModalOpen && this.controls.attacking && !heavyBusy) this.beginStrike(time);
    const pose = this.attack.pose(time, facing);
    const wasDashing = this.player.isDashing;
    if (this.area === 'warden' || this.area === 'sandpit' || this.area === 'icenest' || this.area==='caldera') {
      this.playerObstacles.length = 0;
      this.playerObstacles.push(...this.arena.obstacles);
      if (this.warden && !this.warden.isDead) {
        Object.assign(this.bossFootprint, this.warden.position, { radius: this.warden.radius });
        this.playerObstacles.push(this.bossFootprint);
      }
      if(this.titan?.solid){Object.assign(this.bossFootprint,this.titan.position,{radius:this.titan.radius});this.playerObstacles.push(this.bossFootprint);}
      if (this.vesper?.solid) { Object.assign(this.bossFootprint, this.vesper.position, { radius: this.vesper.radius }); this.playerObstacles.push(this.bossFootprint); }
      if (this.soterrado?.solid) {
        Object.assign(this.bossFootprint, this.soterrado.position, { radius: this.soterrado.radius });
        this.playerObstacles.push(this.bossFootprint);
      }
    }
    this.player.update(time, dt, input, facing, this.area === 'warden' || this.area === 'sandpit' || this.area === 'icenest' || this.area==='caldera' ? this.playerObstacles : this.arena.obstacles, pose, heavy, this.movementBounds);
    this.updateMusicRegion();
    this.hunterArt?.update(this.player.position.x, this.player.position.y, facing, time < (this.hunter?.firedUntil ?? 0), this.player.isDashing, heavy);
    this.astralArt?.update(this.player.position.x,this.player.position.y,facing,time<(this.astral?.firedUntil??0),this.player.isDashing,heavy,this.astral!.element);
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
    if(this.area==='caldera')for(const e of this.enemies)if(e!==this.titan||this.titan.canBeHit)this.bossTargets.push(e);
    const targets = this.area === 'warden' || this.area === 'sandpit' || this.area === 'icenest' || this.area==='caldera' ? this.bossTargets : this.enemies;
    if (this.charge.wavePending) {
      const waveHits = this.charge.takeHits(time, this.hunter||this.astral ? [] : targets);
      this.resolvePlayerHits(time, waveHits, this.charge.damage, this.charge.angle, 0x5fe6d8, this.charge.origin, true);
    }
    if (!this.hunter&&!this.astral) this.renderKineticWave(time);
    if (this.hunter) {
      this.hunter.update(dt, this.player.position, !heavyBusy && Math.hypot(this.player.velocity.x, this.player.velocity.y) > 1, targets, this.arena.obstacles, this.movementBounds,
        (enemy, damage, angle, precision) => this.resolvePlayerHits(time, [enemy], damage, angle, 0x5fe6d8, this.player.position, precision));
      this.hud.setHunterMomentum(this.hunter.momentum);
    } else if(this.astral){
      this.astral.update(time,dt,targets,this.arena.obstacles,this.movementBounds,(enemy,damage,angle,heavy,element,origin,force)=>this.resolvePlayerHits(time,[enemy],damage,angle,ELEMENT_COLORS[element],origin,heavy,this.equipment.snapshot().slots,force,element),heavy.phase==='CHARGING');
      this.astralPanel?.update(this.astral.energy,this.astral.element,heavy.phase,this.player.isDead,this.inputModalOpen);
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
      // Arena limits constrain participants; residents keep their original map bounds.
      const enemyBounds=this.caldera&&enemy!==this.titan?this.caldera.bounds:this.movementBounds;
      enemy.update(time, dt*Math.min(this.astral?.movementScale(enemy,time)??1,this.party?.partner?.astral?.movementScale(enemy,time)??1), target.position, target.isDead, this.arena.obstacles, impact => this.enemyStrike(enemy, impact, impact?.victim && impact.victim === this.party?.partner?.player.position ? this.party!.partner!.player : impact?.victim === this.player.position ? this.player : target), enemyBounds, coopSession.role === 'host' ? [this.player,...(this.party?.partner?.player ? [this.party.partner.player] : [])].filter(p=>!p.isDead).map(p=>p.position) : undefined);
    }
    this.enemies = this.enemies.filter(enemy => !enemy.isDead);
    this.hud.update(this.player.hp, this.player.maxHp, this.player.dashProgress, this.charge.getProgress(time), heavy.phase, heavy.level,
      this.player.dashCooldown, this.charge.cooldown);
    if (this.qualityReference) return;
    if (this.area === 'sandpit') {
      if (this.soterrado?.state === 'DORMANT' && Math.max(this.player.position.x,this.party?.partner?.player.position.x??0) >= SANDPIT.awakeningX) this.soterrado.beginIntro(time);
      this.soterradoHud?.update(this.soterrado);
      return;
    }
    if (this.area === 'warden') {
      if (!this.wardenDefeated && this.warden?.state === 'DORMANT' && Math.max(this.player.position.x,this.party?.partner?.player.position.x??0) >= 850) {
        this.gatherParty(910,760); this.warden.beginIntro(time);
        this.wardenArena?.setEncounterActive(true);
      }
      this.wardenHud?.update(this.warden);
      return;
    }
    if(this.volcanic){this.renewSiroccoHabitats();for(const route of this.volcanic.config.routes)if(this.explorationNear(route,route.radius)){const r=this.progression.discoverSiroccoRoute(route.id);if(r.awarded){this.hud.showExperienceAt(route.x,route.y,20);this.updateProgressHud();this.saveProgress();}}return;}
    if(this.area==='caldera'){
      this.renewSiroccoHabitats();
      if(!this.calderaCheckpointReached&&this.calderaRelaySeen&&this.explorationNear(CALDERA.checkpoint,130)){this.calderaCheckpointReached=true;this.returnStation={...CALDERA.checkpoint};this.saveProgress();}
      if(this.calderaRelaySeen&&this.titan?.state==='DORMANT'&&this.explorationAhead(TITAN.awakeningX)){this.titanReached=true;this.returnStation={...CALDERA.checkpoint};this.gatherParty(2250,970);this.titan.beginIntro(time);this.caldera?.setEncounterActive(true);this.movementBounds={...TITAN.bounds};this.saveProgress();}
      for(const route of CALDERA_ROUTES)if(this.explorationNear(route,route.radius)){const result=this.progression.discoverSiroccoRoute(route.id);if(result.awarded){this.hud.showExperienceAt(route.x,route.y,20);this.updateProgressHud();this.saveProgress();}if(result.leveledUp)this.levelUp();}
      this.titanHud?.update(this.titan);return;
    }
    if (this.area === 'icenest') {
      if (this.vesper?.state === 'DORMANT' && Math.max(this.player.position.x,this.party?.partner?.player.position.x??0) >= VESPER.awakeningX) { this.vesperReached = true; this.saveProgress(); this.gatherParty(920,990); this.vesper.beginIntro(time); this.glacier?.setEncounterActive(true); }
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
    if (this.area === 'cavern' && this.wardenGateOpen && this.explorationNear({x:6310,y:740},120)) this.transitionArea('warden');
    if (this.area === 'forest' && this.progression.passageOpen && !this.gateObstacle && (this.threshold?.isInside(this.player.position) || !!this.party?.partner && this.threshold?.isInside(this.party.partner.player.position))) this.enterCavern();
    if (this.area === 'cavern' && !this.deepPassageOpen && !this.deepOpening && this.explorationNear(CAVERN_DEPTH_OPENING, CAVERN_DEPTH_OPENING.radius)) {
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
          tuneEnemy(enemy,this.area);this.enemies.push(enemy); this.hollowSpawnIds.set(enemy, spawnId + offset);
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
    if(this.volcanic){const c=this.volcanic.config,seen=this.area==='cinder'?this.cinderSignalSeen:this.obsidianSignalSeen;const route=c.routes.find(r=>!this.progression.rewardedRoutes.has(r.id)&&distance(this.player.position,r)<250);const target:ExplorationTarget=distance(this.player.position,c.back)<160?{...c.back,radius:116,name:'Retornar',instruction:'Volte pela passagem anterior.',action:'enter'}:route?{...route,instruction:'Explore este desvio.',action:'walk'}:!seen?{...c.relay,name:'Registro vulcânico',instruction:'Investigue as inscrições no basalto.',action:'investigate'}:{...c.exit,radius:116,name:this.area==='cinder'?VOLCANIC.obsidian.name:CALDERA.name,instruction:'Atravesse a passagem revelada.',action:'enter'};this.explorationGuide.update(this.player.position,this.player.isDead,this.controls.inputMethod,c.name.toLocaleUpperCase('pt-BR'),target,this.hud);return;}
    if(this.caldera){
      const target:ExplorationTarget=this.titanDefeated?this.titanClueSeen?{...CALDERA.back,radius:116,name:'Retornar à expedição',instruction:'Registro recuperado. Reabasteça na base ou volte pelo portal.',action:'enter'}:{...CALDERA.record,name:'Registro térmico',instruction:'Investigue a estrutura além do gigante.',action:'investigate'}:!this.calderaRelaySeen?{...CALDERA.relay,name:'Registro de basalto',instruction:'Explore os desvios e investigue as inscrições.',action:'investigate'}:{...TITAN.spawn,radius:120,name:'O Incandescente',instruction:'Atravesse o limiar. Saia das marcas e ataque nas pausas.',action:'walk'};
      this.explorationGuide.update(this.player.position,this.player.isDead,this.controls.inputMethod,CALDERA.name.toLocaleUpperCase('pt-BR'),target,this.hud);return;
    }
    if (this.glacier) {
      const c = GLACIER[this.glacier.id];
      const target: ExplorationTarget = distance(this.player.position, c.back) < 170 && (this.area !== 'icenest' || this.vesperDefeated || this.vesper?.state === 'DORMANT')
        ? { ...c.back, radius: 116, name: 'Retornar', instruction: 'Volte pela passagem.', action: 'enter' }
        : this.area === 'icecave' ? !this.icecaveSignalSeen
          ? { ...c.relay, name: 'Registro do degelo', instruction: 'Investigue as inscrições.', action: 'investigate' }
          : { ...c.exit, radius: 116, name: 'Ninho da Geada', instruction: 'Atravesse a passagem revelada.', action: 'enter' }
        : this.vesperDefeated ? this.vesperClueSeen?{...c.exit,radius:116,name:VOLCANIC.cinder.name,instruction:'Atravesse o portal térmico revelado.',action:'enter'}:{ ...c.relay, name: 'Registro do ninho', instruction: 'Recupere o fragmento para revelar a próxima região.', action: 'investigate' }
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
    if(this.area==='base'){this.explorationGuide.update(this.player.position,this.player.isDead,this.controls.inputMethod,'PREPARE SUA EXPEDIÇÃO',{...BASE.exit,radius:105,name:'Trilha para a Floresta',instruction:'Enfermaria, oficina e cofre estão disponíveis na base.',action:'enter'},this.hud);return;}
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
      tuneEnemy(enemy,this.area);this.enemies.push(enemy);
      this.enemySpecies.set(enemy, 'crawler');
      this.hollowSpawnIds.set(enemy,FOREST_SPAWNS.length+CAVERN_HOLLOWS.length+index);
    });
  }

  private enterCavern(): void { this.transitionArea('cavern'); }

  private updateMusicRegion(force = false): void {
    const x = this.player.position.x;
    const region = this.area==='caldera'?(this.bossActive()?'titan':'caldera'):this.area==='base'?'forest':this.area === 'sandpit' ? 'soterrado' : this.area === 'arid' ? 'sirocco' : this.area !== 'cavern' ? this.area
      : x >= EXPANSION.exteriorX ? 'exterior' : x >= EXPANSION.deeperX ? 'deeper'
      : this.deepPassageOpen && x >= DEEP_AREA.entryX ? 'deep' : 'cavern';
    if (force || region !== this.musicRegion) {
      this.musicRegion = region;
      this.sounds.setArea(region);
    }
  }

  coopArea(): JourneyArea { return this.area; }

  private partyBridge(): PartyBridge {
    return {
      area: this.area, player: this.player, controls: this.controls, enemies: this.enemies,
      obstacles: this.arena.obstacles, solidObstacles: (this.warden && !this.warden.isDead || this.soterrado?.solid || this.vesper?.solid || this.titan?.solid) ? [...this.arena.obstacles, { ...(this.warden ?? this.soterrado ?? this.vesper ?? this.titan)!.position, radius: (this.warden ?? this.soterrado ?? this.vesper ?? this.titan)!.radius }] : this.arena.obstacles, bounds: this.movementBounds, hud: this.hud, hunter: this.hunter,astral:this.astral,
      boss: this.warden ?? this.soterrado ?? this.vesper ?? this.titan,
      signalPortal:this.signalPortal?.active??false,resources:this.resources?.snapshot()??[],resourceAwarded:[...this.resourceAwarded.values()],potionUsed:this.potionUsed,visited:this.economy.visited,returnStation:this.returnStation,expeditionReturn:this.expeditionReturn,
      cue:kind=>{if(kind==='dash')this.sounds.dash();else if(kind==='charge')this.sounds.charge();else if(kind==='release')this.sounds.swing();else {this.sounds.hurt();this.player.flashHurt();}},
      inputBlocked:this.inputModalOpen,bossActive:this.bossActive(),baseMaxHp:this.progression.maxHp,loot:this.loot?.snapshot()??[],lootRender:poses=>this.loot.render(poses??[]),
      bossRender: boss => {
        (this.wardenHud ?? this.soterradoHud ?? this.vesperHud ?? this.titanHud)?.update(boss);
        this.wardenArena?.setEncounterActive(boss?.active ?? false);
        this.wardenArena?.setPhase(boss?.phase ?? 1);
        this.glacier?.setEncounterActive(boss?.active ?? false);
        if(this.caldera){if(this.calderaRelaySeen)this.caldera.respond();this.caldera.setEncounterActive(boss?.active??false);this.movementBounds=boss?.active?{...TITAN.bounds}:this.caldera.bounds;}
        if(boss?.isDead&&!this.coopBossResolved){this.coopBossResolved=true;this.wardenArena?.resolve();this.glacier?.resolve();this.caldera?.resolve();this.sandpit?.resolve();if(this.area==='sandpit')this.hud.setSandpitArea(this.soterradoDefeated,this.soterradoClueSeen);}
        const cue=boss?`${boss.state}:${boss.phase}:${boss.attackName}`:'';
        if(cue!==this.coopBossCue){
          this.coopBossCue=cue;
          if(boss?.state==='INTRO'){this.sounds.wardenCue('intro');this.sounds.setMusicFocus(.55);}
          else if(boss?.state==='PHASE')this.sounds.wardenCue('phase');
          else if(boss?.state==='TELEGRAPH'){this.sounds.setMusicFocus(1);this.sounds.wardenCue('signal');}
          else if(boss?.state==='EXECUTE')this.sounds.wardenCue(boss.attackName==='rush'?'rush':boss.attackName==='sweep'||boss.attackName==='tail'?'sweep':'slam');
          else if(boss?.isDead){this.sounds.stopMusic();this.sounds.wardenCue('death');}
        }
      },
      strike:this.attack.pose(this.time.now,this.player.rotation),releaseProgress:this.charge.pose(this.time.now).swingProgress,
      progression: this.progression.snapshot(),
      flags: Object.fromEntries(JOURNEY_FLAGS.map(key => [key, this[key]])) as JourneyFlags,
      phase: this.charge.phase, chargeLevel: this.charge.level(this.time.now),
      wave: !this.hunter && !this.astral && this.charge.waveVisible(this.time.now) ? {
        x: this.charge.origin.x + Math.cos(this.charge.angle) * (KINETIC_CHARGE.waveStart + KINETIC_CHARGE.waveTravel * this.charge.waveProgress(this.time.now)),
        y: this.charge.origin.y + Math.sin(this.charge.angle) * (KINETIC_CHARGE.waveStart + KINETIC_CHARGE.waveTravel * this.charge.waveProgress(this.time.now)),
        rotation: this.charge.angle, width: KINETIC_CHARGE.waveThickness, height: this.charge.waveHalfWidth * 2,
      } : undefined,
      firing: this.astral?this.time.now<this.astral.firedUntil:this.hunter ? this.time.now < this.hunter.firedUntil : this.attack.pose(this.time.now, this.player.rotation).phase !== 'READY',
      id: enemy => this.hollowSpawnIds.get(enemy), species: enemy => this.enemySpecies.get(enemy),
      hit: (targets, damage, angle, from, heavy,knockback,color,element) => this.resolvePlayerHits(this.time.now, targets, damage, angle, color??0x5fe6d8, from, heavy,coopSession.peer?.equipment??{},knockback,element),
      impacts: this.impactHistory.filter(hit => this.time.now-hit.at < 650),
      impact: hit => this.impact(hit, hit.color, hit.damage, hit.angle, hit.effective, hit.resisted, false),
      prompt: position => {
        if(this.area!=='base'&&this.canReturnBase(position)&&distance(position,{x:this.returnStation.x-90,y:this.returnStation.y})<65)return{available:true,action:'RETORNAR'};
        if(this.area==='base')return{available:BASE.services.some(s=>distance(position,s)<100)||distance(position,BASE.exit)<105,action:'CONVERSAR'};
        if(this.loot.nearest(position,'guest'))return{available:true,action:'COLETAR'};
        const dead = false;
        const portal = this.chapterPortal?.canEnter(position, dead) || this.sirocco?.exitPortal.canEnter(position, dead) || this.frost?.returnPortal.canEnter(position, dead)
          || this.signalPortal?.canTraverse(position,dead) || this.coldPortal?.canEnter(position,dead) || this.frost?.onward.canEnter(position,dead)
          || this.volcanic?.back.canEnter(position,dead)||this.volcanic?.onward.canEnter(position,dead)|| !this.bossActive()&&this.caldera?.back.canEnter(position,dead) || this.glacier?.onward?.canEnter(position,dead) || this.glacier?.back.canEnter(position,dead)
          || this.area==='dunes'&&this.dunesDepthSeen&&distance(position,DUNES.hollow)<115
          || this.area==='sandpit'&&(this.soterradoDefeated||this.soterrado?.state==='DORMANT')&&distance(position,SANDPIT.ascent)<SANDPIT.ascent.radius
          || this.area==='warden'&&this.wardenDefeated&&distance(position,{x:540,y:760})<115;
        const investigate = !!this.volcanic&&!(this.area==='cinder'?this.cinderSignalSeen:this.obsidianSignalSeen)&&distance(position,this.volcanic.config.relay)<this.volcanic.config.relay.radius|| !!this.caldera&&(!this.calderaRelaySeen&&distance(position,CALDERA.relay)<CALDERA.relay.radius||this.titanDefeated&&!this.titanClueSeen&&distance(position,CALDERA.record)<CALDERA.record.radius)|| this.echoSites.some(site => site.canInvestigate(position, dead)) || this.threshold?.canInvestigate(position, dead) ||
          this.mechanism?.canInvestigate(position, dead) || this.valley?.canInvestigate(position, dead, this.valleyLandmarkSeen) ||
          this.valley?.canInvestigateFrontier(position, dead, this.valleyFrontierSignalSeen) ||
          this.sirocco?.canInvestigate(position, dead, this.aridSignalSeen) ||
          this.dunes?.canInvestigate(position, dead, this.dunesRuinsSeen) || this.frost?.canInvestigate(position, dead, this.frostSignalSeen)
          || this.cavern?.continuation.canInvestigate(position,dead,this.fragmentSeen)
          || this.fragmentSeen&&this.cavern?.wardenApproach.canInvestigate(position,dead) || this.cavern?.wardenApproach.canOpen(position,dead)
          || this.area==='sandpit'&&this.soterradoDefeated&&!this.soterradoClueSeen&&distance(position,SANDPIT.clue)<SANDPIT.clue.radius
          || !!this.glacier&&distance(position,GLACIER[this.glacier.id].relay)<GLACIER[this.glacier.id].relay.radius
            && (this.area==='icecave'?!this.icecaveSignalSeen:this.vesperDefeated&&!this.vesperClueSeen);
        return { available: !!(portal || investigate), action: portal ? 'ENTRAR' : 'INVESTIGAR' };
      },
      sync: world => this.syncCoopWorld(world),
      render: pose => {
        const previousDead = this.player.isDead;
        this.player.health.max = pose.maxHp; this.player.health.current = pose.hp;
        this.player.renderRemote(pose, pose.aim, pose.strike??{ phase: pose.firing ? 'SWING' : 'READY', relativeAngle: 0, worldAngle: pose.aim, swingProgress: pose.swingProgress??.5 },
          { phase: pose.phase as 'READY' | 'CHARGING' | 'RELEASE', level: pose.level, swingProgress: pose.releaseProgress??0 }, pose.dash, pose.dead);
        this.hunterArt?.update(pose.x, pose.y, pose.aim, pose.firing, pose.dash, { phase: pose.phase as 'READY' | 'CHARGING' | 'RELEASE', level: pose.level });
        this.hunter?.beamView.render(pose.beam);
        this.astral?.render(pose.astral);
        if(pose.astral){this.astralArt?.update(pose.x,pose.y,pose.aim,pose.firing,pose.dash,{phase:pose.phase as 'READY'|'CHARGING'|'RELEASE',level:pose.level},pose.astral.element);this.astralPanel?.update(pose.astral.energy,pose.astral.element,pose.phase as 'READY'|'CHARGING'|'RELEASE',pose.dead,this.inputModalOpen);}
        if (pose.dead && !previousDead) this.hud.showDeath(!!coopSession.world?.boss?.active&&!coopSession.world.host.dead);
      },
    };
  }

  private syncCoopWorld(world: PartyWorld): boolean {
    this.visitingCoop = true;
    const personal=this.journey.load();if(personal){this.economy=validEconomy(personal.economy);this.equipment.restore(personal.equipment);this.basePanel?.refreshBar();}
    if(world.visited)this.economy.visited=[...new Set([...this.economy.visited,...world.visited])];
    this.expeditionReturn=validExpeditionReturn(world.expeditionReturn);
    this.resources?.render(world.resources);
    if(world.partner?.deathId){const loss=this.journey.penalizeDeath(world.partner.deathId);if(loss!==undefined&&loss>0)this.hud.showDiscovery(`-${loss} créditos · morte`);}
    const own=this.journey.load()?.progression;
    this.progression.restore({...world.progression,xp:own?.xp??0,abilityUpgrades:own?.abilityUpgrades,bossRewards:own?.bossRewards});
    for (const key of JOURNEY_FLAGS) this[key] = world.flags[key] === true;
    const bossArea=['warden','sandpit','icenest','caldera'].includes(world.area);
    const layoutFlags=bossArea?Object.fromEntries(Object.entries(world.flags).filter(([key])=>!['titanReached','titanDefeated','titanClueSeen','calderaCheckpointReached','vesperReached','vesperDefeated','vesperClueSeen','wardenDefeated','wardenEndingSeen','soterradoDefeated','soterradoClueSeen'].includes(key))):world.flags;
    const layout = world.area + JSON.stringify(layoutFlags) + world.progression.echoes.join(',');
    const refresh = layout !== this.coopLayout;
    this.coopLayout = layout;
    this.area = world.area;
    if (refresh) { this.scene.restart(); return true; }
    if(world.signalPortal)this.signalPortal?.activate();
    if(this.vesperClueSeen)this.glacier?.revealCaldera();
    if(this.area==='sandpit'&&this.soterradoClueSeen&&!this.coldPortal){this.coldPortal=new ChapterPortal(this,{x:SANDPIT.clue.x,y:SANDPIT.clue.y+60},true);this.sandpit?.hideClueForPortal();}
    if (this.coopWorldXp !== undefined && this.progression.xp > this.coopWorldXp)
      this.hud.showExperienceAt(this.player.position.x, this.player.position.y, this.progression.xp - this.coopWorldXp);
    this.coopWorldXp = this.progression.xp;
    const buildKey=JSON.stringify([this.progression.level,this.progression.abilityUpgradeRanks]);
    if(buildKey!==this.peerBuildKey){this.peerBuildKey=buildKey;coopSession.updateEquipment(this.equipment.snapshot().slots,this.equipment.free,this.economy.potions);}
    if(this.progression.upgradePointsAvailable>0&&!this.guestUpgradeScheduled&&!this.inputModalOpen&&!this.player.isDead&&!world.boss?.active){
      this.guestUpgradeScheduled=true;this.time.delayedCall(350,()=>{this.guestUpgradeScheduled=false;if(!this.bossActive())this.showAvailableUpgrade();});
    }
    this.updateProgressHud();
    if (world.message !== this.coopMessage) {
      this.coopMessage = world.message;
      if (world.message) { this.hud.showDiscovery(world.message); this.sounds.signal(); }
    }
    return false;
  }

  private gatherParty(x:number,y:number):void {
    if(coopSession.role!=='host'||!this.party?.partner)return;
    const players=[this.player,...(this.party?.partner?[this.party.partner.player]:[])];
    for(const p of players)if(p.position.x<x-25){p.position.x=x;p.position.y=y;}
  }

  private explorationNear(point: Vec2, radius: number): boolean {
    const peer = this.party?.partner?.player;
    return distance(this.player.position, point) < radius || !!peer && !peer.isDead && distance(peer.position, point) < radius;
  }

  private transitionArea(area: JourneyArea, resume=false): boolean {
    if (this.transitioning) return false;
    if (coopSession.role === 'host' && !coopSession.travel(this.area, area)) {
      this.hud.showDiscovery('AGUARDE A CONEXÃO DA SALA PARA ATRAVESSAR'); return false;
    }
    const departure={...this.player.position};
    this.transitioning = true;
    this.transferHp = this.player.hp;
    this.returnToThreshold = this.area === 'warden' && area === 'cavern';
    this.returnFromValley = this.area === 'valley' && area === 'warden';
    this.returnToValleyPortal = this.area === 'warden' && area === 'valley';
    this.returnToFrontierPortal = this.area === 'arid' && area === 'valley';
    this.cameras.main.fadeOut(220, 5, 15, 20);
    const arrive = () => {
      if (coopSession.role === 'host' && coopSession.area !== area) {
        if(!coopSession.travelling){this.transitioning=false;this.cameras.main.fadeIn(220,5,15,20);this.hud.showDiscovery(coopSession.message);return;}
        this.time.delayedCall(80, arrive); return;
      }
      if(area==='base'&&this.area!=='base')this.expeditionReturn={area:this.area,position:departure};
      if(this.area==='base'&&area!=='base'){
        if(resume&&this.expeditionReturn?.area===area)this.expeditionArrival={...this.expeditionReturn.position};
        this.expeditionReturn=undefined;
      }
      this.area = area; this.saveProgress(); this.scene.restart();
    };
    this.time.delayedCall(240, arrive);
    return true;
  }

  private wardenCue(cue: WardenCue, attack?: WardenAttack): void {
    if (cue === 'execute' && attack) this.sounds.wardenCue(attack);
    else if (cue === 'intro') { this.sounds.wardenCue('intro'); this.sounds.setMusicFocus(0.45); }
    else if (cue === 'phase') { this.sounds.wardenCue('phase'); this.wardenArena?.setPhase(this.warden?.phase ?? 1); }
    else if (cue === 'death') {
      // Persist on the lethal hit; a restart cannot resurrect a defeated guardian.
      this.wardenDefeated = true;
      const reward=this.progression.defeatWarden();
      if(reward.awarded)this.hud.showExperienceAt(this.warden!.position.x,this.warden!.position.y,120);
      if(reward.leveledUp)this.levelUp(false);this.updateProgressHud();
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

  private titanCue(cue:TitanCue):void {
    if(cue==='intro'){this.sounds.wardenCue('intro');this.sounds.setMusicFocus(.55);this.hud.showDiscovery('O INCANDESCENTE\nA CROSTA ESTÁ VIVA');}
    else if(cue==='warning'){this.sounds.setMusicFocus(1);this.sounds.wardenCue('signal');}
    else if(cue==='strike')this.sounds.wardenCue(this.titan?.attackName==='cleave'?'sweep':'slam');
    else if(cue==='phase'){this.sounds.wardenCue('phase');this.hud.showDiscovery(this.titan?.phase===3?'O NÚCLEO ESTÁ EXPOSTO\nFISSURAS E BLOCOS EM SEQUÊNCIA':'A CROSTA SE ROMPE\nOBSERVE AS MARCAS NO SOLO');}
    else if(cue==='death'){
      this.titanDefeated=true;const reward=this.progression.defeatTitan();this.updateProgressHud();
      if(reward.awarded)this.hud.showExperienceAt(this.titan!.position.x,this.titan!.position.y,TITAN.xp);
      if(reward.leveledUp)this.levelUp(false);
      this.caldera?.resolve();this.movementBounds=this.caldera!.bounds;this.sounds.stopMusic();this.sounds.wardenCue('death');this.saveProgress();
    }
  }

  private finishTitan():void {
    this.caldera?.resolve();this.reviveBossSurvivors();this.movementBounds=this.caldera!.bounds;
    this.hud.showDiscovery('O INCANDESCENTE CAIU\nAPERFEIÇOAMENTO CONQUISTADO\nINVESTIGUE O REGISTRO DA CALDEIRA');this.sounds.ancient();
    if(this.progression.upgradePointsAvailable>0)this.time.delayedCall(1400,()=>this.showAvailableUpgrade());
  }

  private finishSoterrado(): void {
    this.sandpit?.resolve();this.reviveBossSurvivors();
    this.hud.setSandpitArea(true,this.soterradoClueSeen);
    this.hud.showDiscovery('O SOTERRADO CAIU\nAPERFEIÇOAMENTO CONQUISTADO\nUMA PASSAGEM FOI EXPOSTA');
    this.sounds.ancient();
    if (this.progression.upgradePointsAvailable>0) this.time.delayedCall(1400,()=>this.showAvailableUpgrade());
  }

  private finishWarden(): void {
    this.wardenArena?.resolve();this.reviveBossSurvivors();
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
    if(this.clickNearbyPortal())return;
    if (coopSession.role === 'guest') { this.party?.queueAttack(); return; }
    if (this.charge.phase !== 'READY') return;
    if(this.astral){const aim=this.controls.aimFrom(this.player.position);if(this.astral.fire(now,this.player.position,aim,this.astralArt!.projectileOffset(aim)))this.sounds.swing();return;}
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

  private resolvePlayerHits(now: number, hits: Enemy[], damage: number, angle: number, color: number, from: Vec2, chargeHit: boolean, slots:EquipmentSnapshot['slots']=this.equipment.snapshot().slots,knockback?:number,element?:AstralElement): void {
    const bonuses=equipmentStats(slots);
    damage=Math.round(damage*(1+bonuses.damage)*(chargeHit?1+bonuses.charge:1));
    if (hits.length) this.cameras.main.shake(chargeHit ? 75 : 55, chargeHit ? 0.003 : 0.0024);
    for (const enemy of hits) {
      if ((enemy === this.warden || enemy === this.soterrado || enemy === this.vesper || enemy === this.titan) && !(enemy as Warden | Soterrado | Vesper | CalderaTitan).canBeHit) continue;
      const multiplier = elementalMultiplier(element, this.enemySpecies.get(enemy));
      const result = applyDamage(enemy.health, Math.round(damage * multiplier));
      if (!result.applied) continue;
      this.sounds.hit();
      this.impact(enemy.position, color, result.amount, angle, multiplier > 1, multiplier < 1);
      if (chargeHit&&knockback===undefined) {
        const wave = this.add.circle(enemy.position.x, enemy.position.y, 14).setStrokeStyle(3, 0x5fe6d8, 0.82).setDepth(15001);
        this.tweens.add({ targets: wave, scale: 2.4, alpha: 0, duration: 190, onComplete: () => wave.destroy() });
      }
      if (result.died) {
        const species = this.enemySpecies.get(enemy);
        if (species && this.bestiary.defeat(species)) this.records.markDiscovery();
        if (enemy !== this.warden && enemy !== this.soterrado && enemy !== this.vesper && enemy !== this.titan) this.deathEffect(enemy.position);
        enemy.die();
        const tier=['frost','icecave','icenest'].includes(this.area)?3:['arid','dunes','sandpit','caldera','cinder','obsidian'].includes(this.area)?2:1;const boss=enemy===this.warden||enemy===this.soterrado||enemy===this.vesper||enemy===this.titan;this.resources.add(enemy.position,tier,'host',boss);if(coopSession.peer)this.resources.add(enemy.position,tier,'guest',boss);
        this.dropEquipment(enemy);
        const spawnIndex = this.hollowSpawnIds.get(enemy);
        if (spawnIndex !== undefined) {
          const isValley = this.area === 'valley' && this.valleyResidents.get(spawnIndex) === enemy;
          const isSirocco = (this.area === 'arid' || this.area === 'dunes' || this.area === 'frost' || this.area === 'icecave'||this.area==='caldera'||this.area==='cinder'||this.area==='obsidian') && this.siroccoResidents.get(spawnIndex) === enemy;
          const reward = isValley || isSirocco
            ? { awarded: true, leveledUp: this.progression.defeatRenewableResident(regionalThreat(this.area,enemy.position.x).xp) }
            : this.progression.defeatHollow(spawnIndex,regionalThreat(this.area,enemy.position.x).xp);
          if (isValley) {
            this.valleyResidents.delete(spawnIndex);
            this.valleyHabitatCooldowns.set(spawnIndex, Date.now() + VALLEY_RENEWAL.delayMs);
          } else if (isSirocco) {
            this.siroccoResidents.delete(spawnIndex);
            this.siroccoHabitatCooldowns.set(spawnIndex, Date.now() + SIROCCO_RENEWAL.delayMs);
          }
          if (reward.awarded) {
            this.updateProgressHud();
            this.hud.showExperienceAt(enemy.position.x, enemy.position.y, regionalThreat(this.area,enemy.position.x).xp);
          }
          if (reward.leveledUp) this.levelUp();
          this.hollowSpawnIds.delete(enemy);
        }
        this.saveProgress();
      } else enemy.hurt(now, from, knockback??(chargeHit ? KINETIC_CHARGE.knockback : 300));
    }
  }

  private enemyStrike(enemy: Enemy, impact?: EnemyImpact, target: Player = this.player): void {
    if (target !== this.player) {
      if (target.isDead || target.invulnerable || (!impact?.ranged && distance(enemy.position, target.position) > (enemy.attackRange ?? CRAWLER.attackRange) + PLAYER.radius)) return;
      const result = applyDamage(target.health, Math.max(1,Math.round((impact?.damage ?? enemy.attackDamage ?? CRAWLER.attackDamage)*regionalThreat(this.area,enemy.position.x).damage*(1-equipmentStats(coopSession.peer?.equipment??{}).resistance))));
      if (result.applied) { target.flashHurt(); target.setHurtGrace(this.time.now + PLAYER.hurtCooldown); this.impact(target.position, 0xff8f82, result.amount); }
      if (result.died) this.handleDeath(target);
      return;
    }
    if (this.player.isDead || this.player.invulnerable || (!impact?.ranged && distance(enemy.position, this.player.position) > (enemy.attackRange ?? CRAWLER.attackRange) + PLAYER.radius)) return;
    const result = applyDamage(this.player.health, Math.max(1,Math.round((impact?.damage ?? enemy.attackDamage ?? CRAWLER.attackDamage)*regionalThreat(this.area,enemy.position.x).damage*(1-equipmentStats(this.equipment.snapshot().slots).resistance))));
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

      this.charge.stop();
      this.kineticWave.clear();
      this.waveDrawn = false;
      this.handleDeath(this.player);
      this.sounds.death();
      this.time.delayedCall(550, () => {if(this.player.isDead)this.hud.showDeath(this.bossActive()&&!!this.party?.partner&&!this.party.partner.player.isDead&&coopSession.peerConnected,this.deathLoss);});
    }
    this.saveProgress();
  }

  private handleDeath(target:Player):void {
    if(target.isDead)return;
    target.die();
    if(target===this.player)this.attack=new SaberAttack(id=>this.progression.upgradeRank(id));
    if(target===this.player){this.deathLoss=deathCreditLoss(this.economy.credits);this.economy.credits-=this.deathLoss;this.basePanel?.refreshBar();this.saveProgress();}
    else {coopSession.peerDeathId=crypto.randomUUID();this.party?.cancelPartnerCharge();}
    const ally=target===this.player?this.party?.partner?.player:this.player;
    if(!ally||ally.isDead||target===this.player&&!coopSession.peerConnected){this.warden?.suspend();this.soterrado?.suspend();this.vesper?.suspend();this.titan?.suspend();}
  }

  private reviveBossSurvivors():void {
    for(const p of [this.player,this.party?.partner?.player])if(p?.isDead){
      const at=safeExpeditionPosition(this.returnStation,p.radius,this.arena.obstacles,this.movementBounds)??this.returnStation;
      p.revive(at);
    }
    this.hud.hideDeath();this.saveProgress();
  }

  // Clicking an enabled nearby passage has the same action path as E/A/Touch.
  private clickNearbyPortal():boolean {
    if(this.controls.inputMethod!=='keyboard'||this.inputModalOpen||this.player.isDead)return false;
    const pointer=this.input.activePointer,click=this.cameras.main.getWorldPoint(pointer.x,pointer.y);
    const portals=[this.signalPortal,this.chapterPortal,this.coldPortal,this.sirocco?.exitPortal,this.frost?.returnPortal,this.frost?.onward,this.glacier?.back,this.glacier?.onward,this.caldera?.back,this.volcanic?.back,this.volcanic?.onward];
    const enabled=portals.find(p=>p&&('canEnter'in p?p.canEnter(this.player.position,false):p.canTraverse(this.player.position,false))&&distance(click,p.position)<110);
    if(!enabled)return false;
    if(coopSession.role==='guest')this.party?.queueInteraction();else this.clickedInteraction=true;
    return true;
  }

  private impact(position: Vec2, color: number, damage: number, saberAngle?: number, effective = false, resisted = false, broadcast = true): void {
    if (broadcast && coopSession.role === 'host') {
      this.impactHistory.push({id: ++this.impactSequence, at: this.time.now, ...position, color, damage, angle: saberAngle, effective, resisted});
      if (this.impactHistory.length > 24) this.impactHistory.shift();
    }
    if (this.referenceImpacts) {
      this.referenceImpacts.hit(this.time.now, position, color, damage, saberAngle, effective, resisted);
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
    const label = this.add.text(position.x, position.y - 31, damageText(damage, effective, resisted), { fontFamily: 'Barlow Condensed, sans-serif', fontSize: '24px', fontStyle: 'bold', color: damageTextColor(color, '#d4ffe9'), stroke: '#14312d', strokeThickness: 4 }).setOrigin(0.5).setDepth(15002);
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
    if(this.player.isDead)this.player.health.max=this.characterMaxHp;else this.player.health.setMaxAndRestore(this.characterMaxHp);
    this.hud.showLevelUp(this.progression.level, this.characterMaxHp, gainedHp, this.progression.upgradePointsAvailable > 0);
    this.updateProgressHud();
    this.saveProgress();
    const ring = this.add.circle(this.player.position.x, this.player.position.y, 25)
      .setStrokeStyle(3, 0xffbd54, 0.8).setDepth(15000);
    this.tweens.add({ targets: ring, scale: 2.6, alpha: 0, duration: 450, onComplete: () => ring.destroy() });
    if (showUpgrade && this.progression.upgradePointsAvailable > 0) this.time.delayedCall(380, () => this.showAvailableUpgrade());
  }

  private showAvailableUpgrade(): void {
    if (this.player.isDead || !this.abilityUpgradeDialog || this.abilityUpgradeDialog.isOpen || this.inputModalOpen || this.records?.isOpen || this.progression.upgradePointsAvailable <= 0) return;
    this.pauseForModal();
    this.abilityUpgradeDialog.open(this.progression.level, this.progression.abilityUpgradeRanks, this.progression.upgradePointsAvailable);
  }

  private pauseForModal(): void {
    coopSession.setMenu(true);
    this.controls.cancelForRecords();
    if (coopSession.role === 'host') this.party?.cancelPartnerCharge();
    if (coopSession.role === 'guest') coopSession.send('input', { x: 0, y: 0, aim: 0, attack: false, dash: false, charge: false, held: false, release: false, cancel: true, interact: false, restart: false });
    this.charge.stop();
    this.hunter?.clear();this.astral?.clear();
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
    if(this.bossActive()&&(!this.player.isDead||coopSession.peerConnected&&this.party?.partner&&!this.party.partner.player.isDead))return;
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
    tuneEnemy(enemy,this.area);this.enemies.push(enemy);
    this.enemySpecies.set(enemy, habitat.kind);
    this.hollowSpawnIds.set(enemy, habitat.id);
    this.valleyResidents.set(habitat.id, enemy);
    this.valleyHabitatCooldowns.delete(habitat.id);
    return true;
  }

  private spawnSiroccoResident(habitat: { id: number; kind: SiroccoKind | FrostKind | VolcanicKind | 'iceCarapace'; x: number; y: number }): boolean {
    if (this.siroccoResidents.has(habitat.id)) return false;
    const readyAt = this.siroccoHabitatCooldowns.get(habitat.id);
    if (readyAt !== undefined && (Date.now() < readyAt || this.explorationNear(habitat, SIROCCO_RENEWAL.safeDistance))) return false;
    const enemy = ['emberHound','fumarole','slagback'].includes(habitat.kind)?new VolcanicCreature(this,habitat.kind as VolcanicKind,habitat.x,habitat.y):habitat.kind === 'iceCarapace' ? new ValleyCreature(this, 'iceCarapace', habitat.x, habitat.y) : new DanteCreature(this, habitat.kind as SiroccoKind|FrostKind, habitat.x, habitat.y);
    tuneEnemy(enemy,this.area);this.enemies.push(enemy);
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
    for (const habitat of this.area==='cinder'||this.area==='obsidian'?VOLCANIC_ENCOUNTERS[this.area]:this.area==='caldera'?CALDERA_ENCOUNTERS:this.area === 'icecave' ? GLACIER_ENCOUNTERS : this.area === 'frost' ? FROST_ENCOUNTERS : this.area === 'dunes' ? DUNES_ENCOUNTERS : SIROCCO_ENCOUNTERS) if (this.spawnSiroccoResident(habitat)) renewed = true;
    if (renewed) this.saveProgress();
  }

  private restoreJourney(): void {
    if (this.glacierPlaytest) {
      if(this.glacierPlaytest.economy){this.area='base';this.economy=validEconomy({credits:300,materials:[30,30,30],potions:3,visited:['base','forest']});return;}
      if(this.glacierPlaytest.area==='forest'){
        this.area='forest';
        if(!this.glacierPlaytest.inventory)for(const id of ['forest-armor','forest-emitter'] as const)this.equipment.grant(id);
        if(this.glacierPlaytest.pilot){this.equipment.equip('armor','forest-armor');this.equipment.equip('weapon','forest-emitter');}
        return;
      }
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
    if (!saved) {if(!new URLSearchParams(location.search).has('qa'))this.area='base';return;}
    this.economy=validEconomy(saved.economy);
    const visited:JourneyArea[]=['base','forest',saved.area];if(saved.progression.passageOpen)visited.push('cavern');if(saved.flags.wardenGateOpen)visited.push('warden');for(const[flag,area]of [['valleyVisited','valley'],['aridVisited','arid'],['dunesVisited','dunes'],['soterradoReached','sandpit'],['frostVisited','frost'],['icecaveVisited','icecave'],['icenestVisited','icenest'],['cinderVisited','cinder'],['obsidianVisited','obsidian'],['calderaVisited','caldera']] as const)if(saved.flags[flag])visited.push(area);this.economy.visited=[...new Set(visited)];
    this.progression.restore(saved.progression);
    this.equipment.restore(saved.equipment);
    this.bestiary.restore(saved.bestiary);
    for (const key of JOURNEY_FLAGS) this[key] = saved.flags[key];
    this.area = saved.area;
    this.expeditionReturn=validExpeditionReturn(saved.expeditionReturn);
    if(this.expeditionReturn&&!this.economy.visited.includes(this.expeditionReturn.area))this.expeditionReturn=undefined;
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
      aridHabitats: [...this.siroccoHabitatCooldowns],equipment:this.equipment.snapshot(),economy:this.economy,expeditionReturn:this.expeditionReturn });
    this.records?.setSaveAvailable(available);
    return available;
  }

  private updateEquipmentAppearance():void {const slots=this.equipment.snapshot().slots;this.player.setEquipmentAppearance(slots);this.hunterArt?.setEquipment(slots);this.astralArt?.setEquipment(slots);if(this.glacierPlaytest?.look)this.setPlaytestAppearance(this.glacierPlaytest.look);if(this.glacierPlaytest?.weaponLook)this.setPlaytestWeapon(this.glacierPlaytest.weaponLook);}
  setPlaytestAppearance(look:import('../config/appearance').EquipmentLook):void {if(!this.glacierPlaytest)return;this.player.setEquipmentLook(look);this.hunterArt?.setEquipmentLook(look);this.astralArt?.setEquipmentLook(look);}

  setPlaytestWeapon(style:import('../config/appearance').WeaponStyle):void {if(!this.glacierPlaytest)return;this.player.setWeaponLook(style);this.hunterArt?.setWeaponLook(style);this.astralArt?.setWeaponLook(style);}

  openExpedition():void{if(!this.player.isDead)this.basePanel.open('map');}
  openEquipment():void {
    if(this.player.isDead||this.equipmentDialog.isOpen)return;
    this.inventoryUnpaused=coopSession.connected;
    if(!this.inventoryUnpaused)this.pauseForModal();else{this.controls.cancelForRecords();this.charge.stop();this.hunter?.clear();this.astral?.clear();}
    this.equipmentDialog.open();
  }

  private closeEquipment():void {if(!this.inventoryUnpaused)this.resumeFromModal();else this.controls.cancelForRecords();this.inventoryUnpaused=false;}

  private equipItem(slot:EquipmentSlot,id?:EquipmentId,uid?:string):boolean {
    const before=this.equipment.snapshot();if(!this.equipment.equip(slot,id,uid))return false;
    const saved=coopSession.role==='guest'?this.journey.saveEquipment(this.equipment.snapshot()):this.saveProgress();
    if(!saved&&!this.glacierPlaytest&&!this.qualityReference){this.equipment.restore(before);return false;}
    this.player.health.max=this.characterMaxHp;this.player.health.current=Math.min(this.player.hp,this.player.maxHp);
    this.updateEquipmentAppearance();coopSession.updateEquipment(this.equipment.snapshot().slots,this.equipment.free);return true;
  }

  seedInventoryPlaytest(full=false,id?:EquipmentId):void {
    if(!this.glacierPlaytest?.inventory)return;
    if(full){this.equipment.restore(undefined);for(let i=0;i<24;i++)this.equipment.acquire({uid:`lab-full-${i}`,id:'forest-helmet'});this.updateEquipmentAppearance();}
    const candidates=id?[id]:full?['forest-armor' as const]:EQUIPMENT_IDS.filter(id=>EQUIPMENT[id].tier===1);
    candidates.forEach((item,i)=>this.loot.add(item,{x:this.player.position.x+42+(i%4)*38,y:this.player.position.y+Math.floor(i/4)*38},'host',this.classId));
  }
  resetInventoryPlaytest():void {if(!this.glacierPlaytest?.inventory)return;this.equipment.restore(undefined);this.loot.render([]);this.updateEquipmentAppearance();}
  private pickupEquipment(pose:import('../systems/EquipmentDrops').LootPose,guest:boolean):void {
    if(guest){
      if((coopSession.peer?.bagFree??0)<=0){this.hud.showDiscovery('Mochila do companheiro cheia.');return;}
      coopSession.lootAwarded.set(pose.uid,{uid:pose.uid,id:pose.id});
      if(coopSession.peer)coopSession.peer.bagFree=Math.max(0,(coopSession.peer.bagFree??0)-1);
    }else{
      const before=this.equipment.snapshot();if(!this.equipment.acquire(pose)){this.hud.showDiscovery('MOCHILA CHEIA · 24/24\nEquipe uma peça para liberar espaço.');return;}
      if(!this.saveProgress()&&!this.glacierPlaytest&&!this.qualityReference){this.equipment.restore(before);this.hud.showDiscovery('Não foi possível salvar a coleta. O item continua no chão.');return;}
      this.hud.showDiscovery(`Coletado: ${EQUIPMENT[pose.id].name}`);coopSession.updateEquipment(this.equipment.snapshot().slots,this.equipment.free);
    }
    this.loot.take(pose.uid);this.sounds.ancient();
  }
  private dropEquipment(enemy:Enemy):void {
    const boss=enemy===this.warden||enemy===this.soterrado||enemy===this.vesper||enemy===this.titan;
    if(!boss&&++this.lootKills%EQUIPMENT_DROP_INTERVAL!==0)return;
    const tier=['frost','icecave','icenest','caldera','cinder','obsidian'].includes(this.area)?3:['arid','dunes','sandpit'].includes(this.area)?2:1;
    const candidates=EQUIPMENT_IDS.filter(id=>EQUIPMENT[id].tier===tier);
    const index=Math.max(0,Math.floor(this.lootKills/EQUIPMENT_DROP_INTERVAL)-1)%candidates.length;
    const id=boss?candidates.find(id=>EQUIPMENT[id].slot==='accessory')!:candidates[index];
    this.loot.add(id,enemy.position,'host',this.classId);
    if(coopSession.peer)this.loot.add(id,enemy.position,'guest',coopSession.peer.classId as PlayableClass);
  }
  private get inputModalOpen():boolean{return !!(this.equipmentDialog?.isOpen||this.basePanel?.isOpen)}
  private bossActive():boolean{if(coopSession.role==='guest')return coopSession.world?.boss?.active===true;const b=this.warden??this.soterrado??this.vesper??this.titan;return !!b&&!b.isDead&&b.state!=='DORMANT';}
  private canReturnBase(position=this.player?.position):boolean{return this.area!=='base'&&!!position&&!this.player.isDead&&!this.bossActive()&&!this.transitioning;}
  private baseTravel(area:JourneyArea,resume=false):boolean{
    if(this.player.isDead||this.bossActive()||this.transitioning)return false;
    if(coopSession.role!=='offline'&&!coopSession.connected)return false;
    if(area==='base'){if(!this.canReturnBase())return false;if(coopSession.role==='guest'){coopSession.requestBase();return true;}}
    else if(this.area!=='base'||!this.economy.visited.includes(area)||coopSession.role==='guest')return false;
    if(resume&&this.expeditionReturn?.area!==area)return false;
    this.sounds.ancient();return this.transitionArea(area,resume);
  }
  private persistPersonal():boolean{return !!this.glacierPlaytest||!!this.qualityReference|| (coopSession.role==='guest'?this.journey.savePersonal(this.equipment.snapshot(),this.economy):this.saveProgress());}
  private serviceAction(action:ServiceAction):boolean{
    if(this.area!=='base'||this.player.isDead)return false;
    const next=transact(this.economy,this.equipment.snapshot(),action);if(!next)return false;
    const old=this.economy,kit=this.equipment.snapshot(),hp=this.player.hp;this.economy=next.economy;this.equipment.restore(next.equipment);
    if(action.kind==='heal'&&coopSession.role!=='guest')this.player.health.current=this.player.maxHp;
    if(!this.persistPersonal()){this.economy=old;this.equipment.restore(kit);this.player.health.current=hp;return false;}
    if(action.kind==='heal'){if(coopSession.role==='guest')coopSession.requestHeal();else this.player.health.current=this.player.maxHp;}
    this.player.health.max=this.characterMaxHp;this.updateEquipmentAppearance();coopSession.updateEquipment(this.equipment.snapshot().slots,this.equipment.free,this.economy.potions);this.basePanel.refreshBar();this.sounds.ancient();return true;
  }
  private usePotion():boolean{
    if(!this.player||this.player.isDead||this.inputModalOpen||this.player.hp>=this.player.maxHp||this.economy.potions<=0||Date.now()<this.economy.potionReadyAt)return false;
    if(coopSession.role==='guest'){coopSession.requestPotion();return true;}
    const old=structuredClone(this.economy),hp=this.player.hp;this.economy.potions--;this.economy.potionReadyAt=Date.now()+8000;
    this.player.health.current=Math.min(this.player.maxHp,this.player.hp+Math.round(this.player.maxHp*.35));
    if(!this.persistPersonal()){this.economy=old;this.player.health.current=hp;this.hud.showDiscovery('Não foi possível salvar a poção.');return false;}this.basePanel.refreshBar();this.sounds.ancient();return true;
  }
  private usePeerPotion():void{
    const now=Date.now();
    const p=this.party?.partner?.player;if(!p||p.isDead||p.hp>=p.maxHp||(coopSession.peer?.potions??0)<=0||now<this.peerPotionReady)return;
    this.peerPotionReady=now+8000;this.potionUsed++;coopSession.peer!.potions!--;p.health.current=Math.min(p.maxHp,p.hp+Math.round(p.maxHp*.35));
  }
  private collectResource(p:ResourceDrop):boolean{
    const old=structuredClone(this.economy);this.economy.credits=Math.min(1e9,this.economy.credits+p.credits);this.economy.materials[p.tier-1]=Math.min(1e9,this.economy.materials[p.tier-1]+p.amount);
    if(!this.persistPersonal()){this.economy=old;return false;}this.basePanel.refreshBar();this.hud.showDiscovery(`+${p.credits} créditos · +${p.amount} ${MATERIAL_NAMES[p.tier-1]}`);return true;
  }
  seedEconomyPlaytest(withMaterials=true):void{if(!this.glacierPlaytest?.economy)return;this.economy=validEconomy({credits:300,materials:withMaterials?[30,30,30]:[0,0,0],potions:3,visited:['base','forest']});this.basePanel.refreshBar();}
  startReturnPlaytest():void{
    if(!this.glacierPlaytest?.economy||this.area!=='base'||this.transitioning)return;
    this.expeditionArrival={x:1100,y:760};this.transitionArea('forest');
  }

}
