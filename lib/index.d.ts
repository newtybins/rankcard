import { GuildMember, PresenceStatus } from 'discord.js';

type ProgressType = 'gradient' | 'colour';
type BackgroundType = 'image' | 'colour';
type Pieces = 'progress' | 'avatar' | 'status' | 'overlay' | 'level' | 'rank' | 'tag';

export interface BuildFonts {
	bold: string;
	regular: string;
}

export interface Font {
	path: string;
	family: string;
	weight?: string;
	style?: string;
}

export interface InputData {
	level: number;
	xpForLevel: (level: number) => number;
	user: GuildMember | null;
	rank?: number;
	fonts?: Font[];
	usernameLength?: number;
	stripAccents?: boolean;
}


interface Piece<T> {
	value: T;
	fontColour: string;
	fontSize: number;
	display: boolean;
}

export interface Background {
	type: BackgroundType;
	value: string | Buffer;
}

interface BarColour {
	type: ProgressType;
	value: string | string[];
}

interface ProgressBar {
	rounded: boolean;
	trackColour: string;
	colour: BarColour;
}

export interface Progress {
	display: boolean;
	currentXP: number;
	requiredXP: number;
	fontSize: number;
	fontColour: string;
	bar: ProgressBar;
}

export interface Status {
	display: boolean;
	width: number;
	type: PresenceStatus;
	colour: string;
	circle: boolean;
}

export interface Overlay {
	display: boolean;
	opacity: number;
	colour: string;
}

interface Avatar {
	value: string | Buffer;
	display: boolean;
}

interface Tag {
	display: boolean;
	fontSize: number;
	fontColour: string;	
	username: string;
	discriminator: string | number;
}

export interface CardData {
	width: number;
	height: number;
	background: Background;
	progress: Progress;
	avatar: Avatar;
	status: Status;
	overlay: Overlay;
	level: Piece<number>;
	rank: Piece<number>;
	tag: Tag;
}

export class RankCard {
	constructor(input: InputData);

	private _data: CardData;
	private _calculateProgress(): number;

	toggleDisplay(...pieces: Pieces[]): RankCard;
	setProgress(fontColour: string, fontSize?: number): RankCard;
	setProgressBar(colour: BarColour, trackColour?: string, rounded?: boolean): RankCard;
	setStatus(circle: boolean): RankCard;
	setOverlay(colour: string, opacity?: number): RankCard;
	setLevel(fontColour: string, fontSize?: number): RankCard;	
	setRank(fontColour: string, fontSize?: number): RankCard;
	setTag(fontColour: string, fontSize?: number): RankCard;

	build(fonts?: BuildFonts): Promise<Buffer>;
}
